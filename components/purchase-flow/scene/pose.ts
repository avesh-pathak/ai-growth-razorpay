// components/purchase-flow/scene/pose.ts
// The unified story: one clock drives all three environments. Pure — the live
// layer reads a ScenePose each frame and writes it to the DOM.

import { clamp01, ease, makeStory, pastStage, stageProgress, within, type Stage, type Story } from "@/lib/purchase-flow/story";
import type { Evaluation, Scenario } from "@/lib/purchase-flow/model";

/* ------------------------------------------------------------- the story */

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

export const storyFor = (scenario: Scenario, evaluation: Evaluation) => makeStory(stagesFor(scenario, evaluation));

/* ---------------------------------------------------------------- pose */

export interface ScenePose {
  merchant: "listening" | "proposing" | "ready" | "paused";
  gate: "idle" | "checking" | "approved" | "blocked";
  buyer: "idle" | "catalog" | "cart" | "quote" | "awaiting" | "checkout" | "paid" | "declined";
  offer: "pending" | "ready" | "blocked";
  chat: number;
  cards: [number, number, number];
  converge: number;
  bundle: number;
  price: number;
  /** −1 when no document is riding the lanes. */
  doc: number;
  docBack: boolean;
  /** −1 when no chip is riding the lanes. */
  chip: number;
  chipRejected: boolean;
  flowOut: boolean;
  flowBack: boolean;
  /** 0..7 rules that have been resolved by the current engagement. */
  reveal: number;
  shield: number;
  reason: number;
  slip: number;
  tiles: number;
  cartItems: number;
  quote: number;
  budget: number;
  over: boolean;
  pay: number;
  payState: "idle" | "processing" | "paid" | "declined";
  receipt: number;
  storeText: string;
  gateText: "pending" | "approved" | "blocked";
  payText: string;
  cursorM: [number, number];
  cursorB: [number, number];
}

const STOPS_M: Array<[number, number]> = [
  [92, 76],
  [48, 36],
  [26, 38],
  [63, 38],
  [100, 38],
];
const STOPS_B: Array<[number, number]> = [
  [84, 70],
  [30, 36],
  [56, 36],
  [80, 64],
];

function stopsAt(stops: Array<[number, number]>, t: number): [number, number] {
  const clamped = clamp01(t);
  const scaled = clamped * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const share = ease(scaled - index);
  const a = stops[index]!;
  const b = stops[index + 1]!;
  return [a[0] + (b[0] - a[0]) * share, a[1] + (b[1] - a[1]) * share];
}

export function poseAt(scenario: Scenario, evaluation: Evaluation, story: Story, clock: number): ScenePose {
  const idx = (id: string) => story.stages.findIndex((stage) => stage.id === id);
  const at = (id: string) => {
    const index = idx(id);
    return index < 0 ? Number.POSITIVE_INFINITY : story.starts[index]!;
  };
  const has = (id: string) => idx(id) >= 0;
  const after = (id: string) => clock >= at(id);
  const finished = (id: string) => {
    const index = idx(id);
    return index >= 0 && pastStage(story, clock, index);
  };
  const w = (id: string, from = 0, to = 1) => {
    const index = idx(id);
    return index < 0 ? 0 : within(story, clock, index, from, to);
  };
  const rawW = (id: string, from = 0, to = 1) => {
    const index = idx(id);
    if (index < 0) return 0;
    const u = stageProgress(story, clock, index);
    return clamp01((u - from) / Math.max(1e-6, to - from));
  };

  const blocked = evaluation.verdict === "blocked";
  const inScreen = has("screen") && after("screen") && !finished("screen");
  const inCheckout = has("checkout") && after("checkout") && !finished("checkout");
  const inPayment = has("payment") && after("payment") && !finished("payment");

  /* merchant --------------------------------------------------------------- */
  let merchant: ScenePose["merchant"] = "listening";
  if (after("propose")) merchant = "proposing";
  if (!blocked && after("decision")) merchant = "ready";
  if (blocked && after("rejected")) merchant = "paused";

  const storeText =
    merchant === "listening" ? "listening…" : merchant === "proposing" ? "proposing…" : merchant === "ready" ? "offer ready" : "stopped";

  /* gate ------------------------------------------------------------------- */
  const reveal = inScreen
    ? 7 * rawW("screen", 0.18, 0.85)
    : inCheckout
      ? 7 * rawW("checkout", 0.12, 0.6)
      : finished("screen")
        ? 7
        : 0;
  const resolved = Math.floor(reveal + 1e-6);

  let gate: ScenePose["gate"] = "idle";
  if (inScreen || inCheckout) gate = "checking";
  else if (blocked) gate = after("rejected") ? "blocked" : finished("screen") ? "checking" : "idle";
  else gate = finished("screen") ? "approved" : "idle";

  let gateText: ScenePose["gateText"] = "pending";
  if (blocked) {
    if (resolved >= evaluation.failedIndex + 1) gateText = "blocked";
  } else if (inCheckout) {
    gateText = resolved >= 7 ? "approved" : "pending";
  } else if (finished("screen")) {
    gateText = "approved";
  }

  const shield = blocked ? 0 : w("decision", 0.12, 0.5);
  const reason = blocked ? w("rejected", 0.35, 0.7) : w("decision", 0.3, 0.7);
  const slip = blocked ? 0 : w("decision", 0.55, 0.95);

  /* packets ----------------------------------------------------------------- */
  let doc = -1;
  let docBack = false;
  if (has("submit") && after("submit") && !finished("submit")) doc = rawW("submit", 0.08, 0.9);
  else if (has("quote") && after("quote") && !finished("quote")) {
    doc = rawW("quote", 0.05, 0.65);
    docBack = true;
  }

  let chip = -1;
  let chipRejected = false;
  if (blocked) {
    if (after("rejected") && !finished("rejected")) {
      chip = rawW("rejected", 0.05, 0.65);
      chipRejected = true;
    }
  } else if (after("decision") && !finished("decision")) {
    chip = rawW("decision", 0.22, 0.92);
  } else if (inCheckout) {
    chip = rawW("checkout", 0.62, 1);
  }

  const flowOut = has("submit") && after("submit") && !finished("submit");
  const flowBack =
    (has("quote") && after("quote") && !finished("quote")) ||
    (has("decision") && after("decision") && !finished("decision")) ||
    inCheckout ||
    (has("rejected") && after("rejected") && !finished("rejected"));

  /* offer -------------------------------------------------------------------- */
  let offer: ScenePose["offer"] = "pending";
  if (blocked) {
    if (has("rejected") && after("rejected") && stageProgress(story, clock, idx("rejected")) > 0.2) offer = "blocked";
  } else if (has("decision") && clock >= at("decision") + story.stages[idx("decision")]!.dur * 0.45) {
    offer = "ready";
  }

  /* buyer --------------------------------------------------------------------- */
  let buyer: ScenePose["buyer"] = "idle";
  if (after("catalog")) buyer = "catalog";
  if (after("cart")) buyer = "cart";
  if (after("quote")) buyer = "quote";
  if (inCheckout) buyer = "awaiting";

  /* payment --------------------------------------------------------------------- */
  let pay = -1;
  let payState: ScenePose["payState"] = "idle";
  if (inPayment) {
    const progress = stageProgress(story, clock, idx("payment"));
    pay = rawW("payment", 0.06, 0.6);
    payState = progress < 0.5 ? "processing" : scenario.payment === "failed" ? "declined" : "paid";
  } else if (has("payment") && finished("payment")) {
    payState = scenario.payment === "failed" ? "declined" : "paid";
  }
  if (payState === "paid") buyer = "paid";
  if (payState === "declined") buyer = "declined";

  let payText = "awaiting quote";
  if (after("catalog")) payText = "awaiting quote";
  if (after("quote")) payText = "quote loaded";
  if (inCheckout) payText = "authorizing…";
  else if (has("checkout") && finished("checkout")) payText = "authorized";
  if (payState === "processing") payText = "processing…";
  if (payState === "paid") payText = "paid · test mode";
  if (payState === "declined") payText = "declined · test mode";

  /* receipt --------------------------------------------------------------------- */
  const receipt = !blocked && scenario.payment !== "failed" ? w("result", 0.1, 0.55) : 0;

  /* cursors ---------------------------------------------------------------------- */
  const cursorM: [number, number] = after("propose")
    ? stopsAt([STOPS_M[0]!, STOPS_M[2]!, STOPS_M[3]!, STOPS_M[4]!], rawW("propose", 0.02, 0.9))
    : stopsAt([STOPS_M[0]!, STOPS_M[1]!], rawW("request", 0.3, 0.9));
  const cursorB: [number, number] = after("catalog")
    ? stopsAt([STOPS_B[0]!, STOPS_B[1]!, STOPS_B[2]!, STOPS_B[3]!], rawW("catalog", 0.08, 0.88))
    : STOPS_B[0]!;

  /* panel reveals ------------------------------------------------------------------ */
  const chat = w("request", 0.12, 0.6);
  const cards: [number, number, number] = [
    w("propose", 0.05, 0.32),
    w("propose", 0.14, 0.41),
    w("propose", 0.23, 0.5),
  ];
  const converge = w("propose", 0.42, 0.72);
  const bundle = w("propose", 0.68, 0.95);
  const price = w("propose", 0.85, 1);
  const tiles = w("catalog", 0.12, 0.8) * 6;
  const cartItems = w("cart", 0.05, 0.8) * 6;
  const quote = w("quote", 0.15, 0.55);

  const capPaise = Math.min(scenario.merchant.perOrderPaise, scenario.buyer.perOrderPaise);
  const over = evaluation.totalPaise > capPaise;
  const budget = blocked ? 0 : w("quote", 0.4, 0.8) * Math.min(1, evaluation.totalPaise / capPaise);

  return {
    merchant,
    gate,
    buyer,
    offer,
    chat,
    cards,
    converge,
    bundle,
    price,
    doc,
    docBack,
    chip,
    chipRejected,
    flowOut,
    flowBack,
    reveal,
    shield,
    reason,
    slip,
    tiles,
    cartItems,
    quote,
    budget,
    over,
    pay,
    payState,
    receipt,
    storeText,
    gateText,
    payText,
    cursorM,
    cursorB,
  };
}

/* ------------------------------------------------------------ readouts */

/** Rule rows as the gate inspector shows them — fixed order, live status. */
export const ruleRows = (evaluation: Evaluation) => evaluation.rules;
