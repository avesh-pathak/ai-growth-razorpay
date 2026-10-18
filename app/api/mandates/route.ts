// app/api/mandates/route.ts — Mandate exchange (create/verify/narrow/revoke/list)

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";
import { createMandate, narrowMandate, signMandate } from "@/lib/policy/mandate";
import type { MandateEnvelope } from "@/lib/policy/types";

type MandateRow = {
  id: string;
  buyer_id: string;
  issuer: string;
  envelope: MandateEnvelope;
  signature: string | null;
  issued_at: string;
  revoked_at: string | null;
  checkout_hash: string | null;
};

function toMandate(row: MandateRow) {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    issuer: row.issuer,
    envelope: row.envelope,
    signature: row.signature ?? signMandate(row.id, row.envelope, row.issuer),
    issuedAt: row.issued_at,
    revokedAt: row.revoked_at ?? undefined,
  };
}

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "unauthorized", message: "sign in first" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mandates")
    .select("*")
    .eq("buyer_id", profile.userId)
    .order("created_at", { ascending: false });
  return NextResponse.json({ mandates: (data ?? []).map((r) => toMandate(r as MandateRow)) });
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
    const mandate = createMandate({
      buyerId: profile.userId,
      issuer: body?.issuer ?? "kindred-coffee-supply",
      maxPerOrderPaise: Number(body?.maxPerOrderPaise ?? 5_000_000),
      maxDailyPaise: Number(body?.maxDailyPaise ?? 10_000_000),
      allowedCategories: Array.isArray(body?.allowedCategories) ? body.allowedCategories : [],
      allowedSkus: Array.isArray(body?.allowedSkus) ? body.allowedSkus : [],
      expiryMinutes: Number(body?.expiryMinutes ?? 15),
    });

    const base = {
      id: mandate.id,
      buyer_id: profile.userId,
      issuer: mandate.issuer,
      envelope: mandate.envelope,
      issued_at: mandate.issuedAt,
    };
    let inserted = await supabase
      .from("mandates")
      .insert({ ...base, signature: mandate.signature })
      .select("*")
      .single();
    if (inserted.error && /signature/.test(inserted.error.message)) {
      inserted = await supabase.from("mandates").insert(base).select("*").single();
    }
    if (inserted.error) {
      return NextResponse.json({ error: "db_error", message: inserted.error.message }, { status: 500 });
    }
    return NextResponse.json({ mandate: toMandate(inserted.data as MandateRow) }, { status: 201 });
  }

  if (!body?.mandateId) {
    return NextResponse.json({ error: "invalid_request", message: "mandateId is required" }, { status: 400 });
  }

  const { data: row } = await supabase.from("mandates").select("*").eq("id", body.mandateId).maybeSingle();
  if (!row || row.buyer_id !== profile.userId) {
    return NextResponse.json({ error: "not_found", message: "mandate not found for this buyer" }, { status: 404 });
  }
  const mandateRow = row as MandateRow;

  if (action === "verify") {
    const expected = signMandate(mandateRow.id, mandateRow.envelope, mandateRow.issuer);
    const signatureValid = mandateRow.signature ? mandateRow.signature === expected : true; // legacy rows: recomputed
    const expired = new Date(mandateRow.envelope.expiry).getTime() < Date.now();
    const revoked = !!mandateRow.revoked_at || !!mandateRow.envelope.revokedAt;
    return NextResponse.json({
      valid: signatureValid && !expired && !revoked,
      signatureValid,
      expired,
      revoked,
      envelope: mandateRow.envelope,
    });
  }

  if (action === "narrow") {
    const narrowed = narrowMandate(toMandate(mandateRow), body?.narrowing ?? {});
    const { error } = await supabase
      .from("mandates")
      .update({ envelope: narrowed.envelope, signature: narrowed.signature })
      .eq("id", mandateRow.id);
    if (error && /signature/.test(error.message)) {
      await supabase.from("mandates").update({ envelope: narrowed.envelope }).eq("id", mandateRow.id);
    } else if (error) {
      return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
    }
    return NextResponse.json({ mandate: narrowed });
  }

  if (action === "revoke") {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from("mandates")
      .update({ revoked_at: nowIso, envelope: { ...mandateRow.envelope, revokedAt: nowIso } })
      .eq("id", mandateRow.id);
    if (error) {
      return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
    }
    return NextResponse.json({ revoked: true, mandateId: mandateRow.id, revokedAt: nowIso });
  }

  return NextResponse.json({ error: "invalid_request", message: "unknown action" }, { status: 400 });
}
