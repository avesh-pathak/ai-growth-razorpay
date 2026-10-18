// app/api/orders/route.ts - list orders for the signed-in buyer

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";

export const instant = false;

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "unauthorized", message: "sign in first" }, { status: 401 });
  }
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10), 200);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, buyer_id, status, total_paise, razorpay_order_id, quote_ref, mandate_id, receipt_id, items, created_at, updated_at")
    .eq("buyer_id", profile.userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
  }
  return NextResponse.json({ orders: data ?? [] });
}