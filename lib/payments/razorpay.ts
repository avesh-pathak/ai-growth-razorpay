// lib/payments/razorpay.ts — Razorpay test-mode client

import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export function getRazorpayClient() {
  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string): boolean {
  const body = orderId + "|" + paymentId;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function createOrder(params: {
  amountPaise: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const client = getRazorpayClient();
  const order = await client.orders.create({
    amount: params.amountPaise,
    currency: params.currency ?? "INR",
    receipt: params.receipt ?? `rcpt-${Date.now()}`,
    notes: params.notes ?? {},
  });
  return { id: order.id, amount: order.amount as number, currency: order.currency as string };
}

export async function capturePayment(paymentId: string, amountPaise: number): Promise<{ id: string; status: string }> {
  const client = getRazorpayClient();
  const payment = await (client.payments as any).capture(paymentId, amountPaise, "INR");
  return { id: payment.id, status: payment.status };
}

export async function createRefund(paymentId: string, amountPaise: number, notes?: Record<string, string>): Promise<{ id: string; status: string }> {
  const client = getRazorpayClient();
  const refund = await (client.payments as any).refund(paymentId, { amount: amountPaise, notes: notes ?? {} });
  return { id: refund.id, status: refund.status };
}