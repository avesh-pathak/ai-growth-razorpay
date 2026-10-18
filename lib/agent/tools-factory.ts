// lib/agent/tools-factory.ts - real, state-injected LangGraph tools
// Each tool closes over a context (buyer identity, mandate, catalog) so the LLM
// only sees the tool's input schema, never the full graph state.

import { tool } from "@langchain/core/tools";
import { fetchCatalog as fetchCatalogFromDb, catalogMap } from "@/lib/catalog";
import { getOrCreateMandate, toPolicyMandate } from "@/lib/policy/store";
import { evaluate } from "@/lib/policy/gate";
import type { Proposal } from "@/lib/policy/types";

export type ToolContext = {
  buyerId: string;
  /** When true, evaluatePolicy uses a synthetic high-limit merchant mandate (merchant side). */
  merchantSide?: boolean;
};

export function createTools(ctx: ToolContext) {
  let catalogCache: Awaited<ReturnType<typeof fetchCatalogFromDb>> | null = null;
  async function catalog(): Promise<Awaited<ReturnType<typeof fetchCatalogFromDb>>> {
    if (!catalogCache) catalogCache = await fetchCatalogFromDb();
    return catalogCache as Awaited<ReturnType<typeof fetchCatalogFromDb>>;
  }

  const searchCatalog = tool(
    async (input: { query?: string; category?: string; maxPricePaise?: number; limit?: number }) => {
      const all = await catalog();
      const q = (input.query ?? "").toLowerCase();
      const filtered = all.filter((p) => {
        if (input.category && p.category !== input.category) return false;
        if (input.maxPricePaise && p.pricePaise > input.maxPricePaise) return false;
        if (q && !p.name.toLowerCase().includes(q) && !(p.subcategory ?? "").toLowerCase().includes(q)) return false;
        return true;
      });
      const slice = filtered.slice(0, input.limit ?? 12);
      return JSON.stringify({
        count: filtered.length,
        items: slice.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          subcategory: p.subcategory,
          pricePaise: p.pricePaise,
          costPaise: p.costPaise,
          marginPct: p.marginPct,
          stock: p.stock,
          rating: p.rating,
          badge: p.badge,
        })),
      });
    },
    {
      name: "searchCatalog",
      description: "Search the live product catalog by query, category, or max price (paise). Returns SKUs with price, cost, margin, stock.",
      schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search query" },
          category: { type: "string", description: "Category filter (Brewers, Grinders, Kettles, Accessories, Beans)" },
          maxPricePaise: { type: "number", description: "Maximum price in paise" },
          limit: { type: "number", description: "Max results (default 12)" },
        },
      },
    },
  );

  const fetchCatalogTool = tool(
    async (input: { full?: boolean }) => {
      const all = await catalog();
      return JSON.stringify({ count: all.length, items: input.full ? all.map((p) => ({ id: p.id, name: p.name, category: p.category, pricePaise: p.pricePaise, costPaise: p.costPaise, marginPct: p.marginPct, stock: p.stock })) : all.slice(0, 20).map((p) => ({ id: p.id, name: p.name, category: p.category, pricePaise: p.pricePaise, stock: p.stock })) });
    },
    {
      name: "fetchCatalog",
      description: "Fetch the product catalog (full or first 20).",
      schema: {
        type: "object",
        properties: {
          full: { type: "boolean", description: "Fetch all products" },
        },
      },
    },
  );

  const proposeBundle = tool(
    async (input: { skuIds: string[]; quantities?: number[] }) => {
      const all = await catalog();
      const byId = new Map(all.map((p) => [p.id, p]));
      const lines = input.skuIds.map((sku, i) => {
        const p = byId.get(sku);
        if (!p) return null;
        const qty = input.quantities?.[i] ?? 1;
        return {
          sku: p.id,
          short: p.name,
          category: p.category,
          quantity: qty,
          unitPaise: p.pricePaise,
          proposedPaise: p.pricePaise,
          costPaise: p.costPaise,
          marginPct: p.marginPct,
          stock: p.stock,
        };
      }).filter((l): l is NonNullable<typeof l> => Boolean(l));
      const totalPaise = lines.reduce((s: number, l: { unitPaise: number; quantity: number }) => s + l.unitPaise * l.quantity, 0);
      return JSON.stringify({ proposal: { lines, totalPaise }, itemCount: lines.length });
    },
    {
      name: "proposeBundle",
      description: "Draft a bundle proposal from a list of SKU IDs and quantities. Returns the proposal with lines and total.",
      schema: {
        type: "object",
        properties: {
          skuIds: { type: "array", items: { type: "string" }, description: "SKU IDs to include" },
          quantities: { type: "array", items: { type: "number" }, description: "Quantities per SKU (default 1)" },
        },
        required: ["skuIds"],
      },
    },
  );

  const evaluatePolicy = tool(
    async (input: { skuIds: string[]; quantities?: number[] }) => {
      const all = await catalog();
      const byId = new Map(all.map((p) => [p.id, p]));
      const lines = input.skuIds.map((sku, i) => {
        const p = byId.get(sku);
        if (!p) return null;
        const qty = input.quantities?.[i] ?? 1;
        return {
          sku: p.id,
          short: p.name,
          category: p.category,
          quantity: qty,
          unitPaise: p.pricePaise,
          proposedPaise: p.pricePaise,
          costPaise: p.costPaise,
          marginPct: p.marginPct,
        };
      }).filter((l): l is NonNullable<typeof l> => Boolean(l));
      const totalPaise = lines.reduce((s: number, l: { unitPaise: number; quantity: number }) => s + l.unitPaise * l.quantity, 0);

type MandateLike = {
  id: string;
  buyerId: string;
  issuer: string;
  signature: string;
  issuedAt: string;
  envelope: {
    maxPerOrderPaise: number;
    maxDailyPaise: number;
    allowedCategories: string[];
    allowedSkus: string[];
    expiry: string;
    currency: string;
    issuedAt: string;
    revokedAt?: string;
    checkoutHash?: string;
  };
};

// inside evaluatePolicy:
      let mandate: MandateLike;
      if (ctx.merchantSide) {
        mandate = {
          id: "merchant-proposal-mandate",
          buyerId: ctx.buyerId,
          issuer: "kindred-coffee-supply",
          signature: "merchant-side",
          issuedAt: new Date().toISOString(),
          envelope: {
            maxPerOrderPaise: 1_000_000_000,
            maxDailyPaise: 1_000_000_000,
            allowedCategories: [],
            allowedSkus: [],
            expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            currency: "INR",
            issuedAt: new Date().toISOString(),
          },
        };
      } else {
        const row = await getOrCreateMandate(ctx.buyerId);
        mandate = toPolicyMandate(row);
      }

      const proposal: Proposal = {
        id: `PROP-${Date.now().toString(36).toUpperCase()}`,
        lines,
        totalPaise,
        mandateId: mandate.id,
        createdAt: new Date().toISOString(),
      };

      const ctx2 = {
        catalog: catalogMap(all),
        rollingDailySpendPaise: 0,
        velocityCount: 0,
        merchantTimezone: "UTC",
      };
      const verdict = evaluate(proposal, mandate, ctx2);
      return JSON.stringify({ verdict, proposalId: proposal.id, totalPaise });
    },
    {
      name: "evaluatePolicy",
      description: "Run the deterministic Policy Gate on a proposed bundle (margin floor, category whitelist, price source-of-truth, caps). Returns the verdict with determining rule and reason.",
      schema: {
        type: "object",
        properties: {
          skuIds: { type: "array", items: { type: "string" }, description: "SKU IDs in the proposal" },
          quantities: { type: "array", items: { type: "number" }, description: "Quantities per SKU" },
        },
        required: ["skuIds"],
      },
    },
  );

  return [searchCatalog, fetchCatalogTool, proposeBundle, evaluatePolicy];
}