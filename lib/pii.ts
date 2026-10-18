// lib/pii.ts - PII helpers: hash identities, redact sensitive fields (ticket 16)

import { createHash } from "crypto";

export function hashIdentity(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function redactEmail(email: string | null | undefined): string {
  if (!email) return "anon";
  const [local, domain] = email.split("@");
  if (!domain) return hashIdentity(email);
  return `${local.slice(0, 2)}***@${domain}`;
}