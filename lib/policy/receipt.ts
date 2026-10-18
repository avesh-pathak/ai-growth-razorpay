// lib/policy/receipt.ts — Receipt canonical body, hash, signature, verification

import { type ReceiptCanonicalBody } from "./types";
import { createHash } from "crypto";

export function computeHash(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function buildReceiptBody(params: {
  receiptId: string;
  proposal: { id: string; lines: { sku: string; qty: number; unitPaise: number }[]; totalPaise: number };
  determiningRule: string | null;
  outcome: "approved" | "blocked" | "failed";
  reason: string | null;
  reasonCode: string | null;
  mandateRef: string;
  razorpayIds?: { orderId?: string; paymentId?: string };
}): ReceiptCanonicalBody {
  const proposalHash = computeHash(JSON.stringify(params.proposal));
  const mandateHash = computeHash(params.mandateRef);
  const quoteHash = params.proposal.totalPaise ? computeHash(String(params.proposal.totalPaise)) : undefined;

  const body: ReceiptCanonicalBody = {
    receiptId: params.receiptId,
    proposal: params.proposal,
    ruleChecked: params.determiningRule as ReceiptCanonicalBody["ruleChecked"],
    outcome: params.outcome,
    reason: params.reason,
    reasonCode: params.reasonCode,
    hashes: {
      proposalHash,
      mandateHash,
      quoteHash,
      receiptHash: "", // filled below
    },
    mandateRef: params.mandateRef,
    razorpayIds: params.razorpayIds,
    createdAt: new Date().toISOString(),
  };

  // Compute receipt hash over the canonical body (excluding receiptHash itself)
  const { receiptHash: _, ...bodyWithoutHash } = body.hashes;
  const canonical = JSON.stringify({ ...body, hashes: bodyWithoutHash });
  body.hashes.receiptHash = computeHash(canonical);

  return body;
}

export function verifyReceipt(body: ReceiptCanonicalBody): boolean {
  const { receiptHash, ...restHashes } = body.hashes;
  const canonical = JSON.stringify({ ...body, hashes: restHashes });
  const computed = computeHash(canonical);
  return computed === receiptHash;
}

export function signReceipt(body: ReceiptCanonicalBody, secret: string): string {
  return createHash("sha256").update(JSON.stringify(body) + secret).digest("hex");
}