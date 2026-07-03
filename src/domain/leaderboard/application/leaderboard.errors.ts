export type LeaderboardErrorCode =
  | "LEADERBOARD_DISABLED"
  | "NOT_ENROLLED"
  | "CACHE_UNAVAILABLE"
  | "INVALID_WINDOW"
  | "USER_NOT_FOUND"
  | "INTERNAL_ERROR"
  | "INVALID_OPERATION";

export class LeaderboardError extends Error {
  constructor(
    public readonly code: LeaderboardErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LeaderboardError";
    Object.setPrototypeOf(this, LeaderboardError.prototype);
  }

  public static isLeaderboardError(error: unknown): error is LeaderboardError {
    return error instanceof LeaderboardError;
  }
}
