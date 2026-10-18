// lib/policy/gate.ts — deterministic Policy Gate
// The gate is a pure function: it takes a proposal + mandate + catalog context
// and returns a GateVerdict. No LLM, no side effects.

import { type GateVerdict, type Proposal, type Mandate, type RuleEvaluation, type RuleId } from "./types";

export interface GateContext {
  catalog: Map<string, { pricePaise: number; costPaise: number; category: string; stock: number }>;
  rollingDailySpendPaise: number;
  velocityCount: number; // checkouts in last hour
  merchantTimezone: string;
}

export interface GateConfig {
  marginFloorPct: number; // default 20
  categoryMarginFloors: Record<string, number>; // beans: 35, machines: 15
  maxDiscountPct: number; // 15
  velocityCapPerHour: number;
}

const DEFAULT_CONFIG: GateConfig = {
  marginFloorPct: 20,
  categoryMarginFloors: { Beans: 35, Brewers: 15, Grinders: 15, Kettles: 15, Accessories: 20 },
  maxDiscountPct: 15,
  velocityCapPerHour: 10,
};

function marginFloorFor(category: string, config: GateConfig): number {
  return config.categoryMarginFloors[category] ?? config.marginFloorPct;
}

function checkMandateValidity(mandate: Mandate, now: Date): RuleEvaluation {
  const env = mandate.envelope;
  const expiry = new Date(env.expiry);
  const skew = 60 * 1000; // ±60s
  if (now.getTime() > expiry.getTime() + skew) {
    return { rule: "mandate_validity", result: "failed", reason: "mandate expired" };
  }
  if (env.revokedAt) {
    return { rule: "mandate_validity", result: "failed", reason: "mandate revoked" };
  }
  return { rule: "mandate_validity", result: "passed" };
}

function checkCategoryWhitelist(proposal: Proposal, mandate: Mandate): RuleEvaluation {
  const allowed = mandate.envelope.allowedCategories;
  const allowedSkus = mandate.envelope.allowedSkus;
  for (const line of proposal.lines) {
    if (allowed.length > 0 && !allowed.includes(line.category)) {
      return { rule: "category_whitelist", result: "failed", reason: `category ${line.category} not allowed` };
    }
    if (allowedSkus.length > 0 && !allowedSkus.includes(line.sku)) {
      return { rule: "category_whitelist", result: "failed", reason: `SKU ${line.sku} not allowed` };
    }
  }
  return { rule: "category_whitelist", result: "passed" };
}

function checkPriceSourceOfTruth(proposal: Proposal, ctx: GateContext): RuleEvaluation {
  for (const line of proposal.lines) {
    const catalogItem = ctx.catalog.get(line.sku);
    if (!catalogItem) {
      return { rule: "price_source_of_truth", result: "failed", reason: `SKU ${line.sku} not found in catalog` };
    }
    if (catalogItem.pricePaise !== line.unitPaise) {
      return {
        rule: "price_source_of_truth",
        result: "failed",
        reason: `price mismatch for ${line.sku}: proposed ${line.unitPaise}, catalog ${catalogItem.pricePaise}`,
      };
    }
    if (catalogItem.stock < line.quantity) {
      return {
        rule: "price_source_of_truth",
        result: "failed",
        reason: `insufficient stock for ${line.sku}: requested ${line.quantity}, available ${catalogItem.stock}`,
      };
    }
  }
  return { rule: "price_source_of_truth", result: "passed" };
}

function checkMarginFloor(proposal: Proposal, config: GateConfig): RuleEvaluation {
  for (const line of proposal.lines) {
    const floor = marginFloorFor(line.category, config);
    if (line.marginPct < floor) {
      return {
        rule: "margin_floor",
        result: "failed",
        reason: `margin floor violated for ${line.sku}: ${line.marginPct}% < ${floor}%`,
        params: { sku: line.sku, margin: line.marginPct, floor },
      };
    }
    // max discount check
    const discountPct = ((line.unitPaise - line.proposedPaise) / line.unitPaise) * 100;
    if (discountPct > config.maxDiscountPct) {
      return {
        rule: "margin_floor",
        result: "failed",
        reason: `discount exceeds max for ${line.sku}: ${discountPct.toFixed(1)}% > ${config.maxDiscountPct}%`,
      };
    }
  }
  return { rule: "margin_floor", result: "passed" };
}

function checkPerOrderCap(proposal: Proposal, mandate: Mandate): RuleEvaluation {
  if (proposal.totalPaise > mandate.envelope.maxPerOrderPaise) {
    return {
      rule: "per_order_cap",
      result: "failed",
      reason: `per-order cap exceeded: ${proposal.totalPaise} > ${mandate.envelope.maxPerOrderPaise}`,
    };
  }
  return { rule: "per_order_cap", result: "passed" };
}

function checkRollingDailyCap(proposal: Proposal, mandate: Mandate, ctx: GateContext): RuleEvaluation {
  if (ctx.rollingDailySpendPaise + proposal.totalPaise > mandate.envelope.maxDailyPaise) {
    return {
      rule: "rolling_daily_cap",
      result: "failed",
      reason: `daily cap exceeded: ${ctx.rollingDailySpendPaise + proposal.totalPaise} > ${mandate.envelope.maxDailyPaise}`,
    };
  }
  return { rule: "rolling_daily_cap", result: "passed" };
}

function checkVelocity(ctx: GateContext, config: GateConfig): RuleEvaluation {
  if (ctx.velocityCount >= config.velocityCapPerHour) {
    return {
      rule: "velocity",
      result: "failed",
      reason: `velocity cap exceeded: ${ctx.velocityCount} >= ${config.velocityCapPerHour}/hour`,
    };
  }
  return { rule: "velocity", result: "passed" };
}

export function evaluate(
  proposal: Proposal,
  mandate: Mandate,
  ctx: GateContext,
  config: GateConfig = DEFAULT_CONFIG,
): GateVerdict {
  const now = new Date();
  const rules: RuleEvaluation[] = [];

  // Rule 1: Mandate validity
  const mandateResult = checkMandateValidity(mandate, now);
  rules.push(mandateResult);
  if (mandateResult.result === "failed") {
    return makeVerdict("blocked", mandateResult.rule, mandateResult.reason, rules, proposal.totalPaise);
  }

  // Rule 2: Category whitelist
  const catResult = checkCategoryWhitelist(proposal, mandate);
  rules.push(catResult);
  if (catResult.result === "failed") {
    return makeVerdict("blocked", catResult.rule, catResult.reason, rules, proposal.totalPaise);
  }

  // Rule 3: Price source-of-truth
  const priceResult = checkPriceSourceOfTruth(proposal, ctx);
  rules.push(priceResult);
  if (priceResult.result === "failed") {
    return makeVerdict("blocked", priceResult.rule, priceResult.reason, rules, proposal.totalPaise);
  }

  // Rule 4: Margin floor
  const marginResult = checkMarginFloor(proposal, config);
  rules.push(marginResult);
  if (marginResult.result === "failed") {
    return makeVerdict("blocked", marginResult.rule, marginResult.reason, rules, proposal.totalPaise, marginResult.params);
  }

  // Rule 5: Per-order cap
  const perOrderResult = checkPerOrderCap(proposal, mandate);
  rules.push(perOrderResult);
  if (perOrderResult.result === "failed") {
    return makeVerdict("blocked", perOrderResult.rule, perOrderResult.reason, rules, proposal.totalPaise);
  }

  // Rule 6: Rolling daily cap
  const dailyResult = checkRollingDailyCap(proposal, mandate, ctx);
  rules.push(dailyResult);
  if (dailyResult.result === "failed") {
    return makeVerdict("blocked", dailyResult.rule, dailyResult.reason, rules, proposal.totalPaise);
  }

  // Rule 7: Velocity
  const velocityResult = checkVelocity(ctx, config);
  rules.push(velocityResult);
  if (velocityResult.result === "failed") {
    return makeVerdict("blocked", velocityResult.rule, velocityResult.reason, rules, proposal.totalPaise);
  }

  // All passed
  for (const r of rules) {
    if (r.result !== "failed") r.result = "passed";
  }
  return {
    outcome: "approved",
    rules,
    totalPaise: proposal.totalPaise,
    evaluatedAt: now.toISOString(),
  };
}

function makeVerdict(
  outcome: "approved" | "blocked",
  rule: RuleId,
  reason: string | undefined,
  rules: RuleEvaluation[],
  totalPaise: number,
  params?: Record<string, unknown>,
): GateVerdict {
  return {
    outcome,
    determiningRule: rule,
    reason: reason,
    reasonCode: rule,
    rules,
    totalPaise,
    evaluatedAt: new Date().toISOString(),
  };
}