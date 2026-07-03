export type LeaderboardWindow = "all" | "week" | "month";

export type LeaderboardActivityType =
  | "quiz"
  | "exam"
  | "forum_post"
  | "assignment_submit"
  | "lesson_completion"
  | "course_completion";

export type LeaderboardActivityCategory =
  | "quizzesAndExams"
  | "participation"
  | "courseCompletion";

export const ACTIVITY_CATEGORY_MAP: Record<LeaderboardActivityType, LeaderboardActivityCategory> = {
  quiz: "quizzesAndExams",
  exam: "quizzesAndExams",
  forum_post: "participation",
  assignment_submit: "participation",
  lesson_completion: "courseCompletion",
  course_completion: "courseCompletion",
};

export const CATEGORY_WEIGHTS: Record<LeaderboardActivityCategory, number> = {
  quizzesAndExams: 0.4,
  participation: 0.3,
  courseCompletion: 0.3,
};

export interface PointEventAggregate {
  userId: string;
  courseId: string;
  activityCategory: LeaderboardActivityCategory;
  totalPoints: number;
}

export interface ScoreBreakdown {
  quizzesAndExams: number;
  participation: number;
  courseCompletion: number;
}

export interface CompositeScore {
  totalScore: number;
  zsetScore: number;
}

export interface RawLeaderboardEntry {
  userId: string;
  totalScore: number;
  rank: number;
  updatedAt: Date;
}

export interface LeaderboardEntryDto {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  totalScore: number;
  isCurrentUser: boolean;
  isPrivate?: boolean; // For admin view
}

export interface MyRankDto {
  rank: number | null;
  totalScore: number;
  categoryBreakdown: ScoreBreakdown;
  window: LeaderboardWindow;
  isAnonymous: boolean;
}

export interface InsertPointEvent {
  userId: string;
  courseId: string;
  activityType: LeaderboardActivityType;
  activityId?: string;
  points: number;
  idempotencyKey?: string;
}

export interface CacheEntry {
  userId: string;
  score: number;
}

export interface CachedRankEntry {
  userId: string;
  score: number;
  rank: number;
}

export interface IPointEventRepository {
  insertPointEvent(event: InsertPointEvent): Promise<void>;
  aggregateByCourseAndWindow(courseId: string, windowStart: Date | null): Promise<PointEventAggregate[]>;
  getUserBreakdown(courseId: string, userId: string, windowStart: Date | null): Promise<ScoreBreakdown>;
}

export interface ILeaderboardCacheRepository {
  getTopEntries(courseId: string, window: LeaderboardWindow, limit: number): Promise<CachedRankEntry[]>;
  getUserRank(courseId: string, window: LeaderboardWindow, userId: string): Promise<CachedRankEntry | null>;
  rebuildLeaderboard(courseId: string, window: LeaderboardWindow, entries: CacheEntry[]): Promise<void>;
  getUpdatedAt(courseId: string, window: LeaderboardWindow): Promise<Date | null>;
}

export interface ILeaderboardOptOutRepository {
  isAnonymous(courseId: string, userId: string): Promise<boolean>;
  getAnonymousUserIds(courseId: string): Promise<string[]>;
  setAnonymous(courseId: string, userId: string): Promise<void>;
  setPublic(courseId: string, userId: string): Promise<void>;
}
