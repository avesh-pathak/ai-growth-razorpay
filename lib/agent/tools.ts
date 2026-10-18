// lib/agent/tools.ts — LangGraph tool definitions (state-injected)

import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Read-only tools
export const searchCatalogTool = tool(
  async (input: { query: string; category?: string; maxPrice?: number }) => {
    // In production, this calls the catalog API
    return JSON.stringify({ results: [], query: input.query });
  },
  {
    name: "searchCatalog",
    description: "Search the product catalog by query, category, or price range.",
    schema: z.object({
      query: z.string().describe("Search query"),
      category: z.string().optional().describe("Filter by category"),
      maxPrice: z.number().optional().describe("Maximum price in paise"),
    }),
  },
);

export const fetchCatalogTool = tool(
  async (input: { full?: boolean }) => {
    return JSON.stringify({ products: [], full: input.full ?? false });
  },
  {
    name: "fetchCatalog",
    description: "Fetch the full product catalog or a filtered subset.",
    schema: z.object({
      full: z.boolean().optional().describe("Fetch all products"),
    }),
  },
);

export const getOrderStatusTool = tool(
  async (input: { orderId: string }) => {
    return JSON.stringify({ orderId: input.orderId, status: "unknown" });
  },
  {
    name: "getOrderStatus",
    description: "Get the status of an order by ID.",
    schema: z.object({
      orderId: z.string().describe("Order ID"),
    }),
  },
);

export const getReceiptTool = tool(
  async (input: { receiptId: string }) => {
    return JSON.stringify({ receiptId: input.receiptId });
  },
  {
    name: "getReceipt",
    description: "Fetch a receipt by ID.",
    schema: z.object({
      receiptId: z.string().describe("Receipt ID"),
    }),
  },
);

// Mutating tools
export const proposeBundleTool = tool(
  async (input: { skuIds: string[]; quantities: number[] }) => {
    return JSON.stringify({ proposalId: `prop-${Date.now()}`, skuIds: input.skuIds });
  },
  {
    name: "proposeBundle",
    description: "Draft a bundle proposal from a list of SKUs and quantities.",
    schema: z.object({
      skuIds: z.array(z.string()).describe("SKU IDs to include"),
      quantities: z.array(z.number()).describe("Quantities per SKU"),
    }),
  },
);

export const createQuoteTool = tool(
  async (input: { proposalId: string }) => {
    return JSON.stringify({ quoteId: `quote-${Date.now()}`, proposalId: input.proposalId, ttlMinutes: 5 });
  },
  {
    name: "createQuote",
    description: "Create an authoritative quote from a proposal (prices re-fetched, 5-min TTL).",
    schema: z.object({
      proposalId: z.string().describe("Proposal ID"),
    }),
  },
);

export const checkoutTool = tool(
  async (input: { quoteId: string; mandateId: string; idempotencyKey: string }) => {
    return JSON.stringify({ orderId: `order-${Date.now()}`, quoteId: input.quoteId, status: "created" });
  },
  {
    name: "checkout",
    description: "Initiate checkout with a quote and mandate.",
    schema: z.object({
      quoteId: z.string().describe("Quote ID"),
      mandateId: z.string().describe("Mandate ID"),
      idempotencyKey: z.string().describe("Idempotency key (UUID)"),
    }),
  },
);

export const issueReceiptTool = tool(
  async (input: { orderId: string; mandateId: string }) => {
    return JSON.stringify({ receiptId: `rec-${Date.now()}`, orderId: input.orderId });
  },
  {
    name: "issueReceipt",
    description: "Issue a receipt for a completed order.",
    schema: z.object({
      orderId: z.string().describe("Order ID"),
      mandateId: z.string().describe("Mandate ID"),
    }),
  },
);