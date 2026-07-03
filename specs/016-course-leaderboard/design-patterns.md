# Design Patterns: Course Leaderboard

**Feature**: `016-course-leaderboard`
**Author**: Principal Engineering, ScholarX Platform
**References**: `src/domain/courses/`, `src/lib/cache/`, AGENTS.md Constitution v1.0.0

---

## Overview

This document catalogues every design pattern the leaderboard feature must implement, **why** each one was chosen, **where** in the codebase it manifests, and **what the code structure looks like** in concrete terms. All patterns are derived from or consistent with the existing ScholarX `courses` domain — the leaderboard is not inventing new conventions, it is faithfully replicating and extending them.

---

## Pattern Index

| # | Pattern | Category | Primary Files |
|---|---------|----------|--------------|
| 1 | Repository | Structural | `contracts/point-event.repository.ts`, `infrastructure/db/` |
| 2 | Factory | Creational | `factory/leaderboard.factory.ts` |
| 3 | Policy (Domain Rule Object) | Behavioural | `application/leaderboard-scoring.policy.ts` |
| 4 | Specification | Behavioural | `application/leaderboard.specifications.ts` |
| 5 | CQRS (Command/Query Separation) | Architectural | `application/leaderboard-command.service.ts`, `application/leaderboard-query.service.ts` |
| 6 | Strategy | Behavioural | `application/leaderboard-scoring.policy.ts` via `CATEGORY_WEIGHTS` |
| 7 | Adapter (Port & Adapter / Hexagonal) | Structural | `infrastructure/cache/redis-leaderboard.repository.ts` |
| 8 | Null Object | Behavioural | `application/leaderboard-query.service.ts` |
| 9 | Domain Event | Architectural | `contracts/leaderboard.events.ts` |
| 10 | Typed Error Object | Structural | `application/leaderboard.errors.ts` |
| 11 | Mapper | Structural | `application/leaderboard.mapper.ts` |
| 12 | Debounce Job (Idempotent Background Job) | Concurrency | `application/leaderboard-cache-rebuild.job.ts` |

---

## Pattern 1: Repository Pattern

### Why

The leaderboard domain has two fundamentally different backing stores: **PostgreSQL** (system of record) and **Redis** (rank cache). Code that calls `SELECT SUM(points)...` or `ZADD leaderboard:...` must never appear inside a service class. The Repository pattern places all I/O behind interfaces, making services testable without a real database and making store swaps transparent.

This is the **same pattern used in `src/domain/courses/contracts/course-progress.repository.ts`** — we replicate it exactly.

### Structure

```
contracts/
├── point-event.repository.ts         ← IPointEventRepository (interface)
├── leaderboard-cache.repository.ts   ← ILeaderboardCacheRepository (interface)
└── leaderboard-opt-out.repository.ts ← ILeaderboardOptOutRepository (interface)

infrastructure/
├── db/
│   ├── point-event.repository.ts     ← DrizzlePointEventRepository (concrete)
│   └── leaderboard-opt-out.repository.ts ← DrizzleOptOutRepository (concrete)
└── cache/
    └── redis-leaderboard.repository.ts ← RedisLeaderboardRepository (concrete)
```

### Concrete Sketch

```typescript
// contracts/point-event.repository.ts
export interface IPointEventRepository {
  insertPointEvent(event: InsertPointEvent): Promise<void>;
  aggregateByCourseAndWindow(
    courseId: string,
    window: LeaderboardWindow,
    windowStart: Date | null,
  ): Promise<PointEventAggregate[]>;
  getUserBreakdown(
    userId: string,
    courseId: string,
    window: LeaderboardWindow,
    windowStart: Date | null,
  ): Promise<PointEventAggregate[]>;
}

// infrastructure/db/point-event.repository.ts
export class DrizzlePointEventRepository implements IPointEventRepository {
  async insertPointEvent(event: InsertPointEvent): Promise<void> {
    await db.insert(pointEvents).values(event).onConflictDoNothing({
      target: pointEvents.idempotencyKey,
    });
  }

  async aggregateByCourseAndWindow(
    courseId: string,
    window: LeaderboardWindow,
    windowStart: Date | null,
  ): Promise<PointEventAggregate[]> {
    return db
      .select({
        userId: pointEvents.userId,
        category: sql<string>`...`, // mapped from activityType
        totalPoints: sql<number>`SUM(${pointEvents.points})`,
      })
      .from(pointEvents)
      .where(
        and(
          eq(pointEvents.courseId, courseId),
          windowStart ? gte(pointEvents.createdAt, windowStart) : undefined,
        ),
      )
      .groupBy(pointEvents.userId, pointEvents.activityType);
  }
}
```

### Anti-patterns Avoided

| Anti-pattern | What we do instead |
|-------------|-------------------|
| Calling `db.select()` inside a service method | All DB calls are inside repository implementations |
| Hard-coding table names in service tests | Services receive mock repository interfaces in tests |
| Putting Redis commands in business logic | Redis is behind `ILeaderboardCacheRepository` |

---

## Pattern 2: Factory Pattern

### Why

Services have dependency chains: `LeaderboardQueryService` needs a `ILeaderboardCacheRepository` + `ILeaderboardOptOutRepository`. Constructing this manually in every route handler creates duplication and makes it easy to wire things incorrectly. The Factory pattern centralises construction.

**Existing precedent**: `src/domain/courses/factory/course-progress-domain.factory.ts` — identical structure.

### Structure

```typescript
// factory/leaderboard.factory.ts

export interface LeaderboardDomainServices {
  query: LeaderboardQueryService;
  command: LeaderboardCommandService;
}

export function createLeaderboardDomain(): LeaderboardDomainServices {
  // Infrastructure layer — concrete implementations
  const pointEventRepo = new DrizzlePointEventRepository();
  const cacheRepo = new RedisLeaderboardRepository();
  const optOutRepo = new DrizzleOptOutRepository();

  // Application layer — domain services wired against interfaces
  const scoringPolicy = new LeaderboardScoringPolicy();
  const privacyPolicy = new LeaderboardPrivacyPolicy();

  const cacheService = new LeaderboardCacheService(cacheRepo);

  return {
    query: new LeaderboardQueryService(
      cacheService,
      pointEventRepo,
      optOutRepo,
      privacyPolicy,
    ),
    command: new LeaderboardCommandService(
      pointEventRepo,
      cacheService,
      scoringPolicy,
    ),
  };
}
```

### Usage in Route Handler

```typescript
// app/api/leaderboard/[courseId]/route.ts
import { createLeaderboardDomain } from "@/domain/leaderboard/factory/leaderboard.factory";

export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  const { query } = createLeaderboardDomain();
  const entries = await query.getTopEntries(params.courseId, "all", 10);
  return Response.json(entries);
}
```

**The route handler knows nothing about Drizzle or Redis.** It only knows `LeaderboardDomainServices`.

---

## Pattern 3: Policy Pattern (Domain Rule Object)

### Why

Scoring logic is complex, has its own rules (weighted sum, tie-breaking encoding, ZSET score formula), and **must be independently testable**. Embedding it inside a service creates a god-service that is hard to test, reason about, and extend. Extracting it into a dedicated **Policy class** (a variant of the Domain Model pattern) follows SRP directly.

**Existing precedent**: `LessonCompletionPolicy` and `CourseCompletionPolicy` in `application/course-completion.policy.ts` — exact same structure.

### Structure

```typescript
// application/leaderboard-scoring.policy.ts

export const CATEGORY_WEIGHTS = {
  quizzes_and_exams: 0.40,
  participation: 0.30,
  course_completion: 0.30,
} as const satisfies Record<LeaderboardActivityCategory, number>;

// Timestamp used for tie-breaking: year 2100 epoch in ms
const MAX_EPOCH_MS = 4_102_444_800_000n;
const COMPOSITE_SCALE = 1_000_000n;

export class LeaderboardScoringPolicy {
  /**
   * Computes the human-readable composite score from raw category aggregates.
   * Pure function — no I/O, no side effects.
   */
  computeCompositeScore(aggregates: PointEventAggregate[]): ScoreBreakdown & { total: number } {
    const categoryTotals = this.groupByCategory(aggregates);

    const quizzesAndExams = categoryTotals.quizzes_and_exams ?? 0;
    const participation = categoryTotals.participation ?? 0;
    const courseCompletion = categoryTotals.course_completion ?? 0;

    const total = Math.round(
      quizzesAndExams * CATEGORY_WEIGHTS.quizzes_and_exams +
      participation * CATEGORY_WEIGHTS.participation +
      courseCompletion * CATEGORY_WEIGHTS.course_completion,
    );

    return { total, quizzesAndExams, participation, courseCompletion };
  }

  /**
   * Encodes the composite score + tie-breaking timestamp into a single
   * float64 suitable for Redis ZSET ordering.
   *
   * Formula: (compositeScore × 1_000_000) + (MAX_EPOCH_MS - achievedAtMs)
   * This ensures higher scores always win, ties broken by earliest timestamp.
   */
  computeZsetScore(compositeScore: number, achievedAt: Date): number {
    const scorePart = BigInt(compositeScore) * COMPOSITE_SCALE;
    const timePart = MAX_EPOCH_MS - BigInt(achievedAt.getTime());
    return Number(scorePart + timePart);
  }

  private groupByCategory(aggregates: PointEventAggregate[]) {
    return aggregates.reduce<Partial<Record<LeaderboardActivityCategory, number>>>(
      (acc, agg) => ({
        ...acc,
        [agg.category]: (acc[agg.category] ?? 0) + agg.totalPoints,
      }),
      {},
    );
  }
}
```

### Why This is Testable (the Payoff)

```typescript
// application/leaderboard-scoring.policy.test.ts
test("weights quizzes at 40% of total score", () => {
  const policy = new LeaderboardScoringPolicy();
  const result = policy.computeCompositeScore([
    { userId: "u1", category: "quizzes_and_exams", totalPoints: 100 },
  ]);
  assert.equal(result.total, 40); // 100 × 0.40
});

test("earlier achiever wins tie", () => {
  const policy = new LeaderboardScoringPolicy();
  const early = policy.computeZsetScore(500, new Date("2026-01-01T10:00:00Z"));
  const late  = policy.computeZsetScore(500, new Date("2026-06-01T10:00:00Z"));
  assert.ok(early > late); // Earlier timestamp → larger ZSET score → ranked higher
});
```

No database. No Redis. No mocks. Pure arithmetic.

---

## Pattern 4: Specification Pattern

### Why

Guard conditions ("is this user enrolled?", "does this course allow leaderboards?", "is this user's request within rate limits?") should not be scattered as `if (!x) throw ...` inline in services. The Specification pattern encapsulates each rule as an independently assertable object.

**Existing precedent**: `CourseWritableSpecification`, `ActiveEnrollmentSpecification`, `LessonBelongsToCourseSpecification` in `application/course-completion.specifications.ts`.

### Structure

```typescript
// application/leaderboard.specifications.ts

export class CourseHasLeaderboardEnabledSpecification {
  assertSatisfiedBy(course: LeaderboardCourseRecord | null): asserts course is LeaderboardCourseRecord {
    if (!course) {
      throw new LeaderboardError("COURSE_NOT_FOUND", 404, "Course not found.", 1001);
    }
    if (!course.leaderboardEnabled) {
      throw new LeaderboardError(
        "LEADERBOARD_DISABLED",
        403,
        "The leaderboard is not enabled for this course.",
        1002,
      );
    }
  }
}

export class LearnerIsEnrolledSpecification {
  assertSatisfiedBy(
    subscription: SubscriptionRecord | null,
    context: { userId: string; courseId: string },
  ): asserts subscription is SubscriptionRecord {
    if (!subscription) {
      throw new LeaderboardError(
        "ENROLLMENT_REQUIRED",
        403,
        "You must be enrolled in this course to view the leaderboard.",
        1003,
        context,
      );
    }
  }
}
```

### Usage in Service

```typescript
// In LeaderboardQueryService.getTopEntries():
const courseSpec = new CourseHasLeaderboardEnabledSpecification();
const enrollmentSpec = new LearnerIsEnrolledSpecification();

courseSpec.assertSatisfiedBy(course);
enrollmentSpec.assertSatisfiedBy(subscription, { userId, courseId });

// Only reaches here if all guards pass
```

---

## Pattern 5: CQRS — Command/Query Separation

### Why

Writes (ingesting a `PointEvent`) and reads (fetching the leaderboard) have **completely different characteristics**:

| Concern | Write Path | Read Path |
|---------|-----------|-----------|
| Latency requirement | < 200ms, durability matters | < 500ms p95 |
| Backing store | PostgreSQL (`INSERT`) | Redis ZSET (`ZREVRANGE`) |
| Consistency | Strong (event persisted before returning) | Eventual (≤5 min staleness) |
| Failure mode | Must fail loudly | Can degrade gracefully (stale data) |

Merging these paths into one service produces a class with conflicting internal assumptions.

**Existing precedent**: `CourseProgressCommandService` vs `CourseProgressQueryService` in the courses domain.

### Structure

```typescript
// application/leaderboard-command.service.ts (Write path)
export class LeaderboardCommandService {
  constructor(
    private readonly pointEventRepo: IPointEventRepository,
    private readonly cacheService: LeaderboardCacheService,
    private readonly scoringPolicy: LeaderboardScoringPolicy,
  ) {}

  async awardPoints(command: AwardPointsCommand): Promise<void> {
    // 1. Persist — system of record
    await this.pointEventRepo.insertPointEvent({
      ...command,
      idempotencyKey: command.idempotencyKey,
    });
    // 2. Signal — enqueue async cache rebuild (does NOT block the response)
    await this.cacheService.scheduleRebuild(command.courseId, command.window);
  }
}

// application/leaderboard-query.service.ts (Read path)
export class LeaderboardQueryService {
  constructor(
    private readonly cacheService: LeaderboardCacheService,
    private readonly pointEventRepo: IPointEventRepository,
    private readonly optOutRepo: ILeaderboardOptOutRepository,
    private readonly privacyPolicy: LeaderboardPrivacyPolicy,
  ) {}

  async getTopEntries(
    courseId: string,
    window: LeaderboardWindow,
    limit: number,
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<LeaderboardPageResponse> {
    // Reads ONLY from Redis — never touches Postgres for ranking
    const cached = await this.cacheService.getTopEntries(courseId, window, limit);
    const anonymousIds = await this.optOutRepo.getAnonymousUserIds(courseId);

    const entries = cached.map((entry, i) =>
      this.privacyPolicy.mask(entry, requestingUserId, isAdmin, anonymousIds)
    );

    return { entries, updatedAt: cached.updatedAt, window };
  }
}
```

---

## Pattern 6: Strategy Pattern (Open/Closed via Config Map)

### Why

The scoring weight for each activity category (40/30/30) **will change**. Product may introduce a new category, adjust weights, or run A/B experiments with different weight distributions. The Strategy pattern ensures new weight configurations can be introduced **without modifying the scoring logic**.

### Structure

The `CATEGORY_WEIGHTS` constant in `leaderboard-scoring.policy.ts` acts as the strategy configuration. The policy class is **closed for modification** but **open for extension** via a new weights config:

```typescript
// Default weights (current product requirement)
export const STANDARD_WEIGHTS: CategoryWeights = {
  quizzes_and_exams: 0.40,
  participation: 0.30,
  course_completion: 0.30,
};

// Future: experiment weights injected via feature flag
export const ENGAGEMENT_HEAVY_WEIGHTS: CategoryWeights = {
  quizzes_and_exams: 0.25,
  participation: 0.50,
  course_completion: 0.25,
};

export class LeaderboardScoringPolicy {
  constructor(
    private readonly weights: CategoryWeights = STANDARD_WEIGHTS,
  ) {}
  // ...computeCompositeScore uses this.weights — no code change needed for new config
}
```

Factory injects the correct weights based on env/feature flag — zero modification to the policy class itself. This satisfies the **Open/Closed Principle** completely.

---

## Pattern 7: Adapter (Port & Adapter / Hexagonal Architecture)

### Why

The leaderboard's caching layer is Redis ZSET — but the business logic should not be coupled to `ioredis` API calls. If Redis is unavailable, we need a graceful degradation path (fall back to a DB-backed cache). If we later migrate to Valkey or DragonflyDB, only the adapter changes.

**Existing precedent**: `src/lib/cache/cache.port.ts` + `DynamicServerCache` — the exact same pattern. The cache `DynamicServerCache` transparently falls back from Redis to in-memory if Redis is unavailable.

### Structure

```typescript
// The Port — the interface the domain sees
export interface ILeaderboardCacheRepository {
  getTopEntries(courseId: string, window: LeaderboardWindow, limit: number): Promise<CachedRankEntry[]>;
  getUserRank(courseId: string, window: LeaderboardWindow, userId: string): Promise<{ rank: number } | null>;
  rebuildLeaderboard(courseId: string, window: LeaderboardWindow, entries: CacheEntry[], updatedAt: Date): Promise<void>;
  getUpdatedAt(courseId: string, window: LeaderboardWindow): Promise<Date | null>;
}

// The Adapter — Redis ZSET implementation
export class RedisLeaderboardRepository implements ILeaderboardCacheRepository {
  constructor(private readonly redis: Redis) {}

  async getTopEntries(courseId: string, window: LeaderboardWindow, limit: number) {
    const key = this.zsetKey(courseId, window);
    const results = await this.redis.zrevrange(key, 0, limit - 1, "WITHSCORES");
    return this.parseZrevrangeWithScores(results);
  }

  async rebuildLeaderboard(courseId, window, entries, updatedAt) {
    const key = this.zsetKey(courseId, window);
    const updatedAtKey = `${key}:updated_at`;
    const pipeline = this.redis.pipeline();

    pipeline.del(key);
    for (const entry of entries) {
      pipeline.zadd(key, entry.zsetScore, entry.userId);
    }
    pipeline.set(updatedAtKey, updatedAt.toISOString());

    await pipeline.exec(); // Atomic — either all succeed or none
  }

  private zsetKey(courseId: string, window: LeaderboardWindow): string {
    // Key schema: leaderboard:{courseId}:all | :week:{YYYY-WW} | :month:{YYYY-MM}
    return `leaderboard:${courseId}:${window}`;
  }
}

// Fallback Adapter — PostgreSQL-backed for degraded mode
export class PostgresLeaderboardFallbackRepository implements ILeaderboardCacheRepository {
  // Same interface, implemented via direct DB queries
  // Used when Redis is unavailable — violates p95 SLA but keeps service alive
}
```

---

## Pattern 8: Null Object Pattern

### Why

When a learner has zero points (they just enrolled), `getUserRank()` from the cache returns `null`. The Null Object pattern provides a safe, non-null default return shape that the UI can render predictably, avoiding scattered `if (rank === null)` checks throughout components.

### Structure

```typescript
// application/leaderboard-query.service.ts

const NULL_MY_RANK: MyRankDto = {
  rank: null,
  totalScore: 0,
  breakdown: {
    quizzesAndExams: 0,
    participation: 0,
    courseCompletion: 0,
  },
  window: "all",
  isAnonymous: false,
  updatedAt: new Date().toISOString(),
};

async getMyRank(userId: string, courseId: string, window: LeaderboardWindow): Promise<MyRankDto> {
  const cached = await this.cacheService.getUserRank(courseId, window, userId);
  if (!cached) return NULL_MY_RANK; // ← Null Object — always safe to render
  // ...build real DTO
}
```

---

## Pattern 9: Domain Event Pattern

### Why

When a `PointEvent` is persisted, other parts of the system may need to react (cache rebuild job, analytics pipeline, PostHog event emission, future notification service). Hard-wiring these reactions inside `LeaderboardCommandService` creates tight coupling and violates SRP. Domain Events decouple the "thing that happened" from "what should happen next."

**Existing precedent**: `src/domain/courses/contracts/course-progress.events.ts` — `CourseCompletedEvent`, `CertificateIssuedEvent` as a typed discriminated union.

### Structure

```typescript
// contracts/leaderboard.events.ts

export interface PointAwardedEvent {
  type: "PointAwarded";
  userId: string;
  courseId: string;
  activityType: LeaderboardActivityType;
  points: number;
  idempotencyKey: string | null;
  occurredAt: string; // ISO-8601
}

export interface CacheRebuildScheduledEvent {
  type: "CacheRebuildScheduled";
  courseId: string;
  window: LeaderboardWindow;
  scheduledAt: string;
}

export interface OptOutChangedEvent {
  type: "OptOutChanged";
  userId: string;
  courseId: string;
  isAnonymous: boolean;
  changedAt: string;
}

export type LeaderboardDomainEvent =
  | PointAwardedEvent
  | CacheRebuildScheduledEvent
  | OptOutChangedEvent;
```

Events are emitted by the command service and consumed by registered handlers (the cache rebuild job, telemetry, etc.) without the command service knowing who listens.

---

## Pattern 10: Typed Error Object

### Why

Route handlers must be able to catch domain errors and map them to HTTP responses without `instanceof` chains on generic `Error`. Each domain error carries a string `code`, HTTP `statusCode`, and optional `details` — enabling clean error middleware.

**Existing precedent**: `NextCourseError` in `src/domain/courses/application/next-course.errors.ts`.

### Structure

```typescript
// application/leaderboard.errors.ts

export class LeaderboardError extends Error {
  constructor(
    readonly code: LeaderboardErrorCode,
    readonly statusCode: number,
    message: string,
    readonly numericCode: number,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "LeaderboardError";
  }
}

export type LeaderboardErrorCode =
  | "COURSE_NOT_FOUND"
  | "LEADERBOARD_DISABLED"
  | "ENROLLMENT_REQUIRED"
  | "RATE_LIMIT_EXCEEDED"
  | "IDEMPOTENCY_CONFLICT"
  | "CACHE_UNAVAILABLE";

export const isLeaderboardError = (v: unknown): v is LeaderboardError =>
  v instanceof LeaderboardError;
```

**Route handler usage**:
```typescript
try {
  const result = await query.getTopEntries(courseId, window, 10, session.user.id, isAdmin);
  return Response.json(result);
} catch (err) {
  if (isLeaderboardError(err)) {
    return Response.json({ error: err.code, message: err.message }, { status: err.statusCode });
  }
  throw err; // Re-throw unknown errors for the global error boundary
}
```

---

## Pattern 11: Mapper Pattern

### Why

Raw Drizzle row shapes, Redis ZSET member strings, and the TypeScript domain types are all different. A dedicated **Mapper** converts between these representation layers at the boundary, keeping both the infrastructure layer (Drizzle) and the application layer (domain types) clean and free of shape-conversion logic.

**Existing precedent**: `course-progress.mapper.ts` in the courses domain.

### Structure

```typescript
// application/leaderboard.mapper.ts

export function mapAggregatesToCompositeScore(
  aggregates: PointEventAggregate[],
  policy: LeaderboardScoringPolicy,
): CompositeScore {
  const breakdown = policy.computeCompositeScore(aggregates);
  const achievedAt = aggregates.reduce(
    (earliest, agg) => (agg.achievedAt < earliest ? agg.achievedAt : earliest),
    new Date(),
  );
  return { ...breakdown, achievedAt };
}

export function mapRawEntryToDto(
  entry: RawLeaderboardEntry,
  rank: number,
  requestingUserId: string,
  isAnonymous: boolean,
  isAdmin: boolean,
): LeaderboardEntryDto {
  const masked = !isAdmin && isAnonymous;
  return {
    rank,
    displayName: masked ? "Anonymous Learner" : entry.displayName,
    avatarUrl: masked ? null : entry.avatarUrl,
    totalScore: entry.score.total,
    isCurrentUser: entry.userId === requestingUserId,
  };
}
```

---

## Pattern 12: Idempotent Background Job (Debounce Job)

### Why

A course with active learners may receive hundreds of `PointEvent` inserts per minute. Rebuilding the Redis ZSET after every single insert would overwhelm the DB aggregation query. The **Debounce Job pattern** collapses multiple invalidation signals into a single rebuild per time window per course.

### Structure

```typescript
// application/leaderboard-cache-rebuild.job.ts

const DEBOUNCE_TTL_SECONDS = 30; // Window: collapse all signals within 30s

export class LeaderboardCacheRebuildJob {
  constructor(
    private readonly cache: ILeaderboardCacheRepository,
    private readonly pointEventRepo: IPointEventRepository,
    private readonly scoringPolicy: LeaderboardScoringPolicy,
    private readonly redis: Redis, // Used for debounce lock only
  ) {}

  /**
   * Schedules a rebuild. If a rebuild is already scheduled for this
   * courseId + window combination, this call is a no-op (debounced).
   */
  async schedule(courseId: string, window: LeaderboardWindow): Promise<void> {
    const lockKey = `leaderboard:job:${courseId}:${window}`;
    const acquired = await this.redis.set(lockKey, "1", "EX", DEBOUNCE_TTL_SECONDS, "NX");
    if (!acquired) return; // Already scheduled — do nothing

    // In production: enqueue to a job queue (BullMQ, Inngest, etc.)
    // In dev/test: execute inline after a short delay
    void this.run(courseId, window);
  }

  /**
   * Executes the rebuild: aggregate from DB → compute scores → atomically update Redis.
   */
  async run(courseId: string, window: LeaderboardWindow): Promise<void> {
    const windowStart = this.getWindowStart(window);
    const aggregates = await this.pointEventRepo.aggregateByCourseAndWindow(
      courseId, window, windowStart,
    );

    const userScoreMap = this.groupAggregatesByUser(aggregates);
    const cacheEntries: CacheEntry[] = [];

    for (const [userId, userAggregates] of userScoreMap) {
      const score = this.scoringPolicy.computeCompositeScore(userAggregates);
      const achievedAt = this.getEarliestTimestamp(userAggregates);
      const zsetScore = this.scoringPolicy.computeZsetScore(score.total, achievedAt);
      cacheEntries.push({ userId, zsetScore });
    }

    await this.cache.rebuildLeaderboard(courseId, window, cacheEntries, new Date());
  }
}
```

---

## Pattern Interaction Diagram

```
HTTP Request
    │
    ▼
Route Handler (thin)
    │ uses factory
    ▼
LeaderboardDomain (factory)
    │ wires
    ├────────────────────────────────────────────────────────────────┐
    ▼                                                                ▼
LeaderboardQueryService (CQRS read)         LeaderboardCommandService (CQRS write)
    │                                                                │
    │ uses ILeaderboardCacheRepository (Port)                        │ uses IPointEventRepository (Repository)
    │ uses ILeaderboardOptOutRepository (Repository)                 │ uses LeaderboardScoringPolicy (Policy+Strategy)
    │ uses LeaderboardPrivacyPolicy (Policy)                         │ fires LeaderboardDomainEvent (Domain Event)
    │ returns LeaderboardEntryDto (Mapper)                           │ schedules LeaderboardCacheRebuildJob (Debounce)
    │                                                                │
    ▼                                                                ▼
RedisLeaderboardRepository (Adapter)          DrizzlePointEventRepository (Repository)
    │                                                                │
    ▼                                                                ▼
Redis 7 ZSET                                              PostgreSQL point_events
```

---

## Anti-Pattern Reference

These are patterns explicitly **forbidden** in this feature.

| Anti-pattern | What it Looks Like | Why Forbidden |
|-------------|-------------------|--------------|
| **Fat Service** | `LeaderboardService` doing DB reads, Redis writes, privacy masking, scoring, and HTTP formatting | Violates SRP; impossible to unit test |
| **Anemic Domain** | All logic in route handlers; services are just CRUD wrappers | Business rules leak into the HTTP layer |
| **Leaky Repository** | Returning Drizzle row objects (`typeof pointEvents.$inferSelect`) from repositories | Couples the application layer to the ORM schema |
| **Cached Personal Data** | Storing `displayName` or `avatarUrl` in the Redis ZSET | Privacy opt-outs cannot be applied retroactively without a full cache rebuild |
| **Synchronous Cache Rebuild on Write** | Rebuilding Redis ZSET inline during `awardPoints()` before returning | Blocks the write path; violates p95 SLA for write callers |
| **Direct Redis in Route Handler** | `await redis.zrevrange(...)` inside `GET /api/leaderboard/[courseId]/route.ts` | Skips the domain layer entirely; untestable; violates Hexagonal Architecture |
