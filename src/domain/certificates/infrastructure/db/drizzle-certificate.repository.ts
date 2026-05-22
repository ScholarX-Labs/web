import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCanonicalCertificates,
  type CertificateSourceType,
  type CompletionSource,
} from "@/db/schema/certificates-db.schema";
import type {
  ICertificateRepository,
  CertificateRecord,
  CertificateSourceKey,
  CreateCertificateInput,
  RevokeCertificateInput,
} from "../../contracts/certificate.repository";

// ---------------------------------------------------------------------------
// Row → application record mapper
// ---------------------------------------------------------------------------

function mapRow(
  row: typeof dbCanonicalCertificates.$inferSelect,
): CertificateRecord {
  return {
    id: row.id,
    certificateNumber: row.certificateNumber,
    shortId: row.shortId,
    userId: row.userId,
    recipientName: row.recipientName,
    recipientEmail: row.recipientEmail,
    sourceType: row.sourceType as CertificateSourceType,
    sourceId: row.sourceId,
    courseId: row.courseId,
    courseProgressId: row.courseProgressId,
    programName: row.programName,
    completionDate: row.completionDate.toISOString(),
    status: row.status as "pending" | "issued" | "claimed" | "revoked",
    issuedAt: row.issuedAt.toISOString(),
    claimedAt: row.claimedAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    revokedReason: row.revokedReason,
    isPublic: row.isPublic,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    ruleVersion: row.ruleVersion,
    completionSource: row.completionSource as CompletionSource,
  };
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

export class DrizzleCertificateRepository implements ICertificateRepository {
  async findByPublicNumber(
    certificateNumber: string,
  ): Promise<CertificateRecord | null> {
    const rows = await db
      .select()
      .from(dbCanonicalCertificates)
      .where(
        eq(dbCanonicalCertificates.certificateNumber, certificateNumber),
      )
      .limit(1);

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findBySource(
    key: CertificateSourceKey,
  ): Promise<CertificateRecord | null> {
    const rows = await db
      .select()
      .from(dbCanonicalCertificates)
      .where(
        and(
          eq(dbCanonicalCertificates.userId, key.userId),
          eq(dbCanonicalCertificates.sourceType, key.sourceType),
          eq(dbCanonicalCertificates.sourceId, key.sourceId),
          isNull(dbCanonicalCertificates.revokedAt),
        ),
      )
      .limit(1);

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async createIssued(
    input: CreateCertificateInput,
  ): Promise<CertificateRecord> {
    const rows = await db
      .insert(dbCanonicalCertificates)
      .values({
        certificateNumber: input.certificateNumber,
        userId: input.userId,
        recipientName: input.recipientName,
        recipientEmail: input.recipientEmail,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        courseId: input.courseId,
        courseProgressId: input.courseProgressId,
        programName: input.programName,
        completionDate: input.completionDate,
        ruleVersion: input.ruleVersion,
        completionSource: input.completionSource,
        metadata: input.metadata ?? {},
        status: "issued",
        isPublic: true,
      })
      .returning();

    const row = rows[0];
    if (!row) throw new Error("Failed to create canonical certificate");
    return mapRow(row);
  }

  async markRevoked(
    input: RevokeCertificateInput,
  ): Promise<CertificateRecord> {
    const now = new Date();
    const rows = await db
      .update(dbCanonicalCertificates)
      .set({
        status: "revoked",
        revokedAt: now,
        revokedReason: input.reason ?? null,
        revokedBy: input.revokedBy,
        updatedAt: now,
      })
      .where(eq(dbCanonicalCertificates.id, input.certificateId))
      .returning();

    const row = rows[0];
    if (!row) throw new Error(`Certificate ${input.certificateId} not found`);
    return mapRow(row);
  }
}
