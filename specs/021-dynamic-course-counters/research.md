# Research: Dynamic Course Counters

## Decision Log

All unknowns were resolved by inspecting the existing `src/lib/cache/`, `src/domain/courses/`, and `src/db/schema/` implementations prior to planning.

---

### Decision 1: Cache Client — Use Existing `CachePort`, Not a New Redis Client

**Decision**: All caching operations use the existing `createServerCache()` factory from `src/lib/cache/cache.factory.ts`, which returns a `CachePort`-compliant adapter (Upstash REST → ioredis TCP → in-process memory, in priority order).

**Rationale**: The codebase already has a fully-featured, circuit-breaker-wrapped, multi-backend cache abstraction. Introducing a new direct `ioredis` or `@upstash/redis` call in the application/domain layer would violate the Dependency Inversion principle and duplicate the fallback/circuit-breaker logic already implemented in `shared-redis.ts` and `upstash-cache.adapter.ts`.

**Alternatives rejected**:
- Direct `@upstash/redis` call in the service: would bypass the circuit-breaker and the in-process memory fallback, reducing resilience.
- New `lib/redis/client.ts`: redundant — the client is already created and exported by `cache.factory.ts`.

---

### Decision 2: Counter TTL — 300 Seconds, Separate from Course Detail TTL

**Decision**: Counter-specific cache entries use a TTL of 300 seconds (5 minutes), stored under the key pattern `courses:counters:{courseId}`. This is completely independent from the existing 60-second course detail cache TTL.

**Rationale**: Course detail data (titles, descriptions, video lists) needs to be fresher because it directly affects navigation and content consumption. Counter data (enrollment count) has a much higher acceptable staleness because: (a) it is only social proof, not functional data; (b) enrollment is not an event that happens every second for most courses; (c) a lower TTL would increase DB load from background revalidations with no meaningful UX improvement.

**Alternatives rejected**:
- Same 60s TTL as course detail: generates unnecessary DB queries every minute per active course.
- 15-minute TTL: acceptable for most cases, but may feel stale on high-growth courses during a launch period. 5 minutes is a reasonable default that is also configurable.

---

### Decision 3: Source of Truth — Live COUNT Query, Not Denormalized Column (Primary Path)

**Decision**: The primary data source for `enrollmentCount` is a live `COUNT(*)` on the `subscriptions` table (`WHERE course_id=$1 AND is_active=true`), cached at the 300s TTL. The denormalized `courses.students_count` column serves as the **fallback** (not the primary path) when both the Redis cache and the database COUNT query are unavailable.

**Rationale**: The denormalized `students_count` column is updated by `incrementStudents()` on enrollment, which is correct for increment operations. However, it does not automatically reflect decrements (e.g., refunds, admin revocations via `is_active=false`). A live COUNT query on the subscriptions table is the canonical truth. Since this query is cached for 5 minutes, its DB cost is negligible at any reasonable traffic scale.

**Alternatives rejected**:
- Using only `students_count`: Not accurate for decrements; doesn't represent the real active count.
- Using only `total_ratings` from the courses table: For rating count this is fine (already denormalized correctly), so `ratingCount` and `averageRating` will use the denormalized columns directly (they are not impacted by the same decrement problem).

---

### Decision 4: Live Event Mechanism — TanStack Query Polling (Not SSE/WebSocket) for v1

**Decision**: Background revalidation on the course detail page uses TanStack Query `refetchInterval` polling at a 5-minute interval against the `/api/courses/[courseId]/counters` route. SSE or WebSocket is explicitly out of scope for v1.

**Rationale**: Polling at the same interval as the cache TTL is the simplest mechanism that provides the desired "alive" UX without requiring new server-side infrastructure (SSE/WebSocket server, connection pooling). The API route itself returns cached data, so polling does not add meaningful DB load. At this polling interval, users will see counter updates within 5 minutes of a real enrollment — which meets the spec's SC-004 criterion.

**Path to SSE/WebSocket in v2**: The architecture supports this upgrade. The `ActivityBadge` component already accepts an `increment` prop — the source of that increment can be changed from a polled delta to a real-time event without changing the component API.

---

### Decision 5: Number Formatting — `toLocaleString` + Abbreviation Threshold at 10,000

**Decision**: Numbers are formatted with `Intl.NumberFormat` (locale-aware commas/separators). Numbers ≥ 10,000 display as `10K+`. Numbers ≥ 100,000 display as `100K+`. The `+` suffix is always appended to communicate honest staleness.

**Rationale**: `toLocaleString` is universally supported and handles RTL/locale differences automatically. The abbreviation threshold at 10,000 matches the spec requirement and is standard on educational platforms (Udemy, Coursera). The `+` suffix is honest and sets the correct expectation about the cached value potentially being slightly lower than reality.

---

### Decision 6: Animation — Digit-Aware Vertical Roll, Not Full-Number Transition

**Decision**: Implement a digit-aware decomposition where each digit is rendered in its own positioned span, and only the span(s) for changed digit(s) animate (vertical roll, `ease-out`, 300ms). The Framer Motion `AnimatePresence` manages enter/exit for each digit slot. The `useReducedMotion` hook collapses this to a 150ms opacity transition when `prefers-reduced-motion` is active.

**Rationale**: Animating the entire number (e.g., `1284` → `1285` as a cross-fade) looks cheap and causes all four digits to visually blur during transition. Rolling only the `4→5` digit is: (a) perceptually cleaner — the unchanged digits remain perfectly legible; (b) subtler — the user notices the change without being distracted; (c) consistent with high-end financial and analytics UIs (Bloomberg, Stripe Dashboard).

**Alternatives rejected**:
- Full-number cross-fade: cheap appearance, loses legibility during transition.
- CSS `counter` property: limited browser support for animated transitions, not controllable via Framer Motion.
- `react-number-easing` or similar lib: adds a dependency; the logic is simple enough to implement with Framer Motion already in the bundle.
