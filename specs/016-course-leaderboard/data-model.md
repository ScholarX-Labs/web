# Data Model: Course Leaderboard

**Feature**: `016-course-leaderboard`
**Status**: Approved
**ORM**: Drizzle ORM (PostgreSQL dialect)
**Cache**: Redis 7 (Sorted Sets)

---

## Entity Relationship Overview

```
┌──────────────┐         ┌─────────────────┐         ┌──────────────────────┐
│    users     │────────▷│  point_events   │◁────────│       courses        │
│  (existing)  │  1:N    │  (append-only)  │  N:1    │     (existing)       │
└──────────────┘         └─────────────────┘         └──────────────────────┘
        │                        │                            │
        │                        │ (aggregated by job)        │
        │                        ▼                            │
        │               ┌─────────────────┐                  │
        │               │ Redis ZSET Cache│                  │
        │               │ (derived, evict)│                  │
        │               └─────────────────┘                  │
        │                                                     │
        │         ┌──────────────────────────┐               │
        └────────▷│  leaderboard_opt_outs    │◁──────────────┘
          1:N     │  (privacy preferences)   │   N:1
                  └──────────────────────────┘
```

---

## PostgreSQL Schema (Drizzle ORM)

### Table: `point_events`

**Purpose**: Immutable, append-only event log. The **system of record** for all leaderboard scores. Never updated — corrections are negative-delta inserts.

```typescript
// src/db/schema/leaderboard.ts

export const activityTypeEnum = pgEnum("activity_type", [
  "quiz",
  "exam",
  "forum_post",
  "assignment_submit",
  "lesson_completion",
  "course_completion",
]);

export const pointEvents = pgTable(
  "point_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    activityType: activityTypeEnum("activity_type").notNull(),
    activityId: uuid("activity_id"),   // Optional: FK to the source quiz/lesson/post
    points: integer("points").notNull(), // Can be negative (correction events)
    idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(), // Prevents duplicate awards
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Primary read pattern: aggregate per course, window, user
    courseWindowIdx: index("pe_course_window_idx").on(
      table.courseId,
      table.createdAt,
      table.userId,
      table.activityType,
    ),
    // For looking up a user's points in a specific course
    userCourseIdx: index("pe_user_course_idx").on(table.userId, table.courseId),
    // Idempotency enforcement
    idempotencyIdx: uniqueIndex("pe_idempotency_key_idx").on(
      table.idempotencyKey,
    ),
  }),
);
```

**Design Notes**:
- `idempotency_key` prevents double-awarding points if a quiz completion webhook fires twice. The calling service generates a deterministic key (e.g., `quiz:{quizId}:user:{userId}:attempt:{n}`).
- `activity_id` is optional but enables "score breakdown" queries that trace a score back to a specific quiz or forum post.
- `points` is an `integer` (not `float`) to avoid floating-point accumulation errors. Weights are applied at scoring time, not stored here.

---

### Table: `leaderboard_opt_outs`

**Purpose**: Stores a learner's privacy preference per course. Absence of a row means the learner is public (default).

```typescript
export const leaderboardOptOuts = pgTable(
  "leaderboard_opt_outs",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.courseId] }),
  }),
);
```

**Design Notes**:
- Uses a composite primary key `(user_id, course_id)` — one preference row per learner per course.
- Opt-in (public) is represented by the **absence** of a row (no wasted storage for the default case).
- Opt-out (anonymous) is represented by the **presence** of a row.
- Toggling is implemented as `INSERT ... ON CONFLICT DO DELETE` or two separate `INSERT`/`DELETE` operations.

---

## Domain Types (TypeScript Contracts)

```typescript
// src/domain/leaderboard/contracts/leaderboard.types.ts

export type LeaderboardWindow = "all" | "week" | "month";

export type LeaderboardActivityType =
  | "quiz"
  | "exam"
  | "forum_post"
  | "assignment_submit"
  | "lesson_completion"
  | "course_completion";

export type LeaderboardActivityCategory =
  | "quizzes_and_exams"
  | "participation"
  | "course_completion";

// Maps raw activity types to their scoring category
export const ACTIVITY_CATEGORY_MAP: Record<
  LeaderboardActivityType,
  LeaderboardActivityCategory
> = {
  quiz: "quizzes_and_exams",
  exam: "quizzes_and_exams",
  forum_post: "participation",
  assignment_submit: "participation",
  lesson_completion: "course_completion",
  course_completion: "course_completion",
};

// Weights MUST sum to 1.0
export const CATEGORY_WEIGHTS: Record<LeaderboardActivityCategory, number> = {
  quizzes_and_exams: 0.40,
  participation: 0.30,
  course_completion: 0.30,
};

// ── Raw DB record from point_events aggregation ──────────────────────────────

export interface PointEventAggregate {
  userId: string;
  category: LeaderboardActivityCategory;
  totalPoints: number;
}

// ── Computed domain objects ───────────────────────────────────────────────────

export interface ScoreBreakdown {
  quizzesAndExams: number;
  participation: number;
  courseCompletion: number;
}

export interface CompositeScore {
  total: number;        // Weighted composite (used for ranking display)
  breakdown: ScoreBreakdown;
  achievedAt: Date;     // Timestamp of the event that produced the current total
}

export interface RawLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: CompositeScore;
  isAnonymous: boolean;
}

export interface LeaderboardEntryDto {
  rank: number;
  displayName: string;       // Masked to "Anonymous Learner" if opted out (server-enforced)
  avatarUrl: string | null;  // null if opted out
  totalScore: number;
  isCurrentUser: boolean;
}

export interface MyRankDto {
  rank: number | null;
  totalScore: number;
  breakdown: ScoreBreakdown;
  window: LeaderboardWindow;
  isAnonymous: boolean;
  updatedAt: string;         // ISO-8601
}

// ── Repository interfaces (Dependency Inversion) ──────────────────────────────

export interface IPointEventRepository {
  /** Insert a new point event. Idempotent via idempotency_key. */
  insertPointEvent(event: InsertPointEvent): Promise<void>;

  /** Aggregate raw category totals per user for a course + time window. */
  aggregateByCourseAndWindow(
    courseId: string,
    window: LeaderboardWindow,
    windowStart: Date | null,
  ): Promise<PointEventAggregate[]>;

  /** Per-user, per-category breakdown for score detail view. */
  getUserBreakdown(
    userId: string,
    courseId: string,
    window: LeaderboardWindow,
    windowStart: Date | null,
  ): Promise<PointEventAggregate[]>;
}

export interface InsertPointEvent {
  userId: string;
  courseId: string;
  activityType: LeaderboardActivityType;
  activityId?: string;
  points: number;
  idempotencyKey?: string;
}

export interface ILeaderboardCacheRepository {
  /** Atomically replace the ZSET for a course+window. */
  rebuildLeaderboard(
    courseId: string,
    window: LeaderboardWindow,
    entries: CacheEntry[],
    updatedAt: Date,
  ): Promise<void>;

  /** Top-K entries by rank (highest ZSET score first). */
  getTopEntries(
    courseId: string,
    window: LeaderboardWindow,
    limit: number,
  ): Promise<CachedRankEntry[]>;

  /** A single user's rank (1-indexed) and ZSET score. */
  getUserRank(
    courseId: string,
    window: LeaderboardWindow,
    userId: string,
  ): Promise<{ rank: number; zsetScore: number } | null>;

  /** Timestamp of last cache build. */
  getUpdatedAt(courseId: string, window: LeaderboardWindow): Promise<Date | null>;
}

export interface CacheEntry {
  userId: string;
  zsetScore: number;  // Pre-computed by LeaderboardScoringPolicy
}

export interface CachedRankEntry {
  rank: number;
  userId: string;
  zsetScore: number;
}

export interface ILeaderboardOptOutRepository {
  isAnonymous(userId: string, courseId: string): Promise<boolean>;
  getAnonymousUserIds(courseId: string): Promise<Set<string>>;
  setAnonymous(userId: string, courseId: string): Promise<void>;
  setPublic(userId: string, courseId: string): Promise<void>;
}
```

---

## Redis Key Schema

| Key Pattern | Type | Description | TTL |
|-------------|------|-------------|-----|
| `leaderboard:{courseId}:all` | ZSET | All-time rank store | No expiry |
| `leaderboard:{courseId}:week:{YYYY-WW}` | ZSET | ISO week rank store | 8 days |
| `leaderboard:{courseId}:month:{YYYY-MM}` | ZSET | Calendar month rank store | 35 days |
| `leaderboard:{courseId}:{window}:updated_at` | STRING | ISO-8601 timestamp of last rebuild | Co-expire with ZSET |
| `leaderboard:job:{courseId}:{window}` | STRING | Debounce lock for rebuild jobs | 5 minutes |

**ZSET Score Encoding**:
```
ZSET_SCORE (float64) = composite_score × 1_000_000
                     + (4_102_444_800_000 - achieved_at_ms)
```

`ZREVRANGE leaderboard:{courseId}:all 0 9` returns the top 10 users in correct order (highest rank first, ties broken by earliest timestamp) without any application-layer sorting.

---

## Database Migration Notes

- Migration `0016_add_leaderboard_tables.sql` creates:
  - `activity_type` enum type
  - `point_events` table with all indexes
  - `leaderboard_opt_outs` table with composite PK
- No modifications to existing tables.
- The migration is additive-only and backward-compatible with the current application state.
