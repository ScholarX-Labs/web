import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { CertificateCanonicalPayload, CertificateRole } from "@/domain/certificates/contracts";

/**
 * CertificateSigningService
 *
 * Handles all cryptographic operations for the Certification Module:
 * - HMAC-SHA256 signing of certificate payloads
 * - Constant-time signature verification (timing-attack safe)
 * - Cryptographically random claim token generation
 * - Human-readable short ID generation
 *
 * No external dependencies — uses Node.js built-in `crypto` module only.
 * Requires `CERT_SIGNING_SECRET` environment variable at runtime.
 */
export class CertificateSigningService {
  private readonly secret: string;

  constructor(secret?: string) {
    const resolved = secret ?? process.env.CERT_SIGNING_SECRET;
    if (!resolved) {
      throw new Error(
        "CERT_SIGNING_SECRET environment variable is not set. " +
          "Generate one with: openssl rand -hex 32",
      );
    }
    this.secret = resolved;
  }

  /**
   * Produce a canonical, deterministically-ordered JSON string from the payload.
   * Key order is sorted to ensure the same payload always produces the same bytes.
   */
  private canonicalize(payload: CertificateCanonicalPayload): string {
    const ordered = Object.keys(payload)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = payload[key as keyof CertificateCanonicalPayload];
        return acc;
      }, {});
    return JSON.stringify(ordered);
  }

  /**
   * Sign a certificate payload and return the HMAC-SHA256 hex digest.
   */
  sign(payload: CertificateCanonicalPayload): string {
    const data = this.canonicalize(payload);
    return createHmac("sha256", this.secret).update(data).digest("hex");
  }

  /**
   * Verify a certificate signature using constant-time comparison.
   * Returns true only if the recomputed signature matches the stored one.
   */
  verify(payload: CertificateCanonicalPayload, storedHex: string): boolean {
    const expectedHex = this.sign(payload);
    const expected = Buffer.from(expectedHex, "hex");
    const received = Buffer.from(storedHex, "hex");

    // Lengths must match before timingSafeEqual (it throws on length mismatch)
    if (expected.length !== received.length) {
      return false;
    }

    return timingSafeEqual(expected, received);
  }

  /**
   * Generate a 30-day single-use claim token.
   * Returns a 64-character lowercase hex string (32 bytes of entropy).
   */
  generateClaimToken(): { token: string; expiresAt: Date } {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    return { token, expiresAt };
  }

  /**
   * Generate a human-readable short certificate ID.
   * Format: SX-{YEAR}-{5-digit-zero-padded-sequence}
   * Example: SX-2026-00142
   */
  generateShortId(sequenceNumber: number): string {
    const year = new Date().getFullYear();
    const paddedSeq = String(sequenceNumber).padStart(5, "0");
    return `SX-${year}-${paddedSeq}`;
  }

  /**
   * Build the canonical payload object from raw certificate fields.
   */
  buildPayload(fields: {
    certificateId: string;
    recipientEmail: string;
    recipientName: string;
    courseId: string;
    seasonNumber: number;
    role: CertificateRole;
    issuedAt: Date;
  }): CertificateCanonicalPayload {
    return {
      certificateId: fields.certificateId,
      recipientEmail: fields.recipientEmail,
      recipientName: fields.recipientName,
      courseId: fields.courseId,
      seasonNumber: fields.seasonNumber,
      role: fields.role,
      issuedAt: fields.issuedAt.toISOString(),
    };
  }
}
