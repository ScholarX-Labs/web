import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { dbCertificates } from "@/db/schema/courses-db.schema";
import type { ICertificateRepository } from "@/domain/courses/contracts/certificate.repository";
import type {
  CertificateMetadata,
  CertificateRecord,
} from "@/domain/courses/contracts/course-progress.types";
import { dateToIsoOrNull } from "@/domain/courses/application/course-progress.mapper";

const mapCertificate = (
  row: typeof dbCertificates.$inferSelect,
): CertificateRecord => ({
  id: row.id,
  certificateNumber: row.certificateNumber,
  userId: row.userId,
  courseId: row.courseId,
  courseProgressId: row.courseProgressId,
  issuedAt: dateToIsoOrNull(row.issuedAt) ?? new Date().toISOString(),
  revokedAt: dateToIsoOrNull(row.revokedAt),
  revocationReason: row.revocationReason,
  metadata: row.metadata as CertificateMetadata,
});

export class NextCertificateRepository implements ICertificateRepository {
  async findCertificateByUserCourse(userId: string, courseId: string) {
    const rows = await db
      .select()
      .from(dbCertificates)
      .where(
        and(
          eq(dbCertificates.userId, userId),
          eq(dbCertificates.courseId, courseId),
        ),
      )
      .limit(1);

    return rows[0] ? mapCertificate(rows[0]) : null;
  }

  async findCertificateByNumber(certificateNumber: string) {
    const rows = await db
      .select()
      .from(dbCertificates)
      .where(eq(dbCertificates.certificateNumber, certificateNumber))
      .limit(1);

    return rows[0] ? mapCertificate(rows[0]) : null;
  }

  async createCertificate(params: {
    certificateNumber: string;
    userId: string;
    courseId: string;
    courseProgressId: string;
    metadata: CertificateMetadata;
  }) {
    const rows = await db
      .insert(dbCertificates)
      .values({
        certificateNumber: params.certificateNumber,
        userId: params.userId,
        courseId: params.courseId,
        courseProgressId: params.courseProgressId,
        metadata: params.metadata,
      })
      .returning();

    const row = rows[0];
    if (!row) throw new Error("Failed to create certificate");
    return mapCertificate(row);
  }
}
