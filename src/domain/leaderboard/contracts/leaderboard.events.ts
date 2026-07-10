export type LeaderboardDomainEventType =
  | "POINT_AWARDED"
  | "CACHE_REBUILD_SCHEDULED"
  | "OPT_OUT_CHANGED";

export interface PointAwardedEvent {
  type: "POINT_AWARDED";
  payload: {
    userId: string;
    courseId: string;
    points: number;
    activityType: string;
    idempotencyKey?: string;
  };
  timestamp: Date;
}

export interface CacheRebuildScheduledEvent {
  type: "CACHE_REBUILD_SCHEDULED";
  payload: {
    courseId: string;
  };
  timestamp: Date;
}

export interface OptOutChangedEvent {
  type: "OPT_OUT_CHANGED";
  payload: {
    userId: string;
    courseId: string;
    isAnonymous: boolean;
  };
  timestamp: Date;
}

export type LeaderboardDomainEvent =
  | PointAwardedEvent
  | CacheRebuildScheduledEvent
  | OptOutChangedEvent;
