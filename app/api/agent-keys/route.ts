// app/api/agent-keys/route.ts — Agent key management (create/list/revoke)
// Secrets are shown once at creation; only SHA-256 hashes are stored.

import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "unauthorized", message: "sign in first" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("agent_keys")
    .select("id, name, scopes, spend_envelope, revoked_at, created_at")
    .eq("buyer_id", profile.userId)
    .order("created_at", { ascending: false });
  return NextResponse.json({ keys: data ?? [] });
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "unauthorized", message: "sign in first" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action as string | undefined;
  const supabase = createAdminClient();

  if (action === "create") {
    const name = String(body?.name ?? "").trim();
    if (name.length < 2) {
      return NextResponse.json({ error: "invalid_request", message: "name required" }, { status: 400 });
    }

    const secret = `sk_agent_${randomBytes(24).toString("hex")}`;
    const hashedSecret = createHash("sha256").update(secret).digest("hex");
    const id = `ak-${Date.now().toString(36).toUpperCase()}`;

    const { error } = await supabase.from("agent_keys").insert({
      id,
      buyer_id: profile.userId,
      name,
      scopes: Array.isArray(body?.scopes) ? body.scopes : ["catalog:read", "quote:create", "checkout:create"],
      spend_envelope: body?.spendEnvelope ?? {},
      hashed_secret: hashedSecret,
    });
    if (error) {
      return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        key: {
          id,
          name,
          scopes: body?.scopes ?? ["catalog:read", "quote:create", "checkout:create"],
          createdAt: new Date().toISOString(),
          secret, // shown once — never stored in plaintext
        },
        notice: "Store this secret now. It will not be shown again.",
      },
      { status: 201 },
    );
  }

  if (action === "revoke") {
    const keyId = String(body?.keyId ?? "");
    if (!keyId) {
      return NextResponse.json({ error: "invalid_request", message: "keyId required" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("agent_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", keyId)
      .eq("buyer_id", profile.userId)
      .select("id");
    if (error) {
      return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "not_found", message: "key not found" }, { status: 404 });
    }
    return NextResponse.json({ revoked: true, keyId });
  }

  return NextResponse.json({ error: "invalid_request", message: "unknown action" }, { status: 400 });
}
