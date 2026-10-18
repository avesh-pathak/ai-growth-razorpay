// scripts/tamper-tester.ts — CLI tamper tester for the audit trail
// Usage: npx tsx scripts/tamper-tester.ts

import { createHash } from "crypto";

interface AuditEvent {
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

function computeHash(event: Omit<AuditEvent, "hash">, prevHash: string | null): string {
  const payload = JSON.stringify({
    id: event.id,
    createdAt: event.createdAt,
    actor: event.actor,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    payload: event.payload,
    prevHash,
  });
  return createHash("sha256").update(payload).digest("hex");
}

function verifyChain(events: AuditEvent[]): { valid: boolean; brokenAt?: number } {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const prevHash = i > 0 ? events[i - 1].hash : null;
    if (event.prevHash !== prevHash) {
      return { valid: false, brokenAt: i };
    }
    const recomputed = computeHash(
      { id: event.id, createdAt: event.createdAt, actor: event.actor, action: event.action, entityType: event.entityType, entityId: event.entityId, payload: event.payload, prevHash: event.prevHash },
      prevHash,
    );
    if (recomputed !== event.hash) {
      return { valid: false, brokenAt: i };
    }
  }
  return { valid: true };
}

// Sample audit trail
const events: AuditEvent[] = [
  {
    id: "evt-1",
    createdAt: "2026-10-18T14:30:00.000Z",
    actor: "buyer-agent",
    action: "quote.requested",
    entityType: "quote",
    entityId: "quote-001",
    payload: { sku: "p1", qty: 1 },
    prevHash: null,
    hash: "",
  },
  {
    id: "evt-2",
    createdAt: "2026-10-18T14:31:00.000Z",
    actor: "policy-gate",
    action: "evaluate",
    entityType: "proposal",
    entityId: "prop-001",
    payload: { verdict: "approved", rules: 7 },
    prevHash: null,
    hash: "",
  },
  {
    id: "evt-3",
    createdAt: "2026-10-18T14:32:00.000Z",
    actor: "buyer-agent",
    action: "checkout.completed",
    entityType: "order",
    entityId: "order-001",
    payload: { total: 189900, paymentId: "pay-001" },
    prevHash: null,
    hash: "",
  },
];

// Compute hashes
let prevHash: string | null = null;
for (const event of events) {
  event.prevHash = prevHash;
  event.hash = computeHash(
    { id: event.id, createdAt: event.createdAt, actor: event.actor, action: event.action, entityType: event.entityType, entityId: event.entityId, payload: event.payload, prevHash: event.prevHash },
    prevHash,
  );
  prevHash = event.hash;
}

console.log("=== Tamper Tester ===\n");
console.log("Original chain:");
console.log(JSON.stringify(events, null, 2));
console.log("\nVerification:", verifyChain(events));

// Tamper: flip a field
const tampered = JSON.parse(JSON.stringify(events));
tampered[1].payload.verdict = "blocked";
console.log("\n--- Tampering: changing event 2 verdict from 'approved' to 'blocked' ---\n");
console.log("Tampered chain verification:", verifyChain(tampered));

// Tamper: flip hash
const tampered2 = JSON.parse(JSON.stringify(events));
tampered2[2].hash = "0".repeat(64);
console.log("\n--- Tampering: flipping event 3 hash ---\n");
console.log("Tampered chain verification:", verifyChain(tampered2));