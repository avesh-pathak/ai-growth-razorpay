// lib/policy/audit.ts — append-only, hash-chained audit trail

import { type AuditEvent } from "./types";
import { createHash } from "crypto";

export function computeAuditHash(event: Omit<AuditEvent, "hash">, prevHash: string | null): string {
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

export function createAuditEvent(params: {
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  prevHash: string | null;
}): AuditEvent {
  const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const event: Omit<AuditEvent, "hash"> = {
    id,
    createdAt,
    actor: params.actor,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    payload: params.payload,
    prevHash: params.prevHash,
  };
  const hash = computeAuditHash(event, params.prevHash);
  return { ...event, hash };
}

export function verifyAuditChain(events: AuditEvent[]): { valid: boolean; brokenAt?: number } {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const prevHash = i > 0 ? events[i - 1].hash : null;
    if (event.prevHash !== prevHash) {
      return { valid: false, brokenAt: i };
    }
    const recomputed = computeAuditHash(
      { id: event.id, createdAt: event.createdAt, actor: event.actor, action: event.action, entityType: event.entityType, entityId: event.entityId, payload: event.payload, prevHash: event.prevHash },
      prevHash,
    );
    if (recomputed !== event.hash) {
      return { valid: false, brokenAt: i };
    }
  }
  return { valid: true };
}