# Implementation Plan: Dynamic Course Counters

**Branch**: `021-dynamic-course-counters` | **Date**: 2026-08-09
**Spec**: [spec.md](file:///C:/Users/dell/Documents/ScholarX/V2/web/specs/021-dynamic-course-counters/spec.md)
**Reviewed By**: Principal SWE Review

---

## Summary

This plan converts the hardcoded, static enrollment and rating counters displayed on the ScholarX course listing and course detail pages into dynamically sourced, aggressively cached, and truthfully animated metrics.

The architecture introduces no new infrastructure dependencies. It slots into the **existing** multi-layer cache ecosystem (`src/lib/cache/`) and the **existing** courses domain (`src/domain/courses/`) by adding one focused service, a few cache helpers, and a thin UI layer built with Framer Motion.

The UX philosophy is explicit: counters must be **truthful and alive**, not inflated. Animations fire only on legitimate data changes, using digit-aware transitions so only the changing digit(s) move. A transient activity badge (`+N just now`) communicates real-time enrollment events honestly.

---

## Technical Context

| Field | Value |
|---|---|
| **Language / Runtime** | TypeScript 5, Node.js 20 (Vercel Edge / Serverless) |
| **Framework** | Next.js 16.2.6 — App Router, React Server Components, Suspense |
| **React** | 19.2.3 (concurrent features, `use()` hook available) |
| **ORM / DB** | Drizzle ORM 0.45.1 on PostgreSQL (via `pg` driver) |
| **Cache Layer** | Existing `CachePort` abstraction in `src/lib/cache/` — Upstash REST → ioredis → in-process memory |
| **Animation** | Framer Motion 12.35.2 (`useReducedMotion` + `AnimatePresence` + `motion.*`) |
| **State (client)** | TanStack React Query 5.90.21 for background revalidation polling |
| **Validation** | Zod 4.3.6 for cache-read validation guards |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **Observability** | Sentry 10.52.0 (already wired) |
| **Performance Goals** | TTFB from cache: <5ms overhead; sustained 10k req/s counter-reads from cache |
| **Constraints** | No direct `ioredis`/`@upstash/redis` calls in application code; use `CachePort` only. No new npm dependencies. |

---

## Constitution Check

*Gates evaluated against ScholarX Constitution v1.0.0. Must pass before implementation begins.*

| Principle | Status | Evidence |
|---|---|---|
| **I. Architecture & SOLID** | ✅ PASS | `CourseMetricsService` has Single Responsibility (counter reads only). `CachePort` interface enforces Dependency Inversion. Repository interface enforces Open/Closed — swap backends without touching service logic. |
| **II. Type Safety** | ✅ PASS | `CourseMetrics`, `CounterCacheEntry`, all function signatures fully typed. Zod guard validates cache reads. No `any`. |
| **III. Testing** | ✅ PASS | `CourseMetricsService` tested with mock `CachePort` and mock repository. `AnimatedCounter` tested with `@testing-library/react`. |
| **IV. Premium UX** | ✅ PASS | Digit-aware Framer Motion transitions. `useReducedMotion` compliance. Suspense skeleton prevents layout shift. Activity badge with `AnimatePresence`. |
| **V. Performance & Scalability** | ✅ PASS | Three-tier cache (memory → Redis → DB). Counter reads never block page render (Suspense). Counters are public aggregates — safe for edge caching. |

---

## Critical Corrections (vs. Initial Draft Plan)

> These errors were found during production review and are corrected in this document.

| Error in Initial Draft | Corrected Value |
|---|---|
| `src/app/(public)/course/[id]/page.tsx` | `src/app/(platform)/courses/[slug]/` (actual route group and slug-based routing) |
| `src/domain/course/` | `src/domain/courses/` (plural — matches actual directory) |
| `src/lib/redis/client.ts` | Use existing `src/lib/cache/cache.factory.ts` → `createServerCache()`. **No new Redis client.** |
| `src/components/features/course/` | `src/components/courses/` (actual component directory) |
| Counter data "doesn't exist yet" | `courses.students_count`, `courses.rating`, `courses.total_ratings` already exist as denormalized columns on the `courses` table and are returned by the existing repository. The task is to add a **separate counter-specific cache layer** with a longer TTL, not to invent new data. |
| New Redis dependency | ❌ Not needed. `@upstash/redis` already in `package.json`. |

---

## Architecture Design

### Caching Architecture — Three-Tier Strategy

```
Request for course counters
           │
           ▼
┌─────────────────────┐
│  Tier 1: In-Process │  Hit → return immediately (<1ms)
│  Memory Cache       │
└─────────────────────┘
           │ Miss
           ▼
┌─────────────────────┐
│  Tier 2: Redis      │  Hit → populate Tier 1, return (<5ms)
│  (Upstash REST)     │  TTL: 300s (configurable)
└─────────────────────┘
           │ Miss
           ▼
┌─────────────────────┐
│  Tier 3: Database   │  Query subscriptions table COUNT(*)
│  (PostgreSQL)       │  → populate Tier 2 + Tier 1
└─────────────────────┘
           │ Failure at ALL tiers
           ▼
┌─────────────────────┐
│  Fallback: Use      │  courses.students_count (denormalized,
│  Denormalized Col   │  already loaded with main course query)
└─────────────────────┘
```

### Counter Update Flow — Stale-While-Revalidate

```
User visits page
      │
      ▼
Server Component fetches CourseMetrics
      │
      ├─ Cache HIT → render immediately, schedule background revalidation
      │
      └─ Cache MISS → DB query → populate cache → render
                │
                ▼
Client receives rendered HTML with cached counter value
      │
      ▼
TanStack Query client polls /api/courses/[slug]/counters
every 5 minutes (configurable, same as Redis TTL)
      │
      ├─ Value unchanged → no action, no animation
      │
      └─ Value changed → AnimatedCounter re-renders
                │         digit-aware Framer Motion transition
                ▼
             If legitimate event detected:
             ActivityBadge renders "+N just now"
             Auto-dismisses after 2 seconds (AnimatePresence)
```

### SOLID Principle Mapping

```
┌──────────────────────────────────────────────────────────────────┐
│                    DEPENDENCY GRAPH                              │
│                                                                  │
│  CourseMetricsService                                            │
│    depends on:  CachePort (interface)  ← Dependency Inversion   │
│    depends on:  CountersRepository (interface)                   │
│    does:        getCourseMetrics(courseId) only                  │
│                 Single Responsibility                            │
│                                                                  │
│  CachePort (interface, already exists in lib/cache/)            │
│    implemented by: UpstashCacheAdapter                          │
│    implemented by: RedisCacheAdapter                            │
│    implemented by: MemoryCacheAdapter                           │
│    → swap backend without touching service  Open/Closed         │
│                                                                  │
│  CountersRepository (interface, NEW)                            │
│    implemented by: DrizzleCountersRepository (NEW)              │
│    method: getLiveEnrollmentCount(courseId): Promise<number>    │
│    → swap DB without touching service  Open/Closed              │
│                                                                  │
│  CourseMetricsService                                            │
│    does NOT:  directly import ioredis or @upstash/redis          │
│    does NOT:  directly call db.select()                          │
│    does NOT:  handle UI or formatting                            │
│               Interface Segregation                              │
└──────────────────────────────────────────────────────────────────┘
```

### UI Component Architecture

```
CoursePage (Server Component)
  └─ <Suspense fallback={<CountersSkeleton />}>
       └─ <CourseCountersSection courseId slug />
            │  (Server Component — fetches CourseMetrics from service)
            └─ <CourseCountersDisplay metrics />
                 │  (Client Component — receives metrics as props)
                 ├─ <AnimatedCounter value={enrollmentCount} label="students enrolled" />
                 ├─ <AnimatedCounter value={ratingCount} label="reviews" />
                 ├─ <AnimatedRating value={averageRating} />
                 └─ <ActivityBadge increment={liveIncrement} />

CoursesListingPage (Server Component)
  └─ <CourseCard course={course}>
       └─ <InlineEnrollmentBadge count={course.studentsCount} />
            (simpler — uses denormalized column, no extra cache read per card)
```

---

## Project Structure

### Documentation (this feature)

```text
specs/021-dynamic-course-counters/
├── plan.md              ← this file
├── spec.md              ← production-grade feature specification
├── research.md          ← caching strategy decisions
├── data-model.md        ← cache schema, TypeScript types, DB queries
├── quickstart.md        ← developer usage guide
└── tasks.md             ← generated by /speckit-tasks
```

### Source Code (corrected paths, repository root)

```text
src/
│
├── app/
│   └── (platform)/
│       └── courses/
│           ├── page.tsx                         ← EXISTS. Pass studentsCount from course record
│           └── [slug]/
│               └── page.tsx                     ← EXISTS. Add CourseCountersSection here
│
├── components/
│   └── courses/
│       ├── course-counters-section.tsx          ← NEW: Server Component. Fetches CourseMetrics.
│       ├── course-counters-display.tsx          ← NEW: Client Component. Renders animated counters.
│       ├── animated-counter.tsx                 ← NEW: Digit-aware animated number (Client Component).
│       ├── activity-badge.tsx                   ← NEW: "+N just now" transient badge (Client Component).
│       ├── counters-skeleton.tsx                ← NEW: Suspense fallback skeleton.
│       └── inline-enrollment-badge.tsx          ← NEW: Compact badge for course cards.
│
├── domain/
│   └── courses/
│       ├── application/
│       │   ├── course-cache.ts                  ← EXISTS. ADD counter cache helpers here.
│       │   └── course-metrics.service.ts        ← NEW: CourseMetricsService class.
│       ├── contracts/
│       │   ├── course-catalog.contract.ts       ← EXISTS. Add CourseMetrics type here or...
│       │   └── course-metrics.contract.ts       ← NEW: CourseMetrics, CounterCacheEntry types.
│       ├── factory/
│       │   └── next-course-domain.factory.ts    ← EXISTS. Wire CourseMetricsService here.
│       └── infrastructure/
│           └── db/
│               ├── next-courses.repository.ts   ← EXISTS. Add getLiveEnrollmentCount() here.
│               └── counters.repository.ts       ← NEW (alt): Dedicated counter DB queries.
│
└── lib/
    └── cache/
        └── cache-policy.ts                      ← EXISTS. ADD counters TTL + key generators.
```

---

## Phase 0: Research (Complete)

All unknowns resolved. See [`research.md`](file:///C:/Users/dell/Documents/ScholarX/V2/web/specs/021-dynamic-course-counters/research.md).

Key decisions locked:
- **Cache backend**: Existing `CachePort` / `createServerCache()`. No new client.
- **Counter TTL**: 300s (5 minutes), independent from 60s course detail TTL.
- **Live events**: TanStack Query polling (5-min interval) on detail page. Not SSE/WebSocket for v1.
- **Fallback chain**: Redis → in-process memory → denormalized `studentsCount` column → hide counter.
- **Animation library**: Framer Motion (already installed). No additions.
- **Source of truth**: `SELECT COUNT(*) FROM subscriptions WHERE course_id=$1 AND is_active=true`

---

## Phase 1: Design & Contracts

### 1.1 New TypeScript Contracts

**File**: `src/domain/courses/contracts/course-metrics.contract.ts`

```typescript
/**
 * @module course-metrics.contract
 * @layer domain/courses/contracts
 * @description Value types for course engagement metrics.
 * These are plain serializable objects — no class instances,
 * safe for JSON cache serialization.
 */

/** Immutable aggregate of public course engagement metrics. */
export interface CourseMetrics {
  readonly courseId: string;
  readonly enrollmentCount: number;  // active subscriptions (is_active=true)
  readonly ratingCount: number;      // total_ratings from courses table
  readonly averageRating: number;    // rating from courses table (0–5)
  readonly source: "live" | "cache" | "fallback"; // observability: where did this come from?
}

/** Cache-serialized wrapper. Enables stale detection without extra Redis calls. */
export interface CounterCacheEntry {
  readonly metrics: CourseMetrics;
  readonly cachedAt: string;   // ISO-8601 UTC
  readonly ttlSeconds: number; // echo of the TTL used, for debugging
}

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
```

### 1.2 Cache Policy Addition

**File**: `src/lib/cache/cache-policy.ts` (MODIFY, add to existing `courses` section)

```typescript
// ADD to the existing courses cache policy object:
counters: {
  ttlSeconds: 300,                        // 5 min — independent from 60s detail TTL
  versionTtlSeconds: 60 * 60 * 24 * 365, // 1 year version key
  // Key generator — namespaced under courses:counters:
  key: (courseId: string) => `courses:counters:${courseId}`,
  versionKey: () => `courses:counters:version`,
},
```

### 1.3 Cache Helper Additions

**File**: `src/domain/courses/application/course-cache.ts` (MODIFY, add)

```typescript
// Follows identical pattern to existing getCachedPublicCourseDetailById

export async function getCachedCourseMetrics(
  courseId: string
): Promise<CourseMetrics | null>

export async function setCachedCourseMetrics(
  courseId: string,
  metrics: CourseMetrics
): Promise<void>

export async function invalidateCourseMetricsCache(
  courseId: string
): Promise<void>
```

All three functions MUST wrap Redis calls in `try/catch` and return `null` / log the error on failure (matching the existing graceful degradation pattern in the same file).

### 1.4 CourseMetricsService

**File**: `src/domain/courses/application/course-metrics.service.ts` (NEW)

```typescript
/**
 * @module course-metrics.service
 * @layer domain/courses/application
 * @description Single-responsibility service for reading course engagement metrics.
 * Implements a three-tier cache read: Redis → in-process memory → database.
 * Depends on CachePort and CountersRepositoryPort interfaces (never concrete classes).
 * @see CachePort
 * @see CountersRepositoryPort
 */
export class CourseMetricsService {
  constructor(
    private readonly cache: CachePort,       // injected — Dependency Inversion
    private readonly repository: CountersRepositoryPort  // injected
  ) {}

  /**
   * Returns CourseMetrics for a given course, preferring cached values.
   * Never throws — returns a fallback or null on complete failure.
   */
  async getCourseMetrics(courseId: string): Promise<CourseMetrics | null>

  /**
   * Invalidates the cached metrics for a course.
   * Called by enrollment service after a successful enrollment.
   */
  async invalidate(courseId: string): Promise<void>
}
```

### 1.5 Repository Addition

**File**: `src/domain/courses/infrastructure/db/next-courses.repository.ts` (MODIFY)
Add method: `getLiveEnrollmentCount(courseId: string): Promise<number>`

```typescript
// Query:
// SELECT COUNT(*)
// FROM subscriptions
// WHERE course_id = $1 AND is_active = true
```

This query MUST use the existing Drizzle `db` client. The result is a single integer. If the query fails, the method throws (the service layer handles the fallback).

### 1.6 Domain Factory Update

**File**: `src/domain/courses/factory/next-course-domain.factory.ts` (MODIFY)

```typescript
// ADD to the factory return type:
export interface NextCourseDomainServices {
  catalog: NextCourseCatalogService;
  enrollment: NextCourseEnrollmentService;
  metrics: CourseMetricsService;  // NEW
}

// Wire in createNextCourseDomain():
const cache = createServerCache();
metrics: new CourseMetricsService(cache, repository),
```

### 1.7 Enrollment Service — Cache Invalidation Hook

**File**: `src/domain/courses/application/next-course-enrollment.service.ts` (MODIFY)

After a successful enrollment, call `metricsService.invalidate(courseId)`. This ensures the counter reflects the new enrollment on the next page load within the TTL window.

```typescript
// After: await invalidatePublicCourseDetailCache(...)
await this.metricsService.invalidate(courseId);
```

### 1.8 API Route for Client-Side Polling

**File**: `src/app/api/courses/[courseId]/counters/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Thin route handler returning CourseMetrics for a course ID.
 * Used by TanStack Query on the course detail page for background revalidation.
 * Returns cached data — does NOT bypass cache.
 * Public route, no authentication required.
 * Response: { data: { enrollmentCount, ratingCount, averageRating, source } }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse>
```

Validates `courseId` param. Calls `courseDomain.metrics.getCourseMetrics(courseId)`. Returns `{ data: CourseMetrics }` or `{ error: "not_found" }` (404) or `{ error: "service_unavailable" }` (500) with appropriate HTTP status. Adds `Cache-Control: public, s-maxage=300, stale-while-revalidate=60` header.

### 1.9 UI Components

#### `course-counters-section.tsx` (Server Component)

```typescript
/**
 * @description Server Component. Fetches CourseMetrics from CourseMetricsService
 * and passes them as props to the Client Component for display and animation.
 * Wrapped in Suspense by the parent page — never blocks render.
 */
export async function CourseCountersSection({
  courseId,
  slug,
}: {
  courseId: string;
  slug: string;
}): Promise<JSX.Element>
```

#### `course-counters-display.tsx` (Client Component)

```typescript
"use client";
/**
 * @description Client Component. Receives initial metrics as props (from SSR).
 * Uses TanStack Query to poll the counters API route every 5 minutes.
 * Passes updated values to AnimatedCounter children, which handle transitions.
 * Manages ActivityBadge visibility based on delta between poll cycles.
 */
export function CourseCountersDisplay({
  initialMetrics,
  courseSlug,
}: {
  initialMetrics: CourseMetrics;
  courseSlug: string;
}): JSX.Element
```

#### `animated-counter.tsx` (Client Component)

```typescript
"use client";
/**
 * @description Digit-aware animated number display.
 * Decomposes the number into individual digit columns.
 * Only animates digit columns whose value has changed.
 * Respects prefers-reduced-motion via useReducedMotion().
 *
 * Animation spec:
 *   - Changed digit: vertical roll, duration 300ms, ease-out
 *   - Stagger: 30ms between columns (rightmost first)
 *   - Reduced motion: opacity cross-fade only, 150ms
 *   - Format: locale-aware (toLocaleString) + abbreviation for ≥10K
 */
export function AnimatedCounter({
  value,
  label,
  suffix = "+",
  abbreviated = false,
  className,
}: AnimatedCounterProps): JSX.Element
```

#### `activity-badge.tsx` (Client Component)

```typescript
"use client";
/**
 * @description Transient activity badge. Renders "+N just now" for a
 * confirmed real enrollment event. Auto-dismisses after dismissAfterMs (default: 2000ms).
 * Uses AnimatePresence for exit animation. Respects reduced motion.
 * MUST only be rendered when increment > 0 and the event was server-confirmed.
 */
export function ActivityBadge({
  increment,
  dismissAfterMs = 2000,
}: ActivityBadgeProps): JSX.Element | null
```

#### `counters-skeleton.tsx`

```typescript
/**
 * @description Suspense fallback for CourseCountersSection.
 * Renders placeholder bars matching the expected counter layout.
 * Must match the dimensions of the real component to prevent layout shift.
 */
export function CountersSkeleton(): JSX.Element
```

---

## Phase 2: Enrollment Service Integration (Cache Invalidation)

When a user enrolls in a course, the existing enrollment service (`next-course-enrollment.service.ts`) already:
1. Calls `incrementStudents(courseId)` to bump the denormalized column
2. Calls `invalidatePublicCourseListCache()` and `invalidatePublicCourseDetailCache()`

**New step to add**: After step 2, also call `metricsService.invalidate(courseId)` to invalidate the counter-specific cache. This ensures the next counter poll returns the fresh count.

This is the **only** place counter cache invalidation should be triggered — keeping the invalidation logic co-located with the mutation, not scattered across the codebase.

---

## Animation Implementation Details

### Digit-Aware Counter Algorithm

```
1. Receive new `value` prop. Previous value is held in useRef.
2. Format both values to strings (locale-aware), pad to same length.
3. Zip by character index. Identify positions where characters differ.
4. For each position:
   a. If unchanged: render static digit span.
   b. If changed: render Framer Motion animated span.
      - exit: { y: "100%", opacity: 0 }, duration: 300ms, ease: "easeOut"
      - enter: { y: "-100%", opacity: 0 } → { y: 0, opacity: 1 }, duration: 300ms, ease: "easeOut"
      - delay: (total_changing_positions - position_index) * 30ms
        (rightmost digit animates first, natural number-change direction)
5. useReducedMotion() → if true, skip step 4b, use { opacity } only.
6. After animation completes, update previousValue ref.
```

### Animation Constants (define in a single file)

```typescript
// src/components/courses/counter.constants.ts
export const COUNTER_ANIMATION = {
  DIGIT_DURATION_MS: 300,
  DIGIT_STAGGER_MS: 30,
  DIGIT_EASE: "easeOut",
  REDUCED_MOTION_DURATION_MS: 150,
  ACTIVITY_BADGE_DISMISS_MS: 2000,
  ACTIVITY_BADGE_ENTRANCE_MS: 200,
  ACTIVITY_BADGE_EXIT_MS: 300,
} as const;
```

### Framer Motion Usage Patterns (matching codebase convention)

```tsx
// Match existing pattern from courses-hero.tsx and latest-courses-section.tsx:
const shouldReduceMotion = useReducedMotion();

// AnimatePresence for activity badge:
<AnimatePresence>
  {isVisible && (
    <motion.div
      key="activity-badge"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: shouldReduceMotion ? 0.15 : 0.2 }}
    >
      +{increment} just now
    </motion.div>
  )}
</AnimatePresence>
```

---

## Testing Plan

### Unit Tests

| File | Test Cases |
|---|---|
| `course-metrics.service.test.ts` | Cache HIT → returns cached value, no DB call; Cache MISS → calls DB, populates cache; DB throws → returns fallback from denormalized column; Both fail → returns null; `invalidate()` → calls cache.delete() |
| `animated-counter.test.tsx` | Renders correct number; Digit decomposition correct; Only changed digits receive motion props; `useReducedMotion=true` → no transform animations; `abbreviated=true` → formats 10K+ correctly |
| `activity-badge.test.tsx` | Renders when increment > 0; Does not render when increment = 0; Calls dismiss callback after `dismissAfterMs`; Does not move when reduced motion |
| `counters-route.test.ts` | Returns 200 with CourseMetrics; Returns 404 for unknown slug; Returns Cache-Control header; Does not expose internal errors |

### Integration Tests (Playwright)

| Scenario | Assertion |
|---|---|
| Course detail page renders with counters | Counter section visible, number matches DB value, no layout shift |
| Enrollment → counter updates | After enrolling, counter on next page load shows incremented value |
| Redis down simulation | Page renders, counters show fallback value, no error state visible |
| `prefers-reduced-motion` | No transform-based animations fire, opacity-only transitions used |

---

## Verification Plan

### Automated
```bash
pnpm test src/domain/courses/application/course-metrics.service.test.ts
pnpm test src/components/courses/animated-counter.test.tsx
pnpm test src/app/api/courses/\[slug\]/counters/route.test.ts
pnpm tsc --noEmit   # must pass with zero errors
pnpm lint           # must pass with zero warnings in changed files
```

### Manual (staging)
1. Deploy to staging. Open course detail page in Chrome DevTools → Network tab.
2. Verify: no request to `/api/courses/*/counters` on initial SSR render (data comes from server).
3. Wait 5 minutes → verify background poll fires and counter updates with animation if value changed.
4. Enroll in a course via another tab → return to detail page → verify counter increments with digit animation and activity badge.
5. Toggle Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → verify zero transform animations.
6. Disable Redis env vars → reload page → verify counter still renders (fallback to denormalized column), no error states.
