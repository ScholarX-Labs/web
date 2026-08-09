# Quickstart: Dynamic Course Counters

**Branch**: `021-dynamic-course-counters`
**Audience**: Engineers implementing or reviewing this feature.

> Before reading this guide, read `plan.md` for the full architectural context and `data-model.md` for all types and cache schema.

---

## 0. Prerequisites

No new environment variables. The existing cache configuration drives which backend is used:

| Env Var | Source | Used For |
|---|---|---|
| `UPSTASH_REDIS_KV_REST_API_URL` | Upstash Console | Redis REST client (primary cache) |
| `UPSTASH_REDIS_KV_REST_API_TOKEN` | Upstash Console | Redis REST auth |
| `DATABASE_URL` | Existing | PostgreSQL (live COUNT query) |

All three were already set before this feature. No action required.

---

## 1. Adding the Counter Cache Policy

**File**: `src/lib/cache/cache-policy.ts`

Find the `courses` policy object and add the `counters` sub-object:

```typescript
// BEFORE (existing):
export const cachePolicy = {
  courses: {
    listTtlSeconds: 60,
    detailTtlSeconds: 60,
    // ...
  },
};

// AFTER (add counters entry):
export const cachePolicy = {
  courses: {
    listTtlSeconds: 60,
    detailTtlSeconds: 60,
    counters: {
      ttlSeconds: 300,
      versionTtlSeconds: 60 * 60 * 24 * 365,
      key: (courseId: string) => `courses:counters:${courseId}`,
      versionKey: () => `courses:counters:version`,
    },
    // ...
  },
};
```

---

## 2. Adding the Repository Method

**File**: `src/domain/courses/infrastructure/db/next-courses.repository.ts`

Add the live enrollment count query:

```typescript
async getLiveEnrollmentCount(courseId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.courseId, courseId),
        eq(subscriptions.isActive, true)
      )
    );
  return result?.count ?? 0;
}
```

---

## 3. Adding Cache Helpers

**File**: `src/domain/courses/application/course-cache.ts`

Add three functions following the exact same pattern as the existing helpers in the file:

```typescript
const counterKey = (courseId: string) =>
  cachePolicy.courses.counters.key(courseId);
const counterTtl = cachePolicy.courses.counters.ttlSeconds;

export async function getCachedCourseMetrics(
  courseId: string
): Promise<CounterCacheEntry | null> {
  try {
    return await cache.getJson<CounterCacheEntry>(counterKey(courseId));
  } catch (error) {
    markSharedRedisUnavailable(`course-counter-get:${courseId}`, error);
    return null;
  }
}

export async function setCachedCourseMetrics(
  courseId: string,
  entry: CounterCacheEntry
): Promise<void> {
  try {
    await cache.setJson(counterKey(courseId), entry, counterTtl);
  } catch (error) {
    markSharedRedisUnavailable(`course-counter-set:${courseId}`, error);
    // Non-fatal: page still renders with DB data
  }
}

export async function invalidateCourseMetricsCache(
  courseId: string
): Promise<void> {
  try {
    await cache.delete(counterKey(courseId));
  } catch (error) {
    markSharedRedisUnavailable(`course-counter-invalidate:${courseId}`, error);
  }
}
```

---

## 4. Creating CourseMetricsService

**File**: `src/domain/courses/application/course-metrics.service.ts` (NEW)

```typescript
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
      const courseDetails = await this.repository.findById(courseId);
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
```

---

## 5. Wiring the Factory

**File**: `src/domain/courses/factory/next-course-domain.factory.ts`

```typescript
// Add to the return type:
metrics: CourseMetricsService;

// Add to createNextCourseDomain():
const repository = new NextCoursesRepository();
return {
  catalog: new NextCourseCatalogService(repository),
  enrollment: new NextCourseEnrollmentService(repository),
  metrics: new CourseMetricsService(repository),   // NEW
};
```

---

## 6. Adding Cache Invalidation to Enrollment

**File**: `src/domain/courses/application/next-course-enrollment.service.ts`

After the existing invalidation calls, add:

```typescript
// Existing:
await invalidatePublicCourseListCache();
await invalidatePublicCourseDetailCache({ courseId, slug: course.slug });

// ADD:
await this.metricsService.invalidate(courseId);
```

This ensures the counter cache is busted after every real enrollment event.

---

## 7. Creating the API Route

**File**: `src/app/api/courses/[slug]/counters/route.ts` (NEW)

```typescript
import { NextResponse } from "next/server";
import { createNextCourseDomain } from "@/domain/courses/factory/next-course-domain.factory";
import { z } from "zod";

const slugSchema = z.string().min(1).max(200);

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const slugResult = slugSchema.safeParse(params.slug);
  if (!slugResult.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  try {
    const domain = createNextCourseDomain();
    const course = await domain.catalog.getBySlug(slugResult.data);
    if (!course) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const metrics = await domain.metrics.getCourseMetrics(
      course.id,
      course.studentsCount ?? 0
    );
    if (!metrics) {
      return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
    }

    return NextResponse.json(
      { data: metrics },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}
```

---

## 8. Building the AnimatedCounter Component

**File**: `src/components/courses/animated-counter.tsx` (NEW)

```typescript
"use client";

import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import type { AnimatedCounterProps } from "@/domain/courses/contracts/course-metrics.contract";
import { COUNTER_ANIMATION } from "./counter.constants";

function formatNumber(value: number, abbreviated: boolean): string {
  if (abbreviated && value >= 100_000) return `${Math.floor(value / 1000)}K`;
  if (abbreviated && value >= 10_000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString();
}

export function AnimatedCounter({
  value,
  label,
  suffix = "+",
  abbreviated = false,
  className,
}: AnimatedCounterProps) {
  const shouldReduceMotion = useReducedMotion();
  const previousValueRef = useRef<number>(value);
  const previousValue = previousValueRef.current;
  previousValueRef.current = value;

  const currentStr = formatNumber(value, abbreviated);
  const previousStr = formatNumber(previousValue, abbreviated);
  // Pad to same length for digit comparison
  const maxLen = Math.max(currentStr.length, previousStr.length);
  const paddedCurrent = currentStr.padStart(maxLen, " ");
  const paddedPrevious = previousStr.padStart(maxLen, " ");

  return (
    <div className={className} aria-live="polite" aria-atomic="true">
      <span className="sr-only">{currentStr}{suffix} {label}</span>
      <span className="flex items-baseline gap-0" aria-hidden="true">
        {paddedCurrent.split("").map((char, i) => {
          const prevChar = paddedPrevious[i];
          const changed = char !== prevChar;
          const delay = changed
            ? (maxLen - 1 - i) * COUNTER_ANIMATION.DIGIT_STAGGER_MS
            : 0;

          if (!changed || shouldReduceMotion) {
            return (
              <motion.span
                key={`${i}-${char}`}
                animate={{ opacity: 1 }}
                transition={{ duration: COUNTER_ANIMATION.REDUCED_MOTION_DURATION_MS / 1000 }}
              >
                {char}
              </motion.span>
            );
          }

          return (
            <span key={i} className="relative overflow-hidden inline-block">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={char}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{
                    duration: COUNTER_ANIMATION.DIGIT_DURATION_MS / 1000,
                    ease: COUNTER_ANIMATION.DIGIT_EASE,
                    delay: delay / 1000,
                  }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              </AnimatePresence>
            </span>
          );
        })}
        <span>{suffix}</span>
      </span>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
```

---

## 9. Building the ActivityBadge Component

**File**: `src/components/courses/activity-badge.tsx` (NEW)

```typescript
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { ActivityBadgeProps } from "@/domain/courses/contracts/course-metrics.contract";
import { COUNTER_ANIMATION } from "./counter.constants";

export function ActivityBadge({ increment, dismissAfterMs = COUNTER_ANIMATION.ACTIVITY_BADGE_DISMISS_MS }: ActivityBadgeProps) {
  const [visible, setVisible] = useState(increment > 0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (increment <= 0) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), dismissAfterMs);
    return () => clearTimeout(timer);
  }, [increment, dismissAfterMs]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`badge-${increment}`}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{
            enter: { duration: COUNTER_ANIMATION.ACTIVITY_BADGE_ENTRANCE_MS / 1000 },
            exit: { duration: COUNTER_ANIMATION.ACTIVITY_BADGE_EXIT_MS / 1000 },
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          role="status"
          aria-live="polite"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          +{increment} just now
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 10. Animation Constants

**File**: `src/components/courses/counter.constants.ts` (NEW)

```typescript
/**
 * @description Centralized animation timing constants for course counter components.
 * All durations are in milliseconds. Change here to affect all counter animations.
 * Aligns with the ScholarX animation tier system:
 *   Tier 1 (micro): 100–200ms
 *   Tier 2 (content): 200–350ms ← counter animations live here
 *   Tier 3 (major): 350–600ms
 */
export const COUNTER_ANIMATION = {
  DIGIT_DURATION_MS: 300,                  // Tier 2
  DIGIT_STAGGER_MS: 30,                    // Stagger between changing digit columns
  DIGIT_EASE: "easeOut" as const,
  REDUCED_MOTION_DURATION_MS: 150,         // Tier 1 — opacity only
  ACTIVITY_BADGE_DISMISS_MS: 2000,
  ACTIVITY_BADGE_ENTRANCE_MS: 200,         // Tier 2
  ACTIVITY_BADGE_EXIT_MS: 300,             // Tier 2
} as const;
```

---

## 11. Integrating into the Course Detail Page

**File**: `src/app/(platform)/courses/[slug]/page.tsx`

```tsx
import { Suspense } from "react";
import { CourseCountersSection } from "@/components/courses/course-counters-section";
import { CountersSkeleton } from "@/components/courses/counters-skeleton";

// Inside the page component, after the main course data fetch:
<Suspense fallback={<CountersSkeleton />}>
  <CourseCountersSection courseId={course.id} courseSlug={params.slug} />
</Suspense>
```

The `Suspense` boundary ensures the rest of the page (title, description, enroll button) renders immediately even if the counter data fetch takes a moment.

---

## Running Tests

```bash
# Unit tests for the service
pnpm test src/domain/courses/application/course-metrics.service.test.ts

# Unit tests for components
pnpm test src/components/courses/animated-counter.test.tsx
pnpm test src/components/courses/activity-badge.test.tsx

# Route handler tests
pnpm test src/app/api/courses/

# Full type check
pnpm tsc --noEmit

# Linting (must be clean)
pnpm lint
```
