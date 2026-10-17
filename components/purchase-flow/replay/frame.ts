// components/purchase-flow/replay/frame.ts
// The replay's pure frame model: (scenario, story, clock) → every value the
// panel animates. One deterministic function of the clock — the DOM layer
// only writes it. No React, no side effects.

import { RULES, type Evaluation, type Scenario } from "@/lib/purchase-flow/model";
import { clamp01, stageIndex, within, type Story } from "@/lib/purchase-flow/story";

export type CheckDisplay = "pending" | "checking" | "passed" | "failed" | "skipped";
export type OfferState = "draft" | "review" | "buyable" | "blocked";
export type PayState = "idle" | "processing" | "succeeded" | "declined";
export type GateVerdict = "standing" | "evaluating" | "approved" | "blocked";
export type StageKind = "merchant" | "gate" | "buyer";

/* The chat copy is fixed demo copy — the amounts and rule text are not. */
export const MESSAGE = "Can you put together a midweek pour-over setup — the essentials?";
export const REPLY = "On it — I pulled six items from the live catalog. Bundle proposal below, priced at vendor list.";

export const CHECK_WORD: Record<CheckDisplay, string> = {
  pending: "———",
  checking: "checking",
  passed: "passed",
  failed: "failed",
  skipped: "skipped",
};

export const OFFER_WORD: Record<OfferState, string> = {
  draft: "draft",
  review: "in review",
  buyable: "buyable",
  blocked: "blocked",
};

export const GATE_WORD: Record<GateVerdict, string> = {
  standing: "standing by",
  evaluating: "evaluating",
  approved: "approved",
  blocked: "blocked",
};

export const PAY_WORD: Record<PayState, string> = {
  idle: "awaiting authorization",
  processing: "processing…",
  succeeded: "paid · test mode",
  declined: "declined · test mode",
};

export interface ReplayFrame {
  stage: number;
  stageId: string;
  /** 0..1 across the whole story. */
  progress: number;

  merchantVis: number;
  buyerVis: number;

  msgText: string;
  msgTyping: boolean;
  replyVis: number;
  replyText: string;
  replyTyping: boolean;
  sysVis: number;
  cards: number[];
  bundleVis: number;
  bundleRows: number[];
  bundleTotalPaise: number;
  offer: OfferState;
  blockedNote: number;

  gateActive: boolean;
  gateEngagement: "proposal" | "checkout" | null;
  reveal: number;
  checks: CheckDisplay[];
  checkingIndex: number;
  gateVerdict: GateVerdict;
  bannerVis: number;
  reasonVis: number;

  catRows: number[];
  catFetched: number;
  picked: number[];
  cartRows: number[];
  cartItems: number;
  provisionalPaise: number;
  authoritative: boolean;
  quoteVis: number;
  quoteTotalPaise: number;
  quoteStamp: number;
  mandates: [number, number];
  authorized: boolean;
  payVis: number;
  payBar: number;
  payState: PayState;
  declineVis: number;
  receiptVis: number;

  ruleNow: string;
}

/** The stage-family a stage id belongs to — tabs, bar segments. */
export function stageKind(id: string): StageKind {
  if (id === "request" || id === "propose" || id === "submit") return "merchant";
  if (id === "screen" || id === "decision" || id === "rejected") return "gate";
  return "buyer";
}

export function frameAt(scenario: Scenario, evaluation: Evaluation, story: Story, clock: number): ReplayFrame {
  const index = (id: string) => story.stages.findIndex((stage) => stage.id === id);
  const w = (id: string, from = 0, to = 1) => {
    const i = index(id);
    return i < 0 ? 0 : within(story, clock, i, from, to);
  };
  const at = (id: string, fraction = 0) => {
    const i = index(id);
    return i < 0 ? Number.POSITIVE_INFINITY : story.starts[i]! + story.stages[i]!.dur * fraction;
  };

  const stage = stageIndex(story, clock);
  const stageId = story.stages[stage]!.id;
  const blocked = evaluation.verdict === "blocked";
  const failedPayment = !blocked && scenario.payment === "failed";

  /* merchant ---------------------------------------------------------- */

  const msgVis = w("request", 0.2, 0.72);
  const msgText = MESSAGE.slice(0, Math.ceil(MESSAGE.length * msgVis));
  const replyTyped = w("propose", 0.02, 0.42);
  const replyText = REPLY.slice(0, Math.ceil(REPLY.length * replyTyped));

  let offer: OfferState = "draft";
  if (clock >= at("submit")) offer = "review";
  if (blocked) {
    if (w("screen", 0.68, 0.78) > 0) offer = "blocked";
  } else if (clock >= at("decision", 0.25)) {
    offer = "buyable";
  }

  /* gate -------------------------------------------------------------- */

  const gateActive = stageId === "screen" || stageId === "checkout";
  const gateEngagement = stageId === "screen" ? "proposal" : stageId === "checkout" ? "checkout" : null;
  const revealProposal = w("screen", 0.08, 0.92) * RULES.length;
  const revealCheckout = w("checkout", 0.3, 0.95) * RULES.length;
  const reveal = clock >= at("checkout") ? revealCheckout : revealProposal;

  const checks: CheckDisplay[] = RULES.map((_, r) => {
    if (reveal >= r + 1) return evaluation.rules[r]?.status ?? "pending";
    if (gateActive && reveal > r + 0.001) return "checking";
    return "pending";
  });
  const checkingIndex = checks.indexOf("checking");

  let gateVerdict: GateVerdict = "standing";
  if (blocked) {
    gateVerdict = reveal >= evaluation.failedIndex + 1 ? "blocked" : gateActive ? "evaluating" : "standing";
  } else if (clock >= at("checkout")) {
    gateVerdict = revealCheckout >= RULES.length - 1e-3 ? "approved" : "evaluating";
  } else if (revealProposal >= RULES.length - 1e-3) {
    gateVerdict = "approved";
  } else if (gateActive) {
    gateVerdict = "evaluating";
  }

  const bannerVis =
    gateVerdict === "approved"
      ? Math.max(w("decision", 0, 0.18), w("checkout", 0.95, 1))
      : gateVerdict === "blocked"
        ? w("rejected", 0.08, 0.32)
        : 0;

  /* buyer ------------------------------------------------------------- */

  const buyerVis = blocked ? 0 : w("decision", 0.55, 0.95);
  const catN = w("catalog", 0.1, 0.75) * 6;
  const cartN = w("cart", 0.16, 0.62) * 6;

  let payState: PayState = "idle";
  if (clock >= at("payment")) {
    payState = clock >= at("payment", 0.6) ? (failedPayment ? "declined" : "succeeded") : "processing";
  }

  return {
    stage,
    stageId,
    progress: clamp01(story.total > 0 ? clock / story.total : 0),

    merchantVis: 1 - buyerVis,
    buyerVis,

    msgText,
    msgTyping: stageId === "request" && msgVis < 0.999,
    replyVis: w("propose", 0.02, 0.4),
    replyText,
    replyTyping: stageId === "propose" && replyText.length < REPLY.length,
    sysVis: w("submit", 0.05, 0.35),
    cards: [0, 1, 2, 3, 4, 5].map((k) => w("propose", 0.28 + k * 0.045, 0.42 + k * 0.045)),
    bundleVis: w("propose", 0.52, 0.66),
    bundleRows: [0, 1, 2, 3, 4, 5].map((k) => w("propose", 0.58 + k * 0.035, 0.66 + k * 0.035)),
    bundleTotalPaise: Math.round(evaluation.totalPaise * w("propose", 0.78, 0.96)),
    offer,
    blockedNote: blocked ? w("rejected", 0.12, 0.42) : 0,

    gateActive,
    gateEngagement,
    reveal,
    checks,
    checkingIndex,
    gateVerdict,
    bannerVis,
    reasonVis: blocked ? w("rejected", 0.05, 0.38) : 0,

    catRows: [0, 1, 2, 3, 4, 5].map((k) => clamp01(catN - k)),
    catFetched: Math.round(catN),
    picked: [0, 1, 2, 3, 4, 5].map((k) => w("cart", 0.08 + k * 0.05, 0.28 + k * 0.05)),
    cartRows: [0, 1, 2, 3, 4, 5].map((k) => w("cart", 0.16 + k * 0.05, 0.36 + k * 0.05)),
    cartItems: Math.round(cartN),
    provisionalPaise: Math.round(evaluation.totalPaise * w("cart", 0.5, 0.95)),
    authoritative: w("quote", 0.55, 0.8) > 0.6,
    quoteVis: w("quote", 0.04, 0.4),
    quoteTotalPaise: Math.round(evaluation.totalPaise * w("quote", 0.25, 0.7)),
    quoteStamp: w("quote", 0.55, 0.8),
    mandates: [clamp01((revealCheckout - 1) * 2.5), clamp01((revealCheckout - 1.3) * 2.5)],
    authorized: !blocked && revealCheckout >= RULES.length - 1e-3,
    payVis: w("payment", 0, 0.15),
    payBar: w("payment", 0.12, 0.6),
    payState,
    declineVis: failedPayment ? w("payment", 0.66, 0.88) : 0,
    receiptVis: !blocked && scenario.payment === "succeeded" ? w("result", 0.08, 0.52) : 0,

    ruleNow:
      checkingIndex >= 0 ? `rule ${checkingIndex + 1} / ${RULES.length} · ${RULES[checkingIndex]!.short.toLowerCase()}` : "",
  };
}

/* ------------------------------------------------------------ chrome copy */

export function contextLine(scenario: Scenario, evaluation: Evaluation, story: Story, phase: number): string {
  const stage = story.stages[Math.min(phase, story.stages.length - 1)]!;
  const failed = evaluation.rules[evaluation.failedIndex];
  switch (stage.id) {
    case "request":
      return "A shopper asks for help — the Merchant Agent listens.";
    case "propose":
      return `The Merchant Agent drafts a bundle of ${evaluation.lines.length} SKUs, priced at vendor list.`;
    case "submit":
      return "The proposal goes to the Policy Gate — nothing is buyable until it passes.";
    case "screen":
      return "Seven rules evaluate in precedence order. First failure wins.";
    case "rejected":
      return `Blocked at ${failed?.short ?? "policy"} — ${evaluation.reasonCode}. Nothing later is evaluated.`;
    case "decision":
      return "All seven rules passed. The offer is now buyable at list price.";
    case "catalog":
      return "The Buyer Agent fetches the authoritative catalog — six SKUs.";
    case "cart":
      return "Selected SKUs move into the cart. The total is provisional until quoted.";
    case "quote":
      return `The backend issues quote ${scenario.quote} — the price is locked for five minutes.`;
    case "checkout":
      return "Both mandates and the policy rules re-verify against the quote.";
    case "payment":
      return "The test-mode processor charges the quoted amount.";
    case "result":
      return scenario.payment === "failed" && evaluation.verdict === "approved"
        ? "Declined in test mode. No receipt, no order token — the audit records the failure."
        : `Payment succeeded. Receipt ${scenario.receipt} is issued and the audit trail closes the loop.`;
    default:
      return "";
  }
}

export function statusTone(scenario: Scenario, evaluation: Evaluation, ended: boolean): "neutral" | "positive" | "destructive" {
  if (!ended) return "neutral";
  if (evaluation.verdict === "blocked") return "destructive";
  if (scenario.payment === "failed") return "destructive";
  return "positive";
}
