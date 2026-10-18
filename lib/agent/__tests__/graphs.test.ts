// lib/agent/__tests__/graphs.test.ts - LangGraph graph tests (node-level + routing)

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/agent/llm", () => {
  return {
    createLLM: vi.fn(async () => {
      return {
        llm: { invoke: vi.fn(async () => ({ content: "Plan: pick affordable items." })) },
        provider: "groq",
      };
    }),
    getLLMProvider: vi.fn(() => "groq"),
    hasProviderKey: vi.fn(() => true),
  };
});

vi.mock("@/lib/catalog", () => {
  function cm(items: { id: string; pricePaise: number; costPaise: number; category: string; stock: number }[]) {
    const m = new Map();
    for (const p of items) {
      m.set(p.id, { pricePaise: p.pricePaise, costPaise: p.costPaise, category: p.category, stock: p.stock });
    }
    return m;
  }
  return {
    fetchCatalog: vi.fn(async () => [
      { id: "p1", name: "V60 Dripper 02", category: "Brewers", subcategory: "Pour-over", pricePaise: 189900, costPaise: 95000, marginPct: 50, stock: 42, rating: 4.8, reviews: 312, image: null, badge: null, attributes: {} },
      { id: "p9", name: "Blade Grinder (Basic)", category: "Grinders", subcategory: "Blade", pricePaise: 89900, costPaise: 45000, marginPct: 50, stock: 50, rating: 3.9, reviews: 89, image: null, badge: null, attributes: {} },
      { id: "p21", name: "Ethiopia Yirgacheffe 250g", category: "Beans", subcategory: "Single origin", pricePaise: 74900, costPaise: 37500, marginPct: 50, stock: 60, rating: 4.8, reviews: 412, image: null, badge: null, attributes: {} },
    ]),
    catalogMap: vi.fn(cm),
  };
});

vi.mock("@/lib/policy/store", () => {
  return {
    getOrCreateMandate: vi.fn(async (buyerId) => ({
      id: "mandate-" + buyerId,
      buyer_id: buyerId,
      issuer: "kindred-coffee-supply",
      envelope: { maxPerOrderPaise: 5000000, maxDailyPaise: 10000000, allowedCategories: [], allowedSkus: [], expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(), currency: "INR", issuedAt: new Date().toISOString() },
      signature: "sig",
      issued_at: new Date().toISOString(),
      revoked_at: null,
      checkout_hash: null,
    })),
    toPolicyMandate: vi.fn((row) => ({ id: row.id, buyerId: row.buyer_id, envelope: row.envelope, signature: row.signature, issuedAt: row.issued_at, revokedAt: row.revoked_at })),
    getBuyerDailySpendPaise: vi.fn(async () => 0),
    getBuyerVelocity: vi.fn(async () => 0),
  };
});

import { createBuyerGraph } from "@/lib/agent/buyer-graph";
import { createMerchantGraph } from "@/lib/agent/merchant-graph";
import { getMemoryCheckpointer } from "@/lib/agent/checkpointer";

describe("Buyer graph", () => {
  it("populates catalogSnapshot", async () => {
    const cp = await getMemoryCheckpointer();
    const graph = createBuyerGraph(cp);
    const res = await graph.invoke({ goal: "pour over", budgetPaise: 500000, sessionId: "t1", agentId: "buyer-agent" }, { configurable: { thread_id: "t1" } });
    expect(Array.isArray(res.catalogSnapshot)).toBe(true);
    expect(res.catalogSnapshot.length).toBeGreaterThan(0);
  });

  it("builds a cart within budget", async () => {
    const cp = await getMemoryCheckpointer();
    const graph = createBuyerGraph(cp);
    const res = await graph.invoke({ goal: "pour over", budgetPaise: 500000, sessionId: "t2", agentId: "buyer-agent" }, { configurable: { thread_id: "t2" } });
    expect(res.proposedCart.totalPaise).toBeLessThanOrEqual(500000);
    expect(res.proposedCart.lines.length).toBeGreaterThan(0);
  });

  it("gate approves healthy margins (7 rules)", async () => {
    const cp = await getMemoryCheckpointer();
    const graph = createBuyerGraph(cp);
    const res = await graph.invoke({ goal: "pour over", budgetPaise: 500000, sessionId: "t3", agentId: "buyer-agent" }, { configurable: { thread_id: "t3" } });
    expect(res.gateVerdict.outcome).toBe("approved");
    expect(res.gateVerdict.rules.length).toBe(7);
  });

  it("completes end-to-end", async () => {
    const cp = await getMemoryCheckpointer();
    const graph = createBuyerGraph(cp);
    const res = await graph.invoke({ goal: "pour over", budgetPaise: 500000, sessionId: "t4", agentId: "buyer-agent" }, { configurable: { thread_id: "t4" } });
    expect(res.receipt).toBeDefined();
    expect(res.hitlStatus).toBe("approved");
  });

  it("auto-approves routine proposals via HITL", async () => {
    const cp = await getMemoryCheckpointer();
    const graph = createBuyerGraph(cp);
    const res = await graph.invoke({ goal: "pour over", budgetPaise: 100000, sessionId: "t5", agentId: "buyer-agent" }, { configurable: { thread_id: "t5" } });
    expect(res.hitlStatus).toBe("approved");
    expect(res.hitlApproval.auto).toBe(true);
  });
});

describe("Merchant graph", () => {
  it("compiles and runs end-to-end", async () => {
    const graph = createMerchantGraph();
    const res = await graph.invoke({ shopperMessage: "I want pour-over coffee", sessionId: "s1", agentId: "merchant-agent" });
    expect(res.recommendation).toBeDefined();
    expect(res.recommendation.status).toBe("approved");
    expect(res.catalogSnapshot.length).toBeGreaterThan(0);
  });
});

describe("Graph compilation", () => {
  it("buyer graph compiles with checkpointer", async () => {
    const cp = await getMemoryCheckpointer();
    const graph = createBuyerGraph(cp);
    expect(graph).toBeDefined();
  });

  it("merchant graph compiles", () => {
    const graph = createMerchantGraph();
    expect(graph).toBeDefined();
  });
});