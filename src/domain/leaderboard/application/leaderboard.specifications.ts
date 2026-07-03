import { LeaderboardError } from "./leaderboard.errors";

export class CourseHasLeaderboardEnabledSpecification {
  assertSatisfiedBy(
    isEnabled: boolean,
    courseId: string
  ): asserts isEnabled is true {
    if (!isEnabled) {
      throw new LeaderboardError(
        "LEADERBOARD_DISABLED",
        `Leaderboard is not enabled for course ${courseId}.`,
        { courseId }
      );
    }
  }
}

export class LearnerIsEnrolledSpecification {
  assertSatisfiedBy(
    isEnrolled: boolean,
    userId: string,
    courseId: string
  ): asserts isEnrolled is true {
    if (!isEnrolled) {
      throw new LeaderboardError(
        "NOT_ENROLLED",
        `User ${userId} is not enrolled in course ${courseId}.`,
        { userId, courseId }
      );
    }
  }
}
