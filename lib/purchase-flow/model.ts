// lib/purchase-flow/model.ts
// Pure scenario model for the "How a purchase flows" figures.
//
// Illustrative demo data: IDs, mandates and counters are invented and clearly
// labelled as such in the UI. Amounts are integer paise, derived from the real
// seed catalog in lib/data/products.ts.
//
// The policy evaluation mirrors the buildable spec's rulebook
// (.scratch/agentic-commerce-build, "Policy Gate core"):
// seven rules, evaluated in order, first failure wins, reported as the
// determining rule. This file is the *display* model for the figures. The
// production gate is a server module (`lib/policy/`, not built yet); these
// figures never authorize anything themselves.

import { PRODUCTS, formatPaise, type Product } from "@/lib/data/products";

/* ------------------------------------------------------------------ rules */

export const RULES = [
  {
    id: "mandate_validity",
    label: "Mandate validity",
    short: "Mandates",
    detail: "Both mandates signed, unexpired and unrevoked — ±60 s clock skew.",
  },
  {
    id: "category_whitelist",
    label: "Category whitelist",
    short: "Categories",
    detail: "Every line's category sits inside both mandates' allowed set.",
  },
  {
    id: "price_source",
    label: "Price source-of-truth",
    short: "Price check",
    detail: "The gate re-fetches the authoritative price and rejects a mismatch.",
  },
  {
    id: "margin_floor",
    label: "Margin floor",
    short: "Margin floor",
    detail: "Per line: machines 15%, beans 35%; no discount past 15% off list.",
  },
  {
    id: "per_order_cap",
    label: "Per-order cap",
    short: "Order cap",
    detail: "The order total must fit both mandates' per-order maxima.",
  },
  {
    id: "daily_cap",
    label: "Rolling daily cap",
    short: "Daily cap",
    detail: "Spent-today + this order must fit both mandates' daily maxima.",
  },
  {
    id: "velocity",
    label: "Velocity",
    short: "Velocity",
    detail: "Checkouts per hour per buyer must stay under the cap.",
  },
] as const;

export type RuleId = (typeof RULES)[number]["id"];

export const ruleIndexOf = (id: RuleId) => RULES.findIndex((rule) => rule.id === id);

/* ------------------------------------------------------------------ money */

/** Integer paise: list × (100 − pct) ÷ 100, rounded to the paise. */
export const unitPricePaise = (listPaise: number, discountPct: number) =>
  Math.round((listPaise * (100 - discountPct)) / 100);

/** Basis points (integer): (price − cost) × 10000 ÷ price. */
export const marginBps = (unitPaise: number, costPaise: number) =>
  Math.round(((unitPaise - costPaise) * 10000) / unitPaise);

export const bpsText = (bps: number) => `${(bps / 100).toFixed(1)}%`;

/** Demo margin floors: machines 15%, beans 35%, everything else 35%. */
export function marginFloorBps(product: Pick<Product, "category">): number {
  if (product.category === "Beans") return 3500;
  if (product.category === "Brewers" || product.category === "Grinders" || product.category === "Kettles") return 1500;
  return 3500;
}

export const MAX_DISCOUNT_PCT = 15;

/* ------------------------------------------------------------------ lines */

export interface BundleLine {
  sku: string;
  name: string;
  short: string;
  category: Product["category"];
  qty: number;
  listPaise: number;
  costPaise: number;
  unitPaise: number;
  discountPct: number;
}

const productOf = (sku: string): Product => {
  const found = PRODUCTS.find((p) => p.id === sku);
  if (!found) throw new Error(`unknown sku ${sku}`);
  return found;
};

/** Short label for the miniature crates in the figures. */
const SHORT: Record<string, string> = {
  p1: "V60",
  p7: "C40",
  p11: "Stagg",
  p14: "filters",
  p15: "scale",
  p21: "beans",
};

export function bundleLines(discountPct: number, discountSku: string | null): BundleLine[] {
  return ["p1", "p7", "p11", "p15", "p14", "p21"].map((sku) => {
    const product = productOf(sku);
    const lineDiscount = discountSku === sku ? discountPct : 0;
    return {
      sku,
      name: product.name,
      short: SHORT[sku] ?? product.name,
      category: product.category,
      qty: 1,
      listPaise: product.pricePaise,
      costPaise: product.costPaise,
      unitPaise: unitPricePaise(product.pricePaise, lineDiscount),
      discountPct: lineDiscount,
    };
  });
}

/* ------------------------------------------------------------------ mandates */

export interface Mandate {
  id: string;
  party: "merchant" | "buyer";
  perOrderPaise: number;
  dailyPaise: number;
  spentTodayPaise: number;
  categories: Product["category"][];
  /** Minutes until expiry; negative means already past. */
  expiresInMin: number;
  revoked: boolean;
}

const ALL_CATEGORIES: Product["category"][] = ["Brewers", "Grinders", "Kettles", "Accessories", "Beans"];

export const merchantMandate = (over: Partial<Mandate> = {}): Mandate => ({
  id: "MM-8841",
  party: "merchant",
  perOrderPaise: 3_000_000, // ₹30,000.00
  dailyPaise: 6_000_000, // ₹60,000.00
  spentTodayPaise: 1_820_000, // ₹18,200.00
  categories: ALL_CATEGORIES,
  expiresInMin: 14,
  revoked: false,
  ...over,
});

export const buyerMandate = (over: Partial<Mandate> = {}): Mandate => ({
  id: "BM-5520",
  party: "buyer",
  perOrderPaise: 3_000_000, // ₹30,000.00
  dailyPaise: 5_000_000, // ₹50,000.00
  spentTodayPaise: 1_240_000, // ₹12,400.00
  categories: ALL_CATEGORIES,
  expiresInMin: 12,
  revoked: false,
  ...over,
});

/* ---------------------------------------------------------------- scenarios */

export type FigureId = "merchant" | "buyer" | "gate";
export type PaymentState = "succeeded" | "failed" | "not_attempted";

export interface Scenario {
  id: string;
  figure: FigureId;
  label: string;
  blurb: string;
  txn: string;
  quote: string;
  receipt: string;
  discountPct: number;
  discountSku: string | null;
  merchant: Mandate;
  buyer: Mandate;
  checkoutsLastHour: number;
  velocityCapPerHour: number;
  priceRefetch: "match" | "mismatch";
  payment: PaymentState;
}

const base = {
  txn: "TXN-2417",
  quote: "Q-2417",
  receipt: "REC-2417",
  checkoutsLastHour: 1,
  velocityCapPerHour: 5,
  priceRefetch: "match" as const,
};

export const SCENARIOS: Scenario[] = [
  // ---- Merchant figure -----------------------------------------------------
  {
    id: "merchant.approved",
    figure: "merchant",
    label: "Approved proposal",
    blurb: "The bundle is proposed at list price. The gate clears every rule, so the offer becomes buyable.",
    ...base,
    discountPct: 0,
    discountSku: null,
    merchant: merchantMandate(),
    buyer: buyerMandate(),
    payment: "not_attempted",
  },
  {
    id: "merchant.blocked",
    figure: "merchant",
    label: "Blocked proposal",
    blurb: "The agent tries 25% off the bean bag to hit the shopper's budget. The beans line falls under its 35% floor, so the offer never becomes buyable.",
    ...base,
    discountPct: 25,
    discountSku: "p21",
    merchant: merchantMandate(),
    buyer: buyerMandate(),
    payment: "not_attempted",
  },
  // ---- Buyer figure --------------------------------------------------------
  {
    id: "buyer.success",
    figure: "buyer",
    label: "Successful purchase",
    blurb: "Catalog, cart, quote, both mandate locks and the gate all clear. Test-mode payment succeeds and the receipt is issued.",
    ...base,
    discountPct: 0,
    discountSku: null,
    merchant: merchantMandate(),
    buyer: buyerMandate(),
    payment: "succeeded",
  },
  {
    id: "buyer.blocked",
    figure: "buyer",
    label: "Policy-blocked purchase",
    blurb: "The buyer's mandate caps a single order at ₹20,000.00. The proposal totals ₹25,644.00 — the gate refuses it at the per-order cap, before any checkout begins.",
    ...base,
    discountPct: 0,
    discountSku: null,
    merchant: merchantMandate(),
    buyer: buyerMandate({ perOrderPaise: 2_000_000 }),
    payment: "not_attempted",
  },
  {
    id: "buyer.failed",
    figure: "buyer",
    label: "Payment failure",
    blurb: "Every rule passes and checkout is authorized, but the test-mode payment is declined. No receipt, no order token — the audit records the failure.",
    ...base,
    discountPct: 0,
    discountSku: null,
    merchant: merchantMandate(),
    buyer: buyerMandate(),
    payment: "failed",
  },
  // ---- Policy Gate figure ---------------------------------------------------
  {
    id: "gate.pass",
    figure: "gate",
    label: "All checks passed",
    blurb: "Seven checkpoints, all clear. The authorization latch retracts and the transaction leaves with a decision receipt.",
    ...base,
    discountPct: 0,
    discountSku: null,
    merchant: merchantMandate(),
    buyer: buyerMandate(),
    payment: "not_attempted",
  },
  {
    id: "gate.mandate",
    figure: "gate",
    label: "Mandate rejection",
    blurb: "The buyer mandate expired four minutes ago — past the ±60 s skew. Checkpoint 1 fails; nothing later is evaluated.",
    ...base,
    discountPct: 0,
    discountSku: null,
    merchant: merchantMandate(),
    buyer: buyerMandate({ expiresInMin: -4 }),
    payment: "not_attempted",
  },
  {
    id: "gate.margin",
    figure: "gate",
    label: "Margin-floor rejection",
    blurb: "A 25% discount on the bean bag drops that line to a 33.2% margin, under the 35% beans floor. Checkpoints 1–3 pass; checkpoint 4 trips.",
    ...base,
    discountPct: 25,
    discountSku: "p21",
    merchant: merchantMandate(),
    buyer: buyerMandate(),
    payment: "not_attempted",
  },
  {
    id: "gate.cap",
    figure: "gate",
    label: "Spending-cap rejection",
    blurb: "The quote is ₹25,644.00 against a buyer per-order maximum of ₹20,000.00. Checkpoints 1–4 pass; checkpoint 5 trips.",
    ...base,
    discountPct: 0,
    discountSku: null,
    merchant: merchantMandate(),
    buyer: buyerMandate({ perOrderPaise: 2_000_000 }),
    payment: "not_attempted",
  },
  {
    id: "gate.velocity",
    figure: "gate",
    label: "Velocity rejection",
    blurb: "Five checkouts already ran this hour. A sixth exceeds the 5/hour/buyer velocity cap, so checkpoint 7 trips after six clearances.",
    ...base,
    discountPct: 0,
    discountSku: null,
    checkoutsLastHour: 5,
    velocityCapPerHour: 5,
    merchant: merchantMandate(),
    buyer: buyerMandate(),
    payment: "not_attempted",
  },
];

export const scenariosFor = (figure: FigureId) => SCENARIOS.filter((scenario) => scenario.figure === figure);

/* --------------------------------------------------------------- evaluation */

export type RuleStatus = "pending" | "passed" | "failed" | "skipped";

export interface RuleResult {
  id: RuleId;
  label: string;
  short: string;
  status: RuleStatus;
  /** Machine code from the spec's error enum (only when failed). */
  code: string | null;
  reason: string;
}

export interface Evaluation {
  verdict: "approved" | "blocked";
  determining: RuleId | null;
  /** Index of the failed rule in RULES order, −1 when approved. */
  failedIndex: number;
  rules: RuleResult[];
  lines: BundleLine[];
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  reasonCode: string | null;
  reasonText: string;
}

const result = (id: RuleId, status: RuleStatus, reason: string, code: string | null = null): RuleResult => {
  const rule = RULES.find((r) => r.id === id)!;
  return { id, label: rule.label, short: rule.short, status, code, reason };
};

export function evaluate(scenario: Scenario): Evaluation {
  const lines = bundleLines(scenario.discountPct, scenario.discountSku);
  const subtotalPaise = lines.reduce((sum, line) => sum + line.listPaise * line.qty, 0);
  const totalPaise = lines.reduce((sum, line) => sum + line.unitPaise * line.qty, 0);
  const discountPaise = subtotalPaise - totalPaise;

  const out: RuleResult[] = [];
  let failedIndex = -1;

  const order: Array<() => RuleResult> = [
    () => {
      // 1 — mandate validity.
      for (const mandate of [scenario.merchant, scenario.buyer]) {
        if (mandate.revoked) {
          return result("mandate_validity", "failed", `${mandate.party} mandate ${mandate.id} is revoked`, "mandate_revoked");
        }
        const secondsLeft = mandate.expiresInMin * 60;
        if (secondsLeft < -60) {
          const minutes = Math.round(-secondsLeft / 60);
          return result(
            "mandate_validity",
            "failed",
            `${mandate.party} mandate ${mandate.id} expired ${minutes}m ago — past the ±60s skew`,
            "mandate_expired",
          );
        }
      }
      const soonest = Math.min(scenario.merchant.expiresInMin, scenario.buyer.expiresInMin);
      return result("mandate_validity", "passed", `both mandates valid · ${soonest}m left`);
    },
    () => {
      // 2 — category whitelist.
      const allowed = scenario.buyer.categories.filter((category) => scenario.merchant.categories.includes(category));
      const bad = lines.find((line) => !allowed.includes(line.category));
      if (bad) {
        return result("category_whitelist", "failed", `${bad.name} · ${bad.category} is not on the mandate`, "category_not_allowed");
      }
      return result("category_whitelist", "passed", `${allowed.length} categories allowed · all lines clear`);
    },
    () => {
      // 3 — price source-of-truth.
      if (scenario.priceRefetch === "mismatch") {
        return result("price_source", "failed", `re-fetched price for ${scenario.txn} differs from quote ${scenario.quote}`, "price_mismatch");
      }
      return result("price_source", "passed", `requote matches ${scenario.quote} · ${formatPaise(totalPaise)}`);
    },
    () => {
      // 4 — margin floor, per line.
      for (const line of lines) {
        const product = productOf(line.sku);
        const floor = marginFloorBps(product);
        const margin = marginBps(line.unitPaise, line.costPaise);
        if (line.discountPct > MAX_DISCOUNT_PCT) {
          return result(
            "margin_floor",
            "failed",
            `${line.short}: ${line.discountPct}% off exceeds the ${MAX_DISCOUNT_PCT}% discount cap`,
            "margin_violation",
          );
        }
        if (margin < floor) {
          return result(
            "margin_floor",
            "failed",
            `${line.short}: margin ${bpsText(margin)} below the ${bpsText(floor)} floor`,
            "margin_violation",
          );
        }
      }
      const tightest = lines.reduce(
        (worst, line) => {
          const margin = marginBps(line.unitPaise, line.costPaise);
          const floor = marginFloorBps(productOf(line.sku));
          return margin - floor < worst.gap ? { gap: margin - floor, line, margin, floor } : worst;
        },
        { gap: Number.MAX_SAFE_INTEGER, line: lines[0], margin: 0, floor: 0 },
      );
      return result("margin_floor", "passed", `tightest line ${tightest.line.short} at ${bpsText(tightest.margin)} · floor ${bpsText(tightest.floor)}`);
    },
    () => {
      // 5 — per-order cap.
      const cap = Math.min(scenario.merchant.perOrderPaise, scenario.buyer.perOrderPaise);
      if (totalPaise > cap) {
        const party = scenario.buyer.perOrderPaise < scenario.merchant.perOrderPaise ? "buyer" : "merchant";
        const mandate = party === "buyer" ? scenario.buyer : scenario.merchant;
        return result(
          "per_order_cap",
          "failed",
          `quote ${formatPaise(totalPaise)} over ${party} per-order max ${formatPaise(cap)} (${mandate.id})`,
          "mandate_exceeded",
        );
      }
      return result("per_order_cap", "passed", `quote ${formatPaise(totalPaise)} within ${formatPaise(cap)}`);
    },
    () => {
      // 6 — rolling daily cap.
      for (const mandate of [scenario.merchant, scenario.buyer]) {
        if (mandate.spentTodayPaise + totalPaise > mandate.dailyPaise) {
          return result(
            "daily_cap",
            "failed",
            `${mandate.party} spent-today + this order exceeds ${formatPaise(mandate.dailyPaise)} (${mandate.id})`,
            "mandate_exceeded",
          );
        }
      }
      const merchantLeft = scenario.merchant.dailyPaise - scenario.merchant.spentTodayPaise - totalPaise;
      const buyerLeft = scenario.buyer.dailyPaise - scenario.buyer.spentTodayPaise - totalPaise;
      return result("daily_cap", "passed", `daily headroom ${formatPaise(Math.min(merchantLeft, buyerLeft))} left after this order`);
    },
    () => {
      // 7 — velocity.
      if (scenario.checkoutsLastHour >= scenario.velocityCapPerHour) {
        return result(
          "velocity",
          "failed",
          `${scenario.checkoutsLastHour + 1}th checkout this hour · cap ${scenario.velocityCapPerHour}/hour/buyer`,
          "rate_limited",
        );
      }
      return result(
        "velocity",
        "passed",
        `${scenario.checkoutsLastHour + 1} of ${scenario.velocityCapPerHour} checkouts this hour`,
      );
    },
  ];

  for (let index = 0; index < order.length; index++) {
    if (failedIndex !== -1) {
      out.push(result(RULES[index].id, "skipped", "not evaluated — first failure wins"));
      continue;
    }
    const verdict = order[index]();
    out.push(verdict);
    if (verdict.status === "failed") failedIndex = index;
  }

  const determining = failedIndex === -1 ? null : RULES[failedIndex].id;
  const failed = failedIndex === -1 ? null : out[failedIndex];
  return {
    verdict: failedIndex === -1 ? "approved" : "blocked",
    determining,
    failedIndex,
    rules: out,
    lines,
    subtotalPaise,
    discountPaise,
    totalPaise,
    reasonCode: failed?.code ?? null,
    reasonText: failed?.reason ?? "all seven rules passed",
  };
}

/* ------------------------------------------------------------ presentation */

export const mandateState = (mandate: Mandate, totalPaise: number) => {
  const expired = mandate.expiresInMin * 60 < -60;
  return {
    id: mandate.id,
    expired,
    perOrderPaise: mandate.perOrderPaise,
    overPerOrder: totalPaise > mandate.perOrderPaise,
    overDaily: mandate.spentTodayPaise + totalPaise > mandate.dailyPaise,
    dailyPaise: mandate.dailyPaise,
    spentTodayPaise: mandate.spentTodayPaise,
  };
};
