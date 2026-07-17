import {
  ILeaderboardCacheRepository,
  IPointEventRepository,
  LeaderboardWindow,
  CacheEntry,
} from "../contracts/leaderboard.types";
import { LeaderboardError } from "./leaderboard.errors";
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
      try {
        await this.cacheRepo.rebuildLeaderboard(courseId, window, []);
      } catch (err) {
        if (
          LeaderboardError.isLeaderboardError(err) &&
          err.code === "CACHE_NOT_READY"
        ) {
          // Redis is still completing its TLS handshake at startup — skip
          // silently.  The cache will be populated on the next awardPoints call.
          console.debug(
            `[LeaderboardCacheRebuildJob] Redis not yet ready, skipping rebuild for ${courseId}/${window}`
          );
          return;
        }
        throw err;
      }
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
    const rebuildTimestamp = Date.now();
    for (const [userId, aggs] of userAggs.entries()) {
      const { totalScore } = this.scoringPolicy.computeCompositeScore(aggs);
      const score = this.scoringPolicy.computeZsetScore(totalScore, rebuildTimestamp);
      entries.push({ userId, score });
    }

    // 4. Update Cache
    try {
      await this.cacheRepo.rebuildLeaderboard(courseId, window, entries);
    } catch (err) {
      if (
        LeaderboardError.isLeaderboardError(err) &&
        err.code === "CACHE_NOT_READY"
      ) {
        console.debug(
          `[LeaderboardCacheRebuildJob] Redis not yet ready, skipping rebuild for ${courseId}/${window}`
        );
        return;
      }
      throw err;
    }
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
      const startOfMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
      );
      return startOfMonth;
    }
    
    return null;
  }
}
