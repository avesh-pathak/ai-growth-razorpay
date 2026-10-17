// lib/purchase-flow/story.ts
// Pure timeline helpers shared by the three figures. No React here.

import type { Evaluation, Scenario } from "./model";

export interface Stage {
  id: string;
  /** Short label for the readout strip ("Picking", "Checking"). */
  label: string;
  /** Audit-style event name shown next to the label. */
  event: string;
  /** Seconds this stage lasts. */
  dur: number;
}

export interface Story {
  stages: Stage[];
  /** Cumulative start time of each stage, in seconds. */
  starts: number[];
  total: number;
}

export function makeStory(stages: Stage[]): Story {
  const starts: number[] = [];
  let at = 0;
  for (const stage of stages) {
    starts.push(at);
    at += stage.dur;
  }
  return { stages, starts, total: at };
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Smoothstep: eases in and out, ends exactly at 0 and 1. */
export const ease = (u: number) => {
  const c = clamp01(u);
  return c * c * (3 - 2 * c);
};

export const tween = (from: number, to: number, u: number) => from + (to - from) * clamp01(u);

export function stageIndex(story: Story, clock: number): number {
  for (let index = story.stages.length - 1; index >= 0; index--) {
    if (clock >= story.starts[index]) return index;
  }
  return 0;
}

/** Raw progress 0..1 through the stage containing `clock`. */
export function stageProgress(story: Story, clock: number, index: number): number {
  const start = story.starts[index];
  return clamp01((clock - start) / story.stages[index].dur);
}

/**
 * Eased progress 0..1 through the slice [from..to] of one stage — the main tool
 * for sequencing motion inside a stage. Outside the slice it clamps.
 */
export function within(story: Story, clock: number, index: number, from = 0, to = 1): number {
  const u = stageProgress(story, clock, index);
  return ease((u - from) / Math.max(1e-6, to - from));
}

/** True once the story has reached the end of a given stage and moved on. */
export function pastStage(story: Story, clock: number, index: number): boolean {
  return clock >= story.starts[index] + story.stages[index].dur;
}

export interface ReadoutRow {
  label: string;
  value: string;
  tone?: "ok" | "bad" | "muted";
}

/* ------------------------------------------------------------- the story */

/**
 * The stage list for a scenario — the one timeline behind every figure.
 * Durations are display-only: the production gate is a server module.
 */
export function stagesFor(scenario: Scenario, evaluation: Evaluation): Stage[] {
  const blocked = evaluation.verdict === "blocked";
  const head: Stage[] = [
    { id: "request", label: "Request", event: "shopper.requested", dur: 2.0 },
    { id: "propose", label: "Propose", event: "merchant.proposal_created", dur: 2.6 },
    { id: "submit", label: "Submit", event: "merchant.proposal_submitted", dur: 1.4 },
    { id: "screen", label: "Evaluate", event: "policy.evaluating", dur: 2.2 },
  ];
  if (blocked) {
    return [...head, { id: "rejected", label: "Blocked", event: `policy.blocked · ${evaluation.reasonCode}`, dur: 3.0 }];
  }
  return [
    ...head,
    { id: "decision", label: "Decision", event: "policy.approved", dur: 1.6 },
    { id: "catalog", label: "Catalog", event: "buyer.catalog_fetched", dur: 1.8 },
    { id: "cart", label: "Cart", event: "buyer.cart_updated", dur: 1.8 },
    { id: "quote", label: "Quote", event: `buyer.quote_created · ${scenario.quote}`, dur: 1.5 },
    { id: "checkout", label: "Authorize", event: "policy.evaluating", dur: 2.2 },
    {
      id: "payment",
      label: "Payment",
      event: scenario.payment === "failed" ? "payment.failed" : "payment.succeeded",
      dur: 2.0,
    },
    {
      id: "result",
      label: scenario.payment === "failed" ? "Failed" : "Receipt",
      event: scenario.payment === "failed" ? `checkout.failed · ${scenario.txn}` : `receipt.issued · ${scenario.receipt}`,
      dur: 2.2,
    },
  ];
}

/** Chrome label for the status chip ("Listening", "Approved", …). */
export function stateLabel(story: Story, phase: number, scenario: Scenario, evaluation: Evaluation, ended: boolean): string {
  if (ended) {
    if (scenario.payment === "failed" && evaluation.verdict === "approved") return "Payment failed";
    return evaluation.verdict === "blocked" ? "Blocked" : "Completed";
  }
  const id = story.stages[Math.min(phase, story.stages.length - 1)]?.id;
  switch (id) {
    case "request":
      return "Listening";
    case "propose":
    case "submit":
      return "Proposing";
    case "screen":
    case "checkout":
      return "Evaluating";
    case "rejected":
      return "Blocked";
    case "decision":
      return "Approved";
    case "payment":
      return "Purchasing";
    case "result":
      return scenario.payment === "failed" ? "Failed" : "Completed";
    default:
      return "Purchasing";
  }
}
