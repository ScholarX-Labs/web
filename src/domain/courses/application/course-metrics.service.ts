import { getCachedCourseMetrics, setCachedCourseMetrics, invalidateCourseMetricsCache } from "./course-cache";
import { CourseMetricsSchema } from "../contracts/course-metrics.contract";
import type { CourseMetrics, CounterCacheEntry } from "../contracts/course-metrics.contract";
import type { NextCoursesRepository } from "../infrastructure/db/next-courses.repository";
import { cachePolicy } from "@/lib/cache/cache-policy";

export class CourseMetricsService {
  constructor(private readonly repository: NextCoursesRepository) {}

  async getCourseMetrics(
    courseId: string,
    fallbackStudentsCount?: number
  ): Promise<CourseMetrics | null> {
    // 1. Try cache
    const cached = await getCachedCourseMetrics(courseId);
    if (cached) {
      const parsed = CourseMetricsSchema.safeParse(cached.metrics);
      if (parsed.success) return { ...parsed.data, source: "cache" };
      // Invalid cache entry — fall through
    }

    // 2. Try live DB query
    try {
      const enrollmentCount = await this.repository.getLiveEnrollmentCount(courseId);
      const courseDetails = await this.repository.findByIdActive(courseId);
      if (!courseDetails) return null;

      const metrics: CourseMetrics = {
        courseId,
        enrollmentCount,
        ratingCount: courseDetails.totalRatings ?? 0,
        averageRating: Number(courseDetails.rating ?? 0),
        source: "live",
      };

      const entry: CounterCacheEntry = {
        metrics,
        cachedAt: new Date().toISOString(),
        ttlSeconds: cachePolicy.courses.counters.ttlSeconds,
      };
      await setCachedCourseMetrics(courseId, entry);
      return metrics;
    } catch {
      // 3. Fallback to denormalized column
      if (fallbackStudentsCount !== undefined) {
        return {
          courseId,
          enrollmentCount: fallbackStudentsCount,
          ratingCount: 0,
          averageRating: 0,
          source: "fallback",
        };
      }
      return null;
    }
  }

  async invalidate(courseId: string): Promise<void> {
    await invalidateCourseMetricsCache(courseId);
  }
}
