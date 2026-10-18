// lib/policy/__tests__/gate.test.ts
import { describe, it, expect } from "vitest";
import { evaluate } from "../gate";
import { createMandate, revokeMandate } from "../mandate";
import type { Proposal } from "../types";
import type { GateContext, GateConfig } from "../gate";

describe("Policy Gate", () => {
  const mandate = createMandate({
    buyerId: "buyer-1",
    issuer: "merchant-1",
    maxPerOrderPaise: 500000,
    maxDailyPaise: 1000000,
    allowedCategories: ["Brewers", "Grinders", "Beans", "Accessories", "Kettles"],
    allowedSkus: [],
    expiryMinutes: 15,
  });

  const ctx: GateContext = {
    catalog: new Map([
      ["p1", { pricePaise: 189900, costPaise: 95000, category: "Brewers", stock: 42 }],
    ]),
    rollingDailySpendPaise: 0,
    velocityCount: 0,
    merchantTimezone: "UTC",
  };

  const config: GateConfig = {
    marginFloorPct: 20,
    categoryMarginFloors: { Brewers: 15, Beans: 35 },
    maxDiscountPct: 15,
    velocityCapPerHour: 10,
  };

  it("approves a valid proposal", () => {
    const proposal: Proposal = {
      id: "prop-1",
      lines: [{ sku: "p1", short: "V60", category: "Brewers", quantity: 1, unitPaise: 189900, proposedPaise: 189900, costPaise: 95000, marginPct: 50 }],
      totalPaise: 189900,
      mandateId: mandate.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, mandate, ctx, config);
    expect(verdict.outcome).toBe("approved");
  });

  it("blocks on mandate expired", () => {
    const expiredMandate = { ...mandate, envelope: { ...mandate.envelope, expiry: new Date(Date.now() - 120000).toISOString() } };
    const proposal: Proposal = {
      id: "prop-2",
      lines: [{ sku: "p1", short: "V60", category: "Brewers", quantity: 1, unitPaise: 189900, proposedPaise: 189900, costPaise: 95000, marginPct: 50 }],
      totalPaise: 189900,
      mandateId: expiredMandate.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, expiredMandate, ctx, config);
    expect(verdict.outcome).toBe("blocked");
    expect(verdict.determiningRule).toBe("mandate_validity");
  });

  it("blocks on category whitelist", () => {
    const restrictedMandate = createMandate({
      buyerId: "buyer-1",
      issuer: "merchant-1",
      maxPerOrderPaise: 500000,
      maxDailyPaise: 1000000,
      allowedCategories: ["Beans"],
      allowedSkus: [],
      expiryMinutes: 15,
    });
    const proposal: Proposal = {
      id: "prop-3",
      lines: [{ sku: "p1", short: "V60", category: "Brewers", quantity: 1, unitPaise: 189900, proposedPaise: 189900, costPaise: 95000, marginPct: 50 }],
      totalPaise: 189900,
      mandateId: restrictedMandate.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, restrictedMandate, ctx, config);
    expect(verdict.outcome).toBe("blocked");
    expect(verdict.determiningRule).toBe("category_whitelist");
  });

  it("blocks on price mismatch", () => {
    const proposal: Proposal = {
      id: "prop-4",
      lines: [{ sku: "p1", short: "V60", category: "Brewers", quantity: 1, unitPaise: 999999, proposedPaise: 999999, costPaise: 95000, marginPct: 50 }],
      totalPaise: 999999,
      mandateId: mandate.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, mandate, ctx, config);
    expect(verdict.outcome).toBe("blocked");
    expect(verdict.determiningRule).toBe("price_source_of_truth");
  });

  it("blocks on margin floor", () => {
    const proposal: Proposal = {
      id: "prop-5",
      lines: [{ sku: "p1", short: "V60", category: "Brewers", quantity: 1, unitPaise: 189900, proposedPaise: 189900, costPaise: 95000, marginPct: 10 }],
      totalPaise: 189900,
      mandateId: mandate.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, mandate, ctx, config);
    expect(verdict.outcome).toBe("blocked");
    expect(verdict.determiningRule).toBe("margin_floor");
  });

  it("blocks on per-order cap", () => {
    const proposal: Proposal = {
      id: "prop-6",
      lines: [{ sku: "p1", short: "V60", category: "Brewers", quantity: 10, unitPaise: 189900, proposedPaise: 189900, costPaise: 95000, marginPct: 50 }],
      totalPaise: 1899000,
      mandateId: mandate.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, mandate, ctx, config);
    expect(verdict.outcome).toBe("blocked");
    expect(verdict.determiningRule).toBe("per_order_cap");
  });

  it("blocks on rolling daily cap", () => {
    const ctxWithSpend = { ...ctx, rollingDailySpendPaise: 900000 };
    const proposal: Proposal = {
      id: "prop-7",
      lines: [{ sku: "p1", short: "V60", category: "Brewers", quantity: 1, unitPaise: 189900, proposedPaise: 189900, costPaise: 95000, marginPct: 50 }],
      totalPaise: 189900,
      mandateId: mandate.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, mandate, ctxWithSpend, config);
    expect(verdict.outcome).toBe("blocked");
    expect(verdict.determiningRule).toBe("rolling_daily_cap");
  });

  it("blocks on velocity cap", () => {
    const ctxWithVelocity = { ...ctx, velocityCount: 10 };
    const proposal: Proposal = {
      id: "prop-8",
      lines: [{ sku: "p1", short: "V60", category: "Brewers", quantity: 1, unitPaise: 189900, proposedPaise: 189900, costPaise: 95000, marginPct: 50 }],
      totalPaise: 189900,
      mandateId: mandate.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, mandate, ctxWithVelocity, config);
    expect(verdict.outcome).toBe("blocked");
    expect(verdict.determiningRule).toBe("velocity");
  });

  it("blocks on insufficient stock", () => {
    const ctxLowStock = {
      ...ctx,
      catalog: new Map([["p1", { pricePaise: 189900, costPaise: 95000, category: "Brewers", stock: 0 }]]),
    };
    const proposal: Proposal = {
      id: "prop-9",
      lines: [{ sku: "p1", short: "V60", category: "Brewers", quantity: 1, unitPaise: 189900, proposedPaise: 189900, costPaise: 95000, marginPct: 50 }],
      totalPaise: 189900,
      mandateId: mandate.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, mandate, ctxLowStock, config);
    expect(verdict.outcome).toBe("blocked");
    expect(verdict.determiningRule).toBe("price_source_of_truth");
  });

  it("blocks on revoked mandate", () => {
    const revokedMandate = revokeMandate(mandate);
    const proposal: Proposal = {
      id: "prop-10",
      lines: [{ sku: "p1", short: "V60", category: "Brewers", quantity: 1, unitPaise: 189900, proposedPaise: 189900, costPaise: 95000, marginPct: 50 }],
      totalPaise: 189900,
      mandateId: revokedMandate.id,
      createdAt: new Date().toISOString(),
    };
    const verdict = evaluate(proposal, revokedMandate, ctx, config);
    expect(verdict.outcome).toBe("blocked");
    expect(verdict.determiningRule).toBe("mandate_validity");
  });
});