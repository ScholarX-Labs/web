import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "@/db";
import { pointEvents, leaderboardOptOuts } from "@/db/schema/leaderboard";
import { user } from "@/db/schema/auth-schema";
import { dbCourses } from "@/db/schema/courses-db.schema";
import { PointEventRepository } from "./point-event.repository";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

describe("PointEventRepository Integration", () => {
  const repo = new PointEventRepository();
  let testUserId: string;
  let testCourseId: string;

  before(async () => {
    // Setup test data
    testUserId = randomUUID();
    testCourseId = randomUUID();

    // Insert dummy user and course to satisfy foreign key constraints
    await db.insert(user).values({
      id: testUserId,
      name: "Test User",
      firstName: "Test",
      lastName: "User",
      email: `test-${testUserId}@example.com`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(dbCourses).values({
      id: testCourseId,
      title: "Test Course",
      slug: `test-course-${testCourseId}`,
      description: "Test Course Description",
      category: "technology",
      currentPrice: 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  after(async () => {
    // Cleanup
    await db.delete(pointEvents).where(eq(pointEvents.userId, testUserId));
    await db.delete(leaderboardOptOuts).where(eq(leaderboardOptOuts.userId, testUserId));
    await db.delete(dbCourses).where(eq(dbCourses.id, testCourseId));
    await db.delete(user).where(eq(user.id, testUserId));
  });

  it("should insert a point event and aggregate correctly", async () => {
    const idempotencyKey = randomUUID();

    await repo.insertPointEvent({
      userId: testUserId,
      courseId: testCourseId,
      activityType: "quiz",
      activityId: randomUUID(),
      points: 50,
      idempotencyKey,
    });

    // Conflict test: inserting the same idempotency key should not throw
    await repo.insertPointEvent({
      userId: testUserId,
      courseId: testCourseId,
      activityType: "quiz",
      activityId: randomUUID(),
      points: 20,
      idempotencyKey, // same key
    });

    // Add another category
    await repo.insertPointEvent({
      userId: testUserId,
      courseId: testCourseId,
      activityType: "forum_post",
      points: 10,
    });

    const aggregates = await repo.aggregateByCourseAndWindow(testCourseId, null);
    assert.equal(aggregates.length, 2);

    const quizAgg = aggregates.find((a) => a.activityCategory === "quizzesAndExams");
    const forumAgg = aggregates.find((a) => a.activityCategory === "participation");

    assert.ok(quizAgg);
    assert.equal(quizAgg.totalPoints, 50); // The duplicate 20 was ignored

    assert.ok(forumAgg);
    assert.equal(forumAgg.totalPoints, 10);

    const breakdown = await repo.getUserBreakdown(testCourseId, testUserId, null);
    assert.equal(breakdown.quizzesAndExams, 50);
    assert.equal(breakdown.participation, 10);
    assert.equal(breakdown.courseCompletion, 0);
  });
});
