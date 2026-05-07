import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCourseCompletions,
  dbCourses,
  dbUsers,
} from "@/domain/courses/infrastructure/db/courses-db.schema";

export type CertificateUserRow = Awaited<
  ReturnType<NextCertificatesRepository["findByUser"]>
>[number];

export type CertificateVerificationRow = NonNullable<
  Awaited<ReturnType<NextCertificatesRepository["findByCertificateId"]>>
>;

export class NextCertificatesRepository {
  /**
   * All completions for a user, newest first.
   * Joins dbCourses + dbUsers so the service gets full data in one query.
   */
  async findByUser(userId: string) {
    return db
      .select({
        completion: dbCourseCompletions,
        courseTitle: dbCourses.title,
        courseImageUrl: dbCourses.imageUrl,
        studentName: dbUsers.name,
      })
      .from(dbCourseCompletions)
      .innerJoin(dbCourses, eq(dbCourseCompletions.courseId, dbCourses.id))
      .innerJoin(dbUsers, eq(dbCourseCompletions.userId, dbUsers.id))
      .where(eq(dbCourseCompletions.userId, userId))
      .orderBy(desc(dbCourseCompletions.completedAt));
  }

  /**
   * Single completion by certificateId — used for public verification.
   * No auth required; certificateId is the only lookup key.
   */
  async findByCertificateId(certificateId: string) {
    const rows = await db
      .select({
        completion: dbCourseCompletions,
        courseTitle: dbCourses.title,
        studentName: dbUsers.name,
      })
      .from(dbCourseCompletions)
      .innerJoin(dbCourses, eq(dbCourseCompletions.courseId, dbCourses.id))
      .innerJoin(dbUsers, eq(dbCourseCompletions.userId, dbUsers.id))
      .where(eq(dbCourseCompletions.certificateId, certificateId.toUpperCase()))
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * Single completion by userId + courseId — used by the PDF download route.
   * Validates ownership: the authenticated user must own this certificate.
   */
  async findByUserAndCourse(userId: string, courseId: string) {
    const rows = await db
      .select({
        completion: dbCourseCompletions,
        courseTitle: dbCourses.title,
        studentName: dbUsers.name,
      })
      .from(dbCourseCompletions)
      .innerJoin(dbCourses, eq(dbCourseCompletions.courseId, dbCourses.id))
      .innerJoin(dbUsers, eq(dbCourseCompletions.userId, dbUsers.id))
      .where(
        and(
          eq(dbCourseCompletions.userId, userId),
          eq(dbCourseCompletions.courseId, courseId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async upsertCompletion(data: {
    userId: string;
    courseId: string;
    completedLessons: number;
    completionPercentage: number;
  }): Promise<string> {
    const rows = await db
      .insert(dbCourseCompletions)
      .values({
        ...data,
        certificateId: sql<string>`'CERT-' || upper(gen_random_uuid()::text)`,
        completedAt: new Date(),
      })
      .onConflictDoUpdate({
        // Unique constraint: one completion per (userId, courseId)
        target: [dbCourseCompletions.userId, dbCourseCompletions.courseId],
        set: {
          completedLessons: data.completedLessons,
          completionPercentage: data.completionPercentage,
          // certificateId is NOT updated — once issued, it never changes
        },
      })
      .returning({ certificateId: dbCourseCompletions.certificateId });

    const certificateId = rows[0]?.certificateId;
    if (!certificateId) {
      throw new Error("Failed to persist course completion certificate ID");
    }

    return certificateId;
  }
}
