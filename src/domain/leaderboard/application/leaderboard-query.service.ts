import {
  ILeaderboardCacheRepository,
  ILeaderboardOptOutRepository,
  IPointEventRepository,
  LeaderboardWindow,
  LeaderboardEntryDto,
  MyRankDto,
} from "../contracts/leaderboard.types";
import { LeaderboardPrivacyPolicy } from "./leaderboard-privacy.policy";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { inArray, eq } from "drizzle-orm";

import { CachedRankEntry } from "../contracts/leaderboard.types";

export class LeaderboardQueryService {
  constructor(
    private cacheRepo: ILeaderboardCacheRepository,
    private optOutRepo: ILeaderboardOptOutRepository,
    private pointEventRepo: IPointEventRepository,
    private privacyPolicy: LeaderboardPrivacyPolicy
  ) {}

  public async getTopEntries(
    courseId: string,
    window: LeaderboardWindow,
    limit: number,
    currentUserId?: string,
    isAdmin: boolean = false
  ): Promise<{ entries: LeaderboardEntryDto[]; updatedAt: Date | null }> {
    let cachedEntries: CachedRankEntry[] = [];
    let updatedAt: Date | null = null;

    try {
      cachedEntries = await this.cacheRepo.getTopEntries(courseId, window, limit);
      updatedAt = await this.cacheRepo.getUpdatedAt(courseId, window);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const isRedisError = error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED') || error.message?.includes('ClosedClient');
      if (isRedisError) {
        console.warn("[LeaderboardQueryService] Redis unavailable, falling back to PostgreSQL for top entries");
        const windowStart = this.getWindowStart(window);
        const aggregates = await this.pointEventRepo.aggregateByCourseAndWindow(courseId, windowStart);
        
        const userScores = new Map<string, number>();
        for (const agg of aggregates) {
          userScores.set(agg.userId, (userScores.get(agg.userId) || 0) + agg.totalPoints);
        }

        const sortedUsers = Array.from(userScores.entries()).sort((a, b) => b[1] - a[1]);
        const topUsers = sortedUsers.slice(0, limit);

        cachedEntries = topUsers.map(([uId, score], index) => ({
          userId: uId,
          score,
          rank: index + 1
        }));
        updatedAt = new Date(); // Degraded mode uses current time
      } else {
        throw err;
      }
    }

    if (cachedEntries.length === 0) {
      return { entries: [], updatedAt };
    }

    const userIds = cachedEntries.map((e) => e.userId);

    // Fetch user profiles
    const users = await db
      .select({ id: user.id, name: user.name, image: user.image, isProfilePublic: user.isProfilePublic })
      .from(user)
      .where(inArray(user.id, userIds));

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Fetch anonymous list
    const anonymousUserIds = await this.optOutRepo.getAnonymousUserIds(courseId);
    const anonymousSet = new Set(anonymousUserIds);

    const entries: LeaderboardEntryDto[] = cachedEntries.map((entry) => {
      const u = userMap.get(entry.userId);
      const isCurrentUser = entry.userId === currentUserId;
      const isOptedOut = anonymousSet.has(entry.userId);
      const isGloballyPrivate = u ? !u.isProfilePublic : false;
      const isAnonymous = isOptedOut || isGloballyPrivate;

      const dto: LeaderboardEntryDto = {
        rank: entry.rank,
        displayName: u?.name ?? "Unknown Learner",
        avatarUrl: u?.image ?? null,
        totalScore: entry.score,
        isCurrentUser,
        isGloballyPrivate,
      };

      if (isAnonymous) {
        dto.isPrivate = true;
        return this.privacyPolicy.mask(dto, isAdmin);
      }
      return dto;
    });

    return { entries, updatedAt };
  }

  public async getMyRank(
    courseId: string,
    window: LeaderboardWindow,
    userId: string
  ): Promise<MyRankDto> {
    let cachedRank: CachedRankEntry | null = null;
    let isDegraded = false;

    try {
      cachedRank = await this.cacheRepo.getUserRank(courseId, window, userId);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const isRedisError = error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED') || error.message?.includes('ClosedClient');
      if (isRedisError) {
        console.warn("[LeaderboardQueryService] Redis unavailable, falling back to PostgreSQL for my rank");
        isDegraded = true;
      } else {
        throw err;
      }
    }

    const [breakdown, isAnonymous, userRecord] = await Promise.all([
      this.pointEventRepo.getUserBreakdown(courseId, userId, this.getWindowStart(window)),
      this.optOutRepo.isAnonymous(courseId, userId),
      db.select({ isProfilePublic: user.isProfilePublic }).from(user).where(eq(user.id, userId)).limit(1),
    ]);
    
    const isGloballyPrivate = userRecord.length > 0 ? !userRecord[0].isProfilePublic : false;

    const totalScore = breakdown.quizzesAndExams + breakdown.participation + breakdown.courseCompletion;

    if (isDegraded && totalScore > 0) {
      const windowStart = this.getWindowStart(window);
      const aggregates = await this.pointEventRepo.aggregateByCourseAndWindow(courseId, windowStart);
      
      const userScores = new Map<string, number>();
      for (const agg of aggregates) {
        userScores.set(agg.userId, (userScores.get(agg.userId) || 0) + agg.totalPoints);
      }
      
      const sortedScores = Array.from(userScores.values()).sort((a, b) => b - a);
      const rankIndex = sortedScores.findIndex(s => s <= totalScore);
      
      cachedRank = {
        userId,
        score: totalScore,
        rank: rankIndex >= 0 ? rankIndex + 1 : sortedScores.length + 1
      };
    }

    return {
      rank: cachedRank ? cachedRank.rank : null,
      totalScore,
      categoryBreakdown: breakdown,
      window,
      isAnonymous,
      isGloballyPrivate,
    };
  }

  private getWindowStart(window: LeaderboardWindow): Date | null {
    if (window === "all") return null;
    
    const now = new Date();
    if (window === "week") {
      const day = now.getUTCDay();
      const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
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
