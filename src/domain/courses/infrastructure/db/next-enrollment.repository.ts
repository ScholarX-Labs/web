import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { dbSubscriptions } from "@/db/schema/courses-db.schema";
import type { IEnrollmentReadRepository } from "@/domain/courses/contracts/enrollment.repository";

export class NextEnrollmentRepository implements IEnrollmentReadRepository {
  async findActiveSubscription(userId: string, courseId: string) {
    const rows = await db
      .select({
        id: dbSubscriptions.id,
        userId: dbSubscriptions.userId,
        courseId: dbSubscriptions.courseId,
      })
      .from(dbSubscriptions)
      .where(
        and(
          eq(sql`${dbSubscriptions.userId}::text`, userId),
          eq(sql`${dbSubscriptions.courseId}::text`, courseId),
          eq(dbSubscriptions.isActive, true),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }
}
