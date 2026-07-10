# Tasks: Course Leaderboard

**Feature**: `016-course-leaderboard`
**Input**: Design documents from `specs/016-course-leaderboard/`
**Prerequisites**: spec.md ✅ | plan.md ✅ | data-model.md ✅ | research.md ✅ | design-patterns.md ✅ | quickstart.md ✅
**Generated**: 2026-07-01

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependency conflict)
- **[Story]**: User story this task belongs to (US1–US4)
- Exact file paths follow the project structure defined in `plan.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the domain folder structure and shared foundation that every subsequent task depends on.

- [x] T001 Create leaderboard domain directory skeleton: `src/domain/leaderboard/application/`, `src/domain/leaderboard/contracts/`, `src/domain/leaderboard/factory/`, `src/domain/leaderboard/infrastructure/db/`, `src/domain/leaderboard/infrastructure/cache/`
- [x] T002 [P] Create Drizzle schema file with `pointEvents` table, `activityTypeEnum`, and `leaderboardOptOuts` table in `src/db/schema/leaderboard.ts` (matches `data-model.md`)
- [x] T003 [P] Create feature flag env variable `LEADERBOARD_ENABLED` and document it in `.env.example`
- [x] T004 Run `pnpm db:generate` to produce the migration from the new Drizzle schema, verify migration SQL in `drizzle/` directory
- [x] T005 Run `pnpm db:push` to apply the migration to the local database and confirm `point_events` and `leaderboard_opt_outs` tables exist

**Checkpoint**: Database tables exist, domain folder skeleton is created. No user story work begins until T005 is complete.

---

## Phase 2: Domain Layer Implementation (Policies & Contracts)

**Purpose**: Core domain contracts, typed errors, domain events, and the scoring policy — all pure, I/O-free code that every service and all user stories depend on.

⚠️ **CRITICAL**: All user story phases depend on this phase being complete.

- [x] T006 [P] Create `LeaderboardWindow`, `LeaderboardActivityType`, `PointEventAggregate`, `ScoreBreakdown`, `CompositeScore`, and repository interfaces in `src/domain/leaderboard/contracts/leaderboard.types.ts`
- [x] T007 [P] Define `LeaderboardDomainEvent` union type (including `PointAwardedEvent`, `CacheRebuildScheduledEvent`) in `src/domain/leaderboard/contracts/leaderboard.events.ts`
- [x] T008 [P] Implement `LeaderboardError` class and `LeaderboardErrorCode` in `src/domain/leaderboard/application/leaderboard.errors.ts`
- [x] T009 [P] Implement `LeaderboardScoringPolicy` pure class with `computeCompositeScore` and `computeZsetScore` methods in `src/domain/leaderboard/application/leaderboard-scoring.policy.ts`
- [x] T010 [P] Implement `LeaderboardPrivacyPolicy` pure class with `mask` method in `src/domain/leaderboard/application/leaderboard-privacy.policy.ts`
- [x] T011 [P] Implement `CourseHasLeaderboardEnabledSpecification` and `LearnerIsEnrolledSpecification` in `src/domain/leaderboard/application/leaderboard.specifications.ts`
- [x] T012 [P] Implement data mappers for converting raw repository models to DTOs in `src/domain/leaderboard/application/leaderboard.mapper.ts`
- [x] T013 Create unit tests for `LeaderboardScoringPolicy` weights and tie-breaker formulas in `src/domain/leaderboard/application/leaderboard-scoring.policy.test.ts`
- [x] T014 Create unit tests for `LeaderboardPrivacyPolicy` masking logic in `src/domain/leaderboard/application/leaderboard-privacy.policy.test.ts`
- [x] T015 Create index barrel files for `contracts` and `application` exporting all public symbols

**Checkpoint**: Core domain logic is implemented and tested. Types are available for infrastructure layer.

---

## Phase 3: User Story 1 — View Course Leaderboard (Priority: P1) 🎯 MVP

**Goal**: Enrolled learners can open the Leaderboard tab of a course and see a ranked top-10 list plus their own rank row with real-time cache freshness indicator.

**Independent Test**: Navigate to `/courses/<slug>/leaderboard` with a seeded course (100 users). Verify top-10 renders with ranks, display names, scores. Verify your own rank row appears even if outside top-10. Verify "Last updated X min ago" indicator is visible.

### Infrastructure for US1 (PostgreSQL & Redis Repositories)

- [x] T016 [P] Implement Postgres `PointEventRepository` in `src/domain/leaderboard/infrastructure/db/point-event.repository.ts` (using `drizzle-orm`)
- [x] T017 [P] Implement `LeaderboardCacheRepository` in `src/domain/leaderboard/infrastructure/cache/leaderboard-cache.repository.ts` (using `ioredis` with `ZADD`, `ZREVRANGE`, `ZREVRANK`, `ZSCORE`)
- [x] T018 [P] Implement Postgres `LeaderboardOptOutRepository` in `src/domain/leaderboard/infrastructure/db/leaderboard-opt-out.repository.ts`
- [x] T019 Create `src/domain/leaderboard/infrastructure/index.ts` barrel exporting all repositories
- [x] T020 Write integration tests in `src/domain/leaderboard/infrastructure/db/point-event.repository.test.ts` to verify inserts, conflicts, and aggregation.

**Checkpoint**: Data persistence layer is complete. Can insert points, aggregate them, and interact with Redis.

### Application Services for US1

- [x] T021 Implement `LeaderboardService` (Command) — coordinates policies, writes to Postgres, emits domain events — in `src/domain/leaderboard/application/leaderboard.service.ts`
- [x] T022 Implement `LeaderboardQueryService` — reads from Redis, applies privacy masking — in `src/domain/leaderboard/application/leaderboard-query.service.ts`
- [x] T023 Implement `LeaderboardCacheRebuildJob` — aggregates `point_events`, runs through scoring policy, atomically replaces Redis ZSET — in `src/domain/leaderboard/application/leaderboard-cache-rebuild.job.ts`

### Factory Wiring for US1

- [x] T024 Implement `createLeaderboardDomain()` factory function returning wired `{ query, command, rebuildJob }` services in `src/domain/leaderboard/factory/leaderboard.factory.ts`

### API Routes for US1

- [x] T025 [US1] Create `GET /api/leaderboard/[courseId]/route.ts` — thin route handler: validate session via Better Auth, call `createLeaderboardDomain().query.getTopEntries()`, return `LeaderboardPageResponse`, catch `LeaderboardError` and map to HTTP status codes
- [x] T026 [US1] Create `GET /api/leaderboard/[courseId]/me/route.ts` — thin route handler: validate session, call `query.getMyRank()`, return `MyRankDto`

### UI Components for US1

- [x] T027 [P] [US1] Create `LeaderboardSkeleton` loading placeholder component (matching existing ScholarX skeleton pattern) in `src/components/leaderboard/LeaderboardSkeleton.tsx`
- [x] T028 [P] [US1] Create `LeaderboardEmptyState` component for zero-activity courses and single-learner courses in `src/components/leaderboard/LeaderboardEmptyState.tsx`
- [x] T029 [P] [US1] Create `LeaderboardRow` — single rank row with Framer Motion `layoutId` for animated reordering, gold/silver/bronze treatment for ranks 1–3, avatar, display name, score display — in `src/components/leaderboard/LeaderboardRow.tsx`
- [x] T030 [US1] Create `LeaderboardMyRank` — sticky "your rank" row shown below the top-10, visually differentiated from regular rows — in `src/components/leaderboard/LeaderboardMyRank.tsx` (depends on T029)
- [x] T031 [US1] Create `LeaderboardTable` — renders top-10 `LeaderboardRow` entries plus a visual separator and `LeaderboardMyRank` when user is outside top-10; wraps in WCAG `role="table"` semantics — in `src/components/leaderboard/LeaderboardTable.tsx` (depends on T029, T030)
- [x] T032 [US1] Create `LeaderboardShell` — layout wrapper containing the "Last updated X min ago" staleness indicator and the time-window selector tabs (stubbed for now, activated in US3) — in `src/components/leaderboard/LeaderboardShell.tsx` (depends on T031)

### Page Route for US1

- [x] T033 [US1] Create `src/app/(platform)/courses/[slug]/leaderboard/page.tsx` — Next.js Server Component: resolves `courseId` from slug, fetches via `createLeaderboardDomain().query.getTopEntries()` and `query.getMyRank()`, passes typed props to `<LeaderboardShell>`, sets page `<title>` metadata (depends on T022, T032)
- [x] T034 [US1] Create `src/app/(platform)/courses/[slug]/leaderboard/loading.tsx` — Suspense boundary showing `<LeaderboardSkeleton>`

**Checkpoint ✅ US1**: Navigate to `/courses/<slug>/leaderboard`. Top-10 ranked list renders. Own rank row is visible. Staleness indicator is shown. Page loads under 500ms with seeded Redis data.

---

## Phase 4: User Story 2 — Scoring Methodology Transparency (Priority: P2)

**Goal**: Learners can open a scoring breakdown panel to understand exactly how points are calculated and view their own per-category score.

**Independent Test**: Click the "How Scores Work" info icon on the leaderboard page. Verify a panel renders with the 40/30/30 weight breakdown. Click your own score row. Verify a per-category breakdown (Quizzes & Exams / Participation / Course Completion) is displayed with your actual point values.

### Implementation for US2

- [x] T035 [P] [US2] Create `ScoringInfoModal` — static modal/drawer explaining the 40/30/30 weight breakdown; content is hard-coded (not fetched); includes an info icon trigger button — in `src/components/leaderboard/ScoringInfoModal.tsx`
- [x] T036 [P] [US2] Create `ScoreBreakdownPanel` — Client Component that receives `MyRankDto.breakdown` as props and renders three category rows (Quizzes & Exams, Participation, Course Completion) with point values and percentage contribution — in `src/components/leaderboard/ScoreBreakdownPanel.tsx`
- [x] T037 [US2] Wire `ScoringInfoModal` into `LeaderboardShell` with an info (ⓘ) icon button in the header — update `src/components/leaderboard/LeaderboardShell.tsx`
- [x] T038 [US2] Wire `ScoreBreakdownPanel` into `LeaderboardMyRank` — clicking the user's own score row opens the breakdown panel with data from `MyRankDto` passed down from the page — update `src/components/leaderboard/LeaderboardMyRank.tsx`

**Checkpoint ✅ US2**: "How Scores Work" info icon opens modal with correct weights. Clicking own score row opens panel with per-category real data. No network request is needed for the info modal.

---

## Phase 5: User Story 3 — Time-Windowed Leaderboard (Priority: P3)

**Goal**: Learners can toggle between All-Time, This Week, and This Month leaderboard views so late joiners have short-term competitive goals.

**Independent Test**: Toggle the time-window selector on the leaderboard page from "All-Time" to "This Week". Rankings update within 300ms (from cache). The date range caption changes. A learner with zero points this week sees "No activity this week" on their rank row.

### API Extension for US3

- [x] T039 [US3] Extend `GET /api/leaderboard/[courseId]/route.ts` to accept `?window=all|week|month` query param — validate the value via Zod enum, pass to `query.getTopEntries()`, and return window-specific rankings — update `src/app/api/leaderboard/[courseId]/route.ts`
- [x] T040 [US3] Extend `GET /api/leaderboard/[courseId]/me/route.ts` to accept `?window=all|week|month` and pass to `query.getMyRank()`

### Cache for US3

- [x] T041 [US3] Implement `getWindowStart(window: LeaderboardWindow): Date | null` utility function inside `LeaderboardCacheRebuildJob` — returns `null` for `"all"`, Monday 00:00 UTC for `"week"`, 1st 00:00 UTC for `"month"` — in `src/domain/leaderboard/application/leaderboard-cache-rebuild.job.ts`
- [x] T042 [US3] Verify Redis key schema supports all three windows (`leaderboard:{courseId}:all`, `leaderboard:{courseId}:week:{YYYY-WW}`, `leaderboard:{courseId}:month:{YYYY-MM}`) — add week and month key builders to `RedisLeaderboardRepository` in `src/domain/leaderboard/infrastructure/cache/redis-leaderboard.repository.ts`

### UI for US3

- [x] T043 [US3] Activate the time-window selector tabs in `LeaderboardShell` — convert stub to a functional Client Component that holds `selectedWindow` state and passes it as a query param to the data fetching function; animate the active tab indicator with Framer Motion — update `src/components/leaderboard/LeaderboardShell.tsx`
- [x] T044 [US3] Update `LeaderboardMyRank` to show "No activity this week/month" empty state text when `rank` is `null` for the selected window — update `src/components/leaderboard/LeaderboardMyRank.tsx`
- [x] T045 [US3] Update `LeaderboardTable` to re-fetch when `selectedWindow` changes — use `useQuery` (TanStack Query) with the window as part of the query key — update `src/components/leaderboard/LeaderboardTable.tsx`

**Checkpoint ✅ US3**: Toggle between All-Time / This Week / This Month updates rankings. Date caption changes. Learner with no this-week activity sees the correct empty state.

---

## Phase 6: User Story 4 — Admin Unmasked View & Export (Priority: P4)

**Goal**: Course instructors and admins can view the unfiltered leaderboard with real learner identities (opted-out users flagged with a privacy badge) and export full data as CSV.

**Independent Test**: Switch to an instructor/admin session. Navigate to the leaderboard. Verify opted-out learners appear with real names and a visible "Private" badge. Click "Export CSV". Verify a CSV file downloads containing all learners' real names, scores, and per-category breakdown.

### API Extension for US4

- [x] T044 [US4] Extend `GET /api/leaderboard/[courseId]/route.ts` to detect admin/instructor role from the Better Auth session and pass `isAdmin: true` to `LeaderboardPrivacyPolicy.mask()` — opted-out learners receive real names with an `isPrivate: true` flag in the response DTO — update `src/app/api/leaderboard/[courseId]/route.ts`
- [x] T045 [US4] Create `GET /api/leaderboard/[courseId]/export/route.ts` — admin-only route (enforce session role guard), queries full leaderboard from DB (not cache — for complete accuracy), formats as CSV (`rank,displayName,email,totalScore,quizzesAndExams,participation,courseCompletion`), returns with `Content-Disposition: attachment; filename="leaderboard-{courseId}.csv"` header

### UI for US4

- [x] T046 [P] [US4] Create `PrivacyBadge` — small inline badge component ("Private") shown next to opted-out user names in the admin view — in `src/components/leaderboard/PrivacyBadge.tsx`
- [x] T047 [US4] Update `LeaderboardRow` to conditionally render `<PrivacyBadge>` when `entry.isPrivate === true` (admin-only field) — update `src/components/leaderboard/LeaderboardRow.tsx`
- [x] T048 [US4] Add "Export CSV" button to `LeaderboardShell` that is only rendered when the current user is an admin/instructor (server-rendered conditional) — triggers a `GET /api/leaderboard/[courseId]/export` fetch with `download` attribute — update `src/components/leaderboard/LeaderboardShell.tsx`

**Checkpoint ✅ US4**: Admin sees opted-out learners with real names + "Private" badge. Export CSV button downloads a complete file.

---

## Phase 7: Point Event Ingestion Pipeline

**Purpose**: Enable the system to actually award points by wiring the `LeaderboardCommandService` into the existing progress and participation event flows.

- [x] T049 Implement `LeaderboardCommandService` with `awardPoints()` method — inserts `PointEvent` via `IPointEventRepository` with idempotency key, then calls `cacheService.scheduleRebuild()` — in `src/domain/leaderboard/application/leaderboard-command.service.ts`
- [x] T050 [P] Create `POST /api/leaderboard/point-events/route.ts` — internal-only route (validate `x-internal-secret` header), validates request body with Zod (`userId`, `courseId`, `activityType`, `points`, `idempotencyKey`), calls `createLeaderboardDomain().command.awardPoints()`
- [x] T051 [P] Create `PUT /api/leaderboard/opt-out/route.ts` — authenticated route: toggles the session user's privacy opt-out for a given `courseId` using `ILeaderboardOptOutRepository`, returns updated `isAnonymous` status
- [x] T052 [P] Implement `DrizzleOptOutRepository` — concrete Drizzle implementation of `ILeaderboardOptOutRepository` with `isAnonymous()`, `getAnonymousUserIds()`, `setAnonymous()` (`INSERT ... ON CONFLICT DO NOTHING`), `setPublic()` (`DELETE WHERE`) — in `src/domain/leaderboard/infrastructure/db/leaderboard-opt-out.repository.ts`
- [x] T053 Hook `awardPoints()` into the existing course progress pipeline: after `CourseCompletionPolicy` marks a lesson or course as complete, emit a `PointAwarded` event that calls `POST /api/leaderboard/point-events` for `lesson_completion` / `course_completion` activity types — update `src/domain/courses/application/course-progress-command.service.ts`

**Checkpoint**: Points are now awarded when learners complete lessons, exams, or the course. Leaderboard rankings update within 5 minutes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Observability, accessibility, error resilience, performance hardening, and documentation.

- [x] T054 [P] Add Sentry error boundary around the leaderboard page component in `src/app/(platform)/courses/[slug]/leaderboard/page.tsx` — ensures leaderboard failures are captured and reported without crashing the course page
- [x] T055 [P] Add PostHog analytics events: `leaderboard_viewed` (with `courseId`, `window`, `userRank`), `leaderboard_opt_out_toggled`, and `leaderboard_exported` — emit from the relevant API route handlers
- [x] T056 [P] WCAG 2.1 AA audit: Add `aria-label` to rank badge elements in `LeaderboardRow`, add `aria-live="polite"` to the table container for rank-change announcements, verify colour contrast ratios for rank-1/2/3 gold/silver/bronze accents — update `src/components/leaderboard/LeaderboardRow.tsx`
- [x] T057 [P] Add Redis availability graceful degradation: if `RedisLeaderboardRepository` throws `ECONNREFUSED`, catch in `LeaderboardQueryService` and fall back to a direct PostgreSQL rank query (degraded mode, will be slower but functional) — update `src/domain/leaderboard/application/leaderboard-query.service.ts`
- [x] T058 [P] Implement `pnpm seed:leaderboard` script that creates 100 synthetic users with randomised `point_events` and runs an initial `LeaderboardCacheRebuildJob` — in `scripts/seed-leaderboard.ts`
- [x] T059 Validate the full quickstart flow from `specs/016-course-leaderboard/quickstart.md` — Docker Redis, `pnpm db:push`, `pnpm seed:leaderboard`, dev server, all three time windows, opt-out toggle, admin export
- [x] T060 [P] Update `src/app/(platform)/courses/[slug]/page.tsx` to add a "Leaderboard" navigation tab that is conditionally shown only when `LEADERBOARD_ENABLED=true` and the course has at least one enrolled learner

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational — Policies, Types, Errors)
    │
    ├──────────────────────────────────────────────────────────┐
    ▼                                                          ▼
Phase 3 (US1 — Core Leaderboard View)               Phase 7 (Point Ingestion — can be parallel)
    │
    ├────────────────────────────────────────────────┐
    ▼                                                ▼
Phase 4 (US2 — Scoring Transparency)      Phase 5 (US3 — Time Windows)
    │                                                │
    └──────────────┬──────────────────────────────────┘
                   ▼
           Phase 6 (US4 — Admin View)
                   │
                   ▼
           Phase 8 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Be Parallel With |
|-------|-----------|---------------------|
| US1 (View Leaderboard) | Phase 2 complete | Phase 7 |
| US2 (Scoring Info) | US1 complete (shares `LeaderboardShell`) | US3 |
| US3 (Time Windows) | US1 complete (extends routes + shell) | US2 |
| US4 (Admin View) | US1 complete (extends routes + row) | — |
| Phase 7 (Ingestion) | Phase 2 complete | US1 |

### Within Each Phase: Task Order

1. **Contracts / types first** (T006–T015) — nothing compiles without them
2. **Infrastructure** (repositories) before **application services**
3. **Services** before **API route handlers**
4. **Route handlers** before **UI components** that call them
5. **`loading.tsx`** can always be built in parallel with the page component

---

## Parallel Execution Examples

### Phase 2 — All Parallelisable

```
T006 (contracts)  ─┐
T007 (events)     ─┤
T008 (errors)     ─┤─── All in parallel (different files, no dependencies)
T009 (scoring)    ─┤
T010 (privacy)    ─┤
T011 (specs)      ─┘
```

### Phase 3 — Infrastructure Layer (after T006–T015)

```
T016 (DrizzlePointEventRepo)  ─┐
T017 (RedisLeaderboardRepo)   ─┘─── In parallel (different files)
```

### Phase 3 — UI Components (after T027)

```
T025 (Skeleton)     ─┐
T026 (EmptyState)   ─┤─── In parallel (different files)
T027 (Row)          ─┘
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. ✅ Complete Phase 1 — Setup
2. ✅ Complete Phase 2 — Foundational
3. ✅ Complete Phase 3 — US1 (Core Leaderboard View)
4. **STOP & VALIDATE**: Seed the course, navigate to leaderboard, verify rankings
5. Ship to staging

### Incremental Delivery

| Increment | Delivers | Validates |
|-----------|---------|----------|
| Phase 1+2+3 | Core leaderboard view | Rankings, own rank, staleness |
| + Phase 4 | Scoring transparency | Info modal, per-category breakdown |
| + Phase 5 | Time windows | Weekly/monthly competitive resets |
| + Phase 6 | Admin oversight | Unmasked view, CSV export |
| + Phase 7 | Live point events | Scores update as learners complete lessons |
| + Phase 8 | Production hardening | Sentry, PostHog, WCAG, graceful degradation |

### Parallel Team Strategy

With two developers:
- **Dev A**: Phase 2 (types/policies) → Phase 3 Infrastructure (T016–T022) → Phase 3 API (T023–T024)
- **Dev B**: Phase 2 (types/policies, same phase) → Phase 3 UI (T025–T032) → Phase 4 (US2)

Both share Phase 2 types. After Phase 2, work diverges completely until Phase 8.

---

## Summary

| Phase | Tasks | Story | Parallelisable |
|-------|-------|-------|---------------|
| Phase 1 — Setup | T001–T005 | — | T002, T003 |
| Phase 2 — Foundational | T006–T015 | — | T006–T012 |
| Phase 3 — US1 Core View | T016–T032 | US1 | T016, T017, T025–T027, T032 |
| Phase 4 — US2 Scoring Info | T033–T036 | US2 | T033, T034 |
| Phase 5 — US3 Time Windows | T037–T043 | US3 | T039, T040 |
| Phase 6 — US4 Admin View | T044–T048 | US4 | T046 |
| Phase 7 — Ingestion Pipeline | T049–T053 | — | T050, T051, T052 |
| Phase 8 — Polish | T054–T060 | — | T054–T058, T060 |
| **Total** | **60 tasks** | 4 stories | ~28 tasks parallelisable |

**Suggested MVP scope**: Phases 1 + 2 + 3 (Tasks T001–T032) — 32 tasks, independently testable leaderboard view.
