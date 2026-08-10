# Feature Specification: Dynamic Course Counters

**Feature Branch**: `021-dynamic-course-counters`
**Created**: 2026-08-09
**Status**: Production-Ready Draft
**Author**: Principal SWE Review
**Input**: Real-time, animated course engagement metrics with multi-layer aggressive caching and a truthful-but-alive UX that builds trust rather than artificial scarcity.

---

## Vision

Course pages currently display static, hardcoded counters that do not reflect actual enrollment or engagement data. This erodes trust and misses a powerful, honest social-proof conversion opportunity.

The goal is not simply to show a live number — it is to make the platform feel **active, trustworthy, and alive** while preserving absolute data integrity. A counter that updates by 1 because one person genuinely just enrolled is worth more than a counter that inflates by 100 through fake animation. This specification draws a hard line between the two.

---

## UX Philosophy & Counter Behavior

### Guiding Principle: Truthful Aliveness

The system MUST only animate counter changes that reflect **legitimate data events**. The goal is to communicate *"this platform is active right now"* — not to simulate scarcity through fake increments.

**Prohibited Pattern**:
```
1284 → 1285 → 1286 → 1287
(when nothing happened)
```
This destroys trust when discovered, triggers regulatory scrutiny in some markets, and is architecturally dishonest.

**Required Pattern**:
```
Server value: 1,284
Legitimate enrollment event occurs
Server value: 1,285
Client animates: 1,284 → 1,285 (digit-aware transition, 250-350ms, ease-out)
```

### Three Display Layers

Every counter MUST implement these three layers in order:

**Layer 1 — Instant Render (Cached Value)**
The server-cached value renders immediately with zero loading spinner. The user perceives instant load. No layout shift. No skeleton for the number itself (only used during initial SSR when data is unavailable).

**Layer 2 — Background Revalidation**
Cached data refreshes in the background after the page loads. If the revalidated value differs from the displayed value, it animates smoothly to the new number. No jarring jump. Only the changed digit(s) transition.

**Layer 3 — Live Activity Pulse (Optional, Event-Driven)**
If a legitimate enrollment event occurs while the user is on the page, the counter animates to the new value and a transient activity indicator appears (e.g., `+1 just now`, visible for ~2 seconds then fades). This communicates real-time engagement honestly.

### Activity Indicator Pattern

When a legitimate real-time increment occurs, the UI should display a brief activity badge:

```
┌────────────────────────────────┐
│                                │
│          1,285+                │
│   Applications submitted       │
│                                │
│      ● +1 just now             │  ← fades after 2s
│                                │
└────────────────────────────────┘
```

The `+` suffix on the displayed number communicates "at least this many" which is always truthful and sets the correct expectation about staleness.

---

## Animation Hierarchy

All animation in this feature MUST conform to the ScholarX animation tier system. Counter-specific timings are called out explicitly.

### Tier 1 — Micro-interactions (100–200ms)
Used for:
- Counter badge hover state
- Icon transitions (active pulse dot)
- Focus ring appearance on counter container
- Small state changes (loading → loaded)

### Tier 2 — Content Transitions (200–350ms)
Used for (this feature's primary tier):
- **Counter digit transitions** — the primary counter animation. Target: `250–350ms`, easing: `ease-out`. Only the digit(s) that changed should move. Unchanged digits must remain perfectly still.
- Card-level counter reveal on initial mount (staggered entry, once per session)
- Dropdown / tooltip appearances
- Activity badge entrance/exit

### Tier 3 — Major Transitions (350–600ms)
Used sparingly for:
- Skeleton → content transition if data was unavailable at SSR time
- Page-level counter section reveal on first viewport entry (once, via `whileInView`, not on scroll)

### Prohibited
- Animations exceeding 800ms for any ordinary interaction
- Elastic/bounce easing on number counters (use `ease-out` only)
- Looping/pulsing animations tied to fake data
- Animating the entire number when only one digit changes

### Digit-Aware Transition Specification
Rather than animating the whole number (e.g., cross-fading `"1284"` to `"1285"`), the counter MUST decompose the number into individual digit columns. Only the digit column(s) that change animate — using a vertical roll/fade (digit slides up-out, new digit slides up-in). Unchanged columns remain static.

Example: `1284 → 1285`
- Columns `1`, `2`, `8` → no animation
- Column `4` → exits upward, `5` enters from below
- Duration: 300ms per column, staggered by 30ms if multiple columns change (rightmost first, matching natural reading of number change direction)

### Reduced Motion
The feature MUST respect the OS-level `prefers-reduced-motion` setting via `useReducedMotion()` from Framer Motion. When reduced motion is enabled:
- All counter transitions collapse to an instant cross-fade (`opacity` only, 150ms)
- No digit-roll animations
- Activity badge fades in/out without movement

---

## User Scenarios & Testing

### User Story 1 — Truthful Social Proof at First Glance (Priority: P1)

As a prospective student landing on a course page, I immediately see accurate enrollment and engagement numbers that load without a spinner, so that I can form an honest trust signal about the course's popularity and make an informed enrollment decision.

**Why this priority**: Social proof is one of the highest-leverage conversion signals. If it is static/wrong it hurts trust; if it is absent, it reduces conversion. Getting this right is high ROI.

**Independent Test**: Load the course detail page for a course with 50 known enrollments. Without logging in or waiting, the displayed enrollment counter shows `50` (or `50+`) within the page's Time-to-Interactive. Verify no database query is made for the counter on a warm cache hit.

**Acceptance Scenarios**:

1. **Given** a course with 1,284 active enrollments, **When** a user navigates to the course detail page, **Then** the enrollment counter displays `1,284+` within the First Contentful Paint, served from cache, with zero loading spinner.
2. **Given** a cached counter value is being displayed, **When** the cache TTL expires and background revalidation returns an updated count of 1,285, **Then** the counter smoothly animates from `1,284` to `1,285` using a digit-aware transition (only the last digit rolls).
3. **Given** the user lands on the course listing page, **When** each course card renders, **Then** the enrollment count badge is visible on every card without individual API calls per card (batch data, single cache read).
4. **Given** the display shows `1,285+`, **When** no real events occur, **Then** the number does not change, does not pulse, and does not animate. The counter is stable.

---

### User Story 2 — Live Activity Signal on Real Events (Priority: P2)

As a user actively browsing a course detail page, I want to see a subtle indicator when a real enrollment happens during my session, so that I feel the course is actively sought-after at this very moment.

**Why this priority**: Live signals on real events significantly outperform inflated fake counters in long-term trust metrics. This layer is valuable but optional — P1 must be solid first.

**Independent Test**: Open a course detail page in two browser windows. Enroll via the second window. Verify the first window's counter updates within the polling interval (or immediately via SSE), with a brief `+1 just now` badge, without a full page reload.

**Acceptance Scenarios**:

1. **Given** a user is viewing a course detail page, **When** a new enrollment legitimately occurs, **Then** the counter increments by 1 with a digit-aware animation and a transient `+1 just now` badge appears and fades after 2 seconds.
2. **Given** a user is viewing a course detail page, **When** no enrollment event occurs for 60 seconds, **Then** the counter does not change and no animation fires.
3. **Given** the user has `prefers-reduced-motion` enabled, **When** a live event counter update occurs, **Then** the number updates via a simple opacity cross-fade, and the `+1 just now` badge fades in without movement.

---

### User Story 3 — Resilient Counters Under Failure (Priority: P3)

As a user, I should always see a meaningful counter value even if the cache or database is temporarily unavailable, so that the course page never shows broken UI or missing information.

**Why this priority**: Reliability is a foundation requirement. A counter that causes page errors or blank sections is worse than a static one.

**Independent Test**: Disable Redis and the database simultaneously. Load a course page. Verify the page renders with the denormalized fallback count from the course record and the counter section does not show an error state.

**Acceptance Scenarios**:

1. **Given** Redis is unavailable, **When** a user visits the course page, **Then** the system falls back to querying the denormalized `studentsCount` column directly from the course record (already in-memory from the main page query), and the counter renders correctly.
2. **Given** both Redis and the database are unavailable, **When** a user visits the course page, **Then** the counter section either shows the last in-process memory cache value or is hidden with a neutral message; the rest of the page renders normally.
3. **Given** the data source returns, **When** the next cache revalidation cycle completes, **Then** the counter automatically recovers and displays fresh data without any manual intervention.

---

### Edge Cases

- **Zero enrollments**: Counter displays `Be the first to enroll` or equivalent; no animation fires on zero-to-zero states.
- **Counter overflow / very large numbers**: Numbers above `10,000` display as `10K+`, above `100,000` as `100K+`. The digit-aware animation still works on the abbreviated form's changing digits.
- **Concurrent revalidations**: If multiple tabs trigger revalidation simultaneously, the system must not produce multiple redundant database reads. The distributed cache (Redis) prevents thundering-herd on the primary database.
- **Cache poisoning**: Counter values must be validated on read (non-negative integer); any invalid cached value is discarded and re-fetched.
- **Bot traffic**: Counter cache reads must not expose any per-user data. Counters are public, non-personalized aggregates.

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST display accurate, dynamically sourced counters for enrolled students, total ratings, and star rating on every course listing card and course detail page.
- **FR-002**: Counter data MUST be served from an aggressive multi-layer cache (in-process → distributed → database) so that the primary database is never queried directly during page rendering on a warm cache hit.
- **FR-003**: Counter data MUST be revalidated in the background after the cache TTL expires. The user MUST NOT wait for revalidation — they receive the cached value immediately.
- **FR-004**: When the revalidated value differs from the displayed value, the displayed counter MUST animate to the new value using a digit-aware transition (Tier 2, 250–350ms, ease-out), not a hard jump.
- **FR-005**: If a legitimate enrollment event occurs while a user is on the detail page, the counter MUST increment by the real delta and display a transient `+N just now` activity badge that auto-dismisses after 2 seconds.
- **FR-006**: The system MUST gracefully degrade in all failure modes: Redis down → fallback to denormalized DB column; DB also down → fallback to in-process memory; all fail → hide counter (do not show zero or error state, do not break page render).
- **FR-007**: Counters MUST format large numbers with locale-aware separators (e.g., `1,284`) and abbreviate numbers above `10,000` as `10K+`.
- **FR-008**: All counter animations MUST be disabled when the user has `prefers-reduced-motion` enabled at the OS level, replaced with a plain opacity transition.
- **FR-009**: The `+` suffix MUST always accompany displayed numbers (communicating "at least this many") to maintain honesty about potential staleness.
- **FR-010**: The activity pulse indicator (live `+N just now` badge) MUST only fire for legitimate, server-confirmed events; it MUST NOT auto-fire based on timers, fake increments, or client-side speculation.

### Non-Functional Requirements

- **NFR-001**: The caching layer MUST support three tiers: (1) in-process memory for sub-millisecond hits, (2) distributed Redis for cross-instance cache sharing, (3) direct database query as the ultimate fallback.
- **NFR-002**: Counter-specific cache TTL MUST be configurable independently from the main course detail cache TTL. Default: 300 seconds (5 minutes). This value MUST live in a single centralized cache policy file.
- **NFR-003**: The implementation MUST adhere to SOLID principles: Single Responsibility (one service for counter reads, one for cache operations), Open/Closed (cache backend swappable via the existing `CachePort` interface), Dependency Inversion (service depends on `CachePort` abstraction, not concrete Redis client).
- **NFR-004**: All new TypeScript code MUST be fully and explicitly typed. No `any`, no `unknown` without validation. Counter values returned to components must use named types, not raw primitives.
- **NFR-005**: The entire counter infrastructure MUST be covered by unit tests. The service must be testable with a mock `CachePort` and mock repository — no real Redis or database connections in tests.
- **NFR-006**: Counter fetching MUST NOT block the critical rendering path of the course page. It MUST be wrapped in `React.Suspense` with a skeleton fallback so that the rest of the page renders immediately.
- **NFR-007**: No counter value or cache key MUST contain user-specific data (e.g., userId). Counters are public aggregates and may be cached publicly.
- **NFR-008**: Every new file introduced MUST have a JSDoc module comment explaining its role, the layer it lives in, and what it depends on.

### Key Entities

- **CourseMetrics**: An aggregate value object containing `enrollmentCount`, `ratingCount`, and `averageRating` for a given `courseId`. Immutable after construction. Must be serializable to/from the cache (plain JSON, no class instances).
- **CounterCacheEntry**: A timestamped wrapper around `CourseMetrics` that includes `cachedAt` (ISO string) and `version` (version key UUID) to support stale-while-revalidate semantics and cache busting.
- **CourseMetricsService**: The single domain service responsible for fetching, caching, and returning `CourseMetrics`. Depends on `CachePort` and a read-only repository interface.
- **AnimatedCounter** (UI): A Client Component that accepts a `value: number` prop, manages the previous value in local state, and fires the digit-aware Framer Motion animation only when `value` changes.
- **ActivityBadge** (UI): A Client Component that accepts an `increment: number` prop (triggered by live events), displays `+N just now`, and auto-dismisses using an `AnimatePresence` exit animation after 2 seconds.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Course pages serve counter data within the existing First Contentful Paint budget — adding the dynamic counter MUST NOT increase measured TTFB by more than 5ms on a warm cache hit.
- **SC-002**: At least 99% of all counter reads are served from the Redis or in-process cache layer, with fewer than 1% reaching the primary database on steady-state traffic.
- **SC-003**: The system sustains 10,000 concurrent course page requests with counter data served entirely from cache, with zero database query fan-out.
- **SC-004**: Counter staleness (time between a real enrollment and the counter reflecting it on a subsequent page view) does not exceed the configured cache TTL (default: 5 minutes) in the expected case, and never exceeds 10 minutes in any case.
- **SC-005**: No page rendering failure is attributable to the counter subsystem under any cache/database failure condition. The rest of the course page renders fully in all degraded states.
- **SC-006**: 100% of counter animations pass the `prefers-reduced-motion` compliance test — no movement animations fire when the media query is active.
- **SC-007**: The digit-aware animation does not produce visual jitter, does not change digits that did not change in the underlying data, and completes within 350ms as measured in Chrome DevTools.

---

## Assumptions

- Enrollment data (the source of truth for `enrollmentCount`) is stored in the `subscriptions` table with an `is_active = true` flag, and a live count query is feasible within the acceptable response time.
- The existing `courses.students_count` denormalized column is kept in sync by the enrollment service (via `incrementStudents`) and is a reliable fallback when live counting is unavailable.
- Minor counter staleness of up to 5 minutes is acceptable and will be clearly communicated via the `+` suffix convention.
- The live event mechanism (Layer 3) can be implemented via polling (SSE or TanStack Query `refetchInterval`) on the course detail page only; a full WebSocket infrastructure is out of scope for this feature.
- Framer Motion (already installed at v12.35.2) is the animation library of record. No new animation library will be introduced.
- The existing `CachePort` abstraction in `src/lib/cache/` is the only approved interface for all caching operations in this feature. Direct `ioredis` or `@upstash/redis` client calls in application/domain code are prohibited.
