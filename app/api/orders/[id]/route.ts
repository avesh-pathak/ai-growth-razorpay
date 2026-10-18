// app/api/orders/[id]/route.ts — Order/payment status

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile, isMerchant } from "@/lib/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "unauthorized", message: "sign in first" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "not_found", message: "order not found" }, { status: 404 });
  }
  if (order.buyer_id !== profile.userId && !isMerchant(profile)) {
    return NextResponse.json({ error: "forbidden", message: "not your order" }, { status: 403 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id,status,amount_paise,razorpay_payment_id,captured_at,refunded_at,refund_amount_paise")
    .eq("order_id", id)
    .maybeSingle();

  const { data: receipt } = await supabase
    .from("receipts")
    .select("id,hash,created_at,canonical_body")
    .eq("order_id", id)
    .maybeSingle();

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      totalPaise: order.total_paise,
      items: order.items ?? [],
      razorpayOrderId: order.razorpay_order_id,
      quoteRef: order.quote_ref,
      mandateId: order.mandate_id,
      receiptId: order.receipt_id,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    },
    payment: payment
      ? {
          id: payment.id,
          status: payment.status,
          amountPaise: payment.amount_paise,
          razorpayPaymentId: payment.razorpay_payment_id,
          capturedAt: payment.captured_at,
          refundedAt: payment.refunded_at,
          refundAmountPaise: payment.refund_amount_paise,
        }
      : null,
    receipt: receipt
      ? {
          id: receipt.id,
          hash: receipt.hash,
          createdAt: receipt.created_at,
          outcome: receipt.canonical_body?.outcome ?? null,
        }
      : null,
  });
}
