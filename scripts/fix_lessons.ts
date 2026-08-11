import { db } from "@/db";
import { dbCourses } from "@/db/schema/courses-db.schema";
import { dbLessons } from "@/db/schema/admin-db.schema";
import { eq, and, count } from "drizzle-orm";
import {
  invalidateCourseMetricsCache,
  invalidatePublicCourseDetailCache,
  invalidatePublicCourseListCache
} from "@/domain/courses/application/course-cache";

async function main() {
  console.log("Starting lessons count sync for all courses...");

  const courses = await db.select({ id: dbCourses.id, title: dbCourses.title, slug: dbCourses.slug }).from(dbCourses);

  let updatedCount = 0;

  for (const course of courses) {
    const [result] = await db
      .select({ accurateCount: count() })
      .from(dbLessons)
      .where(
        and(
          eq(dbLessons.courseId, course.id),
          eq(dbLessons.isArchived, false)
        )
      );

    const accurateCount = result?.accurateCount ?? 0;

    await db
      .update(dbCourses)
      .set({ lessonsCount: accurateCount, updatedAt: new Date() })
      .where(eq(dbCourses.id, course.id));

    console.log(`Course [${course.title}]: set lessons_count to ${accurateCount}`);
    
    // Invalidate caches just in case
    await Promise.all([
      invalidatePublicCourseListCache(),
      invalidatePublicCourseDetailCache({ courseId: course.id, slug: course.slug }),
      invalidateCourseMetricsCache(course.id)
    ]);
    updatedCount++;
  }

  console.log(`Finished sync. Updated ${updatedCount} courses.`);
  process.exit(0);
}

main().catch(console.error);
