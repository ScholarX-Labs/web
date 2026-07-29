import type { ICertificateRepository } from "../contracts/certificate.repository";
import type { ICertificateArtifactRepository } from "../contracts/certificate-artifact.repository";
import type { ICertificateEventRepository } from "../contracts/certificate-event.repository";
import type { ICertificateStoragePort } from "../contracts/certificate-storage.port";
import type { ArtifactType } from "@/db/schema/certificates-db.schema";
import { CURRENT_TEMPLATE_VERSION } from "../domain/certificate-template";
import { CertificateError } from "../domain/certificate-errors";

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * CertificateDownloadQueryService — handles PDF download requests.
 *
 * Design:
 * - Validates certificate exists, is public, and is not revoked.
 * - Validates PDF artifact is ready.
 * - Returns a download URL (signed SAS or streaming proxy URL).
 * - Records a downloaded event (fire-and-forget).
 */
export class CertificateDownloadQueryService {
  constructor(
    private readonly certificateRepo: ICertificateRepository,
    private readonly artifactRepo: ICertificateArtifactRepository,
    private readonly eventRepo: ICertificateEventRepository,
    private readonly storagePort: ICertificateStoragePort,
  ) {}

  async getDownloadUrl(
    certificateNumber: string,
    options?: { actorId?: string },
  ): Promise<string> {
    const certificate = await this.certificateRepo.findByPublicNumber(
      certificateNumber,
    );

    if (!certificate) {
      throw new CertificateError(
        "CERTIFICATE_NOT_FOUND",
        404,
        "Certificate not found.",
        { certificateNumber },
      );
    }

    if (certificate.revokedAt) {
      throw new CertificateError(
        "CERTIFICATE_REVOKED",
        403,
        "This certificate has been revoked and cannot be downloaded.",
        { certificateNumber },
      );
    }

    const artifact = await this.artifactRepo.findRequiredArtifact({
      certificateId: certificate.id,
      artifactType: "pdf" as ArtifactType,
      templateVersion: CURRENT_TEMPLATE_VERSION,
    });

    if (!artifact || artifact.status !== "ready" || !artifact.storageKey || !artifact.storageContainer) {
      throw new CertificateError(
        "ARTIFACT_NOT_READY",
        409,
        "The PDF certificate is not yet ready for download.",
        { certificateNumber, artifactStatus: artifact?.status ?? "not_found" },
      );
    }

    const downloadUrl = await this.storagePort.getDownloadUrl({
      key: artifact.storageKey,
      container: artifact.storageContainer,
      expiresInSeconds: 300, // 5-minute signed URL
      filename: `ScholarX-Certificate-${certificateNumber}.pdf`,
    });

    // Fire-and-forget download event — don't block the response
    this.eventRepo
      .append({
        certificateId: certificate.id,
        eventType: "certificate.downloaded",
        actorId: options?.actorId,
        metadata: {
          certificateNumber,
          artifactId: artifact.id,
        },
      })
      .catch(() => {
        // Non-critical
      });

    return downloadUrl;
  }

  async getDownloadFile(
    certificateNumber: string,
    options?: { actorId?: string },
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const certificate = await this.certificateRepo.findByPublicNumber(
      certificateNumber,
    );

    if (!certificate) {
      throw new CertificateError(
        "CERTIFICATE_NOT_FOUND",
        404,
        "Certificate not found.",
        { certificateNumber },
      );
    }

    if (certificate.revokedAt) {
      throw new CertificateError(
        "CERTIFICATE_REVOKED",
        403,
        "This certificate has been revoked and cannot be downloaded.",
        { certificateNumber },
      );
    }

    const artifact = await this.artifactRepo.findRequiredArtifact({
      certificateId: certificate.id,
      artifactType: "pdf" as ArtifactType,
      templateVersion: CURRENT_TEMPLATE_VERSION,
    });

    if (
      !artifact ||
      artifact.status !== "ready" ||
      !artifact.storageKey ||
      !artifact.storageContainer
    ) {
      throw new CertificateError(
        "ARTIFACT_NOT_READY",
        409,
        "The PDF certificate is not yet ready for download.",
        { certificateNumber, artifactStatus: artifact?.status ?? "not_found" },
      );
    }

    const filename = `ScholarX-Certificate-${certificateNumber}.pdf`;

    // Obtain a signed URL from the storage adapter (SAS for Azure, synthetic
    // URL for the in-memory adapter in dev/test) then fetch it server-side.
    // This avoids a separate downloadBuffer port method and works identically
    // across all storage backends.
    const signedUrl = await this.storagePort.getDownloadUrl({
      key: artifact.storageKey,
      container: artifact.storageContainer,
      expiresInSeconds: 60, // short TTL — only for this server-side fetch
      filename,
    });

    const fetchRes = await fetch(signedUrl, { cache: "no-store" });
    if (!fetchRes.ok) {
      throw new CertificateError(
        "ARTIFACT_FETCH_FAILED",
        502,
        `Storage fetch failed with status ${fetchRes.status}.`,
        { certificateNumber },
      );
    }
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Fire-and-forget download event — don't block the response
    this.eventRepo
      .append({
        certificateId: certificate.id,
        eventType: "certificate.downloaded",
        actorId: options?.actorId,
        metadata: {
          certificateNumber,
          artifactId: artifact.id,
        },
      })
      .catch(() => {
        // Non-critical
      });

    return {
      buffer,
      filename,
      contentType: artifact.contentType ?? "application/pdf",
    };
  }
}

