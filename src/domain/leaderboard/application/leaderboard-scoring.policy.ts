import { PointEventAggregate, CATEGORY_WEIGHTS } from "../contracts/leaderboard.types";

export class LeaderboardScoringPolicy {
  // Use a fixed max epoch for tie breaking (e.g., year 2100)
  private readonly MAX_EPOCH_MS = new Date("2100-01-01T00:00:00.000Z").getTime();

  /**
   * Computes the weighted composite score from point aggregates.
   */
  public computeCompositeScore(aggregates: PointEventAggregate[]): ScoreBreakdownResult {
    let quizzesAndExams = 0;
    let participation = 0;
    let courseCompletion = 0;

    for (const agg of aggregates) {
      if (agg.activityCategory === "quizzesAndExams") {
        quizzesAndExams += agg.totalPoints;
      } else if (agg.activityCategory === "participation") {
        participation += agg.totalPoints;
      } else if (agg.activityCategory === "courseCompletion") {
        courseCompletion += agg.totalPoints;
      }
    }

    const totalScore = 
      (quizzesAndExams * CATEGORY_WEIGHTS.quizzesAndExams) +
      (participation * CATEGORY_WEIGHTS.participation) +
      (courseCompletion * CATEGORY_WEIGHTS.courseCompletion);

    return {
      breakdown: {
        quizzesAndExams,
        participation,
        courseCompletion,
      },
      totalScore,
    };
  }

  /**
   * Computes the ZSET score which inherently handles tie-breaking.
   * Higher score is better. Earlier timestamp is better.
   */
  public computeZsetScore(compositeScore: number, earliestScoreTimestampMs: number): number {
    // 1_000_000 multiplier allows tie-breaker fractional space
    // We add the inverse of the timestamp so earlier times give a slightly higher score
    // using MAX_EPOCH_MS to ensure it stays positive and orders correctly
    const tieBreaker = this.MAX_EPOCH_MS - earliestScoreTimestampMs;
    // ensure tieBreaker doesn't exceed the multiplier space (it won't if scaled properly, 
    // but in Redis float64 representation, we need to be careful with precision. 
    // ZSET scores are double precision floats. Up to 2^53 integer precision.)
    // Let's use BigInt or simply Double precision. MAX_EPOCH_MS is ~4.1e12
    // If score is 10,000, score * 1_000_000_000_000_000 is too big for float64 exact precision.
    // Actually, Redis ZSET allows scores up to 9007199254740992 (2^53).
    // Let's just return a double where integer part is score and fractional part is tiebreaker.
    // score + (MAX_EPOCH_MS - timestamp) / MAX_EPOCH_MS
    const tieBreakerFraction = Math.max(0, tieBreaker) / this.MAX_EPOCH_MS;
    return compositeScore + tieBreakerFraction;
  }
}

export interface ScoreBreakdownResult {
  breakdown: {
    quizzesAndExams: number;
    participation: number;
    courseCompletion: number;
  };
  totalScore: number;
}
