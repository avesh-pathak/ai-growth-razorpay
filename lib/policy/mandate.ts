// lib/policy/mandate.ts — Mandate lifecycle: create, validate, narrow, revoke, sign/verify

import { type Mandate, type MandateEnvelope } from "./types";
import { createHash } from "crypto";

export function createMandate(params: {
  buyerId: string;
  issuer: string;
  maxPerOrderPaise: number;
  maxDailyPaise: number;
  allowedCategories: string[];
  allowedSkus: string[];
  expiryMinutes: number;
  currency?: string;
}): Mandate {
  const now = new Date();
  const expiry = new Date(now.getTime() + params.expiryMinutes * 60 * 1000);
  const envelope: MandateEnvelope = {
    maxPerOrderPaise: params.maxPerOrderPaise,
    maxDailyPaise: params.maxDailyPaise,
    allowedCategories: params.allowedCategories,
    allowedSkus: params.allowedSkus,
    expiry: expiry.toISOString(),
    currency: params.currency ?? "INR",
    issuedAt: now.toISOString(),
  };

  const id = `mandate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const signature = signMandate(id, envelope, params.issuer);

  return {
    id,
    buyerId: params.buyerId,
    issuer: params.issuer,
    envelope,
    signature,
    issuedAt: now.toISOString(),
  };
}

export function signMandate(id: string, envelope: MandateEnvelope, issuer: string): string {
  const payload = JSON.stringify({ id, envelope, issuer });
  return createHash("sha256").update(payload).digest("hex");
}

export function verifyMandate(mandate: Mandate): boolean {
  const expected = signMandate(mandate.id, mandate.envelope, mandate.issuer);
  return expected === mandate.signature;
}

export function narrowMandate(mandate: Mandate, narrowing: Partial<MandateEnvelope>): Mandate {
  const narrowed: MandateEnvelope = {
    ...mandate.envelope,
    ...narrowing,
    // Buyer may narrow, never widen
    maxPerOrderPaise: Math.min(mandate.envelope.maxPerOrderPaise, narrowing.maxPerOrderPaise ?? mandate.envelope.maxPerOrderPaise),
    maxDailyPaise: Math.min(mandate.envelope.maxDailyPaise, narrowing.maxDailyPaise ?? mandate.envelope.maxDailyPaise),
    allowedCategories: narrowing.allowedCategories
      ? narrowing.allowedCategories.filter((c) => mandate.envelope.allowedCategories.includes(c))
      : mandate.envelope.allowedCategories,
    allowedSkus: narrowing.allowedSkus
      ? narrowing.allowedSkus.filter((s) => mandate.envelope.allowedSkus.includes(s))
      : mandate.envelope.allowedSkus,
  };

  return {
    ...mandate,
    envelope: narrowed,
    signature: signMandate(mandate.id, narrowed, mandate.issuer),
  };
}

export function revokeMandate(mandate: Mandate): Mandate {
  return {
    ...mandate,
    envelope: { ...mandate.envelope, revokedAt: new Date().toISOString() },
    revokedAt: new Date().toISOString(),
  };
}

export function bindCheckoutHash(mandate: Mandate, checkoutHash: string): Mandate {
  return {
    ...mandate,
    envelope: { ...mandate.envelope, checkoutHash },
  };
}