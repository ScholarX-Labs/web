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
    if (event.points <= 0) {
      throw new LeaderboardError(
        "INVALID_OPERATION",
        "Points awarded must be greater than zero."
      );
    }

    await this.pointEventRepo.insertPointEvent(event);

    if (this.rebuildJob) {
      // Run cache rebuilds asynchronously
      Promise.all([
        this.rebuildJob.rebuild(event.courseId, "all"),
        this.rebuildJob.rebuild(event.courseId, "week"),
        this.rebuildJob.rebuild(event.courseId, "month"),
      ]).catch((err) => console.error("[LeaderboardService] Cache rebuild failed:", err));
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
