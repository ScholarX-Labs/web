import { db } from "../src/db";
import { dbCourses, dbSubscriptions } from "../src/db/schema/courses-db.schema";
import { count, eq, and } from "drizzle-orm";

async function main() {
  const courses = await db.select({
    id: dbCourses.id,
    title: dbCourses.title,
    studentsCount: dbCourses.studentsCount
  }).from(dbCourses);

  for (const course of courses) {
    const [result] = await db
      .select({ count: count() })
      .from(dbSubscriptions)
      .where(
        and(
          eq(dbSubscriptions.courseId, course.id),
          eq(dbSubscriptions.isActive, true)
        )
      );
    const actualCount = result?.count ?? 0;
    
    if (course.studentsCount !== actualCount) {
      console.log(`Fixing Course: ${course.title}`);
      console.log(`  - changing from ${course.studentsCount} to ${actualCount}`);
      await db.update(dbCourses)
        .set({ studentsCount: actualCount })
        .where(eq(dbCourses.id, course.id));
    }
  }
  
  console.log("Sync complete!");
  process.exit(0);
}

main().catch(console.error);
