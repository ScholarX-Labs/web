import { eq, sum, and, gte } from "drizzle-orm";
import { db } from "@/db";
import { pointEvents } from "@/db/schema/leaderboard";
import {
  IPointEventRepository,
  InsertPointEvent,
  PointEventAggregate,
  ScoreBreakdown,
  LeaderboardActivityCategory,
  ACTIVITY_CATEGORY_MAP,
} from "../../contracts/leaderboard.types";

export class PointEventRepository implements IPointEventRepository {
  public async insertPointEvent(event: InsertPointEvent): Promise<void> {
    await db
      .insert(pointEvents)
      .values({
        userId: event.userId,
        courseId: event.courseId,
        activityType: event.activityType,
        activityId: event.activityId,
        points: event.points,
        idempotencyKey: event.idempotencyKey,
      })
      .onConflictDoNothing({ target: pointEvents.idempotencyKey });
  }

  public async aggregateByCourseAndWindow(
    courseId: string,
    windowStart: Date | null
  ): Promise<PointEventAggregate[]> {
    const conditions = [eq(pointEvents.courseId, courseId)];
    if (windowStart) {
      conditions.push(gte(pointEvents.createdAt, windowStart));
    }

    const rows = await db
      .select({
        userId: pointEvents.userId,
        activityType: pointEvents.activityType,
        totalPoints: sum(pointEvents.points).mapWith(Number),
      })
      .from(pointEvents)
      .where(and(...conditions))
      .groupBy(pointEvents.userId, pointEvents.activityType);

    // Group the raw SQL results into PointEventAggregate items
    const aggregateMap = new Map<string, PointEventAggregate>();

    for (const row of rows) {
      const category: LeaderboardActivityCategory = ACTIVITY_CATEGORY_MAP[row.activityType];
      if (!category) {
        continue; // skip unmapped activity types
      }
      const key = `${row.userId}:${category}`;

      const existing = aggregateMap.get(key);
      if (existing) {
        existing.totalPoints += row.totalPoints;
      } else {
        aggregateMap.set(key, {
          userId: row.userId,
          courseId,
          activityCategory: category,
          totalPoints: row.totalPoints,
        });
      }
    }

    return Array.from(aggregateMap.values());
  }

  public async getUserBreakdown(
    courseId: string,
    userId: string,
    windowStart: Date | null
  ): Promise<ScoreBreakdown> {
    const conditions = [
      eq(pointEvents.courseId, courseId),
      eq(pointEvents.userId, userId),
    ];
    if (windowStart) {
      conditions.push(gte(pointEvents.createdAt, windowStart));
    }

    const rows = await db
      .select({
        activityType: pointEvents.activityType,
        totalPoints: sum(pointEvents.points).mapWith(Number),
      })
      .from(pointEvents)
      .where(and(...conditions))
      .groupBy(pointEvents.activityType);

    const breakdown: ScoreBreakdown = {
      quizzesAndExams: 0,
      participation: 0,
      courseCompletion: 0,
    };

    for (const row of rows) {
      const category = ACTIVITY_CATEGORY_MAP[row.activityType];
      if (!category) {
        continue; // skip unmapped activity types
      }
      breakdown[category] += row.totalPoints;
    }

    return breakdown;
  }
}
