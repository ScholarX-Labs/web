import { db } from "../src/db";
import { dbCourses } from "../src/db/schema/courses-db.schema";
import { dbLessons } from "../src/db/schema/admin-db.schema";
import { eq } from "drizzle-orm";

const YOUTUBE_URLS: { url: string; duration: number }[] = [
  { url: "https://www.youtube.com/watch?v=jNQXAC9IVRw", duration: 18 },
  { url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", duration: 596 },
  { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 212 },
];

async function main() {
  console.log("Fetching courses...");
  const courses = await db
    .select({ id: dbCourses.id, title: dbCourses.title })
    .from(dbCourses)
    .where(eq(dbCourses.status, "active"));

  console.log(`Found ${courses.length} active courses\n`);

  for (const course of courses) {
    const existingLessons = await db
      .select({ id: dbLessons.id, title: dbLessons.title, videoUrl: dbLessons.videoUrl, sortIndex: dbLessons.sortIndex })
      .from(dbLessons)
      .where(eq(dbLessons.courseId, course.id))
      .orderBy(dbLessons.sortIndex);

    if (existingLessons.length === 0) {
      console.log(`  [SKIP] ${course.title} — no lessons`);
      continue;
    }

    console.log(`  [UPDATE] ${course.title} — ${existingLessons.length} lessons`);

    for (let i = 0; i < existingLessons.length; i++) {
      const lesson = existingLessons[i];
      const { url, duration } = YOUTUBE_URLS[i % YOUTUBE_URLS.length];

      await db
        .update(dbLessons)
        .set({ videoUrl: url, duration, status: "active" })
        .where(eq(dbLessons.id, lesson.id));

      console.log(`    ${i + 1}. ${lesson.title} -> ${url}`);
    }
    console.log();
  }

  console.log("Done! All lessons now use YouTube video URLs.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
