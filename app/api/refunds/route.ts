// app/api/refunds/route.ts - Refunds (linked audit pair, gate-checked)

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";
import { createRefund } from "@/lib/payments/razorpay";
import { appendAuditEvent } from "@/lib/policy/store";
import { isMerchant } from "@/lib/auth";
import { formatPaise } from "@/lib/data/products";
import { redactEmail } from "@/lib/pii";

export const instant = false;

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile || !isMerchant(profile)) {
    return NextResponse.json({ error: "forbidden", message: "merchant role required" }, { status: 403 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("audit_events")
    .select("id, created_at, actor, action, entity_type, entity_id, payload")
    .in("action", ["refund.created", "refund.processed", "refund.failed"])
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
  }
  return NextResponse.json({ refunds: data ?? [] });
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile || !isMerchant(profile)) {
    return NextResponse.json({ error: "forbidden", message: "merchant role required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const orderId = body?.orderId as string | undefined;
  const amountPaise = Number(body?.amountPaise);
  const reason = (body?.reason as string | undefined) ?? "merchant_initiated";
  const approved = body?.approved === true;

  if (!orderId || !Number.isFinite(amountPaise) || amountPaise <= 0) {
    return NextResponse.json({ error: "invalid_request", message: "orderId and amountPaise required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Load order + payment
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "not_found", message: "order not found" }, { status: 404 });
  }
  const { data: payment } = await supabase.from("payments").select("*").eq("order_id", orderId).maybeSingle();
  if (!payment || payment.status !== "captured") {
    return NextResponse.json({ error: "invalid_state", message: "payment not captured" }, { status: 409 });
  }
  const originalAmount = payment.amount_paise as number;
  if (amountPaise > originalAmount) {
    return NextResponse.json({ error: "invalid_request", message: "refund exceeds original amount" }, { status: 400 });
  }

  // Gate: admin approval required above 50% of original
  const threshold = Math.floor(originalAmount * 0.5);
  if (amountPaise > threshold && !approved) {
    return NextResponse.json(
      { error: "approval_required", message: `Refund above 50% (${formatPaise(amountPaise)} of ${formatPaise(originalAmount)}) requires admin approval (approved: true)` },
      { status: 403 },
    );
  }

  // Audit: refund requested
  const refundId = `RFND-${Date.now().toString(36).toUpperCase()}`;
  await appendAuditEvent({
    actor: redactEmail(profile.email),
    action: "refund.requested",
    entityType: "order",
    entityId: orderId,
    payload: { refundId, amountPaise, reason, originalAmount, orderId },
  });

  // Gate evaluation audit
  await appendAuditEvent({
    actor: "policy-gate",
    action: "refund.gate_evaluated",
    entityType: "order",
    entityId: orderId,
    payload: { refundId, amountPaise, originalAmount, approved: amountPaise <= threshold || approved, threshold },
  });

  // Razorpay refund (test mode)
  let razorpayRefundId: string;
  try {
    const r = await createRefund(payment.razorpay_payment_id, amountPaise, { reason, orderId, refundId });
    razorpayRefundId = r.id;
  } catch (e) {
    await appendAuditEvent({
      actor: "system",
      action: "refund.failed",
      entityType: "order",
      entityId: orderId,
      payload: { refundId, reason: e instanceof Error ? e.message : "unknown" },
    });
    return NextResponse.json({ error: "refund_failed", message: e instanceof Error ? e.message : "refund failed" }, { status: 502 });
  }

  // Update payment state
  const isFull = amountPaise >= originalAmount;
  await supabase
    .from("payments")
    .update({
      status: isFull ? "refunded" : "partially_refunded",
      refunded_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);

  // Audit: refund created (linked audit pair)
  await appendAuditEvent({
    actor: "merchant",
    action: "refund.created",
    entityType: "receipt",
    entityId: order.receipt_id ?? orderId,
    payload: {
      refundId,
      razorpayRefundId,
      orderId,
      amountPaise,
      reason,
      originalAmount,
      isFull,
      linkedReceiptId: order.receipt_id ?? null,
    },
  });

  return NextResponse.json({
    refundId,
    razorpayRefundId,
    orderId,
    amountPaise,
    status: isFull ? "refunded" : "partially_refunded",
  });
}