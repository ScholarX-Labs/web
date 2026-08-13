# Feature Specification: Lesson Tasks

**Feature Branch**: `022-lesson-tasks`
**Created**: 2026-08-11
**Status**: Production-Ready Final
**Author**: Principal SWE Review, ScholarX Platform

---

## Overview

Lesson Tasks give learners a structured, points-backed knowledge check immediately after each lesson and give course creators a first-class authoring surface to create those checks. A task is either an **MCQ**, a **Written Question**, a **SWOT Analysis**, or an **External Link** (Google Doc/Form or any URL). Each task carries a **point value** awarded only on a correct solution, is **solvable once** per learner, and is independently configurable as **optional** or **mandatory**.

This feature is the connective tissue between three existing subsystems:

1. **Course delivery** — lessons, lesson progress, and course completion (`courses` schema, `lessons`, `lesson_progress`, `course_progress`).
2. **Gamification/leaderboard** — the existing `point_events` ledger (`leaderboard` schema, Feature 016) that powers the Course Leaderboard. Task awards MUST flow into this ledger so points earned on tasks are real, auditable, and immediately reflected in leaderboards.
3. **Admin course builder** — the curriculum editor at `admin/courses/[courseId]` where lessons are authored.

The core engineering constraint is explicit in the request: **the platform has moved CI/CD to Vercel with a Supabase/Postgres backend, and any schema change must be planned, additive, reversible, and communicated before deployment.** This spec treats the migration as a first-class deliverable with an expand-contract strategy — see [Database & Migration Strategy](#database--migration-strategy).

---

## Design Principles

- **Truthful points.** Points are only ever awarded against a *correct* solution of an explicitly configured task, recorded once, and written to the immutable `point_events` ledger. No speculative or client-claimed points.
- **One-time solves are enforced by the database, not by the UI.** A composite unique constraint on `(user_id, task_id)` is the system of record; client-side disabling is only a UX layer.
- **Type-specific behavior behind a single interface.** Each task type owns its payload shape, validation, rendering, and grading. Adding a new task type must not require touching services or routes (Open/Closed).
- **Admin authoring and learner consumption are cleanly separated** across the auth boundary, the domain services (CQRS), and the route handlers.
- **Schema changes are additive and reversible.** New tables only, no renames, no destructive DDL, enum extended via `ALTER TYPE ... ADD VALUE`.

---

## Grading Matrix

Each task type has a distinct grading mechanism, trigger, and submission lifecycle.

| Task Type | Grading Mechanism | Point Award Trigger | Submission Status Lifecycle |
|---|---|---|---|
| **MCQ** | Auto-graded server-side | Correct option selected | `unanswered` → `correct` (points) or `unanswered` → `incorrect` (no points) |
| **Written** | Auto-awarded (participation) | Any valid text submitted | `unanswered` → `correct` (points) |
| **SWOT** | Auto-awarded (participation) | Any valid quadrant payload submitted | `unanswered` → `correct` (points) |
| **Link** | Honor-system confirm | Learner clicks "Mark as Done" | `unanswered` → `correct` (points) |

> **Security Note**: For MCQs, the `correctOptionId` is **never** returned in any learner-facing response. Grading happens exclusively server-side inside the `McqStrategy`.

---

## State Machine

Formal `TaskSubmission` state transitions with guards:

```
                     ┌─────────────────────────────────────────┐
                     │              (No Record)                 │
                     │           "unanswered"                   │
                     └──────────┬──────────────────────────────┘
                                │
                    [submitTask] guard: enrollment valid,
                                │ lesson completed, no prior submission
                                ▼
                     ┌─────────────────┐
                     │    EVALUATING   │ ← server-side strategy evaluation
                     └──┬──────────┬──┘
              [MCQ correct]     [MCQ incorrect]
              [Written/SWOT]    [Link confirm]
                   │                  │
                   ▼                  ▼
            ┌──────────┐      ┌───────────┐
            │ correct  │      │ incorrect │
            └──────────┘      └───────────┘
              points ✓           points ✗
                  ▲
          [Written / SWOT / Link]
          (always lands here)

        ┌──────────────────────┐
        │ [skipTask]           │ guard: task isOptional = true,
        │                      │        no prior submission
        └──────────┬───────────┘
                   ▼
            ┌──────────┐
            │  skipped │ no points
            └──────────┘
```

**Guards Summary**:
- `submitTask`: `ActiveEnrollmentSpecification`, `LessonCompletedSpecification`, `TaskPublishedSpecification`, `NoExistingSubmissionSpecification`
- `skipTask`: Same as above, plus `TaskIsOptionalSpecification`

**Immutability**: All terminal states (`correct`, `incorrect`, `skipped`) are immutable. No re-attempts.

---

## Security Threat Model

| Threat | Category | Mitigation |
|---|---|---|
| **Answer Leakage** | Data exposure | `McqStrategy.toLearnerConfig()` strips `correctOptionId` before serialization. Contract tests assert its absence. |
| **Point Farming** | Abuse / integrity | DB unique constraint `task_submissions_user_task_uq(user_id, task_id)` enforced at the database, not just UI. `NoExistingSubmissionSpecification` asserts in the service before any write. |
| **Double-award via retry** | Integrity | `clientEventId` + `task_submissions_user_client_event_uq(user_id, client_event_id)` make retried requests idempotent. |
| **SSRF via Link tasks** | Security | URL validator in `LinkStrategy.validateAnswer()` accepts only `http:`/`https:` schemes. `javascript:` and data URIs are rejected with `INVALID_ANSWER`. |
| **IDOR on submissions** | Authorization | `userId` is always taken from the authenticated session, never from the request body. |
| **Admin privilege escalation** | Authorization | All admin routes assert `AdminCanEditCourseSpecification` at the route boundary using the existing session guard pattern. |
| **Answer payload in logs** | Privacy | `NFR-013`: `answer` JSONB is never included in structured logs — only `taskId`, `userId`, `courseId`, and result metadata. |
| **Bot point farming** | Abuse | Submission endpoints are rate-limited per user via the existing rate-limit middleware. |

---

## Observability Contract

All structured log events MUST use stable identifiers only, never full answer payloads.

| Event | Trigger | Required Fields |
|---|---|---|
| `lesson_task.created` | Admin creates a task | `taskId`, `lessonId`, `courseId`, `type`, `adminId` |
| `lesson_task.updated` | Admin edits task config/points | `taskId`, `lessonId`, `courseId`, `changedFields[]`, `adminId` |
| `lesson_task.archived` | Admin soft-deletes | `taskId`, `lessonId`, `courseId`, `adminId` |
| `lesson_task.submitted` | Learner submits | `taskId`, `userId`, `courseId`, `type`, `result` (`correct`\|`incorrect`\|`skipped`) |
| `lesson_task.points_awarded` | Point event written | `taskId`, `userId`, `courseId`, `pointsEarned`, `idempotencyKey` |
| `lesson_task.points_dispatch_failed` | Leaderboard API call failed | `taskId`, `userId`, `courseId`, `httpStatus`, `error` |

---

## Error Code Registry

| Code | HTTP Status | Numeric Code | Description |
|---|---|---|---|
| `TASK_NOT_FOUND` | 404 | 2001 | Task does not exist or is archived |
| `TASK_NOT_PUBLISHED` | 409 | 2002 | Task exists but is in `draft` status |
| `LESSON_NOT_COMPLETED` | 403 | 2003 | Learner has not completed the lesson yet |
| `ALREADY_SUBMITTED` | 409 | 2004 | Submission record already exists for this (user, task) pair |
| `TASK_NOT_OPTIONAL` | 422 | 2005 | Skip attempted on a mandatory task |
| `INVALID_ANSWER` | 400 | 2006 | Answer payload fails per-type schema validation |
| `ENROLLMENT_REQUIRED` | 403 | 2007 | User is not actively enrolled in the course |
| `ANSWER_TOO_LARGE` | 413 | 2008 | Written/SWOT answer exceeds 10 KB |
| `MALICIOUS_URL` | 400 | 2009 | Link URL uses a non-http(s) scheme |
| `CONCURRENT_SUBMISSION` | 409 | 2010 | Unique constraint race; retry |
| `TASK_COURSE_MISMATCH` | 422 | 2011 | Task does not belong to the specified course/lesson |

---

## Feature Flag Specification

**Flag Name**: `LESSON_TASKS_V1_ENABLED`
**Environment Variable**: `NEXT_PUBLIC_FF_LESSON_TASKS_V1`
**Default**: `false`

| Behavior | Flag OFF (default) | Flag ON |
|---|---|---|
| Admin Tasks tab | Hidden | Visible |
| Learner task section | Hidden | Visible |
| Mandatory task completion gating | Disabled (policy v1 unchanged) | Enabled (mandatory tasks block completion) |
| Point events for tasks | Not written | Written |

**Rollout Strategy**:
1. Deploy schema migration with flag `false`.
2. Enable flag in staging environment and run verification suite.
3. Enable for a controlled set of test courses in production.
4. Full rollout after 48-hour soak.

**Rollback**: Set flag to `false`. No schema changes needed. Existing submissions and point events are preserved for auditability.

---

## Migration Runbook

### Pre-Deployment Checklist
- [ ] Feature flag `LESSON_TASKS_V1_ENABLED` is `false` on all environments.
- [ ] `specs/022-lesson-tasks/spec.md` is reviewed and approved.
- [ ] Rollback SQL script is ready.

### Step 1: Generate & Apply Migration
```bash
# Generate migration from schema changes
npm run db:generate

# Apply to staging database
npm run db:migrate

# Verify tables exist and constraints are correct
```

### Step 2: Verify Staging
- Confirm `courses.lesson_tasks` and `courses.task_submissions` tables are created.
- Confirm unique constraints: `task_submissions_user_task_uq`, `task_submissions_user_client_event_uq`.
- Confirm `activity_type` enum has `lesson_task` value.
- Run existing course-progress test suite to confirm no regressions.

### Step 3: Deploy Code
Deploy the application code to Vercel *after* the migration has been applied.

### Step 4: Rollout Flag
Enable `LESSON_TASKS_V1_ENABLED` in the Vercel environment dashboard.

### Rollback Plan
```sql
-- Drop new tables (no data loss on existing tables)
DROP TABLE IF EXISTS courses.task_submissions;
DROP TABLE IF EXISTS courses.lesson_tasks;
-- Note: PostgreSQL does not support removing enum values.
-- The 'lesson_task' enum value is harmless if unused.
```
Code rollback: revert Vercel deployment to the prior release.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Complete a Lesson Task (Priority: P1)

As a learner, I want to see and complete the tasks that follow a lesson I just finished, so that I can test my understanding, earn points, and stay engaged.

**Why this priority**: Task completion is the core engagement loop of this feature. Without it there is no feature.

**Independent Test**: Take a course lesson with a published MCQ task. Reach the lesson end screen, answer correctly, and confirm the task shows as solved, the points are awarded, and a second submission is rejected.

**Acceptance Scenarios**:

1. **Given** a learner has completed a lesson that has published tasks, **When** they reach the post-lesson section, **Then** the tasks render in configured order, each showing its type, point value, and optional/mandatory badge.
2. **Given** a learner answers an MCQ correctly, **When** they submit, **Then** the system marks it solved, awards the configured points once, shows a success state, and rejects any further submission for that task.
3. **Given** a learner is viewing an optional task, **When** they choose to skip it, **Then** they proceed to the next lesson without penalty and the skip is recorded.
4. **Given** a learner submits a Written or SWOT answer, **When** they submit, **Then** the submission is marked solved, points are automatically awarded (participation points), and the UI reflects the award.

---

### User Story 2 — Add and Configure Tasks in the Course Builder (Priority: P1)

As a course creator/admin, I want to add one or more tasks to a lesson and configure type, points, and optionality, so that I can author assessments that match my curriculum.

**Why this priority**: Creators must be able to author tasks before learners can engage with them; this is the supply side of the primary flow.

**Independent Test**: Open the lesson editor in the admin course builder, add one task of each type, set points and mandatory/optional, save, and confirm the tasks appear in the learner view of the lesson.

**Acceptance Scenarios**:

1. **Given** an admin is editing a lesson in the course builder, **When** they open the Tasks tab, **Then** they can create tasks of type MCQ, Written, SWOT, or Link, set a non-negative point value, and mark each as optional or mandatory.
2. **Given** an admin has added tasks, **When** they save the lesson, **Then** tasks are persisted with ordering and become visible to learners only when their status is `published`.
3. **Given** an admin edits an existing task, **When** they change its point value or content, **Then** previously submitted solutions are unaffected (point values are snapshotted at submission time) and a confirmation explains this.

---

### User Story 3 — External Link Tasks via Honor System (Priority: P2)

As a learner, I want to open an external resource (Google Doc, Form, survey) and confirm completion, so that link-based tasks are not a dead end.

**Why this priority**: The platform cannot verify activity inside third-party systems. The confirmed-open honor system is the only truthful mechanism available, and it keeps link tasks from being un-finisheable.

**Independent Test**: Open a course with a published link task. Click the link, return, confirm completion, and verify the task is marked solved with points awarded.

**Acceptance Scenarios**:

1. **Given** a link task, **When** the learner opens the configured URL and confirms completion, **Then** the task is marked solved and the configured points are awarded once.
2. **Given** a link task whose URL is unreachable (broken link), **When** the learner attempts to open it, **Then** the learner sees a clear error state and the task remains unanswered without penalty.
3. **Given** a link task, **When** the learner has already confirmed it, **Then** the UI shows the solved state and no further submission is possible.

---

### Edge Cases

- **Incorrect MCQ answer**: Marked `incorrect`, zero points, one-time rule still applies (no retry). The correct option is revealed after submission to support learning.
- **Double submit / network retry**: A `clientEventId` + composite unique constraint on `(user_id, client_event_id)` make resubmission idempotent; a retried request never double-awards points.
- **Point value changed after solves**: Historical submissions keep the point value snapshotted at submission time. Future submissions use the new value. Confirmation copy in the admin UI explains this.
- **Task type changed after solves**: Submissions are preserved against the original payload snapshot; the learner view shows the previous result and the new task only affects new submissions.
- **Task deleted/archived after solves**: Tasks are soft-deleted (`archived`) so historical submissions and point events remain valid and auditable; the learner view no longer surfaces the task.
- **Broken external link**: Never blocks lesson flow, never awards points, explicit error copy.
- **Lesson archived or reordered**: Ordering is per-lesson (`sort_index`); reordering lessons never reorders tasks across lessons. Archiving a lesson cascades its tasks to `archived` (soft).
- **User unenrolled or refunded**: They can no longer submit (enrollment specification guard) but existing submissions and point events are preserved for auditability.
- **Mandatory tasks vs. course completion**: Mandatory-task completion gates course completion ONLY when the feature flag is enabled; default behavior (completion policy v1) is preserved so certificates and existing completion states are not broken.
- **Zero published tasks**: The post-lesson section renders a clean empty state; no task UI, no errors.
- **Oversized written answers**: Rejected at the API boundary with a clear message (limit configurable, default 10 KB).
- **Malicious link URLs**: Only `http:`/`https:` protocols are accepted; `javascript:` and other schemes are rejected at validation time with error code `MALICIOUS_URL`.
- **Bot traffic**: Submission endpoints are rate-limited per user; no answer payloads are ever cached publicly or logged.
- **i18n**: All task UI strings come from the Feature 015 message catalog; task *content* is author-authored text and stored as authored.
- **Reduced motion**: Result/transition animations respect `prefers-reduced-motion`.
- **Task published mid-session**: A learner with an open lesson sees new tasks on the next data fetch; no stale render.
- **Learner not enrolled / lesson locked**: Guarded by specifications at the service boundary; never renders tasks for unauthorized users.
- **Feature flag off during active session**: Tasks are hidden; no errors shown to learner; existing submissions preserved.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support associating multiple tasks with a single lesson.
- **FR-002**: System MUST support the following task types: MCQ (single correct answer), Written Question, SWOT Analysis, and External Link.
- **FR-003**: The system MUST allow each task to be configured as `optional` or `mandatory`.
- **FR-004**: The system MUST allow each task to carry a non-negative integer point value (`points_awarded`).
- **FR-005**: The system MUST enforce that each task can be solved at most once per learner using a database-level unique constraint on `(user_id, task_id)`.
- **FR-006**: System MUST award points to the user when a task resolves to `correct`. For Written and SWOT tasks, points are auto-awarded on valid submission. For External Links, points are awarded on explicit "Mark as Done" confirmation. All awards MUST be recorded in `point_events`.
- **FR-007**: The system MUST auto-grade `mcq` tasks server-side; the `correctOptionId` MUST never be present in any learner-facing response payload.
- **FR-008**: The system MUST auto-award participation points for `written` and `swot` tasks upon valid submission without manual instructor review.
- **FR-009**: The system MUST support `link` tasks via a confirmed-open honor system, awarding configured points on explicit learner confirmation.
- **FR-010**: The system MUST allow learners to skip `optional` tasks without penalty; skipping MUST be recorded as `skipped` but MUST NOT award points.
- **FR-011**: The system MUST snapshot the configured point value and task payload at submission time so later admin edits never alter historical results.
- **FR-012**: The system MUST render the learner task UI in the post-lesson section of the lesson viewer, immediately following lesson content and before the "next lesson" navigation.
- **FR-013**: System MUST integrate the task creation UI into the existing course admin dashboard / lesson builder as a dedicated "Tasks" tab, supporting create, edit, reorder, archive, and publish/draft transitions.
- **FR-014**: The system MUST expose submission state (`unanswered` / `correct` / `incorrect` / `skipped`) to the learner UI so the post-lesson section never asks for a second submission.
- **FR-015**: The system MUST gate all learner-facing task reads and submissions behind enrollment + lesson-completion eligibility checks, enforced at the service specification boundary.
- **FR-016**: When `LESSON_TASKS_V1_ENABLED` is `true`, the system MUST treat outstanding mandatory tasks as blocking course completion and certificate issuance, WITHOUT modifying the default completion policy for existing courses when the flag is `false`.

### Non-Functional Requirements & Constraints

- **NFR-001 (Migration Safety)**: ALL schema changes MUST be additive and reversible. A documented rollback plan MUST exist before deployment. The migration MUST be applicable on Vercel/Supabase Postgres via Drizzle tooling.
- **NFR-002 (Migration Expand-Contract)**: The schema migration MUST be deployed and applied BEFORE the code that reads/writes the new tables.
- **NFR-003 (Performance)**: The learner post-lesson read (tasks + submission states) MUST resolve in a single query with no N+1, targeting p95 < 400ms on warm cache for lessons with up to 20 tasks.
- **NFR-004 (Caching)**: Published, learner-agnostic task definitions MAY be cached through the existing `CachePort` abstraction only. Per-user submission state MUST NEVER be written to a public or shared cache.
- **NFR-005 (Security)**: All submission answers MUST be validated and normalized server-side. Correct answers, and answer payloads MUST NEVER leak to unauthorized clients or appear in logs.
- **NFR-006 (Rate Limiting)**: Submission endpoints MUST be rate-limited per user.
- **NFR-007 (SOLID)**: Implementation MUST satisfy SOLID — SRP (separate command/query/policy/repository classes), OCP (new task types via strategy registry without editing services), LSP (all strategies satisfy `TaskTypeStrategy`), ISP (narrow repository interfaces), DIP (services depend on interfaces, not Drizzle directly).
- **NFR-008 (Testability)**: Grading policies, type validators, specifications, and state machine logic MUST be pure and unit-tested without a database. Repository and route behavior covered by mocked-interface tests.
- **NFR-009 (Accessibility)**: Learner task UI MUST conform to WCAG 2.1 AA: keyboard-navigable MCQ options, labeled fields for written/SWOT, `aria-live` announcements for submission results, `prefers-reduced-motion` support.
- **NFR-010 (i18n)**: All task UI labels and messages MUST use the project i18n message catalog (Feature 015). Author-authored content is treated as arbitrary text.
- **NFR-011 (Privacy & Auditability)**: Written/SWOT answers are learner personal data. They MUST NOT appear in logs, analytics events, or cache keys. All point awards are recorded in `point_events`. User deletion cascades to submissions.
- **NFR-012 (Typing)**: All new TypeScript MUST be fully and explicitly typed. No `any`. Raw Drizzle rows MUST be converted to application types at the repository boundary.
- **NFR-013 (Observability)**: Submission and grading events MUST emit structured logs per the Observability Contract above, using stable identifiers only.

### Key Entities

- **LessonTask**: A task attached to a lesson. Owns `type`, `title`, `instructions`, `pointsAwarded`, `isOptional`, `sortIndex`, `status` (`draft | published | archived`), type-specific `config` JSONB payload, and optimistic concurrency `version`.
- **TaskSubmission**: A learner's one-time attempt. Records `userId`, `taskId`, `courseId`, submitted `answer` JSONB, `status` (`correct | incorrect | skipped`), `pointsEarned`, a client `idempotencyKey`, and the `taskSnapshot` (point value + payload at submission time).
- **TaskTypeStrategy**: A per-type contract (validator + grader + learner-safe payload mapper) registered in a strategy map keyed by `TaskType`. The Open/Closed extension point for future task types.
- **PointEvent**: The existing immutable ledger row in `point_events` written when a task awards points, feeding the Course Leaderboard (Feature 016).

---

## Database & Migration Strategy

**Constraint**: CI/CD now targets Vercel with a Supabase/Postgres backend. The previous Azure workflow is gone and is not a fallback. Migrations must be safe, additive, and must not break the deployment pipeline.

### What Changes

1. **New table `courses.lesson_tasks`** — additive `CREATE TABLE`. No existing table is modified.
2. **New table `courses.task_submissions`** — additive `CREATE TABLE`. No existing table is modified.
3. **Extended enum `activity_type` on `point_events`** — additive `ALTER TYPE activity_type ADD VALUE 'lesson_task'`.

### Schema (Drizzle, already in `src/db/schema/lesson-tasks.schema.ts`)

```ts
// lesson_tasks table
export const lessonTasks = coursesSchema.table("lesson_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id").notNull().references(() => dbLessons.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 16 }).$type<TaskType>().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  instructions: text("instructions"),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  isOptional: boolean("is_optional").notNull().default(true),
  sortIndex: integer("sort_index").notNull().default(0),
  status: varchar("status", { length: 16 }).$type<TaskStatus>().notNull().default("draft"),
  config: jsonb("config").$type<unknown>().notNull(),
  version: integer("version").notNull().default(0),
  createdBy: text("created_by").references(() => dbUsers.id, { onDelete: "set null" }),
  updatedBy: text("updated_by").references(() => dbUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  lessonTasksLessonSortUq: uniqueIndex("lesson_tasks_lesson_sort_uq").on(table.lessonId, table.sortIndex),
  lessonTasksLessonStatusIdx: index("lesson_tasks_lesson_status_idx").on(table.lessonId, table.status, table.sortIndex),
  lessonTasksPointsChk: check("lesson_tasks_points_chk", sql`${table.pointsAwarded} >= 0`),
}));

// task_submissions table
export const taskSubmissions = coursesSchema.table("task_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientEventId: uuid("client_event_id").notNull(),
  userId: text("user_id").notNull().references(() => dbUsers.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").notNull().references(() => lessonTasks.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => dbCourses.id, { onDelete: "cascade" }),
  answer: jsonb("answer").$type<unknown>().notNull(),
  status: varchar("status", { length: 16 }).$type<SubmissionStatus>().notNull().default("pending"),
  pointsEarned: integer("points_earned").notNull().default(0),
  taskSnapshot: jsonb("task_snapshot").$type<{ pointsAwarded: number; config: unknown }>().notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  taskSubmissionsUserTaskUq: uniqueIndex("task_submissions_user_task_uq").on(table.userId, table.taskId),
  taskSubmissionsUserClientEventUq: uniqueIndex("task_submissions_user_client_event_uq").on(table.userId, table.clientEventId),
  taskSubmissionsTaskStatusIdx: index("task_submissions_task_status_idx").on(table.taskId, table.status),
  taskSubmissionsPointsChk: check("task_submissions_points_chk", sql`${table.pointsEarned} >= 0`),
}));
```

---

## Architecture & Design Patterns

The feature follows the existing ScholarX domain conventions (`src/domain/courses/`): **contracts → application → infrastructure → factory**, with thin route handlers.

### Pattern Map

| # | Pattern | Role | Manifests as |
|---|---|---|---|
| 1 | Repository | Data access isolation | `ITaskRepository`, `ITaskSubmissionRepository` (contracts); `DrizzleTaskRepository`, `DrizzleTaskSubmissionRepository` (infrastructure) |
| 2 | Factory | Composition root | `createLessonTasksDomain()` in `lesson-tasks.factory.ts` |
| 3 | CQRS | Read/write separation | `LessonTaskCommandService` vs `LessonTaskQueryService` |
| 4 | Policy | Domain rules, pure & testable | `TaskGradingPolicy` |
| 5 | Specification | Guard conditions | `ActiveEnrollmentSpec`, `LessonCompletedSpec`, `TaskPublishedSpec`, `NoExistingSubmissionSpec`, `TaskIsOptionalSpec`, `AdminCanEditCourseSpec` |
| 6 | Strategy (Registry) | Per-task-type validation/grading — Open/Closed | `TaskTypeStrategy` interface + `TASK_TYPE_STRATEGIES` map |
| 7 | Typed Error Object | Clean HTTP mapping | `LessonTaskError` with code/numericCode/status |
| 8 | Mapper | Boundary shape conversion | `lesson-task.mapper.ts` (Drizzle rows → DTOs, strips correct answers) |
| 9 | Idempotency | At-most-once award | Composite unique constraint + `clientEventId` |

---

## API Contract

### Learner Routes

| Method & Path | Purpose | Auth |
|---|---|---|
| `GET /api/courses/[slug]/lessons/[lessonId]/tasks` | Published tasks + learner submission states | Session + enrollment + lesson eligibility |
| `POST /api/courses/[slug]/lessons/[lessonId]/tasks/[taskId]/submissions` | Submit answer (MCQ/Written/SWOT/Link) | Session + enrollment + one-time guard |
| `POST /api/courses/[slug]/lessons/[lessonId]/tasks/[taskId]/skip` | Record optional task skip | Session + enrollment |

### Admin Routes

| Method & Path | Purpose | Auth |
|---|---|---|
| `GET /api/admin/courses/[courseId]/lessons/[lessonId]/tasks` | List tasks with full config | Admin + course write access |
| `POST /api/admin/courses/[courseId]/lessons/[lessonId]/tasks` | Create task | Admin + course write access |
| `PATCH /api/admin/courses/[courseId]/lessons/[lessonId]/tasks/[taskId]` | Edit task | Admin + course write access |
| `DELETE /api/admin/courses/[courseId]/lessons/[lessonId]/tasks/[taskId]` | Soft-delete (archive) | Admin + course write access |
| `POST /api/admin/courses/[courseId]/lessons/[lessonId]/tasks/reorder` | Reorder tasks | Admin + course write access |

All learner responses MUST use learner-safe payloads (no `correctOptionId`). All admin routes enforce authorization at the route boundary.

---

## UI Placement

### Learner — Post-Lesson Task Section

- **Location**: Lesson viewer `(platform)/courses/[slug]/lessons/[lessonId]`, in the post-lesson area inside `LessonClientBridge`, immediately after lesson content and before "next lesson" navigation.
- **Structure**: `LessonTaskSection` (Server Component shell) fetches tasks + submission states in one call. Each task renders a type-specific Client Component: `McqTaskCard`, `WrittenTaskCard`, `SwotTaskCard`, `LinkTaskCard`, all wrapped in a shared `TaskCard` that shows type badge, point value, optional/mandatory badge, and submission state.
- **After submission**: `aria-live`-announced result with a Framer Motion transition respecting `prefers-reduced-motion`. Solved/incorrect/skipped states are immutable from the learner's perspective.
- **Mandatory warning**: If mandatory tasks remain incomplete, a banner above the "Next Lesson" button informs the learner that course completion is blocked.
- **Empty state**: No published tasks → neutral empty state or nothing; never an error.

### Admin — Course Builder Tasks Tab

- **Location**: The lesson editor in `admin/courses/[courseId]`, as a "Tasks" tab alongside the lesson content and settings tabs.
- **Structure**: Task list with drag-to-reorder, status toggle (draft/published), optional/mandatory toggle, points input, and type picker. Selecting a type swaps in the type-specific editor form. Editing is optimistic-locked via `version`.
- **Data flow**: `useAdminLessonTasks` hook backed by TanStack Query, following the existing `use-admin-lessons` hook pattern.

---

## Success Criteria *(mandatory)*

- **SC-001**: A learner can view, answer, and see results for every task type end-to-end, and a second submission for the same task is rejected at the API and UI levels in 100% of automated attempts.
- **SC-002**: Points awarded on correct solutions appear in `point_events` exactly once (verified by idempotency-key uniqueness) and reflect in the Course Leaderboard within the Feature 016 SLA (≤ 5 minutes).
- **SC-003**: Admins can create, edit, reorder, archive, and publish/unpublish tasks; changes appear for learners only after `published`.
- **SC-004**: The post-lesson read resolves with p95 < 400ms on warm cache; no N+1 query patterns exist.
- **SC-005**: The additive migration applies cleanly on Vercel/Supabase staging and production with the documented rollback script verified; deployment pipeline is not broken.
- **SC-006**: 100% of grading policies, type validators, and specifications pass unit tests without a live database.
- **SC-007**: Zero instances of a learner-facing response containing `correctOptionId` (verified by contract tests).
- **SC-008**: Mandatory-task completion gating is inert by default (flag off) — existing course completion and certificate flows behave identically to pre-feature behavior.
- **SC-009**: The learner task UI passes WCAG 2.1 AA review and `prefers-reduced-motion` compliance.

---

## Assumptions

- The `point_events` table (Feature 016) is the system of record for all leaderboard points and will ingest task awards via a `lesson_task` activity type.
- Lesson completion currently follows `LessonCompletionPolicy` v1. Mandatory-task gating is ADDITIVE and behind a feature flag.
- The learner task UI lives in the authenticated lesson viewer only. No changes to public course marketing pages.
- Admin authoring lives in the existing admin course builder lesson editor; the existing admin session/role guard pattern is sufficient.
- External link tasks cannot be verified inside third-party platforms; the honor system is the accepted mechanism.
- Written and SWOT tasks are automatically awarded participation points; no instructor grading queue is required.
- Task point values are small non-negative integers, enforced by DB check constraint.
- No new third-party dependency is required.

---

## Resolved Decisions

- **Q1 — Point value changes after solves**: Snapshotted at submission. Historical results are immutable. (FR-011)
- **Q2 — External link completion**: Confirmed-open honor system. (FR-009, Story 3)
- **Q3 — Grading model**: MCQ auto-graded; Written and SWOT auto-awarded participation points; Link honor-system. (FR-007, FR-008, FR-009)
- **Q4 — Task lifecycle**: Soft-delete via `status = archived`. (Edge cases)
- **Q5 — Mandatory-task gating**: Behind feature flag `LESSON_TASKS_V1_ENABLED`, off by default. (FR-016, SC-008)
- **Q6 — Migration shape**: New tables only + enum `ADD VALUE`; additive and reversible; applied before code deploy. (NFR-001, NFR-002)
- **Q7 — Correct-answer secrecy**: `correctOptionId` stripped by `McqStrategy.toLearnerConfig()`. (FR-007, NFR-005)
- **Q8 — Admin UI placement**: Dedicated "Tasks" tab in the lesson editor (not a modal). (FR-013)
- **Q9 — MCQ answer count**: Single correct answer, multiple wrong options. (FR-002)

---

## Open Questions at Time of Writing

1. **Retroactive mandatory tasks**: If an admin marks a task as mandatory after some learners have already completed the lesson, does it revoke their course completion status? *(Current assumption: No — completion status is sealed; needs product confirmation.)*
2. **Rich text for prompts**: Should task prompts (title, instructions) support rich text, or plain text only? *(Current assumption: Plain text initially, iterate later.)*
3. **Point reversals on archive**: If a task is soft-deleted, are previously earned points revoked? *(Current assumption: No — points are immutable once recorded in `point_events`.)*
4. **Incorrect MCQ reveal**: Should the correct answer be revealed to the learner after an incorrect MCQ answer? *(Current assumption: Yes — shown immediately after submission for educational value.)*
