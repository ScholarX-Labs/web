# Data Model & Cache Schema: Dynamic Course Counters

## 1. Core TypeScript Types

> These types live in `src/domain/courses/contracts/course-metrics.contract.ts`.

```typescript
/**
 * Immutable value object representing public engagement metrics for a course.
 * Serializable to plain JSON — no class instances, no functions, no circular refs.
 * Safe for Redis cache storage and HTTP API responses.
 */
export interface CourseMetrics {
  readonly courseId: string;
  readonly enrollmentCount: number;   // Active subscriptions (is_active = true)
  readonly ratingCount: number;       // Total number of ratings (courses.total_ratings)
  readonly averageRating: number;     // Average star rating, 0–5 (courses.rating)
  readonly source: "live" | "cache" | "fallback";
  // "live"     → came from a fresh DB COUNT query
  // "cache"    → served from Redis / in-process memory
  // "fallback" → served from denormalized courses.students_count column
}

/**
 * Serialized cache envelope. Wraps CourseMetrics with metadata for debugging
 * and stale-detection without extra cache reads.
 */
export interface CounterCacheEntry {
  readonly metrics: CourseMetrics;
  readonly cachedAt: string;    // ISO-8601 UTC, e.g. "2026-08-09T16:00:00.000Z"
  readonly ttlSeconds: number;  // Echo of the TTL used — useful in cache inspection
}

/** Props for the AnimatedCounter UI component (Client Component). */
export interface AnimatedCounterProps {
  value: number;
  label: string;
  suffix?: string;        // default: "+". Appended after the number.
  abbreviated?: boolean;  // true → "10K+", false → "10,000+"
  className?: string;
}

/** Props for the ActivityBadge UI component (Client Component). */
export interface ActivityBadgeProps {
  increment: number;         // Confirmed positive delta. Must be > 0 to render.
  dismissAfterMs?: number;   // default: 2000
}
```

---

## 2. Zod Validation Guards

> Used by `CourseMetricsService` to validate values read from cache before returning them.
> Prevents corrupted cache entries from causing runtime errors downstream.

```typescript
import { z } from "zod";

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

export type ValidatedCourseMetrics = z.infer<typeof CourseMetricsSchema>;
```

---

## 3. Redis Cache Schema

### Key Pattern
```
courses:counters:{courseId}
```
Where `{courseId}` is the UUID primary key of the course record.

**Example**: `courses:counters:f7a3b2c1-1234-5678-9abc-def012345678`

### Value Structure
The cached value is a JSON-serialized `CounterCacheEntry`:
```json
{
  "metrics": {
    "courseId": "f7a3b2c1-1234-5678-9abc-def012345678",
    "enrollmentCount": 1284,
    "ratingCount": 312,
    "averageRating": 4.8,
    "source": "cache"
  },
  "cachedAt": "2026-08-09T16:00:00.000Z",
  "ttlSeconds": 300
}
```

### TTL
**300 seconds (5 minutes)** — configurable via `cachePolicy.courses.counters.ttlSeconds`.

### Version Key (Cache Busting)
```
courses:counters:version  →  UUID (bumped on enrollment events)
```
The version key is appended to the counter key in production environments to support instant global invalidation (matching the existing version-bump pattern in `cache-semantics.ts`).

---

## 4. Database Queries

### Primary: Live Enrollment Count
```sql
-- Source: subscriptions table
-- Purpose: Accurate active enrollment count (not affected by revocations)
SELECT COUNT(*)::integer AS enrollment_count
FROM subscriptions
WHERE course_id = $1
  AND is_active = true;
```

### Drizzle ORM Equivalent
```typescript
// In NextCoursesRepository.getLiveEnrollmentCount(courseId)
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
```

### Fallback: Denormalized Column Read
When the live count query fails, fall back to `courses.students_count`:
```typescript
// Already loaded as part of the main course detail query.
// No extra DB round-trip required.
const fallbackCount = course.studentsCount ?? 0;
```

---

## 5. API Route Response Schema

**Endpoint**: `GET /api/courses/[courseId]/counters`

**Response body** (application/json):
```typescript
// Success (HTTP 200) — CourseMetrics payload directly
{
  courseId: string;             // UUID
  enrollmentCount: number;      // integer
  ratingCount: number;          // integer
  averageRating: number;        // 0–5, 2 decimal places
  source: "live" | "cache" | "fallback";
}

// Invalid courseId (HTTP 400) — non-UUID param
{
  error: "Invalid courseId"
}

// Not found (HTTP 404)
{
  error: "Course metrics not found"
}

// Server error (HTTP 500) — never exposes internal details
{
  error: "Internal Server Error"
}
```

**Response headers**:
```
Cache-Control: public, s-maxage=300, stale-while-revalidate=60
```
This allows the Vercel CDN to cache the response at the edge for 300 seconds, with a 60-second stale-while-revalidate window — perfectly aligned with the Redis TTL.

---

## 6. Existing Schema References

All field names below are sourced directly from the Drizzle schema in `src/db/schema/courses-db.schema.ts`.

| Drizzle Column | Type | Purpose in this feature |
|---|---|---|
| `courses.id` | `uuid` | Cache key component |
| `courses.slug` | `varchar` | Route param for API endpoint |
| `courses.students_count` | `integer` | Fallback for `enrollmentCount` |
| `courses.rating` | `numeric(3,2)` | Source for `averageRating` |
| `courses.total_ratings` | `integer` | Source for `ratingCount` |
| `subscriptions.course_id` | `uuid` | Filter in live COUNT query |
| `subscriptions.is_active` | `boolean` | Filter for active enrollments |

---

## 7. CourseMetricsService — Read Algorithm

```
getCourseMetrics(courseId):
  1. Try cache.getJson(counterKey(courseId))
     - On success: validate with Zod schema
       - Valid:   return { ...cached.metrics, source: "cache" }
       - Invalid: log warn, proceed to step 2
     - On error: log error, proceed to step 2

  2. Try repository.getLiveEnrollmentCount(courseId)
     - On success:
       a. Also read course.ratingCount, course.averageRating from DB
          (these come from the existing cached course detail or a lightweight DB read)
       b. Construct CourseMetrics with source: "live"
       c. await cache.setJson(counterKey, entry, TTL_SECONDS)
       d. return metrics
     - On error: log error, proceed to step 3

  3. Fallback: accept a pre-fetched `course` record (passed as optional arg)
     - If course.studentsCount exists: return { ..., source: "fallback" }
     - If no course record: return null
```
