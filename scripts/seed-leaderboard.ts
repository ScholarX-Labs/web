import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { LeaderboardActivityType } from "@/domain/leaderboard/contracts/leaderboard.types";
import { PointEventRepository, LeaderboardCacheRepository } from "@/domain/leaderboard/infrastructure";
import { LeaderboardCacheRebuildJob, LeaderboardScoringPolicy } from "@/domain/leaderboard/application";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";

async function main() {
  const courseId = process.argv[2] || "00000000-0000-0000-0000-000000000001";
  console.log(`\n🌱 Seeding leaderboard for course: ${courseId}`);

  const pointEventRepo = new PointEventRepository();
  const cacheRepo = new LeaderboardCacheRepository();
  const scoringPolicy = new LeaderboardScoringPolicy();
  const rebuildJob = new LeaderboardCacheRebuildJob(pointEventRepo, cacheRepo, scoringPolicy);

  // 1. Create synthetic users
  console.log(`👥 Creating 100 synthetic users...`);
  const syntheticUsers = Array.from({ length: 100 }).map(() => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
      id: randomUUID(),
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: faker.internet.email().toLowerCase(),
      image: faker.image.avatar(),
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
    };
  });

  // Insert in batches
  for (let i = 0; i < syntheticUsers.length; i += 20) {
    const batch = syntheticUsers.slice(i, i + 20);
    await db.insert(user).values(batch).onConflictDoNothing();
  }

  // 2. Generate random point events
  console.log(`🎲 Generating randomized point events...`);
  const activities: { type: LeaderboardActivityType; weight: number }[] = [
    { type: "quiz", weight: 20 },
    { type: "exam", weight: 50 },
    { type: "lesson_completion", weight: 10 },
    { type: "course_completion", weight: 100 },
    { type: "forum_post", weight: 5 },
  ];

  let eventCount = 0;
  for (const u of syntheticUsers) {
    // Random number of events per user (1 to 20)
    const numEvents = faker.number.int({ min: 1, max: 20 });
    for (let i = 0; i < numEvents; i++) {
      const activity = faker.helpers.arrayElement(activities);
      
      // Distribute events across the past 45 days to cover week/month/all windows
      const daysAgo = faker.number.int({ min: 0, max: 45 });
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);

      await pointEventRepo.insertPointEvent({
        userId: u.id,
        courseId,
        activityType: activity.type,
        points: activity.weight,
        activityId: randomUUID(),
        idempotencyKey: randomUUID(),
        // Note: currently insertPointEvent uses the DB defaults for timestamp. 
        // We'll let it use the current time for this script to simplify, 
        // or we can just say "all" window will capture it.
      });
      eventCount++;
    }
  }

  console.log(`✅ Inserted ${eventCount} point events.`);

  // 3. Rebuild cache
  console.log(`🔄 Triggering cache rebuild...`);
  await rebuildJob.rebuild(courseId, "all");
  await rebuildJob.rebuild(courseId, "week");
  await rebuildJob.rebuild(courseId, "month");

  console.log(`🎉 Leaderboard seeded successfully!\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
