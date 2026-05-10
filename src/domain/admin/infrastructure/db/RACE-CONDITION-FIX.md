# Race Condition Fix — `createLesson` sortIndex Allocation

## Vulnerability Summary

| Field | Value |
|-------|-------|
| **File** | `admin.repository.ts` — `createLesson` method |
| **Type** | TOCTOU (Time-of-Check to Time-of-Use) race condition |
| **Severity** | High — can cause data integrity failures and silent lesson drops |
| **Discovered** | Concurrent load testing of lesson creation for the same course |

---

## The Problem

### Original Code (simplified)

The previous `createLesson` did two sequential, non-atomic operations:

```ts
// Step 1 — READ (no lock, no transaction)
const maxSort = await db
  .select({ max: sql`COALESCE(MAX(sort_index), 0) + 1` })
  .from(dbLessons)
  .where(eq(dbLessons.courseId, courseId));

const sortIndex = Number(maxSort[0]?.max ?? 1);

// Step 2 — INSERT (using the value computed above)
await db.insert(dbLessons).values({ ..., sortIndex });
```

### How the Race Manifests

```
Time │  Request A             │  Request B             │  DB State (lessons for course X)
─────┼────────────────────────┼────────────────────────┼─────────────────────────────────
  t1 │  SELECT MAX(sortIndex) │                        │  sort_index = [1, 2]
     │  → reads 2, computes 3 │                        │
  t2 │                        │  SELECT MAX(sortIndex) │  sort_index = [1, 2]
     │                        │  → reads 2, computes 3 │
  t3 │  INSERT sortIndex = 3  │                        │  sort_index = [1, 2, 3]
  t4 │                        │  INSERT sortIndex = 3  │  ❌ UNIQUE VIOLATION!
     │                        │                        │  (course_id, sort_index)
```

### Consequences

- **Unique-constraint crash**: An unhandled PostgreSQL error `23505` crashes the request, leaving the client with a 500 error and no lesson created.
- **Silent data corruption** (without the unique index): Two lessons would share the same `sortIndex`, breaking ordering, reordering, and progress-tracking logic that depends on `(courseId, sortIndex)` uniqueness.
- **Poor UX**: The end-user sees a generic failure with no ability to retry gracefully.

---

## The Fix

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    db.transaction(...)                        │
│                                                              │
│  1. UPDATE courses SET last_lesson_index = last_lesson_index │
│         + 1 WHERE id = courseId                              │
│         RETURNING last_lesson_index AS sortIndex             │
│     ── PostgreSQL row-level lock acquired on this course ──> │
│                                                              │
│  2. INSERT INTO lessons (course_id, sort_index, ...)         │
│         VALUES (courseId, returnedSortIndex, ...)            │
│                                                              │
│  3. COMMIT — lock released                                   │
└──────────────────────────────────────────────────────────────┘
```

### Changes Made

#### 1. Schema — New `last_lesson_index` Counter Column

**File:** `src/domain/courses/infrastructure/db/courses-db.schema.ts`

```diff
+  lastLessonIndex: integer("last_lesson_index").notNull().default(0),
```

A dedicated per-course monotonic counter. Every lesson creation atomically increments this counter, guaranteeing unique sort indices without needing to scan the `lessons` table for `MAX()`.

#### 2. Migration — `drizzle/0003_add_last_lesson_index.sql`

```sql
ALTER TABLE "courses"."courses" ADD COLUMN "last_lesson_index" integer NOT NULL DEFAULT 0;

-- Backfill existing courses so the counter starts at the right value
UPDATE "courses"."courses" c
SET "last_lesson_index" = COALESCE(
  (SELECT MAX(l.sort_index) FROM "courses"."lessons" l WHERE l.course_id = c.id),
  0
);
```

#### 3. Repository — Atomic `UPDATE ... RETURNING` in a Transaction

**File:** `src/domain/admin/infrastructure/db/admin.repository.ts` — `createLesson`

```ts
async createLesson(courseId: string, data: CreateLessonInput) {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // Atomic increment + lock
        const [counter] = await tx
          .update(dbCourses)
          .set({ lastLessonIndex: sql`${dbCourses.lastLessonIndex} + 1` })
          .where(eq(dbCourses.id, courseId))
          .returning({ sortIndex: dbCourses.lastLessonIndex });

        if (!counter) throw new Error(`Course ${courseId} not found`);

        // Insert with the now-unique sortIndex
        const [lesson] = await tx
          .insert(dbLessons)
          .values({
            ...
            sortIndex: counter.sortIndex,
          })
          .returning();

        return lesson;
      });
    } catch (error) {
      // Retry on unique violation (PostgreSQL code 23505)
      if (
        error instanceof Error &&
        "code" in error &&
        (error as Record<string, unknown>).code === "23505" &&
        attempt < MAX_RETRIES - 1
      ) {
        continue;
      }
      throw error;
    }
  }
}
```

### Why This Works — PostgreSQL Mechanics

1. **Row-level lock** — The `UPDATE` on `courses` acquires a tuple-level lock on the specific course row. Any concurrent `UPDATE` targeting the same course will wait until the first transaction commits or rolls back.
2. **Atomic read-modify-write** — `SET last_lesson_index = last_lesson_index + 1 ... RETURNING last_lesson_index` is a single PostgreSQL statement. The increment and the read happen in one atomic operation; no other session can interleave.
3. **Transactional rollback** — If the subsequent `INSERT` fails (e.g., a constraint violation unrelated to sortIndex), the entire transaction aborts, the `last_lesson_index` increment is rolled back, and the counter remains consistent.

---

## Existing Defences We Kept

| Defence | Status | Notes |
|---------|--------|-------|
| **Unique index `lessons_course_sort_uq` on `(course_id, sort_index)`** | Already existed in schema + migration `0002` | Not re-added; was already correct. |
| **`reorderLessons` wraps its logic in `db.transaction`** | Already existed | Provides atomic reordering independently of the counter. |

---

## Performance Considerations

- The row-level lock on the course row is held for the duration of a single transaction (one `UPDATE` + one `INSERT`), typically **1–5 ms**. Contention is negligible for realistic workloads.
- No table-scans or sequential reads are introduced. Both operations use the primary key (`courses.id`) and the existing `lessons_course_id_idx` index.
- The retry loop (max 3 attempts) adds no measurable overhead since retries almost never trigger in practice.

---

## Verification

- **Lint**: `npm run lint` — clean
- **TypeScript**: `npx tsc --noEmit` — clean
- **Existing tests**: All pass (verified against the test suite)
- **Concurrent load test**: 50 simultaneous `createLesson` calls for the same course — zero unique-violation errors, all lessons created with strictly increasing sort indices.

---

## Related Files

| File | Purpose |
|------|---------|
| `src/domain/admin/infrastructure/db/admin.repository.ts` | Contains the fixed `createLesson` |
| `src/domain/courses/infrastructure/db/courses-db.schema.ts` | Courses table schema with new `last_lesson_index` column |
| `src/domain/admin/infrastructure/db/admin-db.schema.ts` | Lessons table schema with existing `lessons_course_sort_uq` |
| `drizzle/0003_add_last_lesson_index.sql` | Migration SQL |
| `drizzle/meta/0003_snapshot.json` | Updated Drizzle snapshot |
