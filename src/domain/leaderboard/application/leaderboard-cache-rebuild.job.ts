import {
  ILeaderboardCacheRepository,
  IPointEventRepository,
  LeaderboardWindow,
  CacheEntry,
} from "../contracts/leaderboard.types";
import { LeaderboardScoringPolicy } from "./leaderboard-scoring.policy";

export class LeaderboardCacheRebuildJob {
  constructor(
    private pointEventRepo: IPointEventRepository,
    private cacheRepo: ILeaderboardCacheRepository,
    private scoringPolicy: LeaderboardScoringPolicy
  ) {}

  public async rebuild(courseId: string, window: LeaderboardWindow): Promise<void> {
    const windowStart = this.getWindowStart(window);
    
    // 1. Fetch aggregates from DB
    const aggregates = await this.pointEventRepo.aggregateByCourseAndWindow(
      courseId,
      windowStart
    );

    if (aggregates.length === 0) {
      await this.cacheRepo.rebuildLeaderboard(courseId, window, []);
      return;
    }

    // 2. Group aggregates by user
    const userAggs = new Map<string, typeof aggregates>();

    for (const agg of aggregates) {
      if (!userAggs.has(agg.userId)) {
        userAggs.set(agg.userId, []);
      }
      userAggs.get(agg.userId)!.push(agg);
    }

    // 3. Compute scores
    const entries: CacheEntry[] = [];
    for (const [userId, aggs] of userAggs.entries()) {
      const { totalScore } = this.scoringPolicy.computeCompositeScore(aggs);
      const score = this.scoringPolicy.computeZsetScore(totalScore, Date.now()); // Using Date.now() for placeholder tie-breaker logic in bulk rebuild
      entries.push({ userId, score });
    }

    // 4. Update Cache
    await this.cacheRepo.rebuildLeaderboard(courseId, window, entries);
  }

  private getWindowStart(window: LeaderboardWindow): Date | null {
    if (window === "all") return null;
    
    const now = new Date();
    if (window === "week") {
      const day = now.getUTCDay();
      const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setUTCDate(diff));
      startOfWeek.setUTCHours(0, 0, 0, 0);
      return startOfWeek;
    }
    
    if (window === "month") {
      const startOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
      startOfMonth.setUTCHours(0, 0, 0, 0);
      return startOfMonth;
    }
    
    return null;
  }
}
