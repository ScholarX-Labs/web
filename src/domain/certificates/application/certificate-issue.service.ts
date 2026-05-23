import type { ICertificateRepository } from "../contracts/certificate.repository";
import type { ICertificateArtifactRepository } from "../contracts/certificate-artifact.repository";
import type { ICertificateEventRepository } from "../contracts/certificate-event.repository";
import type { ICertificateQueueRepository } from "../contracts/certificate-queue.repository";
import type { ICertificateQueuePort } from "../contracts/certificate-queue.port";
import type {
  CertificateEligibilitySnapshot,
  CompletionSource,
} from "../domain/certificate-source";
import type { CertificateRecord } from "../contracts/certificate.repository";
import type { CertificateArtifactRecord } from "../contracts/certificate-artifact.repository";
import { randomUUID } from "crypto";
import { generateCertificateNumber } from "../domain/certificate-number";
import { CURRENT_TEMPLATE_VERSION } from "../domain/certificate-template";
import { CertificateError } from "../domain/certificate-errors";

// ---------------------------------------------------------------------------
// Command input / output types
// ---------------------------------------------------------------------------

export interface IssueCourseCertificateInput {
  userId: string;
  courseId: string;
  courseProgressId: string;
  completedAt: Date;
  recipientName: string;
  recipientEmail?: string;
  courseTitle: string;
  completionSource: CompletionSource;
  ruleVersion?: string;
}

export interface IssueCertificateResult {
  certificate: CertificateRecord;
  artifact: CertificateArtifactRecord;
  alreadyIssued: boolean;
  artifactStatus: string;
}

const MIN_BROWSER_LOADABLE_PDF_BYTES = 500;
const STALE_PENDING_MS = 2 * 60 * 1000;
const STALE_GENERATING_MS = 15 * 60 * 1000;
const MAX_ARTIFACT_REPAIR_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * CertificateIssueService — the single write entry-point for certificate issuance.
 *
 * Design: idempotent command pattern.
 * - Looks up existing certificate by (userId, source_type, source_id).
 * - If found, ensures the required PDF artifact exists and is queued.
 * - If not found, generates certificate number, creates certificate, creates
 *   artifact, writes event, and writes outbox row — all in one DB transaction.
 * - After the transaction commits, publishes to Azure Service Bus.
 * - If Service Bus publish fails, the durable outbox row ensures a repair job
 *   can re-enqueue without losing the work.
 */
export class CertificateIssueService {
  constructor(
    private readonly certificateRepo: ICertificateRepository,
    private readonly artifactRepo: ICertificateArtifactRepository,
    private readonly eventRepo: ICertificateEventRepository,
    private readonly queueRepo: ICertificateQueueRepository,
    private readonly queuePort: ICertificateQueuePort,
  ) {}

  async issueForCourseCompletion(
    input: IssueCourseCertificateInput,
  ): Promise<IssueCertificateResult> {
    const sourceKey = {
      userId: input.userId,
      sourceType: "course_completion" as const,
      sourceId: input.courseProgressId,
    };

    // -------------------------------------------------------------------------
    // Step 1: Idempotency check — return existing certificate if already issued
    // -------------------------------------------------------------------------
    const existing = await this.certificateRepo.findBySource(sourceKey);

    if (existing) {
      const artifact = await this.ensureArtifactExists(existing);
      return {
        certificate: existing,
        artifact,
        alreadyIssued: true,
        artifactStatus: artifact.status,
      };
    }

    // -------------------------------------------------------------------------
    // Step 2: Generate number and create certificate + artifact + event + outbox
    // All writes happen inside the callers' DB transaction (repository handles it).
    // -------------------------------------------------------------------------
    const snapshot: CertificateEligibilitySnapshot = {
      sourceType: "course_completion",
      sourceId: input.courseProgressId,
      userId: input.userId,
      courseId: input.courseId,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      programName: input.courseTitle,
      completedAt: input.completedAt,
      completionSource: input.completionSource,
      ruleVersion: input.ruleVersion ?? "course_completion_v1",
    };

    // Retry loop for the extremely rare certificate number collision
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const certificateNumber = generateCertificateNumber();
        return await this.createCertificateWithArtifact(
          certificateNumber,
          snapshot,
          input,
        );
      } catch (error) {
        // If it's a unique constraint violation on certificate_number, retry
        const isUniqueViolation =
          (error as { code?: string })?.code === "23505" &&
          (error as { constraint?: string })?.constraint?.includes("certificate_number");

        if (!isUniqueViolation || attempt >= 4) {
          // Could be a race condition on the source key — check once more
          const raceWinner = await this.certificateRepo.findBySource(sourceKey);
          if (raceWinner) {
            const artifact = await this.ensureArtifactExists(raceWinner);
            return {
              certificate: raceWinner,
              artifact,
              alreadyIssued: true,
              artifactStatus: artifact.status,
            };
          }
          throw error;
        }
      }
    }

    throw new CertificateError(
      "CERTIFICATE_ISSUE_FAILED",
      500,
      "Certificate could not be issued after retry attempts.",
    );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async createCertificateWithArtifact(
    certificateNumber: string,
    snapshot: CertificateEligibilitySnapshot,
    input: IssueCourseCertificateInput,
  ): Promise<IssueCertificateResult> {
    // Create the certificate
    const certificate = await this.certificateRepo.createIssued({
      certificateNumber,
      userId: snapshot.userId,
      recipientName: snapshot.recipientName,
      recipientEmail: snapshot.recipientEmail,
      sourceType: snapshot.sourceType,
      sourceId: snapshot.sourceId,
      courseId: snapshot.courseId,
      courseProgressId: input.courseProgressId,
      programName: snapshot.programName,
      completionDate: snapshot.completedAt,
      ruleVersion: snapshot.ruleVersion,
      completionSource: snapshot.completionSource,
      metadata: {
        courseId: input.courseId,
        certificateTemplateVersion: CURRENT_TEMPLATE_VERSION,
      },
    });

    // Create the pending PDF artifact
    const artifact = await this.artifactRepo.createPending({
      certificateId: certificate.id,
      artifactType: "pdf",
      templateVersion: CURRENT_TEMPLATE_VERSION,
    });

    // Derive stable Service Bus message ID (idempotent for duplicate detection)
    const messageId = `${artifact.id}:pdf:${CURRENT_TEMPLATE_VERSION}`;

    // Write outbox row for durable publish tracking
    const outboxRow = await this.queueRepo.createOutboxRow({
      artifactId: artifact.id,
      certificateId: certificate.id,
      messageId,
    });

    // Record the domain event
    await this.eventRepo.append({
      certificateId: certificate.id,
      eventType: "certificate.issued",
      actorId: snapshot.userId,
      metadata: {
        sourceType: snapshot.sourceType,
        sourceId: snapshot.sourceId,
        ruleVersion: snapshot.ruleVersion,
        templateVersion: CURRENT_TEMPLATE_VERSION,
      },
    });

    // -------------------------------------------------------------------------
    // Step 3: Publish to Service Bus AFTER the DB transaction commits.
    // If this fails, the outbox row allows the repair job to re-enqueue.
    // -------------------------------------------------------------------------
    await this.publishArtifactJob(artifact, certificate, messageId, outboxRow.id);

    return {
      certificate,
      artifact,
      alreadyIssued: false,
      artifactStatus: artifact.status,
    };
  }

  private async ensureArtifactExists(
    certificate: CertificateRecord,
  ): Promise<CertificateArtifactRecord> {
    const existing = await this.artifactRepo.findRequiredArtifact({
      certificateId: certificate.id,
      artifactType: "pdf",
      templateVersion: CURRENT_TEMPLATE_VERSION,
    });

    if (existing) {
      if (this.shouldRequeueArtifact(existing)) {
        const repaired = await this.artifactRepo.markPendingForRegeneration({
          artifactId: existing.id,
          reasonCode: this.getRepairReasonCode(existing),
          reasonMessage:
            "Artifact was repaired by course access guard and requeued for generation.",
        });

        const artifact = repaired ?? existing;
        const messageId = `${artifact.id}:pdf:${CURRENT_TEMPLATE_VERSION}:repair-${Date.now()}-${randomUUID()}`;
        const outboxRow = await this.queueRepo.createOutboxRow({
          artifactId: artifact.id,
          certificateId: certificate.id,
          messageId,
        });

        await this.publishArtifactJob(
          artifact,
          certificate,
          messageId,
          outboxRow.id,
        );

        return artifact;
      }

      return existing;
    }

    // Artifact was lost or not created; create and re-enqueue
    const artifact = await this.artifactRepo.createPending({
      certificateId: certificate.id,
      artifactType: "pdf",
      templateVersion: CURRENT_TEMPLATE_VERSION,
    });

    const messageId = `${artifact.id}:pdf:${CURRENT_TEMPLATE_VERSION}`;
    const outboxRow = await this.queueRepo.createOutboxRow({
      artifactId: artifact.id,
      certificateId: certificate.id,
      messageId,
    });

    await this.publishArtifactJob(artifact, certificate, messageId, outboxRow.id);

    return artifact;
  }

  private shouldRequeueArtifact(artifact: CertificateArtifactRecord): boolean {
    const updatedAt = new Date(artifact.updatedAt).getTime();
    const isUpdatedAtValid = Number.isFinite(updatedAt);
    const ageMs = isUpdatedAtValid ? Date.now() - updatedAt : 0;
    const nextAttemptAt = artifact.nextAttemptAt
      ? new Date(artifact.nextAttemptAt).getTime()
      : null;

    if (
      artifact.status === "ready" &&
      artifact.contentType === "application/pdf" &&
      artifact.byteSize !== null &&
      artifact.byteSize < MIN_BROWSER_LOADABLE_PDF_BYTES
    ) {
      return true;
    }

    if (artifact.status === "pending" && ageMs >= STALE_PENDING_MS) {
      return true;
    }

    if (artifact.status === "generating" && ageMs >= STALE_GENERATING_MS) {
      return true;
    }

    if (
      artifact.status === "failed" &&
      artifact.attempts < MAX_ARTIFACT_REPAIR_ATTEMPTS &&
      (nextAttemptAt === null || nextAttemptAt <= Date.now())
    ) {
      return true;
    }

    return false;
  }

  private getRepairReasonCode(artifact: CertificateArtifactRecord): string {
    if (artifact.status === "ready") return "INVALID_READY_PDF_REPAIR";
    if (artifact.status === "generating") return "STALE_GENERATING_REPAIR";
    if (artifact.status === "failed") return "FAILED_ARTIFACT_REPAIR";
    return "STALE_PENDING_REPAIR";
  }

  private async publishArtifactJob(
    artifact: CertificateArtifactRecord,
    certificate: CertificateRecord,
    messageId: string,
    outboxId: string,
  ): Promise<void> {
    try {
      await this.queuePort.publish({
        messageId,
        body: {
          schemaVersion: 1,
          artifactId: artifact.id,
          certificateId: certificate.id,
          certificateNumber: certificate.certificateNumber,
          artifactType: "pdf",
          templateVersion: CURRENT_TEMPLATE_VERSION,
          requestedAt: new Date().toISOString(),
        },
      });

      // Mark the outbox row as successfully published
      await this.queueRepo.markPublished({
        outboxId,
        publishedAt: new Date(),
      });

      await this.eventRepo.append({
        certificateId: certificate.id,
        eventType: "certificate.artifact_generation_requested",
        metadata: { artifactId: artifact.id, messageId },
      });
    } catch (publishError) {
      // Service Bus publish failed — outbox row remains unpublished.
      // The repair job will re-enqueue this within 5 minutes.
      console.error(
        "[CertificateIssueService] Service Bus publish failed; outbox row will be picked up by repair job",
        { artifactId: artifact.id, messageId, error: publishError },
      );
    }
  }
}
