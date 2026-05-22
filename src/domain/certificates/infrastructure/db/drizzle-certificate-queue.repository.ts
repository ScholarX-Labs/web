import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCertificateArtifactQueue,
  type OutboxStatus,
} from "@/db/schema/certificates-db.schema";
import type {
  ICertificateQueueRepository,
  CertificateQueueOutboxRecord,
  CreateOutboxRowInput,
  MarkOutboxPublishedInput,
  UnpublishedOutboxRow,
} from "../../contracts/certificate-queue.repository";

function mapRow(
  row: typeof dbCertificateArtifactQueue.$inferSelect,
): CertificateQueueOutboxRecord {
  return {
    id: row.id,
    artifactId: row.artifactId,
    certificateId: row.certificateId,
    messageId: row.messageId,
    queueName: row.queueName,
    status: row.status as OutboxStatus,
    attempts: row.attempts,
    lastError: row.lastError,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    nextAttemptAt: row.nextAttemptAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class DrizzleCertificateQueueRepository
  implements ICertificateQueueRepository
{
  async createOutboxRow(
    input: CreateOutboxRowInput,
  ): Promise<CertificateQueueOutboxRecord> {
    const rows = await db
      .insert(dbCertificateArtifactQueue)
      .values({
        artifactId: input.artifactId,
        certificateId: input.certificateId,
        messageId: input.messageId,
        queueName: input.queueName ?? "certificate-artifact-generation",
        status: "pending",
        attempts: 0,
      })
      .onConflictDoNothing() // idempotent on message_id
      .returning();

    if (!rows[0]) {
      // Conflict — return existing row
      const existing = await db
        .select()
        .from(dbCertificateArtifactQueue)
        .where(eq(dbCertificateArtifactQueue.messageId, input.messageId))
        .limit(1);
      if (existing[0]) return mapRow(existing[0]);
      throw new Error("Failed to create outbox row");
    }

    return mapRow(rows[0]);
  }

  async markPublished(
    input: MarkOutboxPublishedInput,
  ): Promise<void> {
    await db
      .update(dbCertificateArtifactQueue)
      .set({
        status: "published",
        publishedAt: input.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(dbCertificateArtifactQueue.id, input.outboxId));
  }

  async findUnpublished(
    olderThanMs: number,
    limit: number,
  ): Promise<UnpublishedOutboxRow[]> {
    const cutoff = new Date(Date.now() - olderThanMs);
    const rows = await db
      .select({
        id: dbCertificateArtifactQueue.id,
        artifactId: dbCertificateArtifactQueue.artifactId,
        certificateId: dbCertificateArtifactQueue.certificateId,
        messageId: dbCertificateArtifactQueue.messageId,
      })
      .from(dbCertificateArtifactQueue)
      .where(
        and(
          eq(dbCertificateArtifactQueue.status, "pending"),
          isNull(dbCertificateArtifactQueue.publishedAt),
          lt(dbCertificateArtifactQueue.createdAt, cutoff),
        ),
      )
      .orderBy(dbCertificateArtifactQueue.createdAt)
      .limit(limit);

    return rows;
  }
}
