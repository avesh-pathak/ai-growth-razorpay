/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/agent/merchant-graph.ts - Merchant Agent LangGraph (conversational selling)
// Uses the real catalog, the real Policy Gate, and the LLM for reasoning.

import { StateGraph, interrupt } from "@langchain/langgraph";
import { MerchantState } from "./state";
import { fetchCatalog } from "@/lib/catalog";
import { evaluate } from "@/lib/policy/gate";
import { createLLM } from "./llm";

async function listenToShopper(_state: typeof MerchantState.State) {
  return {};
}

async function searchCatalog(_state: typeof MerchantState.State) {
  try {
    const catalog = await fetchCatalog();
    const snapshot = catalog.map((p) => ({
      id: p.id, name: p.name, category: p.category, pricePaise: p.pricePaise,
      costPaise: p.costPaise, marginPct: p.marginPct, stock: p.stock, badge: p.badge,
    }));
    return { catalogSnapshot: snapshot, error: null };
  } catch (e) {
    return { catalogSnapshot: [], error: e instanceof Error ? e.message : "catalog fetch failed" };
  }
}

async function draftProposal(state: typeof MerchantState.State) {
  const { catalogSnapshot, shopperMessage } = state;
  const catalog = catalogSnapshot ?? [];
  // Default proposal: top 3 by margin, in stock. LLM reasoning refines in production.
  let lines = catalog.filter((p: any) => p.stock > 0).sort((a: any, b: any) => b.marginPct - a.marginPct).slice(0, 3).map((p: any) => ({
    sku: p.id, short: p.name, category: p.category, quantity: 1,
    unitPaise: p.pricePaise, proposedPaise: p.pricePaise, costPaise: p.costPaise, marginPct: p.marginPct,
  }));
  let thought = `Drafted a ${lines.length}-item bundle from the catalog.`;
  try {
    const { llm } = await createLLM();
    const res: any = await llm.invoke(
      `You are the Merchant Agent. Shopper said: "${shopperMessage}". Available catalog (id,name,category,pricePaise,marginPct,stock): ${JSON.stringify(catalog.slice(0, 12))}. Pick 2-4 complementary SKUs for a bundle. Reply with only the SKU ids as a JSON array, e.g. ["p1","p7"].`,
    );
    const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    const m = text.match(/\[[\s\S]*\]/);
    if (m) {
      const ids = JSON.parse(m[0]);
      if (Array.isArray(ids) && ids.length > 0) {
        const byId = new Map(catalog.map((p: any) => [p.id, p]));
        const picked = ids.map((id: string) => byId.get(id)).filter(Boolean);
        if (picked.length > 0) {
          lines = picked.map((p: any) => ({
            sku: p.id, short: p.name, category: p.category, quantity: 1,
            unitPaise: p.pricePaise, proposedPaise: p.pricePaise, costPaise: p.costPaise, marginPct: p.marginPct,
          }));
          thought = `LLM selected ${lines.length} SKUs for the shopper's request.`;
        }
      }
    }
  } catch {
    // keep deterministic proposal
  }
  const totalPaise = lines.reduce((s: number, l: any) => s + l.unitPaise * l.quantity, 0);
  const proposal = {
    id: `prop-${Date.now()}`,
    lines,
    totalPaise,
    createdAt: new Date().toISOString(),
  };
  return {
    proposal,
    reasoningTrace: [{ thought, toolCall: "draftProposal", result: `${lines.length} items, ${totalPaise} paise`, decision: "proceed" }],
  };
}

async function policyGate(state: typeof MerchantState.State) {
  const { proposal } = state;
  const total = proposal?.totalPaise ?? 0;
  if (!proposal?.lines?.length) {
    return { gateVerdict: { outcome: "blocked", determiningRule: "price_source_of_truth", reason: "empty proposal", reasonCode: "invalid_request", rules: [], totalPaise: 0, evaluatedAt: new Date().toISOString() } };
  }
  try {
    // Merchant-side mandate: high limits so only margin/category/price rules apply.
    const mandate = {
      id: "merchant-proposal-mandate",
      buyerId: "merchant",
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
    const all = await fetchCatalog();
    const { catalogMap } = await import("@/lib/catalog");
    const ctx = { catalog: catalogMap(all), rollingDailySpendPaise: 0, velocityCount: 0, merchantTimezone: "UTC" };
    const p = { id: proposal.id, lines: proposal.lines, totalPaise: total, mandateId: mandate.id, createdAt: proposal.createdAt };
    const verdict = evaluate(p as any, mandate as any, ctx);
    return { gateVerdict: verdict };
  } catch (e) {
    return { gateVerdict: { outcome: "blocked", determiningRule: "margin_floor", reason: e instanceof Error ? e.message : "gate error", reasonCode: "invalid_request", rules: [], totalPaise: total, evaluatedAt: new Date().toISOString() }, error: e instanceof Error ? e.message : "gate error" };
  }
}

async function presentRecommendation(state: typeof MerchantState.State) {
  const { proposal, gateVerdict } = state;
  if (gateVerdict?.outcome === "blocked") {
    return {
      recommendation: {
        status: "blocked",
        explanation: `I can't offer that bundle — ${gateVerdict.reason ?? "it didn't pass our checks"}. Let me find an alternative.`,
      },
      reasoningTrace: [{ thought: `Gate blocked: ${gateVerdict.determiningRule}.`, toolCall: "presentRecommendation", result: "blocked", decision: "explain + re-draft" }],
    };
  }
  let explanation = "Here's a bundle I think you'll love:";
  try {
    const { llm } = await createLLM();
    const res: any = await llm.invoke(
      `You are the Merchant Agent. Present this approved bundle to the shopper in 2-3 warm sentences. Bundle: ${JSON.stringify(proposal?.lines)}. Total: ${proposal?.totalPaise} paise. Explain why it's a good fit. Keep under 80 words.`,
    );
    const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    if (text) explanation = text.slice(0, 500);
  } catch {
    // keep default
  }
  return {
    recommendation: { status: "approved", proposal, explanation },
    reasoningTrace: [{ thought: "Gate approved. Presenting recommendation.", toolCall: "presentRecommendation", result: "approved", decision: "present" }],
  };
}

async function hitlGate(state: typeof MerchantState.State) {
  const total = state.proposal?.totalPaise ?? 0;
  const needsApproval = total > 10000000; // ₹1,00,000
  if (!needsApproval) {
    return { hitlStatus: "approved" as const, hitlApproval: { auto: true } };
  }
  const decision = interrupt({
    proposal: state.proposal,
    totalPaise: total,
    message: "High-value proposal. Approve, reject, or modify.",
  });
  if (decision?.action === "reject") {
    return { hitlStatus: "rejected" as const, error: "human rejected proposal" };
  }
  if (decision?.action === "modify" && decision?.modifiedProposal) {
    return { hitlStatus: "modified" as const, proposal: decision.modifiedProposal };
  }
  return { hitlStatus: "approved" as const, hitlApproval: decision ?? { action: "approve" } };
}

function hitlCondition(state: typeof MerchantState.State): string {
  if (state.hitlStatus === "rejected") return "abort";
  return "gate";
}

function gateCondition(state: typeof MerchantState.State): string {
  if (state.gateVerdict?.outcome === "blocked") {
    if ((state.retryCount ?? 0) >= 2) return "present";
    return "redraft";
  }
  return "present";
}

export function createMerchantGraph(checkpointer?: any) {
  const graph = new StateGraph(MerchantState)
    .addNode("listenToShopper", listenToShopper)
    .addNode("searchCatalog", searchCatalog, { retryPolicy: { maxAttempts: 3, initialInterval: 1000, backoffFactor: 2, maxInterval: 10000 } })
    .addNode("draftProposal", draftProposal, { retryPolicy: { maxAttempts: 2, initialInterval: 1000, backoffFactor: 2, maxInterval: 5000 } })
    .addNode("hitlGate", hitlGate)
    .addNode("policyGate", policyGate, { retryPolicy: { maxAttempts: 2, initialInterval: 1000, backoffFactor: 2, maxInterval: 5000 } })
    .addNode("presentRecommendation", presentRecommendation)
    .addEdge("__start__", "listenToShopper")
    .addEdge("listenToShopper", "searchCatalog")
    .addEdge("searchCatalog", "draftProposal")
    .addEdge("draftProposal", "hitlGate")
    .addConditionalEdges("hitlGate", hitlCondition, {
      abort: "__end__",
      gate: "policyGate",
    })
    .addConditionalEdges("policyGate", gateCondition, {
      redraft: "draftProposal",
      present: "presentRecommendation",
    })
    .addEdge("presentRecommendation", "__end__");

  return graph.compile(checkpointer ? { checkpointer } : undefined);
}