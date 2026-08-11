import { invalidatePublicCourseListCache } from "../src/domain/courses/application/course-cache";
import { invalidateCourseMetricsCache } from "../src/domain/courses/application/course-cache";
import { db } from "../src/db";
import { dbCourses } from "../src/db/schema/courses-db.schema";

async function main() {
  console.log("Invalidating course catalog cache...");
  await invalidatePublicCourseListCache();
  
  const courses = await db.select({ id: dbCourses.id }).from(dbCourses);
  for (const course of courses) {
    await invalidateCourseMetricsCache(course.id);
  }
  
  console.log("Done invalidating cache.");
  process.exit(0);
}

main().catch(console.error);
