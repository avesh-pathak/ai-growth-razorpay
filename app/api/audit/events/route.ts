// app/api/audit/events/route.ts - recent audit events (hash-chained trust spine)

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
    .from("audit_events")
    .select("id, created_at, actor, action, entity_type, entity_id, payload, prev_hash, hash")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
  }
  return NextResponse.json({ events: data ?? [] });
}