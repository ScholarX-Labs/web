import { z } from "zod";

/**
 * @module course-metrics.contract
 * @layer domain/courses/contracts
 * @description Value types for course engagement metrics.
 * These are plain serializable objects — no class instances,
 * safe for JSON cache serialization.
 */

export const CourseMetricsSchema = z.object({
  courseId: z.string().uuid(),
  enrollmentCount: z.number().int().nonnegative(),
  ratingCount: z.number().int().nonnegative(),
  averageRating: z.number().min(0).max(5),
  source: z.enum(["live", "cache", "fallback"]),
});

export const CounterCacheEntrySchema = z.object({
  metrics: CourseMetricsSchema,
  cachedAt: z.string().datetime(),
  ttlSeconds: z.number().positive(),
});

export type CourseMetrics = z.infer<typeof CourseMetricsSchema>;
export type CounterCacheEntry = z.infer<typeof CounterCacheEntrySchema>;

/** Props for the AnimatedCounter client component. */
export interface AnimatedCounterProps {
  value: number;
  label: string;
  suffix?: string;    // e.g., "+" for social-proof "at least" framing
  abbreviated?: boolean; // true = 10K+, false = 10,000+
  className?: string;
}

/** Props for the ActivityBadge client component. */
export interface ActivityBadgeProps {
  increment: number;       // positive integer — actual confirmed delta
  dismissAfterMs?: number; // default: 2000
}
