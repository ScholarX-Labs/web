import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { leaderboardOptOuts } from "@/db/schema/leaderboard";
import { ILeaderboardOptOutRepository } from "../../contracts/leaderboard.types";

export class LeaderboardOptOutRepository implements ILeaderboardOptOutRepository {
  public async isAnonymous(courseId: string, userId: string): Promise<boolean> {
    const result = await db
      .select({ userId: leaderboardOptOuts.userId })
      .from(leaderboardOptOuts)
      .where(
        and(
          eq(leaderboardOptOuts.courseId, courseId),
          eq(leaderboardOptOuts.userId, userId)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  public async getAnonymousUserIds(courseId: string): Promise<string[]> {
    const rows = await db
      .select({ userId: leaderboardOptOuts.userId })
      .from(leaderboardOptOuts)
      .where(eq(leaderboardOptOuts.courseId, courseId));

    return rows.map((r) => r.userId);
  }

  public async setAnonymous(courseId: string, userId: string): Promise<void> {
    await db
      .insert(leaderboardOptOuts)
      .values({
        courseId,
        userId,
      })
      .onConflictDoNothing({ target: [leaderboardOptOuts.courseId, leaderboardOptOuts.userId] });
  }

  public async setPublic(courseId: string, userId: string): Promise<void> {
    await db
      .delete(leaderboardOptOuts)
      .where(
        and(
          eq(leaderboardOptOuts.courseId, courseId),
          eq(leaderboardOptOuts.userId, userId)
        )
      );
  }
}
