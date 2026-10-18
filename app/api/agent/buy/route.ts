// app/api/agent/buy/route.ts - Buyer Agent: autonomous purchase, zero human clicks.
// Supports two entry modes:
//   1. Single SKU (skuId + quantity) - used by the "Buy with agent" button.
//   2. Goal + budget (goal + budgetPaise) - the LLM plans a cart within budget, then
//      the deterministic gate + checkout run (LLM proposes, gate executes).
// A blocked run is a first-class, explained outcome with cheaper alternatives.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";
import { fetchCatalog, catalogMap } from "@/lib/catalog";
import { evaluate } from "@/lib/policy/gate";
import { computeHash } from "@/lib/policy/receipt";
import {
  appendAuditEvent,
  getOrCreateMandate,
  toPolicyMandate,
  getBuyerDailySpendPaise,
  getBuyerVelocity,
  issueReceipt,
} from "@/lib/policy/store";
import type { Proposal } from "@/lib/policy/types";
import { createOrder } from "@/lib/payments";
import { captureOrder } from "@/lib/checkout/capture-order";
import { rateLimit, getClientKey } from "@/lib/rate-limit";
import { formatPaise } from "@/lib/data/products";
import { createLLM } from "@/lib/agent/llm";

export const instant = false;

type CartLine = { sku: string; short: string; category: string; quantity: number; unitPaise: number; costPaise: number; marginPct: number; proposedPaise: number };

async function planCartWithLLM(goal: string, budgetPaise: number, catalog: Awaited<ReturnType<typeof fetchCatalog>>) {
  const trace: string[] = [];
  const compact = catalog.map((p) => ({ id: p.id, name: p.name, cat: p.category, price: p.pricePaise, margin: p.marginPct, stock: p.stock }));
  let skuIds: string[] = [];
  let quantities: number[] = [];
  let reasoning = "";

  try {
    const { llm } = await createLLM();
    const prompt = `You are the Buyer Agent for SlashCheckout. Given a shopper goal and budget, pick a cart of SKUs from the catalog.

Goal: ${goal}
Budget (paise): ${budgetPaise}

Catalog (id, name, category, pricePaise, marginPct, stock):
${JSON.stringify(compact)}

Rules:
- Never exceed the budget (sum of pricePaise * qty <= budgetPaise).
- Prefer complementary items (e.g., brewer + grinder + beans).
- Only pick items with stock > 0.
- Return ONLY valid JSON, no markdown, in this exact shape:
{"skuIds":["p1",...],"quantities":[1,...],"reasoning":"one short sentence"}

Pick 1-4 items.`;
    const res = await llm.invoke(prompt);
    const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.skuIds)) {
        skuIds = parsed.skuIds;
        quantities = Array.isArray(parsed.quantities) ? parsed.quantities : skuIds.map(() => 1);
        reasoning = String(parsed.reasoning ?? "");
      }
    }
  } catch (e) {
    reasoning = `LLM planning failed (${e instanceof Error ? e.message : "unknown"}); falling back to greedy selection.`;
  }

  // Fallback: greedy affordable selection if LLM didn't return usable SKUs
  if (skuIds.length === 0) {
    let total = 0;
    for (const p of catalog) {
      if (p.stock <= 0) continue;
      if (total + p.pricePaise <= budgetPaise && skuIds.length < 4) {
        skuIds.push(p.id);
        quantities.push(1);
        total += p.pricePaise;
      }
    }
    reasoning = reasoning || "Greedy fallback: picked affordable items up to budget.";
  }

  // Validate SKUs exist
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const validIds: string[] = [];
  const validQtys: number[] = [];
  for (let i = 0; i < skuIds.length; i++) {
    if (byId.has(skuIds[i])) {
      validIds.push(skuIds[i]);
      validQtys.push(Math.max(1, Math.min(10, quantities[i] ?? 1)));
    }
  }
  if (validIds.length === 0) {
    // last resort: cheapest in-stock item
    const cheapest = catalog.filter((p) => p.stock > 0).sort((a, b) => a.pricePaise - b.pricePaise)[0];
    if (cheapest) {
      validIds.push(cheapest.id);
      validQtys.push(1);
    }
  }

  trace.push(`planner: goal="${goal}" budget=${formatPaise(budgetPaise)}`);
  trace.push(`planner: LLM selected ${validIds.length} SKU(s) - ${reasoning}`);
  return { skuIds: validIds, quantities: validQtys, reasoning, trace };
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "unauthorized", message: "sign in to run the buyer agent" }, { status: 401 });
  }

  const limit = rateLimit(`agent-buy:${getClientKey(request, profile.userId)}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "rate_limited", message: "too many agent purchases in a minute" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const skuId = body?.skuId as string | undefined;
  const quantity = Math.max(1, Math.min(10, Math.floor(Number(body?.quantity ?? 1))));
  const goal = (body?.goal as string | undefined)?.trim();
  const budgetPaise = body?.budgetPaise ? Number(body.budgetPaise) : undefined;

  const catalog = await fetchCatalog();

  // Resolve the cart lines (single SKU or LLM-planned from a goal)
  let skuIds: string[] = [];
  let quantities: number[] = [];
  const trace: string[] = [];

  if (goal && budgetPaise && budgetPaise > 0) {
    const planned = await planCartWithLLM(goal, budgetPaise, catalog);
    skuIds = planned.skuIds;
    quantities = planned.quantities;
    trace.push(...planned.trace);
  } else if (skuId) {
    skuIds = [skuId];
    quantities = [quantity];
  } else {
    return NextResponse.json({ error: "invalid_request", message: "skuId or (goal + budgetPaise) is required" }, { status: 400 });
  }

  trace.push(`catalog: ${catalog.length} SKUs read from the database`);

  const byId = new Map(catalog.map((p) => [p.id, p]));
  const lines: CartLine[] = [];
  for (let i = 0; i < skuIds.length; i++) {
    const p = byId.get(skuIds[i]);
    if (!p) continue;
    const qty = Math.max(1, Math.min(10, quantities[i] ?? 1));
    if (p.stock < qty) {
      return NextResponse.json(
        { error: "out_of_stock", message: `${p.name} has ${p.stock} in stock - the agent paused instead of over-ordering` },
        { status: 409 },
      );
    }
    lines.push({ sku: p.id, short: p.name, category: p.category, quantity: qty, unitPaise: p.pricePaise, costPaise: p.costPaise, marginPct: p.marginPct, proposedPaise: p.pricePaise });
  }
  if (lines.length === 0) {
    return NextResponse.json({ error: "no_items", message: "no qualifying SKUs for this run" }, { status: 422 });
  }

  const totalPaise = lines.reduce((s, l) => s + l.unitPaise * l.quantity, 0);
  trace.push(`cart: ${lines.map((l) => `${l.quantity} x ${l.short}`).join(", ")}`);
  trace.push(`quote: ${formatPaise(totalPaise)} locked for 5 minutes`);

  const supabase = createAdminClient();
  const mandateRow = await getOrCreateMandate(profile.userId);
  const mandate = toPolicyMandate(mandateRow);
  trace.push(`mandate ${mandate.id}: signed, valid until ${new Date(mandate.envelope.expiry).toISOString().slice(11, 16)} UTC`);

  const proposal: Proposal = {
    id: `PROP-${Date.now().toString(36).toUpperCase()}`,
    lines,
    totalPaise,
    mandateId: mandate.id,
    createdAt: new Date().toISOString(),
  };

  const ctx = {
    catalog: catalogMap(catalog),
    rollingDailySpendPaise: await getBuyerDailySpendPaise(profile.userId),
    velocityCount: await getBuyerVelocity(profile.userId),
    merchantTimezone: "UTC",
  };

  const verdict = evaluate(proposal, mandate, ctx);

  await appendAuditEvent({
    actor: "buyer-agent",
    action: "policy.evaluated",
    entityType: "proposal",
    entityId: proposal.id,
    payload: {
      outcome: verdict.outcome,
      determiningRule: verdict.determiningRule ?? null,
      reason: verdict.reason ?? null,
      totalPaise: verdict.totalPaise,
      mandateId: mandate.id,
      origin: "agent.buy",
      goal: goal ?? null,
      lines: lines.map((l) => ({ sku: l.sku, qty: l.quantity })),
      rules: verdict.rules.map((r) => ({ rule: r.rule, result: r.result })),
    },
  });

  // --------------------------- blocked path ---------------------------
  if (verdict.outcome === "blocked") {
    trace.push(`gate: blocked at ${verdict.determiningRule} - first failure wins`);

    const receiptId = `REC-${Date.now().toString(36).toUpperCase()}`;
    await issueReceipt({ receiptId, proposal, verdict, outcome: "blocked", mandateId: mandate.id });

    await appendAuditEvent({
      actor: "policy-gate",
      action: "checkout.blocked",
      entityType: "receipt",
      entityId: receiptId,
      payload: {
        determiningRule: verdict.determiningRule ?? null,
        reason: verdict.reason ?? null,
        totalPaise: verdict.totalPaise,
        proposalId: proposal.id,
        origin: "agent.buy",
      },
    });

    // cheaper alternatives: in the category of the first (largest) line
    const primaryCat = lines[0].category;
    const primaryPrice = lines[0].unitPaise;
    const suggestions = catalog
      .filter((c) => c.category === primaryCat && !lines.some((l) => l.sku === c.id) && c.stock > 0 && c.pricePaise < primaryPrice)
      .sort((a, b) => b.marginPct - a.marginPct)
      .slice(0, 3)
      .map((c) => ({ id: c.id, slug: c.slug, name: c.name, pricePaise: c.pricePaise }));

    return NextResponse.json({
      status: "blocked",
      verdict,
      receiptId,
      mandateId: mandate.id,
      suggestions,
      trace,
      goal: goal ?? null,
    });
  }

  trace.push(`gate: approved - ${verdict.rules.length} rules checked, no failures`);

  // --------------------------- approved path ---------------------------
  // Optimistic-concurrency stock decrement per line
  for (const l of lines) {
    const { data: skuRow } = await supabase.from("skus").select("stock").eq("id", l.sku).maybeSingle();
    const current = skuRow?.stock ?? 0;
    if (current < l.quantity) {
      const receiptId = `REC-${Date.now().toString(36).toUpperCase()}`;
      const failedVerdict = { ...verdict, outcome: "failed" as const, reason: `stock race: ${l.short} sold out during the agent run`, reasonCode: "price_source_of_truth" };
      await issueReceipt({ receiptId, proposal, verdict: failedVerdict, outcome: "failed", mandateId: mandate.id });
      return NextResponse.json({ status: "failed", verdict: failedVerdict, receiptId, trace }, { status: 409 });
    }
    const { data: updated } = await supabase
      .from("skus")
      .update({ stock: current - l.quantity })
      .eq("id", l.sku)
      .eq("stock", current)
      .select("id");
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "stock_race", message: `${l.short} changed during the agent run - retry` }, { status: 409 });
    }
  }

  let razorpayOrder: { id: string; amount: number; currency: string };
  try {
    razorpayOrder = await createOrder({
      amountPaise: totalPaise,
      receipt: proposal.id,
      notes: { mandateId: mandate.id, proposalId: proposal.id, origin: "buyer-agent", ...(goal ? { goal } : {}) },
    });
  } catch (err) {
    const receiptId = `REC-${Date.now().toString(36).toUpperCase()}`;
    const failedVerdict = { ...verdict, outcome: "failed" as const, reason: err instanceof Error ? err.message : "payment order failed", reasonCode: "payment_failed" };
    await issueReceipt({ receiptId, proposal, verdict: failedVerdict, outcome: "failed", mandateId: mandate.id });
    await appendAuditEvent({
      actor: "system",
      action: "checkout.failed",
      entityType: "receipt",
      entityId: receiptId,
      payload: { reason: "razorpay_order_failed", message: err instanceof Error ? err.message : "unknown", origin: "agent.buy" },
    });
    return NextResponse.json({ status: "failed", message: err instanceof Error ? err.message : "payment order failed" }, { status: 502 });
  }

  const orderId = `TXN-${Date.now().toString(36).toUpperCase()}`;
  const orderItems = lines.map((l) => ({ sku: l.sku, name: l.short, category: l.category, qty: l.quantity, unitPaise: l.unitPaise }));
  const orderBase = {
    id: orderId,
    buyer_id: profile.userId,
    status: "created",
    total_paise: totalPaise,
    razorpay_order_id: razorpayOrder.id,
    quote_ref: proposal.id,
    mandate_id: mandate.id,
  };

  let orderInsert = await supabase.from("orders").insert({ ...orderBase, items: orderItems });
  if (orderInsert.error && /items/.test(orderInsert.error.message)) {
    orderInsert = await supabase.from("orders").insert(orderBase);
  }
  if (orderInsert.error) {
    return NextResponse.json({ error: "db_error", message: orderInsert.error.message }, { status: 500 });
  }

  await supabase.from("payments").insert({
    id: `pay-${orderId}`,
    order_id: orderId,
    razorpay_payment_id: null,
    amount_paise: totalPaise,
    status: "pending",
  });

  await supabase
    .from("mandates")
    .update({ checkout_hash: computeHash(`${proposal.id}:${totalPaise}`) })
    .eq("id", mandate.id);

  await appendAuditEvent({
    actor: "buyer-agent",
    action: "checkout.created",
    entityType: "order",
    entityId: orderId,
    payload: { totalPaise, razorpayOrderId: razorpayOrder.id, mandateId: mandate.id, origin: "agent.buy", goal: goal ?? null, lines: lines.map((l) => ({ sku: l.sku, qty: l.quantity })) },
  });

  const capture = await captureOrder(orderId, profile.userId);
  if (!capture.ok) {
    return NextResponse.json({
      status: "created",
      orderId,
      razorpayOrderId: razorpayOrder.id,
      totalPaise,
      mandateId: mandate.id,
      proposalId: proposal.id,
      verdict,
      message: capture.message,
      trace,
      goal: goal ?? null,
    });
  }

  trace.push(`capture: ${capture.result.paymentId} - simulated test-mode capture`);
  trace.push(`receipt: ${capture.result.receiptId} issued, hash-chained`);

  return NextResponse.json({
    status: "captured",
    orderId,
    razorpayOrderId: razorpayOrder.id,
    paymentId: capture.result.paymentId,
    receiptId: capture.result.receiptId,
    receiptHash: capture.result.receiptHash,
    totalPaise,
    mandateId: mandate.id,
    proposalId: proposal.id,
    verdict,
    trace,
    goal: goal ?? null,
    lines,
  });
}