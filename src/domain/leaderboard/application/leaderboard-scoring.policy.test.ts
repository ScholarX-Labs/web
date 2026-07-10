import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LeaderboardScoringPolicy } from "./leaderboard-scoring.policy";
import { PointEventAggregate } from "../contracts/leaderboard.types";

describe("LeaderboardScoringPolicy", () => {
  const policy = new LeaderboardScoringPolicy();

  it("should correctly compute weights at 40/30/30", () => {
    const aggregates: PointEventAggregate[] = [
      { userId: "1", courseId: "c1", activityCategory: "quizzesAndExams", totalPoints: 100 },
      { userId: "1", courseId: "c1", activityCategory: "participation", totalPoints: 100 },
      { userId: "1", courseId: "c1", activityCategory: "courseCompletion", totalPoints: 100 },
    ];

    const result = policy.computeCompositeScore(aggregates);
    assert.deepEqual(result.breakdown, {
      quizzesAndExams: 100,
      participation: 100,
      courseCompletion: 100,
    });
    // 100 * 0.4 + 100 * 0.3 + 100 * 0.3 = 100
    assert.equal(result.totalScore, 100);
  });

  it("should handle zero scores correctly", () => {
    const result = policy.computeCompositeScore([]);
    assert.equal(result.totalScore, 0);
    assert.deepEqual(result.breakdown, {
      quizzesAndExams: 0,
      participation: 0,
      courseCompletion: 0,
    });
  });

  it("should handle tie-breaking direction where earlier timestamp wins", () => {
    const score = 100;
    const earlierTime = new Date("2023-01-01T10:00:00Z").getTime();
    const laterTime = new Date("2023-01-01T11:00:00Z").getTime();

    const earlierZset = policy.computeZsetScore(score, earlierTime);
    const laterZset = policy.computeZsetScore(score, laterTime);

    assert.ok(earlierZset > laterZset);
  });
});
