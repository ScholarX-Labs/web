import type { ICertificateRepository } from "../contracts/certificate.repository";
import type { ICertificateArtifactRepository } from "../contracts/certificate-artifact.repository";
import type { ICertificateEventRepository } from "../contracts/certificate-event.repository";
import type { ICertificateRendererPort } from "../contracts/certificate-renderer.port";
import type { ICertificateStoragePort } from "../contracts/certificate-storage.port";
import type { CertificateArtifactJobMessage } from "../contracts/certificate-queue.port";
import type { ArtifactType } from "@/db/schema/certificates-db.schema";
import { buildArtifactStorageKey } from "../contracts/certificate-storage.port";
import { CertificateError } from "../domain/certificate-errors";
import type { CertificateTemplateVersion } from "../domain/certificate-template";
import { invalidatePublicCertificateCache } from "./certificate-cache";

export const ARTIFACT_STORAGE_CONTAINER = "certificates";

/**
 * CertificateArtifactGenerationService — called by the worker only.
 *
 * Design: atomic claim pattern (Outbox/Job pattern).
 * 1. Atomically claim the artifact row (pending/failed → generating).
 * 2. If claim returns null → artifact is already ready or non-retryable; skip.
 * 3. Load certificate snapshot for rendering.
 * 4. Reject if certificate is revoked.
 * 5. Render PDF.
 * 6. Upload to Azure Blob.
 * 7. Mark artifact ready.
 * 8. Record artifact_ready event.
 */
export class CertificateArtifactGenerationService {
  constructor(
    private readonly certificateRepo: ICertificateRepository,
    private readonly artifactRepo: ICertificateArtifactRepository,
    private readonly eventRepo: ICertificateEventRepository,
    private readonly renderer: ICertificateRendererPort,
    private readonly storage: ICertificateStoragePort,
  ) {}

  async processJob(message: CertificateArtifactJobMessage): Promise<void> {
    const startedAt = Date.now();

    // Step 1: Atomically claim the artifact row
    const claimed = await this.artifactRepo.markGenerating({
      artifactId: message.artifactId,
    });

    if (!claimed) {
      // Already ready, non-retryable failed, or claimed by another worker
      const existing = await this.artifactRepo.findRequiredArtifact({
        certificateId: message.certificateId,
        artifactType: message.artifactType as ArtifactType,
        templateVersion: message.templateVersion,
      });
      if (existing?.status === "ready") {
        console.info("[CertificateArtifactGenerationService] Artifact already ready — skipping", {
          artifactId: message.artifactId,
        });
        return;
      }
      console.warn("[CertificateArtifactGenerationService] Artifact claim failed — another worker may have it", {
        artifactId: message.artifactId,
      });
      return;
    }

    // Step 2: Load certificate for render data
    const certificate = await this.certificateRepo.findByPublicNumber(
      message.certificateNumber,
    );

    if (!certificate) {
      await this.failArtifact(message.artifactId, "CERTIFICATE_NOT_FOUND", "Certificate not found");
      await invalidatePublicCertificateCache(message.certificateNumber);
      return;
    }

    // Step 3: Reject revoked certificates
    if (certificate.revokedAt) {
      await this.failArtifact(
        message.artifactId,
        "CERTIFICATE_REVOKED",
        "Certificate is revoked; artifact generation skipped",
        undefined, // no next attempt
      );
      await invalidatePublicCertificateCache(certificate.certificateNumber);
      return;
    }

    await this.eventRepo.append({
      certificateId: certificate.id,
      eventType: "certificate.artifact_generation_started",
      metadata: {
        artifactId: message.artifactId,
        artifactType: message.artifactType,
        templateVersion: message.templateVersion,
      },
    });
    await invalidatePublicCertificateCache(certificate.certificateNumber);

    try {
      // Step 4: Render
      const renderOutput = await this.renderer.renderPdf({
        certificateNumber: certificate.certificateNumber,
        recipientName: certificate.recipientName,
        programName: certificate.programName,
        completionDate: new Date(certificate.completionDate),
        issuedAt: new Date(certificate.issuedAt),
        templateVersion: message.templateVersion as CertificateTemplateVersion,
      });

      // Step 5: Upload to storage
      const storageKey = buildArtifactStorageKey(
        certificate.certificateNumber,
        message.templateVersion,
        message.artifactType as "pdf" | "png_preview",
      );

      await this.storage.upload({
        key: storageKey,
        container: ARTIFACT_STORAGE_CONTAINER,
        content: renderOutput.content,
        contentType: renderOutput.contentType,
      });

      // Step 6: Mark ready
      const durationMs = Date.now() - startedAt;
      await this.artifactRepo.markReady({
        artifactId: message.artifactId,
        storageContainer: ARTIFACT_STORAGE_CONTAINER,
        storageKey,
        contentType: renderOutput.contentType,
        byteSize: renderOutput.byteSize,
        checksumSha256: renderOutput.checksumSha256,
        generatedAt: new Date(),
      });

      await this.eventRepo.append({
        certificateId: certificate.id,
        eventType: "certificate.artifact_ready",
        metadata: {
          artifactId: message.artifactId,
          durationMs,
          storageKey,
          byteSize: renderOutput.byteSize,
        },
      });
      await invalidatePublicCertificateCache(certificate.certificateNumber);

      console.info("[CertificateArtifactGenerationService] Artifact ready", {
        artifactId: message.artifactId,
        durationMs,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const durationMs = Date.now() - startedAt;

      // Exponential backoff for next attempt
      const attempts = (claimed.attempts ?? 0);
      const backoffMs = Math.min(Math.pow(2, attempts) * 30_000, 600_000); // max 10 min
      const nextAttemptAt = new Date(Date.now() + backoffMs);

      await this.failArtifact(
        message.artifactId,
        "RENDER_FAILED",
        errMsg,
        attempts < 5 ? nextAttemptAt : undefined,
      );

      await this.eventRepo.append({
        certificateId: certificate.id,
        eventType: "certificate.artifact_failed",
        metadata: {
          artifactId: message.artifactId,
          error: errMsg,
          durationMs,
          attempts: attempts + 1,
        },
      });
      await invalidatePublicCertificateCache(certificate.certificateNumber);

      // Re-throw so the worker can abandon/nack the Service Bus message
      throw new CertificateError(
        "RENDER_FAILED",
        500,
        `Artifact generation failed: ${errMsg}`,
        { artifactId: message.artifactId },
      );
    }
  }

  private async failArtifact(
    artifactId: string,
    errorCode: string,
    errorMessage: string,
    nextAttemptAt?: Date,
  ): Promise<void> {
    try {
      await this.artifactRepo.markFailed({
        artifactId,
        errorCode,
        errorMessage,
        nextAttemptAt,
      });
    } catch {
      // Best-effort — don't swallow the original error
    }
  }
}
