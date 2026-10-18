// app/api/checkout/complete/route.ts — Complete a checkout in test mode.
// Razorpay test mode: the payment UI is simulated; capture and receipt issuance
// are recorded exactly as the webhook path would, with the same audit chain.

import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { captureOrder } from "@/lib/checkout/capture-order";

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "unauthorized", message: "sign in first" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderId = body?.orderId as string | undefined;
  if (!orderId) {
    return NextResponse.json({ error: "invalid_request", message: "orderId is required" }, { status: 400 });
  }

  const outcome = await captureOrder(orderId, profile.userId);
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error, message: outcome.message }, { status: outcome.httpStatus });
  }

  return NextResponse.json(outcome.result);
}
