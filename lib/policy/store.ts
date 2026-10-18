// lib/policy/store.ts — server-side persistence for the trust spine
// (audit chain appends, mandate rows, receipt rows) on top of the service role client.

import { createAdminClient } from "@/lib/supabase/admin";
import { computeAuditHash } from "@/lib/policy/audit";
import {
  type Mandate,
  type MandateEnvelope,
  type ReceiptCanonicalBody,
  type Proposal,
  type GateVerdict,
} from "@/lib/policy/types";
import { createMandate, signMandate } from "@/lib/policy/mandate";
import { buildReceiptBody, signReceipt } from "@/lib/policy/receipt";

export const MERCHANT_ID = "kindred-coffee-supply";
export const DEFAULT_MANDATE_LIMITS = {
  maxPerOrderPaise: 5_000_000, // ₹50,000
  maxDailyPaise: 10_000_000, // ₹1,00,000
  expiryMinutes: 15,
};

export type MandateRow = {
  id: string;
  buyer_id: string;
  issuer: string;
  envelope: MandateEnvelope;
  signature: string | null;
  issued_at: string;
  revoked_at: string | null;
  checkout_hash: string | null;
};

/** Append a hash-chained audit event. Returns the stored event. */
export async function appendAuditEvent(params: {
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
}): Promise<{ id: string; hash: string; prevHash: string | null; createdAt: string }> {
  const supabase = createAdminClient();
  const { data: last } = await supabase
    .from("audit_events")
    .select("hash")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const prevHash: string | null = last?.hash ?? null;

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const hash = computeAuditHash(
    {
      id,
      createdAt,
      actor: params.actor,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: params.payload,
      prevHash,
    },
    prevHash,
  );

  const { error } = await supabase.from("audit_events").insert({
    id,
    created_at: createdAt,
    actor: params.actor,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    payload: params.payload,
    prev_hash: prevHash,
    hash,
  });
  if (error) throw new Error(`audit append failed: ${error.message}`);

  return { id, hash, prevHash, createdAt };
}

/** Load the buyer's active mandate or issue a fresh one. */
export async function getOrCreateMandate(buyerId: string): Promise<MandateRow> {
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("mandates")
    .select("*")
    .eq("buyer_id", buyerId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const active = (rows ?? []).find(
    (r) => !r.envelope?.revokedAt && r.envelope?.expiry && new Date(r.envelope.expiry).getTime() > Date.now(),
  );
  if (active) return active as MandateRow;

  const mandate = createMandate({
    buyerId,
    issuer: MERCHANT_ID,
    maxPerOrderPaise: DEFAULT_MANDATE_LIMITS.maxPerOrderPaise,
    maxDailyPaise: DEFAULT_MANDATE_LIMITS.maxDailyPaise,
    allowedCategories: [],
    allowedSkus: [],
    expiryMinutes: DEFAULT_MANDATE_LIMITS.expiryMinutes,
  });

  const base = {
    id: mandate.id,
    buyer_id: buyerId,
    issuer: mandate.issuer,
    envelope: mandate.envelope,
    issued_at: mandate.issuedAt,
  };

  // `signature` column is added by migration 005; fall back if it is not there yet.
  let inserted = await supabase
    .from("mandates")
    .insert({ ...base, signature: mandate.signature })
    .select("*")
    .single();
  if (inserted.error && /signature/.test(inserted.error.message)) {
    inserted = await supabase.from("mandates").insert(base).select("*").single();
  }
  if (inserted.error || !inserted.data) {
    throw new Error(`mandate insert failed: ${inserted.error?.message ?? "unknown"}`);
  }

  return inserted.data as MandateRow;
}

export function toPolicyMandate(row: MandateRow): Mandate {
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

/** Sum of today's captured/paid orders for a buyer (rolling daily spend). */
export async function getBuyerDailySpendPaise(buyerId: string): Promise<number> {
  const supabase = createAdminClient();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("orders")
    .select("total_paise,status,created_at")
    .eq("buyer_id", buyerId)
    .gte("created_at", startOfDay.toISOString())
    .in("status", ["captured", "paid", "checkout"]);
  return (data ?? []).reduce((s, o) => s + (o.total_paise ?? 0), 0);
}

/** Checkouts attempted in the last hour for this buyer (velocity rule). */
export async function getBuyerVelocity(buyerId: string): Promise<number> {
  const supabase = createAdminClient();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("buyer_id", buyerId)
    .gte("created_at", hourAgo.toISOString());
  return count ?? 0;
}

/** Build, sign and chain-store a receipt. Returns the stored record. */
export async function issueReceipt(params: {
  receiptId: string;
  proposal: Proposal;
  verdict: Pick<GateVerdict, "determiningRule" | "reason" | "reasonCode">;
  outcome: "approved" | "blocked" | "failed";
  mandateId: string;
  orderId?: string;
  razorpayIds?: { orderId?: string; paymentId?: string };
}): Promise<{ id: string; body: ReceiptCanonicalBody; signature: string; hash: string; prevHash: string | null }> {
  const supabase = createAdminClient();

  const body = buildReceiptBody({
    receiptId: params.receiptId,
    proposal: {
      id: params.proposal.id,
      lines: params.proposal.lines.map((l) => ({ sku: l.sku, qty: l.quantity, unitPaise: l.unitPaise })),
      totalPaise: params.proposal.totalPaise,
    },
    determiningRule: params.verdict.determiningRule ?? null,
    outcome: params.outcome,
    reason: params.verdict.reason ?? null,
    reasonCode: params.verdict.reasonCode ?? null,
    mandateRef: params.mandateId,
    razorpayIds: params.razorpayIds,
  });

  const secret = process.env.POLICY_SIGNING_SECRET ?? "kindred-demo-secret";
  const signature = signReceipt(body, secret);

  const { data: last } = await supabase
    .from("receipts")
    .select("hash")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const prevHash: string | null = last?.hash ?? null;

  const { error } = await supabase.from("receipts").insert({
    id: params.receiptId,
    mandate_id: params.mandateId,
    order_id: params.orderId ?? null,
    canonical_body: body,
    signature,
    hash: body.hashes.receiptHash,
    prev_hash: prevHash,
  });
  if (error) throw new Error(`receipt insert failed: ${error.message}`);

  return { id: params.receiptId, body, signature, hash: body.hashes.receiptHash, prevHash };
}
