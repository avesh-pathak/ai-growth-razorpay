// lib/policy/__tests__/receipt.test.ts
import { describe, it, expect } from "vitest";
import { buildReceiptBody, verifyReceipt, computeHash } from "../receipt";

describe("Receipt", () => {
  it("builds a receipt body with correct hash", () => {
    const body = buildReceiptBody({
      receiptId: "rec-001",
      proposal: { id: "prop-1", lines: [{ sku: "p1", qty: 1, unitPaise: 189900 }], totalPaise: 189900 },
      determiningRule: null,
      outcome: "approved",
      reason: null,
      reasonCode: null,
      mandateRef: "mandate-1",
    });
    expect(body.receiptId).toBe("rec-001");
    expect(body.outcome).toBe("approved");
    expect(body.hashes.receiptHash).toBeTruthy();
    expect(body.hashes.proposalHash).toBeTruthy();
  });

  it("verifies a valid receipt", () => {
    const body = buildReceiptBody({
      receiptId: "rec-002",
      proposal: { id: "prop-2", lines: [{ sku: "p2", qty: 2, unitPaise: 99900 }], totalPaise: 199800 },
      determiningRule: "margin_floor",
      outcome: "blocked",
      reason: "margin too low",
      reasonCode: "margin_floor",
      mandateRef: "mandate-2",
    });
    expect(verifyReceipt(body)).toBe(true);
  });

  it("detects tampered receipt", () => {
    const body = buildReceiptBody({
      receiptId: "rec-003",
      proposal: { id: "prop-3", lines: [{ sku: "p3", qty: 1, unitPaise: 50000 }], totalPaise: 50000 },
      determiningRule: null,
      outcome: "approved",
      reason: null,
      reasonCode: null,
      mandateRef: "mandate-3",
    });
    // Tamper with the outcome
    const tampered = { ...body, outcome: "blocked" as const };
    expect(verifyReceipt(tampered)).toBe(false);
  });

  it("includes razorpay IDs when provided", () => {
    const body = buildReceiptBody({
      receiptId: "rec-004",
      proposal: { id: "prop-4", lines: [], totalPaise: 0 },
      determiningRule: null,
      outcome: "approved",
      reason: null,
      reasonCode: null,
      mandateRef: "mandate-4",
      razorpayIds: { orderId: "order-123", paymentId: "pay-456" },
    });
    expect(body.razorpayIds?.orderId).toBe("order-123");
    expect(body.razorpayIds?.paymentId).toBe("pay-456");
  });

  it("computeHash is deterministic", () => {
    const h1 = computeHash("hello");
    const h2 = computeHash("hello");
    expect(h1).toBe(h2);
    expect(h1).not.toBe(computeHash("world"));
  });
});