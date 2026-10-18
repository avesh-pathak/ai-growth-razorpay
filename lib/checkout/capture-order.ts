// lib/checkout/capture-order.ts — Test-mode capture: the single path that marks a
// payment captured, issues the approved receipt, and appends the audit events.
// Used by /api/checkout/complete (human checkout) and /api/agent/buy (zero-click agent).

import { createAdminClient } from "@/lib/supabase/admin";
import { appendAuditEvent, issueReceipt } from "@/lib/policy/store";
import type { Proposal } from "@/lib/policy/types";

export type CaptureResult = {
  orderId: string;
  status: "captured";
  receiptId: string;
  receiptHash: string | null;
  paymentId: string;
  totalPaise: number;
  replayed?: boolean;
};

export type CaptureOutcome =
  | { ok: true; result: CaptureResult }
  | { ok: false; httpStatus: number; error: string; message: string };

type OrderItem = { sku: string; name: string; category: string; qty: number; unitPaise: number };

export async function captureOrder(orderId: string, buyerId: string): Promise<CaptureOutcome> {
  const supabase = createAdminClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    return { ok: false, httpStatus: 404, error: "not_found", message: "order not found" };
  }
  if (order.buyer_id !== buyerId) {
    return { ok: false, httpStatus: 403, error: "forbidden", message: "not your order" };
  }

  // Idempotent completion: an already-captured order returns its receipt.
  if (order.status === "captured" && order.receipt_id) {
    const [{ data: receipt }, { data: payment }] = await Promise.all([
      supabase.from("receipts").select("hash").eq("id", order.receipt_id).maybeSingle(),
      supabase.from("payments").select("razorpay_payment_id").eq("order_id", orderId).maybeSingle(),
    ]);
    return {
      ok: true,
      result: {
        orderId,
        status: "captured",
        receiptId: order.receipt_id,
        receiptHash: receipt?.hash ?? null,
        paymentId: payment?.razorpay_payment_id ?? "",
        totalPaise: order.total_paise,
        replayed: true,
      },
    };
  }
  if (order.status !== "created") {
    return { ok: false, httpStatus: 409, error: "invalid_state", message: `order is ${order.status}` };
  }

  const paymentId = `pay_SIM${orderId.replace(/[^A-Z0-9]/gi, "").slice(0, 12)}`;
  const nowIso = new Date().toISOString();

  await supabase
    .from("payments")
    .update({ status: "captured", captured_at: nowIso, razorpay_payment_id: paymentId })
    .eq("order_id", orderId);

  await supabase.from("orders").update({ status: "captured", updated_at: nowIso }).eq("id", orderId);

  const rawItems = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
  const proposal: Proposal = {
    id: `PROP-${orderId}`,
    lines:
      rawItems.length > 0
        ? rawItems.map((i) => ({
            sku: i.sku,
            short: i.name,
            category: i.category,
            quantity: i.qty,
            unitPaise: i.unitPaise,
            proposedPaise: i.unitPaise,
            costPaise: Math.round(i.unitPaise * 0.5),
            marginPct: 50,
          }))
        : [
            {
              sku: "mixed",
              short: "Order",
              category: "Mixed",
              quantity: 1,
              unitPaise: order.total_paise,
              proposedPaise: order.total_paise,
              costPaise: Math.round(order.total_paise * 0.5),
              marginPct: 50,
            },
          ],
    totalPaise: order.total_paise,
    mandateId: order.mandate_id ?? "unbound",
    createdAt: nowIso,
  };

  const receiptId = `REC-${orderId.replace(/^TXN-/, "")}`;
  const issued = await issueReceipt({
    receiptId,
    proposal,
    verdict: {},
    outcome: "approved",
    mandateId: order.mandate_id ?? "unbound",
    orderId,
    razorpayIds: { orderId: order.razorpay_order_id ?? undefined, paymentId },
  });

  await supabase.from("orders").update({ receipt_id: receiptId }).eq("id", orderId);

  await appendAuditEvent({
    actor: "system",
    action: "payment.captured",
    entityType: "order",
    entityId: orderId,
    payload: { paymentId, amountPaise: order.total_paise, mode: "test" },
  });
  await appendAuditEvent({
    actor: "buyer-agent",
    action: "receipt.issued",
    entityType: "receipt",
    entityId: receiptId,
    payload: { orderId, totalPaise: order.total_paise, paymentId },
  });

  return {
    ok: true,
    result: {
      orderId,
      status: "captured",
      receiptId,
      receiptHash: issued.hash,
      paymentId,
      totalPaise: order.total_paise,
    },
  };
}
