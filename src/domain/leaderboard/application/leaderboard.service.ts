import {
  ILeaderboardOptOutRepository,
  IPointEventRepository,
  LeaderboardActivityType,
} from "../contracts/leaderboard.types";
import { LeaderboardError } from "./leaderboard.errors";
import { LeaderboardDomainEvent } from "../contracts/leaderboard.events";

import { LeaderboardCacheRebuildJob } from "./leaderboard-cache-rebuild.job";

export class LeaderboardService {
  constructor(
    private pointEventRepo: IPointEventRepository,
    private optOutRepo: ILeaderboardOptOutRepository,
    private rebuildJob?: LeaderboardCacheRebuildJob
  ) {}

  public async awardPoints(event: {
    userId: string;
    courseId: string;
    activityType: LeaderboardActivityType;
    points: number;
    activityId?: string;
    idempotencyKey?: string;
  }): Promise<LeaderboardDomainEvent> {
    if (!Number.isFinite(event.points) || event.points <= 0) {
      throw new LeaderboardError(
        "INVALID_OPERATION",
        "Points awarded must be greater than zero."
      );
    }

    await this.pointEventRepo.insertPointEvent(event);

    if (this.rebuildJob) {
      // Run all three window rebuilds independently so a failure in one window
      // does not prevent the others from completing (Promise.allSettled vs .all).
      const windows = ["all", "week", "month"] as const;
      const results = await Promise.allSettled(
        windows.map((w) => this.rebuildJob!.rebuild(event.courseId, w))
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === "rejected") {
          console.error(
            `[LeaderboardService] Cache rebuild failed for window="${windows[i]}":`,
            result.reason
          );
        }
      }
    }

    return {
      type: "POINT_AWARDED",
      payload: event,
      timestamp: new Date(),
    };
  }

  public async optOut(courseId: string, userId: string): Promise<LeaderboardDomainEvent> {
    await this.optOutRepo.setAnonymous(courseId, userId);
    return {
      type: "OPT_OUT_CHANGED",
      payload: { courseId, userId, isAnonymous: true },
      timestamp: new Date(),
    };
  }

  public async optIn(courseId: string, userId: string): Promise<LeaderboardDomainEvent> {
    await this.optOutRepo.setPublic(courseId, userId);
    return {
      type: "OPT_OUT_CHANGED",
      payload: { courseId, userId, isAnonymous: false },
      timestamp: new Date(),
    };
  }
}
