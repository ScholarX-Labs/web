import { getCachedCourseMetrics, setCachedCourseMetrics, invalidateCourseMetricsCache } from "./course-cache";
import { CourseMetricsSchema } from "../contracts/course-metrics.contract";
import type { CourseMetrics, CounterCacheEntry, CourseMetricsFallbackOptions } from "../contracts/course-metrics.contract";
import type { NextCoursesRepository } from "../infrastructure/db/next-courses.repository";
import { cachePolicy } from "@/lib/cache/cache-policy";

export class CourseMetricsService {
  private activeRefreshes = new Map<string, Promise<void>>();

  constructor(private readonly repository: NextCoursesRepository) {}

  async getCourseMetrics(
    courseId: string,
    fallbackStudentsCount?: number | CourseMetricsFallbackOptions
  ): Promise<CourseMetrics | null> {
    // 1. Try cache
    const cached = await getCachedCourseMetrics(courseId);
    if (cached) {
      const parsed = CourseMetricsSchema.safeParse(cached.metrics);
      if (parsed.success && parsed.data.courseId === courseId) {
        const isStale =
          Date.now() - new Date(cached.cachedAt).getTime() >
          cached.ttlSeconds * 1000;

        if (isStale) {
          this.triggerBackgroundRefresh(courseId);
        }

        return { ...parsed.data, source: "cache" };
      }
      // Invalid cache entry — fall through
    }

    // 2. Try live DB query (synchronous path)
    return this.fetchAndCache(courseId, fallbackStudentsCount);
  }

  private triggerBackgroundRefresh(courseId: string) {
    if (this.activeRefreshes.has(courseId)) {
      return;
    }

    const refreshPromise = this.fetchAndCache(courseId)
      .catch(() => {
        // Silently fail background refreshes, relying on next request to retry
      })
      .then(() => {
        this.activeRefreshes.delete(courseId);
      });

    this.activeRefreshes.set(courseId, refreshPromise);
  }

  private async fetchAndCache(
    courseId: string,
    fallbackStudentsCount?: number | CourseMetricsFallbackOptions
  ): Promise<CourseMetrics | null> {
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
        const fallback = typeof fallbackStudentsCount === "number"
          ? { enrollmentCount: fallbackStudentsCount }
          : fallbackStudentsCount;

        const metrics: CourseMetrics = {
          courseId,
          enrollmentCount: fallback.enrollmentCount,
          source: "fallback",
        };

        if (fallback.ratingCount !== undefined) {
          metrics.ratingCount = fallback.ratingCount;
        }
        if (fallback.averageRating !== undefined) {
          metrics.averageRating = fallback.averageRating;
        }

        return metrics;
      }
      return null;
    }
  }

  async invalidate(courseId: string): Promise<void> {
    await invalidateCourseMetricsCache(courseId);
  }
}
