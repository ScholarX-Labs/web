# Implementation Plan: Course Leaderboard

**Branch**: `016-course-leaderboard` | **Date**: 2026-07-01 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/016-course-leaderboard/spec.md`
**Constitution Version**: 1.0.0

---

## Summary

Implement a production-grade Course Leaderboard feature that ranks enrolled learners by a weighted composite score (Quizzes & Exams 40%, Participation 30%, Course Completion 30%). Rankings are computed from an immutable `point_events` append-only log, cached in Redis Sorted Sets for sub-500ms reads, and served via thin Next.js route handlers backed by a SOLID-compliant domain service layer. Privacy opt-outs are enforced server-side. Tie-breaking is by earliest UTC timestamp. The design follows ScholarX's existing bounded-context domain structure, command/query separation, and spec-first engineering workflow.

---

## Technical Context

| Attribute | Value |
|-----------|-------|
| **Language** | TypeScript 5.x (strict mode, no `any`) |
| **Runtime** | Next.js 15 App Router, Node.js 20 |
| **Styling** | Tailwind CSS + existing design system tokens |
| **Auth** | Better Auth session — `session.user.id` is the authority |
| **ORM / DB** | Drizzle ORM, PostgreSQL (Neon / Docker local) |
| **Cache** | Redis 7 Sorted Sets (ZSET) via `ioredis` |
| **Testing** | Vitest + React Testing Library + Drizzle test fixtures |
| **Performance Goal** | p95 ≤ 500ms for leaderboard page load (10k+ learners) |
| **Consistency SLA** | Eventual — rankings stale by ≤ 5 minutes |
| **Scale** | 10k learners per course; up to 100k point events per course |
| **Project Type** | Next.js web application (App Router, Server + Client Components) |

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Principle I — SOLID Architecture ✅

| SOLID Principle | How This Design Applies |
|-----------------|------------------------|
| **S — Single Responsibility** | `PointEventRepository` only reads/writes events. `LeaderboardScoringPolicy` only computes scores. `LeaderboardCacheService` only manages Redis. `LeaderboardQueryService` only answers read queries. |
| **O — Open/Closed** | `LeaderboardScoringPolicy` is open for extension (new activity types added to the `ActivityWeights` config map) without modifying existing scoring logic. |
| **L — Liskov Substitution** | Repository interfaces (`IPointEventRepository`, `ILeaderboardCacheRepository`) allow swapping implementations (e.g., test doubles, future DynamoDB migration) without breaking consumers. |
| **I — Interface Segregation** | Read and write operations are separated: `ILeaderboardQueryRepository` (reads) vs `ILeaderboardCommandRepository` (writes). Server Components only receive the query interface. |
| **D — Dependency Inversion** | `LeaderboardQueryService` and `LeaderboardCommandService` depend on interfaces, not concrete DB/Redis implementations. Concrete repositories injected at the route handler boundary. |

### Principle II — Type Safety ✅

- All domain types are explicit interfaces/unions — no `any`, no `unknown` without narrowing guards.
- Drizzle schema types flow through to contract types via explicit mappers (`leaderboard.mapper.ts`).
- API route request bodies validated with Zod before entering the service layer.
- Redis payloads are serialized/deserialized through typed codec functions, not raw `JSON.parse`.

### Principle III — Testing Standards ✅

- `LeaderboardScoringPolicy` — 100% unit test coverage (pure function, no I/O).
- `LeaderboardQueryService` — Integration tests against a Drizzle test database fixture.
- `LeaderboardCacheService` — Unit tests with `ioredis-mock`.
- `LeaderboardTable` component — React Testing Library smoke tests covering rank display, anonymous masking, and empty state.
- E2E: Playwright test for the happy-path learner flow (view leaderboard → inspect score breakdown → toggle time window).

### Principle IV — Premium UX ✅

- Leaderboard table uses the existing ScholarX design system (card, avatar, badge primitives).
- Top 3 ranks receive distinctive visual treatment (gold/silver/bronze accent, trophy icon).
- Rank changes animate using Framer Motion `layoutId` for smooth reordering on client refetch.
- "Last updated X min ago" staleness indicator with subtle pulse animation.
- Opt-out toggle is a standard privacy settings toggle, not buried in profile settings.
- Full WCAG 2.1 AA compliance: keyboard nav, `aria-label` on rank badges, `role="table"` semantics.

### Principle V — Performance, Scalability & Maintainability ✅

- **Never** query PostgreSQL for leaderboard rankings at read time. All ranks served from Redis ZSET.
- Cache invalidation is asynchronous: point events trigger a background job that updates Redis, never blocking the write path.
- Drizzle query for `point_events` aggregation uses a composite index `(course_id, user_id, created_at)` to prevent full table scans.
- The scoring policy is stateless and pure — it can be moved to an edge function or a worker without refactoring.
- Feature flag (`LEADERBOARD_ENABLED`) controls rollout per course, defaulting to `false`.

---

## Architecture Decision Records (ADRs)

### ADR-001: Redis Sorted Sets for Rank Storage

**Status**: Accepted

**Context**: Leaderboard rankings over 10k+ users cannot be computed at request time via `ROW_NUMBER() OVER(ORDER BY score DESC)` without violating the p95 ≤ 500ms SLA.

**Decision**: Use Redis 7 ZSET with key `leaderboard:{courseId}:{window}` where window ∈ `{all,week,month}`. Members are `userId` strings. Scores are encoded as `actualPoints * 1e6 + (MAX_EPOCH - completionTimestamp)` to bake tie-breaking into the native ZSET ordering.

**Consequences**:
- Rank lookups are `O(log N)` via `ZREVRANK`.
- Top-K retrieval is `O(log N + K)` via `ZREVRANGE`.
- Cache can be fully rebuilt from `point_events` at any time — Redis is not the system of record.
- Requires a Redis flush-and-rebuild strategy on grade corrections (targeted, not full-cache).

**Alternatives Rejected**:
| Alternative | Rejection Reason |
|-------------|-----------------|
| PostgreSQL `ROW_NUMBER()` materialized view | Refresh latency too high; blocking on high write throughput |
| In-process Node.js LRU cache | Not shared across instances; useless in clustered deployment |
| Full DB rank on every request | Violates NFR-001 at scale |

---

### ADR-002: Append-Only PointEvent Log

**Status**: Accepted

**Context**: Scores change when grades are corrected or participation events are backfilled. We need an auditable source of truth that can reconstruct any historical rank.

**Decision**: All score contributions are persisted as immutable `point_events` rows (insert-only, no updates). The canonical score for any learner is always `SUM(points) WHERE ...`. Redis is recomputed from this log.

**Consequences**:
- Full auditability for grade dispute resolution (FR-004 / NFR-004).
- Score corrections are implemented by inserting a negative correction event (not by mutating existing rows).
- The aggregation query `SELECT SUM(points) GROUP BY user_id, category` is the single source of truth.

---

### ADR-003: Command/Query Separation (CQRS-lite)

**Status**: Accepted

**Context**: Writes (point events) and reads (leaderboard rankings) have completely different performance and consistency requirements.

**Decision**: Separate `LeaderboardCommandService` (handles point event ingestion, cache invalidation scheduling) from `LeaderboardQueryService` (handles read requests, reads exclusively from Redis). No service crosses this boundary.

---

## Project Structure

### Documentation (this feature)

```text
specs/016-course-leaderboard/
├── spec.md               ← Approved feature specification
├── plan.md               ← This document
├── research.md           ← ADR evidence and benchmarking data
├── data-model.md         ← Database schema, Redis key design, entity relationships
├── design-patterns.md    ← All 12 design patterns with TypeScript sketches
├── quickstart.md         ← Local dev setup
└── tasks.md              ← Task breakdown (generated by /speckit-tasks)
```

### Source Code Layout

```text
src/
├── app/
│   ├── (platform)/
│   │   └── courses/
│   │       └── [slug]/
│   │           └── leaderboard/
│   │               ├── page.tsx                 # RSC: fetches & passes typed data
│   │               └── loading.tsx              # Skeleton loader (Suspense boundary)
│   └── api/
│       └── leaderboard/
│           ├── [courseId]/
│           │   ├── route.ts                     # GET: leaderboard entries (query)
│           │   └── me/
│           │       └── route.ts                 # GET: authenticated user's rank
│           ├── point-events/
│           │   └── route.ts                     # POST: ingest a point event (internal)
│           └── opt-out/
│               └── route.ts                     # PUT: toggle privacy opt-out
│
├── components/
│   └── leaderboard/
│       ├── LeaderboardShell.tsx                 # Layout wrapper, time-window selector
│       ├── LeaderboardTable.tsx                 # Core ranked table, top-3 treatment
│       ├── LeaderboardRow.tsx                   # Single rank row (animated via layoutId)
│       ├── LeaderboardMyRank.tsx                # Sticky "your rank" row
│       ├── ScoreBreakdownPanel.tsx              # Per-category score drawer
│       ├── ScoringInfoModal.tsx                 # "How Scores Work" explanation modal
│       ├── LeaderboardEmptyState.tsx            # Zero-activity or no-course-points state
│       └── LeaderboardSkeleton.tsx              # Loading skeleton
│
├── domain/
│   └── leaderboard/
│       ├── application/
│       │   ├── leaderboard-query.service.ts     # Reads from cache; composes LeaderboardEntry[]
│       │   ├── leaderboard-command.service.ts   # Ingests PointEvents; schedules cache update
│       │   ├── leaderboard-scoring.policy.ts    # Pure: computes composite score + ZSET score
│       │   ├── leaderboard-privacy.policy.ts    # Pure: applies opt-out masking to entries
│       │   ├── leaderboard-cache.service.ts     # Redis ZSET read/write abstraction
│       │   ├── leaderboard-cache-rebuild.job.ts # Background job: rebuild cache from DB
│       │   └── index.ts
│       ├── contracts/
│       │   ├── leaderboard.types.ts             # All domain types and interfaces
│       │   ├── leaderboard.events.ts            # Domain events (PointAwarded, CacheInvalidated)
│       │   ├── point-event.repository.ts        # IPointEventRepository interface
│       │   ├── leaderboard-cache.repository.ts  # ILeaderboardCacheRepository interface
│       │   ├── leaderboard-opt-out.repository.ts# ILeaderboardOptOutRepository interface
│       │   └── index.ts
│       ├── factory/
│       │   └── leaderboard.factory.ts           # Constructs wired service instances
│       └── infrastructure/
│           ├── db/
│           │   ├── point-event.repository.ts    # Drizzle implementation
│           │   └── leaderboard-opt-out.repository.ts
│           └── cache/
│               └── redis-leaderboard.repository.ts # ioredis implementation
│
└── db/
    └── schema/
        └── leaderboard.ts                       # Drizzle table definitions
```

---

## Scoring Policy Design

The `LeaderboardScoringPolicy` is a **pure, stateless class** (SRP, easily testable) that encodes the weighted scoring formula and the ZSET tie-breaking score computation.

```
COMPOSITE_SCORE = (quiz_exam_points × 0.40)
               + (participation_points × 0.30)
               + (completion_points × 0.30)

ZSET_SCORE = COMPOSITE_SCORE × 1_000_000
           + (MAX_EPOCH_MS - earliest_score_reached_at_ms)
```

The ZSET score embeds tie-breaking natively, so Redis `ZREVRANGE` already returns a deterministically ordered list without any application-layer sorting.

**ActivityWeights** config (Open/Closed for extension):

| Activity Type | Category | Weight |
|--------------|----------|--------|
| `quiz` | Quizzes & Exams | 0.40 |
| `exam` | Quizzes & Exams | 0.40 |
| `forum_post` | Participation | 0.30 |
| `assignment_submit` | Participation | 0.30 |
| `lesson_completion` | Course Completion | 0.30 |
| `course_completion` | Course Completion | 0.30 |

---

## Cache Invalidation Flow

```
PointEvent Ingested
       │
       ▼
LeaderboardCommandService
       │
       ├─── Persist to point_events (Postgres, INSERT)
       │
       └─── Enqueue cache-rebuild job for (courseId, affected windows)
                    │
                    ▼
          LeaderboardCacheRebuildJob  (background, max 5-min SLA)
                    │
                    ├─── Aggregate SUM(points) per user per window from point_events
                    │
                    └─── Atomically replace Redis ZSET via MULTI/EXEC pipeline
```

---

## API Contracts

### `GET /api/leaderboard/[courseId]?window=all|week|month&limit=10&cursor=<rank>`

**Auth**: Session required (enrolled learner or course admin).
**Response** (200):

```typescript
interface LeaderboardPageResponse {
  entries: LeaderboardEntryDto[];
  window: LeaderboardWindow;
  updatedAt: string;       // ISO-8601 — drives "Last updated X min ago"
  totalParticipants: number;
}

interface LeaderboardEntryDto {
  rank: number;
  displayName: string;     // "Anonymous Learner" if opted out (server-enforced)
  avatarUrl: string | null;
  totalScore: number;
  isCurrentUser: boolean;
}
```

**Privacy contract**: `displayName` and `avatarUrl` are **never** the real values for opted-out users in non-admin responses. This is enforced by `LeaderboardPrivacyPolicy` in the service layer before any data leaves the server.

---

### `GET /api/leaderboard/[courseId]/me`

Returns the authenticated user's rank, score, and per-category breakdown regardless of their position.

```typescript
interface MyRankResponse {
  rank: number | null;     // null if zero points
  totalScore: number;
  categoryBreakdown: {
    quizzesAndExams: number;
    participation: number;
    courseCompletion: number;
  };
  window: LeaderboardWindow;
  isAnonymous: boolean;    // user's own opt-out state
}
```

---

## Complexity Tracking

No constitution violations. All patterns used (domain service layer, repository interfaces, factory wiring) are established in the `src/domain/courses` bounded context and are being replicated consistently here.
