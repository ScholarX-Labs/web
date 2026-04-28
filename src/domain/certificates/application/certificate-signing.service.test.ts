import { test, describe, it } from "node:test";
import assert from "node:assert/strict";
import { CertificateSigningService } from "./certificate-signing.service";
import type { CertificateCanonicalPayload } from "@/domain/certificates/contracts";

const TEST_SECRET = "a".repeat(64); // deterministic 64-char hex for tests

describe("CertificateSigningService", () => {
  const signer = new CertificateSigningService(TEST_SECRET);

  const payload: CertificateCanonicalPayload = {
    certificateId: "550e8400-e29b-41d4-a716-446655440000",
    recipientEmail: "test@scholarx.lk",
    recipientName: "Amal Perera",
    courseId: "course-abc-123",
    seasonNumber: 7,
    role: "mentee",
    issuedAt: "2026-04-28T00:00:00.000Z",
  };

  it("sign() produces a 64-char lowercase hex string", () => {
    const hex = signer.sign(payload);
    assert.match(hex, /^[0-9a-f]{64}$/);
  });

  it("sign() is deterministic — same payload always produces same signature", () => {
    const hex1 = signer.sign(payload);
    const hex2 = signer.sign(payload);
    assert.equal(hex1, hex2);
  });

  it("verify() returns true for a correctly signed payload", () => {
    const hex = signer.sign(payload);
    assert.equal(signer.verify(payload, hex), true);
  });

  it("verify() returns false when payload is tampered (different recipientEmail)", () => {
    const hex = signer.sign(payload);
    const tampered: CertificateCanonicalPayload = {
      ...payload,
      recipientEmail: "hacker@evil.com",
    };
    assert.equal(signer.verify(tampered, hex), false);
  });

  it("verify() returns false when payload is tampered (different role)", () => {
    const hex = signer.sign(payload);
    const tampered: CertificateCanonicalPayload = { ...payload, role: "mentor" };
    assert.equal(signer.verify(tampered, hex), false);
  });

  it("verify() returns false when signature hex is truncated", () => {
    const hex = signer.sign(payload);
    assert.equal(signer.verify(payload, hex.slice(0, 32)), false);
  });

  it("verify() returns false when signature is all zeros (no timing oracle)", () => {
    assert.equal(signer.verify(payload, "0".repeat(64)), false);
  });

  it("generateClaimToken() produces a 64-char hex string", () => {
    const { token } = signer.generateClaimToken();
    assert.match(token, /^[0-9a-f]{64}$/);
  });

  it("generateClaimToken() sets expiry ~30 days from now", () => {
    const { expiresAt } = signer.generateClaimToken();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const diff = expiresAt.getTime() - Date.now();
    assert.ok(diff > thirtyDays - 5000, "expiry should be ~30 days from now");
    assert.ok(diff < thirtyDays + 5000, "expiry should not exceed 30 days");
  });

  it("generateClaimToken() generates unique tokens each call", () => {
    const { token: t1 } = signer.generateClaimToken();
    const { token: t2 } = signer.generateClaimToken();
    assert.notEqual(t1, t2);
  });

  it("generateShortId() produces correct format SX-YYYY-00001", () => {
    const id = signer.generateShortId(1);
    assert.match(id, /^SX-\d{4}-\d{5}$/);
  });

  it("generateShortId() zero-pads to 5 digits", () => {
    const id = signer.generateShortId(42);
    assert.ok(id.endsWith("-00042"), `Expected -00042 suffix, got: ${id}`);
  });

  it("sign() is key-order invariant (canonical JSON)", () => {
    // Constructing two payloads with keys in different orders
    // TypeScript freezes object key order but this tests the canonicalize implementation
    const p1 = { ...payload };
    const p2 = {
      seasonNumber: payload.seasonNumber,
      role: payload.role,
      issuedAt: payload.issuedAt,
      courseId: payload.courseId,
      recipientName: payload.recipientName,
      recipientEmail: payload.recipientEmail,
      certificateId: payload.certificateId,
    } as CertificateCanonicalPayload;
    assert.equal(signer.sign(p1), signer.sign(p2));
  });

  it("throws if CERT_SIGNING_SECRET is missing", () => {
    assert.throws(
      () => new CertificateSigningService(undefined),
      /CERT_SIGNING_SECRET/,
    );
  });
});
