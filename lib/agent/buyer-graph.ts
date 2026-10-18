/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/agent/buyer-graph.ts - Buyer Agent LangGraph (autonomous purchase)
// Uses the real catalog, the real Policy Gate, and the LLM for reasoning.

import { StateGraph, interrupt } from "@langchain/langgraph";
import { BuyerState } from "./state";
import { fetchCatalog } from "@/lib/catalog";
import { evaluate } from "@/lib/policy/gate";
import { getOrCreateMandate, toPolicyMandate } from "@/lib/policy/store";
import { createLLM } from "./llm";

const MAX_REPLANS = 3;

async function fetchCatalogNode(state: typeof BuyerState.State) {
  try {
    const catalog = await fetchCatalog();
    const snapshot = catalog.map((p) => ({
      id: p.id, name: p.name, category: p.category, pricePaise: p.pricePaise,
      costPaise: p.costPaise, marginPct: p.marginPct, stock: p.stock,
    }));
    return { catalogSnapshot: snapshot, error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "catalog fetch failed" };
  }
}

async function reasonOverGoal(state: typeof BuyerState.State) {
  const { goal, budgetPaise, catalogSnapshot } = state;
  const affordable = (catalogSnapshot ?? []).filter((p: any) => p.pricePaise <= budgetPaise && p.stock > 0);
  let thought = `Goal: ${goal}. Budget: ${budgetPaise} paise. Found ${affordable.length} affordable in-stock items.`;
  try {
    const { llm } = await createLLM();
    const res: any = await llm.invoke(
      `You are the Buyer Agent. Goal: "${goal}". Budget: ${budgetPaise} paise. Affordable in-stock items: ${JSON.stringify(affordable.map((p: any) => ({ id: p.id, name: p.name, price: p.pricePaise, cat: p.category })))}. In one sentence, state your plan for building a cart within budget.`,
    );
    const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    if (text) thought = text.slice(0, 400);
  } catch {
    // keep deterministic thought
  }
  return {
    reasoningTrace: [{ thought, toolCall: "reasonOverGoal", result: `${affordable.length} items`, decision: "proceed" }],
  };
}

async function proposeCart(state: typeof BuyerState.State) {
  const { catalogSnapshot, budgetPaise } = state;
  const cart: any[] = [];
  let total = 0;
  const sorted = [...(catalogSnapshot ?? [])].sort((a: any, b: any) => b.marginPct - a.marginPct);
  for (const item of sorted) {
    if (total + item.pricePaise <= budgetPaise && cart.length < 5 && item.stock > 0) {
      cart.push({ sku: item.id, short: item.name, category: item.category, quantity: 1, unitPaise: item.pricePaise, costPaise: item.costPaise, marginPct: item.marginPct, proposedPaise: item.pricePaise });
      total += item.pricePaise;
    }
  }
  return { proposedCart: { lines: cart, totalPaise: total }, retryCount: (state.retryCount ?? 0) };
}

async function policyGate(state: typeof BuyerState.State) {
  const { proposedCart } = state;
  const buyerId = (state as any).sessionId || "buyer-agent";
  const total = proposedCart?.totalPaise ?? 0;
  if (!proposedCart?.lines?.length) {
    return { gateVerdict: { outcome: "blocked", determiningRule: "price_source_of_truth", reason: "empty cart", reasonCode: "invalid_request", rules: [], totalPaise: 0, evaluatedAt: new Date().toISOString() } };
  }
  try {
    let m: any;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(buyerId);
    if (isUuid) {
      const mandateRow = await getOrCreateMandate(buyerId);
      m = toPolicyMandate(mandateRow);
    } else {
      // Anonymous/stream run: use a synthetic high-limit mandate so the gate
      // still checks margin, category, and price source-of-truth.
      m = {
        id: `anon-mandate-${buyerId}`,
        buyerId,
        issuer: "kindred-coffee-supply",
        signature: "anon",
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
    }
    const all = await fetchCatalog();
    const ctx = {
      catalog: (await import("@/lib/catalog")).catalogMap(all),
      rollingDailySpendPaise: 0,
      velocityCount: 0,
      merchantTimezone: "UTC",
    };
    const proposal = {
      id: `PROP-${Date.now().toString(36).toUpperCase()}`,
      lines: proposedCart.lines,
      totalPaise: total,
      mandateId: m.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, m, ctx);
    return { gateVerdict: verdict, mandate: m };
  } catch (e) {
    return { gateVerdict: { outcome: "blocked", determiningRule: "mandate_validity", reason: e instanceof Error ? e.message : "gate error", reasonCode: "invalid_request", rules: [], totalPaise: total, evaluatedAt: new Date().toISOString() }, error: e instanceof Error ? e.message : "gate error" };
  }
}

async function createQuote(state: typeof BuyerState.State) {
  const { proposedCart } = state;
  return {
    quote: {
      quoteId: `quote-${Date.now()}`,
      lines: proposedCart?.lines ?? [],
      totalPaise: proposedCart?.totalPaise ?? 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    },
  };
}

async function checkout(_state: typeof BuyerState.State) {
  // Deterministic: real money action happens in /api/agent/buy; graph records intent.
  return { error: null };
}

async function issueReceiptNode(state: typeof BuyerState.State) {
  return {
    receipt: {
      receiptId: `rec-${Date.now()}`,
      outcome: state.gateVerdict?.outcome ?? "approved",
      createdAt: new Date().toISOString(),
    },
    reasoningTrace: [{ thought: `Run complete. Gate outcome: ${state.gateVerdict?.outcome}.`, toolCall: "issueReceipt", result: "receipt issued", decision: "done" }],
  };
}

const HITL_THRESHOLD_PAISE = 500000; // ₹5,000

async function hitlGate(state: typeof BuyerState.State) {
  const total = state.proposedCart?.totalPaise ?? 0;
  const restricted = (state.proposedCart?.lines ?? []).some((l: any) => l.category === "Grinders" && l.unitPaise > 1000000);
  const lowMargin = (state.proposedCart?.lines ?? []).some((l: any) => l.marginPct < 20);
  const needsApproval = total > HITL_THRESHOLD_PAISE || restricted || lowMargin;

  if (!needsApproval) {
    return { hitlStatus: "approved" as const, hitlApproval: { auto: true, reason: "routine proposal" } };
  }

  // Pause for human approval (threshold exceeded)
  const decision = interrupt({
    proposal: state.proposedCart,
    totalPaise: total,
    reason: restricted ? "restricted category" : lowMargin ? "low margin" : "high value",
    message: "This proposal exceeds the auto-approval threshold. Approve, reject, or modify.",
  });

  if (decision?.action === "reject") {
    return { hitlStatus: "rejected" as const, error: "human rejected proposal", hitlApproval: decision };
  }
  if (decision?.action === "modify" && decision?.modifiedCart) {
    return { hitlStatus: "modified" as const, proposedCart: decision.modifiedCart, hitlApproval: decision };
  }
  return { hitlStatus: "approved" as const, hitlApproval: decision ?? { action: "approve" } };
}

function hitlCondition(state: typeof BuyerState.State): string {
  if (state.hitlStatus === "rejected") return "abort";
  return "gate";
}

function gateCondition(state: typeof BuyerState.State): string {
  if (state.gateVerdict?.outcome === "blocked") {
    if ((state.retryCount ?? 0) >= MAX_REPLANS) return "abort";
    return "replan";
  }
  return "quote";
}

export function createBuyerGraph(checkpointer?: any) {
  const graph = new StateGraph(BuyerState)
    .addNode("fetchCatalog", fetchCatalogNode, { retryPolicy: { maxAttempts: 3, initialInterval: 1000, backoffFactor: 2, maxInterval: 10000 } })
    .addNode("reasonOverGoal", reasonOverGoal, { retryPolicy: { maxAttempts: 2, initialInterval: 1000, backoffFactor: 2, maxInterval: 5000 } })
    .addNode("proposeCart", proposeCart)
    .addNode("hitlGate", hitlGate)
    .addNode("policyGate", policyGate, { retryPolicy: { maxAttempts: 2, initialInterval: 1000, backoffFactor: 2, maxInterval: 5000 } })
    .addNode("createQuote", createQuote)
    .addNode("checkout", checkout)
    .addNode("issueReceipt", issueReceiptNode)
    .addEdge("__start__", "fetchCatalog")
    .addEdge("fetchCatalog", "reasonOverGoal")
    .addEdge("reasonOverGoal", "proposeCart")
    .addEdge("proposeCart", "hitlGate")
    .addConditionalEdges("hitlGate", hitlCondition, {
      abort: "__end__",
      gate: "policyGate",
    })
    .addConditionalEdges("policyGate", gateCondition, {
      replan: "reasonOverGoal",
      quote: "createQuote",
      abort: "__end__",
    })
    .addEdge("createQuote", "checkout")
    .addEdge("checkout", "issueReceipt")
    .addEdge("issueReceipt", "__end__");

  return graph.compile(checkpointer ? { checkpointer } : undefined);
}