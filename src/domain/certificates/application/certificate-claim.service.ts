import { db } from "@/db";
import type {
  ClaimCertificateInput,
  ClaimCertificateResult,
} from "@/domain/certificates/contracts";
import { CertificatesRepository } from "@/domain/certificates/infrastructure/db/certificates.repository";
import { CertificateError } from "./certificate.errors";

/**
 * CertificateClaimService
 *
 * Handles the atomic claim flow:
 * 1. Look up certificate by claim token
 * 2. Validate: token must exist, not expired, certificate not already claimed/revoked
 * 3. Atomically mark as CLAIMED, clear token, set claimedAt, optionally link userId
 * 4. Log "claimed" event
 */
export class CertificateClaimService {
  private readonly certRepo: CertificatesRepository;

  constructor(certRepo?: CertificatesRepository) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.certRepo = certRepo ?? new CertificatesRepository(db as any);
  }

  async claim(input: ClaimCertificateInput): Promise<ClaimCertificateResult> {
    const row = await this.certRepo.findByClaimToken(input.claimToken);

    if (!row) {
      return {
        success: false,
        code: "token_invalid",
        message: "This claim link is invalid or has already been used.",
      };
    }

    if (row.status === "CLAIMED") {
      return {
        success: false,
        code: "already_claimed",
        certificateId: row.id,
        message: "This certificate has already been claimed.",
      };
    }

    if (row.status === "REVOKED") {
      throw new CertificateError(
        "CERTIFICATE_REVOKED",
        403,
        "This certificate has been revoked and cannot be claimed.",
        4001,
        { certificateId: row.id },
      );
    }

    const now = new Date();
    if (row.claimTokenExpiresAt && row.claimTokenExpiresAt < now) {
      return {
        success: false,
        code: "token_expired",
        certificateId: row.id,
        message:
          "This claim link has expired (30-day limit). Contact support to request a new link.",
      };
    }

    // Atomic: mark claimed, clear token, link userId if provided
    await this.certRepo.markClaimed(row.id, input.userId);
    await this.certRepo.logEvent({
      certificateId: row.id,
      eventType: "claimed",
      actorId: input.userId,
      actorRole: input.userId ? "recipient" : "public",
    });

    return {
      success: true,
      code: "claimed",
      certificateId: row.id,
      message: "Certificate claimed successfully. Welcome to your wallet!",
    };
  }
}
