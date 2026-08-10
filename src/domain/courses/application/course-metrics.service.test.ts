import { describe, it, expect, vi, beforeEach } from "vitest";
import { CourseMetricsService } from "./course-metrics.service";
import * as courseCache from "./course-cache";
import type { NextCoursesRepository } from "../infrastructure/db/next-courses.repository";

vi.mock("./course-cache", () => ({
  getCachedCourseMetrics: vi.fn(),
  setCachedCourseMetrics: vi.fn(),
  invalidateCourseMetricsCache: vi.fn(),
}));

describe("CourseMetricsService", () => {
  let mockRepository: Partial<NextCoursesRepository>;
  let service: CourseMetricsService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = {
      getLiveEnrollmentCount: vi.fn().mockResolvedValue(100),
      findByIdActive: vi.fn().mockResolvedValue({
        totalRatings: 50,
        rating: 4.5,
      }),
    };
    service = new CourseMetricsService(mockRepository as NextCoursesRepository);
  });

  it("should return cached metrics if valid", async () => {
    vi.mocked(courseCache.getCachedCourseMetrics).mockResolvedValue({
      metrics: {
        courseId: "123e4567-e89b-12d3-a456-426614174000",
        enrollmentCount: 150,
        ratingCount: 60,
        averageRating: 4.8,
        source: "live",
      },
      cachedAt: new Date().toISOString(),
      ttlSeconds: 300,
    });

    const result = await service.getCourseMetrics("123e4567-e89b-12d3-a456-426614174000");

    expect(result).toEqual({
      courseId: "123e4567-e89b-12d3-a456-426614174000",
      enrollmentCount: 150,
      ratingCount: 60,
      averageRating: 4.8,
      source: "cache",
    });
    expect(mockRepository.getLiveEnrollmentCount).not.toHaveBeenCalled();
  });

  it("should query DB and cache if cache miss", async () => {
    vi.mocked(courseCache.getCachedCourseMetrics).mockResolvedValue(null);

    const result = await service.getCourseMetrics("123e4567-e89b-12d3-a456-426614174000");

    expect(result).toEqual({
      courseId: "123e4567-e89b-12d3-a456-426614174000",
      enrollmentCount: 100,
      ratingCount: 50,
      averageRating: 4.5,
      source: "live",
    });
    expect(courseCache.setCachedCourseMetrics).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174000",
      expect.objectContaining({
        metrics: expect.objectContaining({ source: "live" }),
      })
    );
  });

  it("should fallback to denormalized column if DB throws", async () => {
    vi.mocked(courseCache.getCachedCourseMetrics).mockResolvedValue(null);
    mockRepository.getLiveEnrollmentCount = vi.fn().mockRejectedValue(new Error("DB Down"));

    const result = await service.getCourseMetrics("123e4567-e89b-12d3-a456-426614174000", 99);

    expect(result).toEqual({
      courseId: "123e4567-e89b-12d3-a456-426614174000",
      enrollmentCount: 99,
      ratingCount: 0,
      averageRating: 0,
      source: "fallback",
    });
  });

  it("should return null if all fail and no fallback provided", async () => {
    vi.mocked(courseCache.getCachedCourseMetrics).mockResolvedValue(null);
    mockRepository.getLiveEnrollmentCount = vi.fn().mockRejectedValue(new Error("DB Down"));

    const result = await service.getCourseMetrics("123e4567-e89b-12d3-a456-426614174000");

    expect(result).toBeNull();
  });

  it("should call cache invalidate", async () => {
    await service.invalidate("course-1");
    expect(courseCache.invalidateCourseMetricsCache).toHaveBeenCalledWith("course-1");
  });
});
