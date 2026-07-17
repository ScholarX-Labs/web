import {
  ILeaderboardCacheRepository,
  LeaderboardWindow,
  CacheEntry,
  CachedRankEntry,
} from "../../contracts/leaderboard.types";
import { LeaderboardError } from "../../application/leaderboard.errors";
import {
  getSharedRedisClient,
  isSharedRedisConfigured,
} from "@/lib/cache/shared-redis";

export class LeaderboardCacheRepository implements ILeaderboardCacheRepository {
  /**
   * Returns the Redis client if it is ready, or throws a typed LeaderboardError.
   *
   * Two distinct failure modes are surfaced:
   *  - CACHE_UNAVAILABLE – Redis is not configured, or the circuit breaker is
   *    open after repeated failures.  Treat as a degraded-mode signal.
   *  - CACHE_NOT_READY  – Redis is configured and healthy but the connection
   *    handshake (including TLS) has not yet completed (common at container
   *    startup).  Rebuild callers should skip silently; query callers should
   *    fall back to PostgreSQL.
   */
  private getClient() {
    if (!isSharedRedisConfigured()) {
      throw new LeaderboardError(
        "CACHE_UNAVAILABLE",
        "Redis is not configured for leaderboard operations."
      );
    }

    const client = getSharedRedisClient();
    if (!client) {
      // getSharedRedisClient returns null either because the circuit is open
      // OR because the client status is not yet "ready".  At this point Redis
      // IS configured, so a null result means "not ready yet" (transient).
      throw new LeaderboardError(
        "CACHE_NOT_READY",
        "Redis client is not yet ready for leaderboard operations."
      );
    }

    return client;
  }

  private getZsetKey(courseId: string, window: LeaderboardWindow): string {
    return `scholarx:leaderboard:${courseId}:${window}`;
  }

  private getUpdatedKey(courseId: string, window: LeaderboardWindow): string {
    return `scholarx:leaderboard:${courseId}:${window}:updated_at`;
  }

  public async getTopEntries(
    courseId: string,
    window: LeaderboardWindow,
    limit: number
  ): Promise<CachedRankEntry[]> {
    const client = this.getClient();
    const key = this.getZsetKey(courseId, window);
    
    // ZREVRANGE with WITHSCORES returns [member1, score1, member2, score2, ...]
    const results = await client.zrevrange(key, 0, limit - 1, "WITHSCORES");
    
    const entries: CachedRankEntry[] = [];
    let rank = 1;
    for (let i = 0; i < results.length; i += 2) {
      const userId = results[i];
      const score = parseFloat(results[i + 1]);
      entries.push({
        userId,
        score,
        rank: rank++,
      });
    }

    return entries;
  }

  public async getUserRank(
    courseId: string,
    window: LeaderboardWindow,
    userId: string
  ): Promise<CachedRankEntry | null> {
    const client = this.getClient();
    const key = this.getZsetKey(courseId, window);

    const [rank, scoreStr] = await Promise.all([
      client.zrevrank(key, userId),
      client.zscore(key, userId),
    ]);

    if (rank === null || scoreStr === null) {
      return null;
    }

    return {
      userId,
      score: parseFloat(scoreStr),
      rank: rank + 1, // ZREVRANK is 0-indexed
    };
  }

  public async rebuildLeaderboard(
    courseId: string,
    window: LeaderboardWindow,
    entries: CacheEntry[]
  ): Promise<void> {
    const client = this.getClient();
    const key = this.getZsetKey(courseId, window);
    const updatedKey = this.getUpdatedKey(courseId, window);

    const multi = client.multi();

    // Clear existing data
    multi.del(key);

    // If there are entries, add them
    if (entries.length > 0) {
      // zadd arguments format: [score1, member1, score2, member2, ...]
      const args: (string | number)[] = [];
      for (const entry of entries) {
        args.push(entry.score, entry.userId);
      }
      // Using apply to pass the arguments dynamically
      multi.zadd(key, ...args);
    }

    // Set updated_at timestamp
    multi.set(updatedKey, Date.now().toString());

    await multi.exec();
  }

  public async getUpdatedAt(
    courseId: string,
    window: LeaderboardWindow
  ): Promise<Date | null> {
    const client = this.getClient();
    const key = this.getUpdatedKey(courseId, window);
    
    const timestamp = await client.get(key);
    if (!timestamp) {
      return null;
    }
    
    return new Date(parseInt(timestamp, 10));
  }
}
