// lib/policy/__tests__/audit.test.ts
import { describe, it, expect } from "vitest";
import { createAuditEvent, verifyAuditChain, computeAuditHash } from "../audit";

describe("Audit Trail", () => {
  it("creates an audit event with a hash", () => {
    const event = createAuditEvent({
      actor: "buyer-agent",
      action: "quote.requested",
      entityType: "quote",
      entityId: "quote-001",
      payload: { sku: "p1", qty: 1 },
      prevHash: null,
    });
    expect(event.id).toBeTruthy();
    expect(event.hash).toBeTruthy();
    expect(event.prevHash).toBeNull();
  });

  it("verifies a valid chain", () => {
    const e1 = createAuditEvent({
      actor: "buyer-agent",
      action: "quote.requested",
      entityType: "quote",
      entityId: "quote-001",
      payload: { sku: "p1" },
      prevHash: null,
    });
    const e2 = createAuditEvent({
      actor: "policy-gate",
      action: "evaluate",
      entityType: "proposal",
      entityId: "prop-001",
      payload: { verdict: "approved" },
      prevHash: e1.hash,
    });
    const e3 = createAuditEvent({
      actor: "buyer-agent",
      action: "checkout.completed",
      entityType: "order",
      entityId: "order-001",
      payload: { total: 189900 },
      prevHash: e2.hash,
    });
    const result = verifyAuditChain([e1, e2, e3]);
    expect(result.valid).toBe(true);
  });

  it("detects a broken chain (tampered prevHash)", () => {
    const e1 = createAuditEvent({
      actor: "buyer-agent",
      action: "quote.requested",
      entityType: "quote",
      entityId: "quote-001",
      payload: { sku: "p1" },
      prevHash: null,
    });
    const e2 = createAuditEvent({
      actor: "policy-gate",
      action: "evaluate",
      entityType: "proposal",
      entityId: "prop-001",
      payload: { verdict: "approved" },
      prevHash: e1.hash,
    });
    // Tamper: change e2's prevHash
    const tampered = { ...e2, prevHash: "wrong-hash" };
    const result = verifyAuditChain([e1, tampered]);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("detects a tampered hash", () => {
    const e1 = createAuditEvent({
      actor: "buyer-agent",
      action: "quote.requested",
      entityType: "quote",
      entityId: "quote-001",
      payload: { sku: "p1" },
      prevHash: null,
    });
    const tampered = { ...e1, hash: "0".repeat(64) };
    const result = verifyAuditChain([tampered]);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(0);
  });

  it("handles single event", () => {
    const e1 = createAuditEvent({
      actor: "system",
      action: "init",
      entityType: "system",
      entityId: "sys-1",
      payload: {},
      prevHash: null,
    });
    const result = verifyAuditChain([e1]);
    expect(result.valid).toBe(true);
  });

  it("handles empty chain", () => {
    const result = verifyAuditChain([]);
    expect(result.valid).toBe(true);
  });
});