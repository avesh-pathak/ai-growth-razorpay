// app/api/checkout/route.ts — Checkout: quote + mandate -> Policy Gate -> Razorpay order
// The gate runs BEFORE any money action. A blocked proposal is a first-class,
// explained, receipt-backed outcome (the flagship demo path).

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";
import { fetchCatalog, catalogMap } from "@/lib/catalog";
import { getQuote, consumeQuote } from "@/lib/quote-store";
import { evaluate } from "@/lib/policy/gate";
import { computeHash } from "@/lib/policy/receipt";
import {
  appendAuditEvent,
  getOrCreateMandate,
  toPolicyMandate,
  getBuyerDailySpendPaise,
  getBuyerVelocity,
  issueReceipt,
  type MandateRow,
} from "@/lib/policy/store";
import type { Proposal } from "@/lib/policy/types";
import { createOrder } from "@/lib/payments";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "unauthorized", message: "sign in to check out" }, { status: 401 });
  }

  const limit = rateLimit(`checkout:${getClientKey(request, profile.userId)}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "rate_limited", message: "too many checkout attempts" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const quoteId = body?.quoteId as string | undefined;
  const idempotencyKey = body?.idempotencyKey as string | undefined;
  const requestedMandateId = body?.mandateId as string | undefined;

  if (!quoteId || !idempotencyKey) {
    return NextResponse.json({ error: "invalid_request", message: "quoteId and idempotencyKey are required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency: replay a completed attempt instead of double-charging.
  const { data: existingKey } = await supabase
    .from("idempotency_keys")
    .select("status,result")
    .eq("key", idempotencyKey)
    .maybeSingle();
  if (existingKey?.status === "completed" && existingKey.result) {
    return NextResponse.json({ ...(existingKey.result as Record<string, unknown>), replayed: true });
  }

  const quote = getQuote(quoteId);
  if (!quote) {
    return NextResponse.json({ error: "quote_expired", message: "quote not found or expired — re-quote first" }, { status: 410 });
  }

  // Mandate: buyer-scoped, signed, time-bounded.
  let mandateRow: MandateRow;
  if (requestedMandateId) {
    const { data } = await supabase.from("mandates").select("*").eq("id", requestedMandateId).maybeSingle();
    if (!data || data.buyer_id !== profile.userId) {
      return NextResponse.json({ error: "invalid_mandate", message: "mandate not found for this buyer" }, { status: 403 });
    }
    mandateRow = data as MandateRow;
  } else {
    mandateRow = await getOrCreateMandate(profile.userId);
  }
  const mandate = toPolicyMandate(mandateRow);

  const proposal: Proposal = {
    id: `PROP-${Date.now().toString(36).toUpperCase()}`,
    lines: quote.lines.map((l) => ({
      sku: l.sku,
      short: l.short,
      category: l.category,
      quantity: l.quantity,
      unitPaise: l.unitPaise,
      proposedPaise: l.proposedPaise,
      costPaise: l.costPaise,
      marginPct: l.marginPct,
    })),
    totalPaise: quote.totalPaise,
    mandateId: mandate.id,
    createdAt: new Date().toISOString(),
  };

  const catalog = await fetchCatalog();
  const ctx = {
    catalog: catalogMap(catalog),
    rollingDailySpendPaise: await getBuyerDailySpendPaise(profile.userId),
    velocityCount: await getBuyerVelocity(profile.userId),
    merchantTimezone: "UTC",
  };

  const verdict = evaluate(proposal, mandate, ctx);

  await appendAuditEvent({
    actor: "policy-gate",
    action: "policy.evaluated",
    entityType: "proposal",
    entityId: proposal.id,
    payload: {
      outcome: verdict.outcome,
      determiningRule: verdict.determiningRule ?? null,
      reason: verdict.reason ?? null,
      totalPaise: verdict.totalPaise,
      quoteId,
      mandateId: mandate.id,
      rules: verdict.rules.map((r) => ({ rule: r.rule, result: r.result })),
    },
  });

  // --------------------------- blocked path ---------------------------
  if (verdict.outcome === "blocked") {
    const receiptId = `REC-${Date.now().toString(36).toUpperCase()}`;
    await issueReceipt({
      receiptId,
      proposal,
      verdict,
      outcome: "blocked",
      mandateId: mandate.id,
    });

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
      },
    });

    // Swap suggestions: cheaper, in-stock alternatives per blocked line.
    const suggestions = quote.lines.map((line) => ({
      forSku: line.sku,
      alternatives: catalog
        .filter((c) => c.category === line.category && c.id !== line.sku && c.stock > 0 && c.pricePaise < line.unitPaise)
        .sort((a, b) => b.marginPct - a.marginPct)
        .slice(0, 2)
        .map((c) => ({ id: c.id, slug: c.slug, name: c.name, pricePaise: c.pricePaise })),
    }));

    return NextResponse.json({
      status: "blocked",
      verdict,
      receiptId,
      suggestions,
    });
  }

  // --------------------------- approved path ---------------------------
  // Atomic-ish inventory decrement with optimistic concurrency check.
  for (const line of quote.lines) {
    const { data: skuRow } = await supabase.from("skus").select("stock").eq("id", line.sku).maybeSingle();
    const current = skuRow?.stock ?? 0;
    if (current < line.quantity) {
      const receiptId = `REC-${Date.now().toString(36).toUpperCase()}`;
      const failedVerdict = { ...verdict, outcome: "blocked" as const, determiningRule: "price_source_of_truth" as const, reason: `stock race: ${line.short} sold out during checkout`, reasonCode: "price_source_of_truth" };
      await issueReceipt({ receiptId, proposal, verdict: failedVerdict, outcome: "failed", mandateId: mandate.id });
      await appendAuditEvent({
        actor: "policy-gate",
        action: "checkout.failed",
        entityType: "receipt",
        entityId: receiptId,
        payload: { reason: "stock_race", sku: line.sku },
      });
      return NextResponse.json({ status: "failed", verdict: failedVerdict, receiptId }, { status: 409 });
    }
    const { data: updated } = await supabase
      .from("skus")
      .update({ stock: current - line.quantity })
      .eq("id", line.sku)
      .eq("stock", current)
      .select("id");
    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: "stock_race", message: `${line.short} changed during checkout — retry` },
        { status: 409 },
      );
    }
  }

  // Razorpay order (test mode).
  let razorpayOrder: { id: string; amount: number; currency: string };
  try {
    razorpayOrder = await createOrder({
      amountPaise: quote.totalPaise,
      receipt: quoteId,
      notes: { quoteId, mandateId: mandate.id, proposalId: proposal.id },
    });
  } catch (err) {
    const receiptId = `REC-${Date.now().toString(36).toUpperCase()}`;
    const failedVerdict = { ...verdict, outcome: "blocked" as const };
    await issueReceipt({ receiptId, proposal, verdict: failedVerdict, outcome: "failed", mandateId: mandate.id });
    await appendAuditEvent({
      actor: "system",
      action: "checkout.failed",
      entityType: "receipt",
      entityId: receiptId,
      payload: { reason: "razorpay_order_failed", message: err instanceof Error ? err.message : "unknown" },
    });
    return NextResponse.json(
      { status: "failed", message: err instanceof Error ? err.message : "payment order failed" },
      { status: 502 },
    );
  }

  const orderId = `TXN-${Date.now().toString(36).toUpperCase()}`;
  const orderItems = quote.lines.map((l) => ({
    sku: l.sku,
    name: l.short,
    category: l.category,
    qty: l.quantity,
    unitPaise: l.unitPaise,
  }));

  const orderBase = {
    id: orderId,
    buyer_id: profile.userId,
    status: "created",
    total_paise: quote.totalPaise,
    razorpay_order_id: razorpayOrder.id,
    quote_ref: quoteId,
    mandate_id: mandate.id,
  };

  // `items` column is added by migration 005; fall back if missing.
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
    amount_paise: quote.totalPaise,
    status: "pending",
  });

  // Bind the mandate to this checkout (single-use binding).
  await supabase
    .from("mandates")
    .update({ checkout_hash: computeHash(`${quoteId}:${quote.totalPaise}`) })
    .eq("id", mandate.id);

  consumeQuote(quoteId);

  const result = {
    status: "created",
    orderId,
    razorpayOrderId: razorpayOrder.id,
    amountPaise: quote.totalPaise,
    totalPaise: quote.totalPaise,
    mandateId: mandate.id,
    proposalId: proposal.id,
    verdict,
  };

  await supabase.from("idempotency_keys").upsert(
    { key: idempotencyKey, status: "completed", result },
    { onConflict: "key" },
  );

  await appendAuditEvent({
    actor: "buyer-agent",
    action: "checkout.created",
    entityType: "order",
    entityId: orderId,
    payload: {
      totalPaise: quote.totalPaise,
      razorpayOrderId: razorpayOrder.id,
      quoteId,
      mandateId: mandate.id,
    },
  });

  return NextResponse.json(result);
}
