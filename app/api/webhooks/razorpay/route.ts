// app/api/webhooks/razorpay/route.ts — Razorpay webhook handler

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const eventId = request.headers.get("x-razorpay-event-id") ?? "";

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "server_error", message: "webhook secret not configured" }, { status: 500 });
  }

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "unauthorized", message: "invalid signature" }, { status: 401 });
  }

  // TODO: dedupe via processed_events table using eventId
  // TODO: handle event types: payment.captured, payment.failed, refund.created, etc.

  let event: { event: string; payload: unknown };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_request", message: "invalid JSON" }, { status: 400 });
  }

  // Log the event
  console.log("Webhook received:", event.event, eventId);

  return NextResponse.json({ status: "ok" });
}