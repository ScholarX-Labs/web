import type { ICertificateRepository } from "../contracts/certificate.repository";
import type { ICertificateEventRepository } from "../contracts/certificate-event.repository";
import { CertificateError } from "../domain/certificate-errors";
import { assertValidCertificateTransition } from "../domain/certificate-status";
import { invalidatePublicCertificateCache } from "./certificate-cache";

export interface RevokeCertificateCommand {
  certificateNumber: string;
  revokedBy: string;
  reason?: string;
}

/**
 * CertificateRevocationService — admin-only revocation.
 * Validates the state transition and records the event.
 */
export class CertificateRevocationService {
  constructor(
    private readonly certificateRepo: ICertificateRepository,
    private readonly eventRepo: ICertificateEventRepository,
  ) {}

  async revoke(command: RevokeCertificateCommand): Promise<void> {
    const certificate = await this.certificateRepo.findByPublicNumber(
      command.certificateNumber,
    );

    if (!certificate) {
      throw new CertificateError(
        "CERTIFICATE_NOT_FOUND",
        404,
        "Certificate not found.",
        { certificateNumber: command.certificateNumber },
      );
    }

    // Validate state machine transition
    assertValidCertificateTransition(certificate.status as "pending" | "issued" | "claimed" | "revoked", "revoked");

    await this.certificateRepo.markRevoked({
      certificateId: certificate.id,
      revokedBy: command.revokedBy,
      reason: command.reason,
    });

    await this.eventRepo.append({
      certificateId: certificate.id,
      eventType: "certificate.revoked",
      actorId: command.revokedBy,
      actorRole: "admin",
      metadata: {
        reason: command.reason,
        previousStatus: certificate.status,
      },
    });

    await invalidatePublicCertificateCache(certificate.certificateNumber);
  }
}
