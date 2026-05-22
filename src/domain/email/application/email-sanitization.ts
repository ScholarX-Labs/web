import { createHash, randomUUID } from "node:crypto";
import type { EmailCategory } from "../contracts/email-types";

export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase();
}

export function hashEmailValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashSubject(subject: string): string {
  return createHash("sha256").update(subject).digest("hex");
}

export function maskEmailAddress(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0] ?? "*"}***@${domain}`;
}

export function createSubjectPreview(subject: string): string {
  return subject.replace(/\s+/g, " ").trim().slice(0, 120);
}

export function safeFailureReason(reason: string): string {
  return reason
    .replace(/password\s*[:=]\s*\S+/gi, "password=[redacted]")
    .replace(/token\s*[:=]\s*\S+/gi, "token=[redacted]")
    .replace(/secret\s*[:=]\s*\S+/gi, "secret=[redacted]")
    .slice(0, 500);
}

export function createRequestId(category: EmailCategory): string {
  return `${category}-${randomUUID()}`;
}

export function createLegacyIdempotencyKey(input: {
  category: EmailCategory;
  to: string;
  subject: string;
  requestId?: string;
  purpose?: string;
}): string {
  const normalizedRecipient = normalizeEmailAddress(input.to);
  const purpose = input.purpose ?? "legacy";
  const stablePart = input.requestId ?? hashSubject(input.subject).slice(0, 16);
  return `${input.category}:${normalizedRecipient}:${purpose}:${stablePart}`;
}
