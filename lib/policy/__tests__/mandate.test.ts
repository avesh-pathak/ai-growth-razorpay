// lib/policy/__tests__/mandate.test.ts
import { describe, it, expect } from "vitest";
import { createMandate, verifyMandate, narrowMandate, revokeMandate, bindCheckoutHash } from "../mandate";

describe("Mandate", () => {
  it("creates a mandate with correct envelope", () => {
    const m = createMandate({
      buyerId: "buyer-1",
      issuer: "merchant-1",
      maxPerOrderPaise: 500000,
      maxDailyPaise: 1000000,
      allowedCategories: ["Brewers", "Beans"],
      allowedSkus: [],
      expiryMinutes: 15,
    });
    expect(m.id).toBeTruthy();
    expect(m.buyerId).toBe("buyer-1");
    expect(m.envelope.maxPerOrderPaise).toBe(500000);
    expect(m.envelope.maxDailyPaise).toBe(1000000);
    expect(m.envelope.allowedCategories).toEqual(["Brewers", "Beans"]);
    expect(m.signature).toBeTruthy();
  });

  it("verifies a valid mandate", () => {
    const m = createMandate({
      buyerId: "buyer-1",
      issuer: "merchant-1",
      maxPerOrderPaise: 500000,
      maxDailyPaise: 1000000,
      allowedCategories: [],
      allowedSkus: [],
      expiryMinutes: 15,
    });
    expect(verifyMandate(m)).toBe(true);
  });

  it("detects tampered mandate", () => {
    const m = createMandate({
      buyerId: "buyer-1",
      issuer: "merchant-1",
      maxPerOrderPaise: 500000,
      maxDailyPaise: 1000000,
      allowedCategories: [],
      allowedSkus: [],
      expiryMinutes: 15,
    });
    const tampered = { ...m, envelope: { ...m.envelope, maxPerOrderPaise: 999999 } };
    expect(verifyMandate(tampered)).toBe(false);
  });

  it("narrows a mandate (buyer may narrow, never widen)", () => {
    const m = createMandate({
      buyerId: "buyer-1",
      issuer: "merchant-1",
      maxPerOrderPaise: 500000,
      maxDailyPaise: 1000000,
      allowedCategories: ["Brewers", "Beans", "Grinders"],
      allowedSkus: ["p1", "p2", "p3"],
      expiryMinutes: 15,
    });
    const narrowed = narrowMandate(m, {
      maxPerOrderPaise: 300000,
      maxDailyPaise: 2000000, // attempt to widen — should be clamped
      allowedCategories: ["Brewers"],
      allowedSkus: ["p1", "p999"], // p999 not in original — should be filtered
    });
    expect(narrowed.envelope.maxPerOrderPaise).toBe(300000);
    expect(narrowed.envelope.maxDailyPaise).toBe(1000000); // clamped, not widened
    expect(narrowed.envelope.allowedCategories).toEqual(["Brewers"]);
    expect(narrowed.envelope.allowedSkus).toEqual(["p1"]); // p999 filtered out
  });

  it("revokes a mandate", () => {
    const m = createMandate({
      buyerId: "buyer-1",
      issuer: "merchant-1",
      maxPerOrderPaise: 500000,
      maxDailyPaise: 1000000,
      allowedCategories: [],
      allowedSkus: [],
      expiryMinutes: 15,
    });
    const revoked = revokeMandate(m);
    expect(revoked.revokedAt).toBeTruthy();
    expect(revoked.envelope.revokedAt).toBeTruthy();
  });

  it("binds checkout hash to mandate", () => {
    const m = createMandate({
      buyerId: "buyer-1",
      issuer: "merchant-1",
      maxPerOrderPaise: 500000,
      maxDailyPaise: 1000000,
      allowedCategories: [],
      allowedSkus: [],
      expiryMinutes: 15,
    });
    const bound = bindCheckoutHash(m, "checkout-hash-123");
    expect(bound.envelope.checkoutHash).toBe("checkout-hash-123");
  });
});