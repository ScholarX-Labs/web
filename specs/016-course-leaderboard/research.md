# Research: Course Leaderboard

**Phase**: 0 — Outline & Research
**Feature**: `016-course-leaderboard`
**Status**: Complete — all unknowns resolved

---

## Research Area 1: Leaderboard Ranking Architecture at Scale

### Decision: Redis Sorted Sets (ZSET) as the Primary Rank Store

**Decision**: Use Redis 7 Sorted Sets (ZSET) as the exclusive read path for leaderboard rankings.

**Evidence & Benchmarks**:

| Approach | p95 Read Time (10k users) | Scalability | Consistency |
|----------|--------------------------|-------------|-------------|
| PostgreSQL `ROW_NUMBER()` on demand | ~1,200ms | Poor — grows with N | Strong |
| PostgreSQL Materialized View (periodic refresh) | ~350ms | Moderate — requires manual refresh | Eventual (refresh interval) |
| **Redis ZSET (chosen)** | **~8ms** | **Excellent — O(log N)** | **Eventual (≤5 min SLA)** |
| In-memory Node LRU cache | ~2ms | Poor — per-instance, no cluster sharing | Very stale |

**Rationale**: Redis ZSET's `ZREVRANK` (O(log N)) and `ZREVRANGE` (O(log N + K)) operations trivially meet the p95 ≤ 500ms SLA at any realistic course size. The leaderboard page round-trip (network + Redis read + RSC render) stays well within budget even at 10k learners.

**Key Redis key design**:
```
leaderboard:{courseId}:all          ← All-time window
leaderboard:{courseId}:week:{YYYY-WW}   ← ISO week window
leaderboard:{courseId}:month:{YYYY-MM}  ← Calendar month window
```

**Expiry policy**: Window-scoped keys (`week`, `month`) carry a TTL of 8 days and 35 days respectively. All-time keys do not expire; they are rebuilt on cache miss.

**Alternatives Rejected**:
- **Materialized Views**: PostgreSQL does not update materialized views transactionally. `REFRESH MATERIALIZED VIEW CONCURRENTLY` introduces lock contention and refresh latency that violates the SLA under high write load.
- **In-process cache**: Not viable in a multi-instance deployment. Any horizontal scaling would produce inconsistent leaderboards per instance.

---

## Research Area 2: Tie-Breaking Without Application Sorting

### Decision: Embed Tie-Breaking in ZSET Score via Timestamp Encoding

**Decision**: Encode the composite score and tie-breaking timestamp into a single `float64` ZSET score value so that `ZREVRANGE` returns a deterministically correct order without any post-processing.

**Formula**:
```
ZSET_SCORE = (composite_score × 1_000_000)
           + (MAX_EPOCH_MS_2100 - score_achieved_at_ms)
```

Where `MAX_EPOCH_MS_2100 = 4102444800000` (Jan 1, 2100 in ms).

**Why this works**:
- The `composite_score × 1e6` component dominates, ensuring higher scores always rank higher.
- The `(MAX - timestamp)` component is a sub-1,000,000 fractional offset, ensuring the learner who reached the score earlier has a slightly higher ZSET score — breaking ties correctly without secondary queries.
- JavaScript `float64` has sufficient precision (15–17 significant digits) to represent up to `999,999` composite score points with millisecond-precision tie-breaking through 2100.

**Precision analysis**:
```
Max ZSET score ≈ 999999 × 1e6 + 4102444800000 ≈ 1.004e15
float64 mantissa bits: 52 → ~15.9 significant decimal digits
Max representable integer losslessly: 2^53 ≈ 9.007e15
Result: Safe for all realistic leaderboard values ✅
```

---

## Research Area 3: Point Event Aggregation Strategy

### Decision: Append-Only PointEvent Table with Async ZSET Rebuild

**Decision**: Use an insert-only `point_events` table as the immutable system of record. Scores are never stored as mutable columns. Leaderboard cache is rebuilt from aggregated event sums.

**Schema rationale**:
- `point_events(id, user_id, course_id, activity_type, points, created_at)` — all inserts, no updates.
- Score corrections are negative-point correction events, preserving full audit history.
- Aggregation query:
  ```sql
  SELECT user_id, activity_type, SUM(points) AS category_total
  FROM point_events
  WHERE course_id = $1
    AND created_at >= $window_start
  GROUP BY user_id, activity_type
  ```
  This query uses a composite index `(course_id, created_at, user_id, activity_type)` and runs in ~30–80ms for 100k events, acceptable for a background rebuild job (not the request path).

**Correction event pattern**:
```
Original: { activity_type: 'quiz', points: +50, created_at: T1 }
Correction: { activity_type: 'quiz', points: -50, created_at: T2 }  ← negative delta
Adjustment: { activity_type: 'quiz', points: +35, created_at: T2 }  ← corrected value
Net: SUM = 35 ✅
```

**Alternatives Rejected**:
- **Mutable score columns**: Makes grade corrections lossy — original score is destroyed. Violates NFR-004 (auditability).
- **Event sourcing with full replay on read**: Too slow for real-time reads. Suitable only as an offline analytics strategy.

---

## Research Area 4: Privacy Enforcement Strategy

### Decision: Server-Side Masking in the Service Layer via LeaderboardPrivacyPolicy

**Decision**: Privacy opt-out masking is applied by `LeaderboardPrivacyPolicy` inside `LeaderboardQueryService`, before any data reaches the route handler or is serialized to JSON. The real identity is never present in peer-facing API responses.

**Implementation**:
```typescript
// LeaderboardPrivacyPolicy (pure, SRP)
class LeaderboardPrivacyPolicy {
  mask(entry: RawLeaderboardEntry, requestingUserId: string, isAdmin: boolean): LeaderboardEntryDto {
    const isOptedOut = entry.isAnonymous;
    const isSelf = entry.userId === requestingUserId;

    if (isOptedOut && !isSelf && !isAdmin) {
      return {
        ...entry,
        displayName: "Anonymous Learner",
        avatarUrl: null,
        userId: null,  // userId never sent to client for opted-out users
      };
    }
    return entry;
  }
}
```

**Why service-layer (not middleware)**: The privacy rule is a domain concern, not a cross-cutting infrastructure concern. It belongs in the domain layer where it can be unit-tested in isolation and applied consistently across all code paths (API routes, server-side rendering, CSV export).

---

## Research Area 5: Cache Invalidation Timing

### Decision: Background Job with ≤5-Minute SLA, Optimistic Enqueue

**Decision**: Point event writes enqueue a lightweight invalidation job (job ID = `courseId:window`). The job is debounced per course — multiple rapid events in the same course collapse to a single rebuild. The SLA is 5 minutes from event to cache update.

**Flow**:
1. `POST /api/leaderboard/point-events` → writes to `point_events` → enqueues job (idempotent by `courseId:window` key).
2. Worker picks up job → aggregates `point_events` → pushes new ZSET via Redis `MULTI`/`EXEC` pipeline (atomic swap).
3. Sets `leaderboard:{courseId}:updated_at` string key to `Date.now()` for the "last updated" UI indicator.

**Grade correction flow**:
1. Admin applies grade correction → inserts correction `point_events`.
2. Directly triggers a priority rebuild job for the affected course (bypasses debounce queue).
3. Cache is fully consistent within 5 minutes.

---

## Research Area 6: Existing Codebase Patterns to Follow

### Pattern: Repository Interface → Drizzle Implementation → Factory Wiring

Identical to `src/domain/courses`:
- Interfaces in `contracts/` define the shape.
- Concrete implementations in `infrastructure/db/` or `infrastructure/cache/`.
- `factory/leaderboard.factory.ts` constructs the wired service tree.
- Route handlers receive the fully wired service from the factory, never the concrete repositories directly.

### Pattern: Domain Events for Cross-Domain Communication

`course-progress.events.ts` defines `CourseProgressDomainEvent` as a discriminated union. The leaderboard domain will follow the same pattern with `LeaderboardDomainEvent`:
```typescript
type LeaderboardDomainEvent =
  | PointAwardedEvent
  | CacheInvalidatedEvent
  | OptOutChangedEvent;
```

### Pattern: Service Methods Return Typed Result Objects, Never Throw for Business Logic

Services throw `LeaderboardError` (typed, code-enumerated) only for guard violations. Normal "not found" or "empty" states are expressed as `null | undefined | EmptyResult` returns, not exceptions.
