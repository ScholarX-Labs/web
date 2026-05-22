/**
 * Certificate Repair / Requeue Job
 *
 * Runs on a 5-minute timer to re-enqueue:
 * 1. Unpublished outbox rows (Service Bus publish failed at issuance time).
 * 2. Artifacts stuck in 'pending' for > 5 minutes with no outbox row.
 * 3. Artifacts stuck in 'generating' for > 15 minutes (lock timeout exceeded).
 * 4. Failed artifacts with remaining retry budget and a past next_attempt_at.
 *
 * Deployment options:
 * - Azure Functions timer trigger (every 5 minutes)
 * - Azure Container Apps scheduled job
 * - Simple cron process alongside the worker
 *
 * Run (one-shot):
 *   node --import tsx src/worker/certificate-repair-job.ts
 */

import "dotenv/config";
import { and, eq, isNull, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCanonicalCertificates,
  dbCertificateArtifactQueue,
  dbCertificateArtifacts,
} from "@/db/schema/certificates-db.schema";
import { DrizzleCertificateQueueRepository } from "@/domain/certificates/infrastructure/db/drizzle-certificate-queue.repository";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Re-enqueue outbox rows older than this that were never published */
const UNPUBLISHED_OUTBOX_AGE_MS = 2 * 60 * 1000; // 2 minutes

/** Artifacts stuck in 'pending' with no outbox row for this long get re-queued */
const PENDING_ARTIFACT_STALE_MS = 5 * 60 * 1000; // 5 minutes

/** Artifacts stuck in 'generating' beyond this are assumed to have lost their lock */
const GENERATING_ARTIFACT_STALE_MS = 15 * 60 * 1000; // 15 minutes

/** Batch size per repair pass */
const BATCH_SIZE = 100;

/** Max retries before we stop re-queuing a failed artifact */
const MAX_ARTIFACT_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Metrics (simple counters for structured logging)
// ---------------------------------------------------------------------------

interface RepairMetrics {
  unpublishedOutboxFound: number;
  unpublishedOutboxPublished: number;
  unpublishedOutboxFailed: number;
  staleGeneratingReset: number;
  staleGeneratingResetFailed: number;
  failedArtifactsRequeued: number;
  failedArtifactsRequeuedFailed: number;
  totalDurationMs: number;
}

// ---------------------------------------------------------------------------
// Repair steps
// ---------------------------------------------------------------------------

/**
 * Step 1: Find unpublished outbox rows and re-publish them to Service Bus.
 * These rows exist when the initial publish call failed after the DB commit.
 */
async function repairUnpublishedOutboxRows(
  queueRepo: DrizzleCertificateQueueRepository,
): Promise<Pick<RepairMetrics, "unpublishedOutboxFound" | "unpublishedOutboxPublished" | "unpublishedOutboxFailed">> {
  const metrics = { unpublishedOutboxFound: 0, unpublishedOutboxPublished: 0, unpublishedOutboxFailed: 0 };

  const rows = await queueRepo.findUnpublished(UNPUBLISHED_OUTBOX_AGE_MS, BATCH_SIZE);
  metrics.unpublishedOutboxFound = rows.length;

  if (!rows.length) return metrics;

  console.info(`[CertificateRepairJob] Found ${rows.length} unpublished outbox rows`);

  // Publish each row via the queue port
  const { AzureServiceBusCertificateQueueAdapter } = await import(
    "@/domain/certificates/infrastructure/azure/azure-service-bus-certificate-queue.adapter"
  );
  const queuePort = new AzureServiceBusCertificateQueueAdapter();

  for (const row of rows) {
    try {
      // Fetch the actual certificate number
      const [cert] = await db
        .select({ certificateNumber: dbCanonicalCertificates.certificateNumber })
        .from(dbCanonicalCertificates)
        .where(eq(dbCanonicalCertificates.id, row.certificateId))
        .limit(1);

      const certificateNumber = cert?.certificateNumber ?? "unknown";

      // Re-publish the message — Azure Service Bus duplicate detection
      // prevents double-processing if the message was already delivered.
      await queuePort.publish({
        messageId: row.messageId,
        body: {
          schemaVersion: 1,
          artifactId: row.artifactId,
          certificateId: row.certificateId,
          certificateNumber,
          artifactType: "pdf" as const,
          templateVersion: "scholarx-v1",
          requestedAt: new Date().toISOString(),
        },
      });

      await queueRepo.markPublished({
        outboxId: row.id,
        publishedAt: new Date(),
      });

      metrics.unpublishedOutboxPublished++;
    } catch (error) {
      metrics.unpublishedOutboxFailed++;
      console.error("[CertificateRepairJob] Failed to re-publish outbox row", {
        outboxId: row.id,
        messageId: row.messageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return metrics;
}

/**
 * Step 2: Reset artifacts stuck in 'generating' for longer than the lock timeout.
 * The worker must have crashed without completing or abandoning the message.
 * Resetting back to 'pending' allows the repair job or next Service Bus delivery
 * to re-claim the artifact.
 */
async function resetStaleGeneratingArtifacts(): Promise<
  Pick<RepairMetrics, "staleGeneratingReset" | "staleGeneratingResetFailed">
> {
  const metrics = { staleGeneratingReset: 0, staleGeneratingResetFailed: 0 };

  try {
    const cutoff = new Date(Date.now() - GENERATING_ARTIFACT_STALE_MS);

    const result = await db
      .update(dbCertificateArtifacts)
      .set({
        status: "pending",
        errorCode: "WORKER_LOCK_TIMEOUT",
        errorMessage: "Worker lock timed out; reset to pending for retry",
        nextAttemptAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dbCertificateArtifacts.status, "generating"),
          lt(dbCertificateArtifacts.updatedAt, cutoff),
        ),
      )
      .returning({ id: dbCertificateArtifacts.id });

    metrics.staleGeneratingReset = result.length;

    if (result.length) {
      console.info(
        `[CertificateRepairJob] Reset ${result.length} stale generating artifacts`,
      );
    }
  } catch (error) {
    metrics.staleGeneratingResetFailed = 1;
    console.error("[CertificateRepairJob] Failed to reset stale generating artifacts", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return metrics;
}

/**
 * Step 3: Re-enqueue retryable failed artifacts that have passed their next_attempt_at.
 * These are artifacts the worker marked as 'failed' with a backoff schedule.
 */
async function requeueRetryableFailedArtifacts(): Promise<
  Pick<RepairMetrics, "failedArtifactsRequeued" | "failedArtifactsRequeuedFailed">
> {
  const metrics = { failedArtifactsRequeued: 0, failedArtifactsRequeuedFailed: 0 };

  const now = new Date();
  const stalePendingCutoff = new Date(Date.now() - PENDING_ARTIFACT_STALE_MS);

  // Find failed or stale-pending artifacts eligible for retry
  const rows = await db
    .select({
      id: dbCertificateArtifacts.id,
      certificateId: dbCertificateArtifacts.certificateId,
      certificateNumber: dbCanonicalCertificates.certificateNumber,
      artifactType: dbCertificateArtifacts.artifactType,
      templateVersion: dbCertificateArtifacts.templateVersion,
      attempts: dbCertificateArtifacts.attempts,
      nextAttemptAt: dbCertificateArtifacts.nextAttemptAt,
    })
    .from(dbCertificateArtifacts)
    .innerJoin(
      dbCanonicalCertificates,
      eq(dbCertificateArtifacts.certificateId, dbCanonicalCertificates.id),
    )
    .where(
      and(
        or(
          // Retryable failed artifacts past their backoff window
          and(
            eq(dbCertificateArtifacts.status, "failed"),
            lt(dbCertificateArtifacts.attempts, MAX_ARTIFACT_ATTEMPTS),
            or(
              isNull(dbCertificateArtifacts.nextAttemptAt),
              lte(dbCertificateArtifacts.nextAttemptAt, now),
            ),
          ),
          // Stale pending artifacts with no recent update (fallback for lost outbox)
          and(
            eq(dbCertificateArtifacts.status, "pending"),
            lt(dbCertificateArtifacts.updatedAt, stalePendingCutoff),
          ),
        ),
      ),
    )
    .limit(BATCH_SIZE);

  if (!rows.length) return metrics;

  console.info(`[CertificateRepairJob] Re-queuing ${rows.length} retryable artifacts`);

  const { AzureServiceBusCertificateQueueAdapter } = await import(
    "@/domain/certificates/infrastructure/azure/azure-service-bus-certificate-queue.adapter"
  );
  const queuePort = new AzureServiceBusCertificateQueueAdapter();

  for (const row of rows) {
    try {
      const messageId = `${row.id}:${row.artifactType}:${row.templateVersion}:retry-${row.attempts}`;

      await queuePort.publish({
        messageId,
        body: {
          schemaVersion: 1,
          artifactId: row.id,
          certificateId: row.certificateId,
          certificateNumber: row.certificateNumber,
          artifactType: row.artifactType as "pdf",
          templateVersion: row.templateVersion,
          requestedAt: new Date().toISOString(),
        },
      });

      metrics.failedArtifactsRequeued++;
    } catch (error) {
      metrics.failedArtifactsRequeuedFailed++;
      console.error("[CertificateRepairJob] Failed to re-queue artifact", {
        artifactId: row.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return metrics;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function runRepairJob(): Promise<void> {
  const startedAt = Date.now();
  console.info("[CertificateRepairJob] Starting repair pass");

  const queueRepo = new DrizzleCertificateQueueRepository();

  const [outboxMetrics, staleMetrics, retryMetrics] = await Promise.all([
    repairUnpublishedOutboxRows(queueRepo),
    resetStaleGeneratingArtifacts(),
    requeueRetryableFailedArtifacts(),
  ]);

  const metrics: RepairMetrics = {
    ...outboxMetrics,
    ...staleMetrics,
    ...retryMetrics,
    totalDurationMs: Date.now() - startedAt,
  };

  console.info("[CertificateRepairJob] Repair pass complete", metrics);
}

// Run immediately if called directly
runRepairJob().catch((error) => {
  console.error("[CertificateRepairJob] Fatal error:", error);
  process.exit(1);
});

export { runRepairJob };
