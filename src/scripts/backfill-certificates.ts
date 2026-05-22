/**
 * Certificate Backfill Script
 *
 * Phase 3 migration: copies rows from `courses.certificates` into
 * `certificates.certificates`, preserving all certificate numbers,
 * issued timestamps, and metadata.
 *
 * Safety:
 * - Dry-run mode by default — set DRY_RUN=false to write.
 * - Idempotent — skips rows already in the canonical table.
 * - Records a `certificate.migrated` event for each backfilled row.
 * - Never generates PDFs during backfill.
 *
 * Run (dry run):
 *   node --import tsx src/scripts/backfill-certificates.ts
 *
 * Run (write):
 *   DRY_RUN=false node --import tsx src/scripts/backfill-certificates.ts
 *
 * Phase 5 — Drop legacy table — must NOT be run until:
 *   1. Backfill row count matches source.
 *   2. Public certificate pages verified against canonical records.
 *   3. No application code imports courses.certificates.
 *   4. Rollback window has passed.
 */

import "dotenv/config";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { dbCertificates } from "@/db/schema/courses-db.schema";
import {
  dbCanonicalCertificates,
  dbCertificateArtifacts,
  dbCertificateArtifactQueue,
  dbCertificateEvents,
} from "@/db/schema/certificates-db.schema";
import { generateCertificateNumber } from "@/domain/certificates/domain/certificate-number";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DRY_RUN = process.env.DRY_RUN !== "false";
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? "100", 10);
const CURRENT_TEMPLATE_VERSION = "scholarx-v1" as const;

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

interface BackfillMetrics {
  sourceRowsFound: number;
  skipped: number;
  inserted: number;
  failed: number;
  artifactsCreated: number;
  eventsWritten: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Step 1: Inventory
// ---------------------------------------------------------------------------

async function inventory() {
  const sourceRows = await db
    .select({
      id: dbCertificates.id,
      certificateNumber: dbCertificates.certificateNumber,
      userId: dbCertificates.userId,
      courseId: dbCertificates.courseId,
      courseProgressId: dbCertificates.courseProgressId,
      issuedAt: dbCertificates.issuedAt,
      revokedAt: dbCertificates.revokedAt,
      revocationReason: dbCertificates.revocationReason,
      metadata: dbCertificates.metadata,
    })
    .from(dbCertificates)
    .orderBy(dbCertificates.issuedAt);

  const canonicalRows = await db
    .select({ certificateNumber: dbCanonicalCertificates.certificateNumber })
    .from(dbCanonicalCertificates)
    .where(
      and(
        isNull(dbCanonicalCertificates.revokedAt),
      ),
    );

  const existingNumbers = new Set(canonicalRows.map((r) => r.certificateNumber));

  console.info("[BackfillCertificates] Inventory:", {
    sourceRows: sourceRows.length,
    canonicalRowsExisting: canonicalRows.length,
    dryRun: DRY_RUN,
  });

  return { sourceRows, existingNumbers };
}

// ---------------------------------------------------------------------------
// Step 2: Process rows
// ---------------------------------------------------------------------------

async function backfillRow(
  row: {
    id: string;
    certificateNumber: string;
    userId: string;
    courseId: string;
    courseProgressId: string;
    issuedAt: Date;
    revokedAt: Date | null;
    revocationReason: string | null;
    metadata: {
      learnerDisplayName: string;
      courseTitle: string;
      completionDate: string;
      completionSource: string;
      ruleVersion: string;
      requiredLessonCount: number;
      certificateTemplateVersion: string;
    };
  },
  existingNumbers: Set<string>,
  metrics: BackfillMetrics,
) {
  // Idempotency — skip if already in canonical table
  if (existingNumbers.has(row.certificateNumber)) {
    metrics.skipped++;
    console.debug("[BackfillCertificates] Skipping (already migrated):", row.certificateNumber);
    return;
  }

  if (DRY_RUN) {
    console.info("[DRY RUN] Would migrate:", {
      legacyId: row.id,
      certificateNumber: row.certificateNumber,
      userId: row.userId,
      courseId: row.courseId,
      issuedAt: row.issuedAt.toISOString(),
    });
    metrics.inserted++;
    return;
  }

  try {
    // Insert canonical certificate, preserving the original certificate number
    const canonicalCert = await db
      .insert(dbCanonicalCertificates)
      .values({
        certificateNumber: row.certificateNumber,
        shortId: row.certificateNumber, // keep as legacy alias
        userId: row.userId,
        recipientName: row.metadata.learnerDisplayName ?? "Unknown",
        sourceType: "course_completion",
        sourceId: row.courseProgressId,
        courseId: row.courseId,
        courseProgressId: row.courseProgressId,
        programName: row.metadata.courseTitle ?? "Unknown Course",
        completionDate: new Date(row.metadata.completionDate ?? row.issuedAt),
        status: row.revokedAt ? "revoked" : "issued",
        issuedAt: row.issuedAt,
        revokedAt: row.revokedAt ?? undefined,
        revokedReason: row.revocationReason ?? undefined,
        ruleVersion: row.metadata.ruleVersion ?? "course_completion_v1",
        completionSource: (row.metadata.completionSource === "backfill_approximate"
          ? "backfill_approximate"
          : "legacy_migration") as "legacy_migration" | "backfill_approximate",
        isPublic: true,
        metadata: {
          legacyId: row.id,
          legacyTable: "courses.certificates",
          courseId: row.courseId,
          requiredLessonCount: row.metadata.requiredLessonCount,
          certificateTemplateVersion: CURRENT_TEMPLATE_VERSION,
          migratedAt: new Date().toISOString(),
        },
      })
      .returning();

    const cert = canonicalCert[0];
    if (!cert) throw new Error("Failed to insert canonical certificate");

    metrics.inserted++;

    // Create a pending PDF artifact (do NOT enqueue — batch admin action needed)
    if (!row.revokedAt) {
      await db.insert(dbCertificateArtifacts).values({
        certificateId: cert.id,
        artifactType: "pdf",
        templateVersion: CURRENT_TEMPLATE_VERSION,
        status: "pending",
        storageProvider: "azure_blob",
        attempts: 0,
      }).onConflictDoNothing();

      metrics.artifactsCreated++;
    }

    // Record migration event
    await db.insert(dbCertificateEvents).values({
      certificateId: cert.id,
      eventType: "certificate.migrated",
      actorId: "system:backfill",
      actorRole: "system",
      metadata: {
        legacyId: row.id,
        legacyTable: "courses.certificates",
        legacyCertificateNumber: row.certificateNumber,
        migratedAt: new Date().toISOString(),
      },
    });

    metrics.eventsWritten++;
    existingNumbers.add(row.certificateNumber); // Track for this run
  } catch (error) {
    metrics.failed++;
    console.error("[BackfillCertificates] Failed to migrate row:", {
      legacyId: row.id,
      certificateNumber: row.certificateNumber,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startedAt = Date.now();

  console.info("[BackfillCertificates] Starting backfill", {
    dryRun: DRY_RUN,
    batchSize: BATCH_SIZE,
  });

  const { sourceRows, existingNumbers } = await inventory();

  const metrics: BackfillMetrics = {
    sourceRowsFound: sourceRows.length,
    skipped: 0,
    inserted: 0,
    failed: 0,
    artifactsCreated: 0,
    eventsWritten: 0,
    durationMs: 0,
  };

  // Process in batches
  for (let i = 0; i < sourceRows.length; i += BATCH_SIZE) {
    const batch = sourceRows.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((row) => backfillRow(row as Parameters<typeof backfillRow>[0], existingNumbers, metrics)),
    );

    console.info(`[BackfillCertificates] Progress: ${Math.min(i + BATCH_SIZE, sourceRows.length)}/${sourceRows.length}`);
  }

  metrics.durationMs = Date.now() - startedAt;

  console.info("[BackfillCertificates] Backfill complete", metrics);

  if (DRY_RUN) {
    console.info("[BackfillCertificates] DRY RUN complete — no rows were written.");
    console.info("To apply changes, set DRY_RUN=false and re-run.");
  } else if (metrics.failed > 0) {
    console.warn(
      `[BackfillCertificates] ${metrics.failed} rows failed — check logs above.`,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[BackfillCertificates] Fatal error:", error);
  process.exit(1);
});
