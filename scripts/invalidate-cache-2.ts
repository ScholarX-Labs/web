import {
  invalidatePublicCourseListCache,
  invalidateCourseMetricsCache,
  invalidatePublicCourseDetailCache,
} from "../src/domain/courses/application/course-cache";
import { db } from "../src/db";
import { dbCourses } from "../src/db/schema/courses-db.schema";

async function main() {
  console.log("Invalidating course catalog cache...");
  await invalidatePublicCourseListCache();
  
  const courses = await db.select({ id: dbCourses.id, slug: dbCourses.slug }).from(dbCourses);
  for (const course of courses) {
    await invalidateCourseMetricsCache(course.id);
    await invalidatePublicCourseDetailCache({ courseId: course.id, slug: course.slug });
  }
  
  console.log("Done invalidating cache.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
