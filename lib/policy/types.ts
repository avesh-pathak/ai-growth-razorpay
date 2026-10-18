// lib/policy/types.ts — shared types for the Policy Gate, mandates, receipts, audit trail

export type RuleId =
  | "mandate_validity"
  | "category_whitelist"
  | "price_source_of_truth"
  | "margin_floor"
  | "per_order_cap"
  | "rolling_daily_cap"
  | "velocity";

export type RuleResult = "passed" | "failed" | "skipped";

export interface RuleEvaluation {
  rule: RuleId;
  result: RuleResult;
  reason?: string;
  params?: Record<string, unknown>;
}

export interface GateVerdict {
  outcome: "approved" | "blocked";
  determiningRule?: RuleId;
  reason?: string;
  reasonCode?: string;
  rules: RuleEvaluation[];
  totalPaise: number;
  evaluatedAt: string;
}

export interface MandateEnvelope {
  maxPerOrderPaise: number;
  maxDailyPaise: number;
  allowedCategories: string[];
  allowedSkus: string[];
  expiry: string; // ISO timestamp
  currency: string;
  issuedAt: string;
  revokedAt?: string;
  checkoutHash?: string;
}

export interface Mandate {
  id: string;
  buyerId: string;
  issuer: string; // merchant ID
  envelope: MandateEnvelope;
  signature: string;
  issuedAt: string;
  revokedAt?: string;
}

export interface ProposalLine {
  sku: string;
  short: string;
  category: string;
  quantity: number;
  unitPaise: number; // authoritative price from catalog
  proposedPaise: number; // price the agent proposed
  costPaise: number;
  marginPct: number;
}

export interface Proposal {
  id: string;
  lines: ProposalLine[];
  totalPaise: number;
  mandateId: string;
  createdAt: string;
}

export interface ReceiptCanonicalBody {
  receiptId: string;
  proposal: {
    id: string;
    lines: { sku: string; qty: number; unitPaise: number }[];
    totalPaise: number;
  };
  ruleChecked: RuleId | null;
  outcome: "approved" | "blocked" | "failed";
  reason: string | null;
  reasonCode: string | null;
  hashes: {
    proposalHash: string;
    mandateHash: string;
    quoteHash?: string;
    receiptHash: string;
  };
  mandateRef: string;
  razorpayIds?: {
    orderId?: string;
    paymentId?: string;
  };
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  createdAt: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  prevHash: string | null;
  hash: string;
}