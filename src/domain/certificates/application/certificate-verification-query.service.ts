import type { ICertificateRepository, CertificateRecord } from "../contracts/certificate.repository";
import type { ICertificateArtifactRepository } from "../contracts/certificate-artifact.repository";
import type { ICertificateEventRepository } from "../contracts/certificate-event.repository";
import type { ArtifactType } from "@/db/schema/certificates-db.schema";
import { CURRENT_TEMPLATE_VERSION } from "../domain/certificate-template";
import {
  getCachedCertificateArtifactStatus,
  getCachedPublicCertificate,
  setCachedCertificateArtifactStatus,
  setCachedPublicCertificate,
} from "./certificate-cache";

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

export interface LearnerCertificateLinkDto {
  certificateNumber: string;
  certificateUrl: string;
  courseTitle: string;
  issuedAt: string;
  status: string;
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
    const cached = await getCachedPublicCertificate(certificateNumber);
    if (cached) {
      if (!cached.found) return null;

      this.eventRepo
        .append({
          certificateId: cached.certificateId,
          eventType: "certificate.verified",
          metadata: { certificateNumber: cached.value.certificateNumber },
        })
        .catch(() => {
          // Non-critical — continue even if event write fails
        });

      return cached.value;
    }

    const certificate = await this.certificateRepo.findByPublicNumber(
      certificateNumber,
    );

    if (!certificate || !certificate.isPublic) {
      await setCachedPublicCertificate(certificateNumber, { found: false });
      return null;
    }

    // Always include revoked certificates — spec requirement
    const artifact = await this.artifactRepo.findRequiredArtifact({
      certificateId: certificate.id,
      artifactType: "pdf" as ArtifactType,
      templateVersion: CURRENT_TEMPLATE_VERSION,
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

    const value = {
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

    await setCachedPublicCertificate(certificateNumber, {
      found: true,
      certificateId: certificate.id,
      value,
    });

    return value;
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
    const cached = await getCachedCertificateArtifactStatus(certificateNumber);
    if (cached) {
      return cached.found ? cached.value : null;
    }

    const certificate = await this.certificateRepo.findByPublicNumber(
      certificateNumber,
    );
    if (!certificate || !certificate.isPublic) {
      await setCachedCertificateArtifactStatus(certificateNumber, { found: false });
      return null;
    }

    const artifact = await this.artifactRepo.findRequiredArtifact({
      certificateId: certificate.id,
      artifactType: "pdf" as ArtifactType,
      templateVersion: CURRENT_TEMPLATE_VERSION,
    });

    const pdfStatus = artifact?.status ?? "pending";
    const isReady = pdfStatus === "ready";
    const isPendingOrGenerating =
      pdfStatus === "pending" || pdfStatus === "generating";

    const value = {
      certificateNumber: certificate.certificateNumber,
      pdf: {
        status: pdfStatus,
        downloadUrl: isReady
          ? `/certificates/${certificate.certificateNumber}/download`
          : null,
        nextPollAfterMs: isPendingOrGenerating ? 5000 : null,
      },
    };

    await setCachedCertificateArtifactStatus(certificateNumber, {
      found: true,
      value,
    });

    return value;
  }

  /**
   * Returns the full certificate record for internal use.
   * Must not be called from public API endpoints.
   */
  async getInternalCertificate(certificateNumber: string): Promise<CertificateRecord | null> {
    return this.certificateRepo.findByPublicNumber(certificateNumber);
  }

  /**
   * Internal learner-facing lookup used by authenticated course and lesson pages.
   * Does not expose storage keys, internal IDs, or private auth data.
   */
  async getCourseCompletionCertificateForUser(input: {
    userId: string;
    courseProgressId: string;
  }): Promise<LearnerCertificateLinkDto | null> {
    const certificate = await this.certificateRepo.findBySource({
      userId: input.userId,
      sourceType: "course_completion",
      sourceId: input.courseProgressId,
    });

    if (!certificate || !certificate.isPublic) return null;

    return {
      certificateNumber: certificate.certificateNumber,
      certificateUrl: `/certificates/${certificate.certificateNumber}`,
      courseTitle: certificate.programName,
      issuedAt: certificate.issuedAt,
      status: certificate.status,
    };
  }

  /**
   * Internal learner-facing lookup to list all public, unrevoked certificates for a user.
   */
  async getCertificatesForUser(userId: string): Promise<LearnerCertificateLinkDto[]> {
    const certificates = await this.certificateRepo.findByUserId(userId);
    return certificates.map((cert) => ({
      certificateNumber: cert.certificateNumber,
      certificateUrl: `/certificates/${cert.certificateNumber}`,
      courseTitle: cert.programName,
      issuedAt: cert.issuedAt,
      status: cert.status,
    }));
  }
}
