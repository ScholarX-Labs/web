import { db } from "@/db";
import { dbCourses, dbSubscriptions } from "@/db/schema/courses-db.schema";
import { eq, and, count } from "drizzle-orm";
import {
  invalidateCourseMetricsCache,
  invalidatePublicCourseDetailCache,
  invalidatePublicCourseListCache
} from "@/domain/courses/application/course-cache";
import { invalidateEnrollmentCache } from "@/domain/admin/application/admin-cache";

async function main() {
  console.log("Starting students count sync for all courses...");

  const courses = await db.select({ id: dbCourses.id, title: dbCourses.title, slug: dbCourses.slug }).from(dbCourses);

  let updatedCount = 0;

  for (const course of courses) {
    const [result] = await db
      .select({ accurateCount: count() })
      .from(dbSubscriptions)
      .where(
        and(
          eq(dbSubscriptions.courseId, course.id),
          eq(dbSubscriptions.isActive, true)
        )
      );

    const accurateCount = result?.accurateCount ?? 0;

    await db
      .update(dbCourses)
      .set({ studentsCount: accurateCount, updatedAt: new Date() })
      .where(eq(dbCourses.id, course.id));

    console.log(`Course [${course.title}]: set students_count to ${accurateCount}`);
    
    await Promise.all([
      invalidatePublicCourseListCache(),
      invalidatePublicCourseDetailCache({ courseId: course.id, slug: course.slug }),
      invalidateCourseMetricsCache(course.id),
      invalidateEnrollmentCache(course.id)
    ]);
    updatedCount++;
  }

  console.log(`Finished sync. Updated ${updatedCount} courses.`);
  process.exit(0);
}

main().catch(console.error);
