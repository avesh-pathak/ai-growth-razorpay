// app/api/receipts/route.ts - list recent receipts for the signed-in user

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";

export const instant = false;

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "unauthorized", message: "sign in first" }, { status: 401 });
  }
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10), 100);
  const supabase = createAdminClient();
  // receipts linked to this buyer's orders
  const { data: orders } = await supabase.from("orders").select("id").eq("buyer_id", profile.userId);
  const orderIds = (orders ?? []).map((o: any) => o.id);
  if (orderIds.length === 0) {
    return NextResponse.json({ receipts: [] });
  }
  const { data, error } = await supabase
    .from("receipts")
    .select("id, order_id, mandate_id, canonical_body, signature, hash, prev_hash, created_at")
    .in("order_id", orderIds)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
  }
  return NextResponse.json({ receipts: data ?? [] });
}