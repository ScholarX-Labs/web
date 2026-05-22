import type { ICertificateRepository, CertificateRecord } from "../contracts/certificate.repository";
import type { ICertificateArtifactRepository } from "../contracts/certificate-artifact.repository";
import type { ICertificateEventRepository } from "../contracts/certificate-event.repository";
import type { ArtifactType } from "@/db/schema/certificates-db.schema";

// ---------------------------------------------------------------------------
// Public DTO — safe to return to the browser (no internal IDs or storage keys)
// ---------------------------------------------------------------------------

export interface PublicCertificateArtifactDto {
  status: string;
  /** Only set when status === "ready" */
  downloadUrl: string | null;
  /** How many ms the client should wait before polling again */
  nextPollAfterMs: number | null;
}

export interface PublicCertificateDto {
  certificateNumber: string;
  recipientName: string;
  programName: string;
  completionDate: string;
  issuedAt: string;
  status: string;
  isRevoked: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
  pdf: PublicCertificateArtifactDto;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * CertificateVerificationQueryService — read-only query service for public pages.
 *
 * Design:
 * - Never exposes internal UUIDs, user IDs, storage keys, or private data.
 * - Returns revoked certificates as revoked (not 404) per spec requirement.
 * - Returns null for unknown or non-public certificates.
 */
export class CertificateVerificationQueryService {
  constructor(
    private readonly certificateRepo: ICertificateRepository,
    private readonly artifactRepo: ICertificateArtifactRepository,
    private readonly eventRepo: ICertificateEventRepository,
  ) {}

  async getPublicCertificate(
    certificateNumber: string,
  ): Promise<PublicCertificateDto | null> {
    const certificate = await this.certificateRepo.findByPublicNumber(
      certificateNumber,
    );

    if (!certificate || !certificate.isPublic) return null;

    // Always include revoked certificates — spec requirement
    const artifact = await this.artifactRepo.findRequiredArtifact({
      certificateId: certificate.id,
      artifactType: "pdf" as ArtifactType,
      templateVersion: "scholarx-v1",
    });

    // Record a verification event (fire-and-forget — don't block the response)
    this.eventRepo
      .append({
        certificateId: certificate.id,
        eventType: "certificate.verified",
        metadata: { certificateNumber },
      })
      .catch(() => {
        // Non-critical — continue even if event write fails
      });

    const pdfStatus = artifact?.status ?? "pending";
    const isReady = pdfStatus === "ready";
    const isPendingOrGenerating =
      pdfStatus === "pending" || pdfStatus === "generating";

    return {
      certificateNumber: certificate.certificateNumber,
      recipientName: certificate.recipientName,
      programName: certificate.programName,
      completionDate: certificate.completionDate,
      issuedAt: certificate.issuedAt,
      status: certificate.status,
      isRevoked: Boolean(certificate.revokedAt),
      revokedAt: certificate.revokedAt,
      revokedReason: certificate.revokedReason,
      pdf: {
        status: pdfStatus,
        downloadUrl: isReady
          ? `/certificates/${certificate.certificateNumber}/download`
          : null,
        nextPollAfterMs: isPendingOrGenerating ? 5000 : null,
      },
    };
  }

  /**
   * Lightweight status-only endpoint for client-side polling.
   * Returns only artifact status — no certificate metadata.
   */
  async getArtifactStatus(
    certificateNumber: string,
  ): Promise<{
    certificateNumber: string;
    pdf: PublicCertificateArtifactDto;
  } | null> {
    const certificate = await this.certificateRepo.findByPublicNumber(
      certificateNumber,
    );
    if (!certificate || !certificate.isPublic) return null;

    const artifact = await this.artifactRepo.findRequiredArtifact({
      certificateId: certificate.id,
      artifactType: "pdf" as ArtifactType,
      templateVersion: "scholarx-v1",
    });

    const pdfStatus = artifact?.status ?? "pending";
    const isReady = pdfStatus === "ready";
    const isPendingOrGenerating =
      pdfStatus === "pending" || pdfStatus === "generating";

    return {
      certificateNumber: certificate.certificateNumber,
      pdf: {
        status: pdfStatus,
        downloadUrl: isReady
          ? `/certificates/${certificate.certificateNumber}/download`
          : null,
        nextPollAfterMs: isPendingOrGenerating ? 5000 : null,
      },
    };
  }

  /**
   * Returns the full certificate record for internal use.
   * Must not be called from public API endpoints.
   */
  async getInternalCertificate(certificateNumber: string): Promise<CertificateRecord | null> {
    return this.certificateRepo.findByPublicNumber(certificateNumber);
  }
}
