import { and, eq, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCertificateArtifacts,
  type ArtifactType,
  type ArtifactStatus,
  type StorageProvider,
} from "@/db/schema/certificates-db.schema";
import type {
  ICertificateArtifactRepository,
  CertificateArtifactRecord,
  ArtifactKey,
  CreateArtifactInput,
  MarkGeneratingInput,
  MarkReadyInput,
  MarkFailedInput,
} from "../../contracts/certificate-artifact.repository";

// ---------------------------------------------------------------------------
// Row → application record mapper
// ---------------------------------------------------------------------------

function mapRow(
  row: typeof dbCertificateArtifacts.$inferSelect,
): CertificateArtifactRecord {
  return {
    id: row.id,
    certificateId: row.certificateId,
    artifactType: row.artifactType as ArtifactType,
    templateVersion: row.templateVersion,
    status: row.status as ArtifactStatus,
    storageProvider: row.storageProvider as StorageProvider,
    storageContainer: row.storageContainer,
    storageKey: row.storageKey,
    contentType: row.contentType,
    byteSize: row.byteSize,
    checksumSha256: row.checksumSha256,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    attempts: row.attempts,
    nextAttemptAt: row.nextAttemptAt?.toISOString() ?? null,
    generatedAt: row.generatedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

export class DrizzleCertificateArtifactRepository
  implements ICertificateArtifactRepository
{
  async findRequiredArtifact(
    key: ArtifactKey,
  ): Promise<CertificateArtifactRecord | null> {
    const rows = await db
      .select()
      .from(dbCertificateArtifacts)
      .where(
        and(
          eq(dbCertificateArtifacts.certificateId, key.certificateId),
          eq(dbCertificateArtifacts.artifactType, key.artifactType),
          eq(dbCertificateArtifacts.templateVersion, key.templateVersion),
        ),
      )
      .limit(1);

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async createPending(
    input: CreateArtifactInput,
  ): Promise<CertificateArtifactRecord> {
    const rows = await db
      .insert(dbCertificateArtifacts)
      .values({
        certificateId: input.certificateId,
        artifactType: input.artifactType,
        templateVersion: input.templateVersion,
        storageProvider: input.storageProvider ?? "azure_blob",
        status: "pending",
        attempts: 0,
      })
      .onConflictDoNothing() // idempotent — return existing if already created
      .returning();

    // If conflict, return existing row
    if (!rows[0]) {
      const existing = await this.findRequiredArtifact({
        certificateId: input.certificateId,
        artifactType: input.artifactType,
        templateVersion: input.templateVersion,
      });
      if (existing) return existing;
      throw new Error("Failed to create artifact and could not find existing");
    }

    return mapRow(rows[0]);
  }

  /**
   * Atomically claim the artifact for generation.
   *
   * Uses a conditional UPDATE with RETURNING to ensure exactly one worker
   * claims the row. Returns null if:
   * - The artifact is already 'ready'
   * - Another worker has already claimed it (status is 'generating')
   * - next_attempt_at is in the future
   */
  async markGenerating(
    input: MarkGeneratingInput,
  ): Promise<CertificateArtifactRecord | null> {
    const now = new Date();
    const rows = await db
      .update(dbCertificateArtifacts)
      .set({
        status: "generating",
        attempts: sql`"attempts" + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(dbCertificateArtifacts.id, input.artifactId),
          or(
            eq(dbCertificateArtifacts.status, "pending"),
            eq(dbCertificateArtifacts.status, "failed"),
          ),
          or(
            sql`${dbCertificateArtifacts.nextAttemptAt} is null`,
            lte(dbCertificateArtifacts.nextAttemptAt, now),
          ),
        ),
      )
      .returning();

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async markReady(input: MarkReadyInput): Promise<void> {
    const now = new Date();
    await db
      .update(dbCertificateArtifacts)
      .set({
        status: "ready",
        storageContainer: input.storageContainer,
        storageKey: input.storageKey,
        contentType: input.contentType,
        byteSize: input.byteSize,
        checksumSha256: input.checksumSha256,
        generatedAt: input.generatedAt,
        errorCode: null,
        errorMessage: null,
        nextAttemptAt: null,
        updatedAt: now,
      })
      .where(eq(dbCertificateArtifacts.id, input.artifactId));
  }

  async markFailed(input: MarkFailedInput): Promise<void> {
    const now = new Date();
    await db
      .update(dbCertificateArtifacts)
      .set({
        status: "failed",
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        nextAttemptAt: input.nextAttemptAt ?? null,
        updatedAt: now,
      })
      .where(eq(dbCertificateArtifacts.id, input.artifactId));
  }
}
