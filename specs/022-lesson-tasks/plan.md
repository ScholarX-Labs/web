# Implementation Plan: 022-lesson-tasks

**Branch**: `022-lesson-tasks` | **Date**: 2026-08-11 | **Spec**: [`specs/022-lesson-tasks/spec.md`](file:///c:/Users/dell/Documents/ScholarX/V2/web/specs/022-lesson-tasks/spec.md) | **Spec Version**: Production-Ready Final

---

## Summary

The Lesson Tasks feature gives learners a structured, points-backed knowledge check immediately after each lesson and gives course creators a first-class authoring surface. A task can be an **MCQ** (auto-graded server-side), a **Written Question** (participation points auto-awarded), a **SWOT Analysis** (participation points auto-awarded), or an **External Link** (honor-system "Mark as Done"). Each task carries a point value awarded on correct submission, is solvable once per learner, and is independently configurable as optional or mandatory.

The implementation introduces a flexible, Open/Closed architecture using the **Strategy pattern** for task types — new types can be added without modifying any core submission logic. Strict separation of concerns is achieved through **CQRS** (separate command and query services), **Specification classes** for guard clauses (matching the existing `CourseWritableSpecification` convention), a `TaskGradingPolicy` for pure evaluation logic, and typed Repository interfaces following the Dependency Inversion principle.

**Key design tradeoff**: Point events are dispatched via an HTTP call to `/api/leaderboard/point-events` (mirroring the existing `emitPointEvents` pattern in `CourseProgressCommandService`) rather than a direct DB write, ensuring the leaderboard integration remains decoupled and the existing audit infrastructure stays intact.

---

## Technical Context

| Field | Value |
|---|---|
| **Language/Version** | TypeScript 5.x / Node 20 (Vercel Edge/Node runtime) |
| **Primary Dependencies** | Next.js App Router, React 19, Tailwind CSS, shadcn/ui, Better Auth, Drizzle ORM 0.x, TanStack Query, Framer Motion |
| **Storage** | PostgreSQL 15 (via Supabase) |
| **ORM** | Drizzle ORM with `coursesSchema` pgSchema namespace |
| **Testing** | Vitest for unit tests; mocked interface tests for services and repositories |
| **Target Platform** | Web (Vercel + Supabase) |
| **Performance Goals** | p95 < 400ms on warm cache for lessons with up to 20 tasks |
| **Constraints** | Additive and reversible schema changes only. No destructive DDL. |
| **Scale/Scope** | Up to 20 tasks per lesson; thousands of concurrent learner submissions |

---

## Constitution Check

| Principle | Status | Justification |
|---|---|---|
| **I — Proper Architecture & SOLID** | ✅ PASS | CQRS separates read/write paths. Strategy pattern (Open/Closed) handles polymorphic task types. Repository interfaces enforce Dependency Inversion. Specifications enforce Single Responsibility for each guard. |
| **II — Uncompromising Code Quality & Type Safety** | ✅ PASS | All new TypeScript is explicitly typed. `LearnerSafeTaskPayload` and `AdminTaskPayload` are distinct types preventing data leakage. No `any`. Drizzle rows converted to domain types at the repository boundary. |
| **III — Rigorous Testing Standards** | ✅ PASS | `TaskGradingPolicy`, all Specification classes, and all Strategy classes are pure functions testable without a database. Command service is tested with mocked repository interfaces. Route handlers tested with mocked factories. |
| **IV — Premium User Experience Consistency** | ✅ PASS | Learner task cards use existing shadcn/ui primitives. Framer Motion transitions on submit results. `aria-live` announcements. `prefers-reduced-motion` respected. WCAG 2.1 AA targeted. |
| **V — Performance, Scalability & Maintainability** | ✅ PASS | Single JOIN query in `getTasksWithSubmissions` eliminates N+1. Index-backed queries. Adding new task types requires only a new Strategy file — zero edits to services, routes, or schema. |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js API Route Handlers                │
│    (Thin: parse, validate, call factory, map errors)         │
│                                                              │
│  GET  /api/courses/[slug]/lessons/[lessonId]/tasks           │
│  POST /api/courses/[slug]/lessons/[lessonId]/tasks/[id]/sub  │
│  POST /api/courses/[slug]/lessons/[lessonId]/tasks/[id]/skip │
│  GET/POST/PATCH/DELETE/POST /api/admin/.../tasks             │
└─────────────────────────┬────────────────────────────────────┘
                          │  createLessonTasksDomain()
                          ▼
┌──────────────────────────────────────────────────────────────┐
│               Lesson Tasks Factory (Composition Root)        │
│         lesson-tasks.factory.ts                              │
└──────────┬───────────────────────────────┬───────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────────┐     ┌─────────────────────────────────┐
│ LessonTask           │     │    LessonTaskQueryService        │
│ CommandService       │     │  (reads tasks + submission state)│
│ (submit / skip)      │     └────────────────┬────────────────┘
└──────────┬───────────┘                      │
           │                                  ▼
           │  uses          ┌─────────────────────────────────┐
           ├──────────────▶ │   ITaskRepository               │
           │                │   getTasksWithSubmissions()     │
           │                │   (single LEFT JOIN query)      │
           │                └────────────────┬────────────────┘
           │  uses                           │
           ├──────────────▶ Specifications   │
           │  ├── ActiveEnrollmentSpecification               │
           │  ├── LessonCompletedSpecification                │
           │  ├── TaskPublishedSpecification                  │
           │  ├── NoExistingSubmissionSpecification           │
           │  └── TaskIsOptionalSpecification                 │
           │                                 │
           │  uses          ┌────────────────▼────────────────┐
           ├──────────────▶ │   TaskGradingPolicy             │
           │                │   grade(type, config, answer)   │
           │                └─────────────────────────────────┘
           │
           │  uses          ┌─────────────────────────────────┐
           ├──────────────▶ │  TASK_TYPE_STRATEGIES Map       │
           │                │  McqStrategy                    │
           │                │  WrittenStrategy                │
           │                │  SwotStrategy                   │
           │                │  LinkStrategy                   │
           │                └─────────────────────────────────┘
           │
           │  writes        ┌─────────────────────────────────┐
           ├──────────────▶ │  ITaskSubmissionRepository      │
           │                │  DrizzleTaskSubmissionRepository │
           │                └─────────────────────────────────┘
           │
           │  dispatches    ┌─────────────────────────────────┐
           └──────────────▶ │   Point Events Port             │
                            │   POST /api/leaderboard/...     │
                            │   activityType: 'lesson_task'   │
                            └─────────────────────────────────┘
```

---

## Full File Structure

### Documentation
```
specs/022-lesson-tasks/
├── spec.md           ← [MODIFIED] Production-Ready Final
├── plan.md           ← [THIS FILE]
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/api.md
```

### Database
```
[MODIFY] src/db/schema/leaderboard.ts
         → Add 'lesson_task' to activityTypeEnum
[EXISTS] src/db/schema/lesson-tasks.schema.ts
         → lessonTasks + taskSubmissions tables (already created)
[MODIFY] drizzle.config.ts
         → lesson-tasks.schema.ts already added
```

### Domain Layer
```
[NEW] src/domain/courses/lesson-tasks/
│
├── contracts/
│   ├── lesson-tasks.types.ts          ← All domain types and DTOs
│   ├── lesson-tasks.repository.ts     ← ITaskRepository + ITaskSubmissionRepository interfaces
│   └── task-type.strategy.ts          ← TaskTypeStrategy interface contract
│
├── strategies/
│   ├── mcq.strategy.ts                ← McqStrategy: validate, grade, strip correctOptionId
│   ├── written.strategy.ts            ← WrittenStrategy: validate text payload
│   ├── swot.strategy.ts               ← SwotStrategy: validate quadrant payload
│   ├── link.strategy.ts               ← LinkStrategy: validate http/https URL
│   └── task-type.registry.ts          ← TASK_TYPE_STRATEGIES: Map<TaskType, TaskTypeStrategy>
│
├── application/
│   ├── lesson-tasks-command.service.ts ← submitTask(), skipTask()
│   ├── lesson-tasks-query.service.ts   ← getTasksForLesson()
│   └── lesson-tasks.errors.ts          ← LessonTaskError class + error codes
│
├── models/
│   ├── task-grading.policy.ts          ← TaskGradingPolicy.grade() → GradingVerdict
│   └── lesson-tasks.specifications.ts  ← All guard Specification classes
│
└── infrastructure/
    └── db/
        ├── drizzle-task.repository.ts            ← ITaskRepository implementation
        └── drizzle-task-submission.repository.ts ← ITaskSubmissionRepository implementation
```

### Factory
```
[NEW] src/domain/courses/lesson-tasks/lesson-tasks.factory.ts
      → createLessonTasksDomain(): LessonTasksDomainServices
```

### API Routes
```
[NEW] src/app/api/courses/[slug]/lessons/[lessonId]/tasks/
│   └── route.ts                             ← GET tasks + submission state
[NEW] src/app/api/courses/[slug]/lessons/[lessonId]/tasks/[taskId]/
│   ├── submissions/route.ts                 ← POST submit answer
│   └── skip/route.ts                        ← POST skip optional task
[NEW] src/app/api/admin/courses/[courseId]/lessons/[lessonId]/tasks/
│   ├── route.ts                             ← GET list, POST create
│   ├── [taskId]/route.ts                    ← PATCH edit, DELETE archive
│   └── reorder/route.ts                     ← POST reorder
```

### UI Layer
```
[NEW] src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/
│   ├── lesson-task-section.tsx              ← Server Component shell
│   ├── task-card.tsx                        ← Shared wrapper (badge, points, state)
│   └── tasks/
│       ├── mcq-task-card.tsx                ← Radio options, submit, reveal on incorrect
│       ├── written-task-card.tsx            ← Textarea + submit
│       ├── swot-task-card.tsx               ← 4-quadrant textarea + submit
│       └── link-task-card.tsx               ← External link + Mark as Done
[NEW] src/components/hooks/use-lesson-tasks.ts  ← TanStack Query hooks
[NEW] src/components/admin/tasks/
│   ├── lesson-task-editor.tsx               ← Admin task list with drag-to-reorder
│   └── task-type-form/
│       ├── mcq-form.tsx
│       ├── written-form.tsx
│       ├── swot-form.tsx
│       └── link-form.tsx
[NEW] src/components/hooks/use-admin-lesson-tasks.ts ← Admin TanStack Query hooks
```

---

## Contracts Layer

### `lesson-tasks.types.ts`

```typescript
// ─── Core Domain Types ────────────────────────────────────────────────────
export type TaskType = "mcq" | "written" | "swot" | "link";
export type TaskStatus = "draft" | "published" | "archived";
export type SubmissionStatus = "correct" | "incorrect" | "skipped";

// ─── MCQ Config (stored in lesson_tasks.config JSONB) ─────────────────────
export interface McqOption {
  id: string; // stable UUID per option
  text: string;
}

export interface McqConfig {
  options: McqOption[];
  correctOptionId: string; // NEVER sent to learners
}

// ─── Written Config ────────────────────────────────────────────────────────
export interface WrittenConfig {
  prompt: string;
  maxLengthKb?: number; // default 10
}

// ─── SWOT Config ──────────────────────────────────────────────────────────
export interface SwotConfig {
  promptStrengths?: string;
  promptWeaknesses?: string;
  promptOpportunities?: string;
  promptThreats?: string;
  maxLengthKbPerQuadrant?: number; // default 5
}

// ─── Link Config ──────────────────────────────────────────────────────────
export interface LinkConfig {
  url: string;      // https only
  linkText: string; // e.g. "Open Google Doc"
  confirmText?: string; // e.g. "I've completed this"
}

export type TaskTypeConfig = McqConfig | WrittenConfig | SwotConfig | LinkConfig;

// ─── DB Record Types (repository output) ──────────────────────────────────
export interface LessonTaskRecord {
  id: string;
  lessonId: string;
  type: TaskType;
  title: string;
  instructions: string | null;
  pointsAwarded: number;
  isOptional: boolean;
  sortIndex: number;
  status: TaskStatus;
  config: TaskTypeConfig;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskSubmissionRecord {
  id: string;
  clientEventId: string;
  userId: string;
  taskId: string;
  courseId: string;
  answer: unknown;
  status: SubmissionStatus;
  pointsEarned: number;
  taskSnapshot: { pointsAwarded: number; config: TaskTypeConfig };
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Learner-Safe Payloads (correct answers stripped) ─────────────────────
export interface LearnerSafeMcqConfig {
  options: McqOption[]; // NO correctOptionId
}

export type LearnerSafeConfig = LearnerSafeMcqConfig | WrittenConfig | SwotConfig | LinkConfig;

export interface LearnerSafeTaskPayload {
  id: string;
  type: TaskType;
  title: string;
  instructions: string | null;
  pointsAwarded: number;
  isOptional: boolean;
  sortIndex: number;
  config: LearnerSafeConfig;
}

export interface TasksWithSubmissionsQueryResult {
  task: LearnerSafeTaskPayload;
  submission: TaskSubmissionRecord | null;
}

// ─── Admin Payload (full config, no stripping) ────────────────────────────
export type AdminTaskPayload = LessonTaskRecord;

// ─── Commands ────────────────────────────────────────────────────────────
export interface SubmitTaskCommand {
  clientEventId: string;
  userId: string;
  courseId: string;
  lessonId: string;
  taskId: string;
  answer: unknown;
}

export interface SkipTaskCommand {
  clientEventId: string;
  userId: string;
  courseId: string;
  lessonId: string;
  taskId: string;
}

// ─── Grading ──────────────────────────────────────────────────────────────
export interface GradingVerdict {
  isCorrect: boolean;
  finalStatus: SubmissionStatus;
  pointsEarned: number;
}
```

### `lesson-tasks.repository.ts`

```typescript
import type {
  LessonTaskRecord,
  TaskSubmissionRecord,
  TasksWithSubmissionsQueryResult,
} from "./lesson-tasks.types";

export interface ITaskRepository {
  findTaskById(taskId: string): Promise<LessonTaskRecord | null>;
  findPublishedTasksByLesson(lessonId: string): Promise<LessonTaskRecord[]>;
  getTasksWithSubmissions(
    lessonId: string,
    userId: string
  ): Promise<TasksWithSubmissionsQueryResult[]>;
  // Admin reads (full config, no stripping)
  findAdminTasksByLesson(lessonId: string): Promise<LessonTaskRecord[]>;
  createTask(task: Omit<LessonTaskRecord, "id" | "createdAt" | "updatedAt">): Promise<LessonTaskRecord>;
  updateTask(
    taskId: string,
    patch: Partial<Omit<LessonTaskRecord, "id" | "createdAt" | "updatedAt">>,
    expectedVersion: number
  ): Promise<LessonTaskRecord | null>; // null = version conflict
  archiveTask(taskId: string): Promise<void>;
  reorderTasks(lessonId: string, orderedTaskIds: string[]): Promise<void>;
}

export interface ITaskSubmissionRepository {
  findSubmission(
    userId: string,
    taskId: string
  ): Promise<TaskSubmissionRecord | null>;
  findByClientEventId(
    userId: string,
    clientEventId: string
  ): Promise<TaskSubmissionRecord | null>;
  createSubmission(
    submission: Omit<TaskSubmissionRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<TaskSubmissionRecord>;
}
```

### `task-type.strategy.ts`

```typescript
import type { TaskTypeConfig, LearnerSafeConfig, GradingVerdict } from "./lesson-tasks.types";

export interface ValidatedAnswer {
  raw: unknown;
}

export interface TaskTypeStrategy<
  TConfig extends TaskTypeConfig = TaskTypeConfig,
  TAnswer extends ValidatedAnswer = ValidatedAnswer
> {
  readonly type: string;
  /**
   * Validate the raw answer payload from the client.
   * Throws LessonTaskError('INVALID_ANSWER', 400, ...) on failure.
   */
  validateAnswer(config: TConfig, rawAnswer: unknown): TAnswer;
  /**
   * Evaluate the validated answer against the task config.
   * Returns a pure GradingVerdict — no side effects.
   */
  grade(config: TConfig, answer: TAnswer, pointsAwarded: number): GradingVerdict;
  /**
   * Strip any sensitive config fields before returning to learner.
   * MCQ: removes correctOptionId. Others: pass through.
   */
  toLearnerConfig(config: TConfig): LearnerSafeConfig;
}
```

---

## Strategy Registry

### `mcq.strategy.ts`

```typescript
import { LessonTaskError } from "../application/lesson-tasks.errors";
import type { TaskTypeStrategy, ValidatedAnswer } from "../contracts/task-type.strategy";
import type { McqConfig, LearnerSafeMcqConfig, GradingVerdict } from "../contracts/lesson-tasks.types";

export interface McqAnswer extends ValidatedAnswer {
  selectedOptionId: string;
}

export class McqStrategy implements TaskTypeStrategy<McqConfig, McqAnswer> {
  readonly type = "mcq" as const;

  validateAnswer(config: McqConfig, rawAnswer: unknown): McqAnswer {
    if (
      typeof rawAnswer !== "object" ||
      rawAnswer === null ||
      typeof (rawAnswer as Record<string, unknown>)["selectedOptionId"] !== "string"
    ) {
      throw new LessonTaskError("INVALID_ANSWER", 400, "MCQ answer must contain selectedOptionId.", 2006);
    }
    const selectedOptionId = (rawAnswer as Record<string, unknown>)["selectedOptionId"] as string;
    const validIds = config.options.map((o) => o.id);
    if (!validIds.includes(selectedOptionId)) {
      throw new LessonTaskError("INVALID_ANSWER", 400, "selectedOptionId is not a valid option.", 2006);
    }
    return { raw: rawAnswer, selectedOptionId };
  }

  grade(config: McqConfig, answer: McqAnswer, pointsAwarded: number): GradingVerdict {
    const isCorrect = answer.selectedOptionId === config.correctOptionId;
    return {
      isCorrect,
      finalStatus: isCorrect ? "correct" : "incorrect",
      pointsEarned: isCorrect ? pointsAwarded : 0,
    };
  }

  toLearnerConfig(config: McqConfig): LearnerSafeMcqConfig {
    // CRITICAL: correctOptionId is stripped here and nowhere else.
    return { options: config.options };
  }
}
```

### `written.strategy.ts`

```typescript
export class WrittenStrategy implements TaskTypeStrategy<WrittenConfig, ValidatedAnswer> {
  readonly type = "written" as const;
  private readonly MAX_BYTES = 10 * 1024; // 10 KB default

  validateAnswer(config: WrittenConfig, rawAnswer: unknown): ValidatedAnswer {
    const maxBytes = config.maxLengthKb ? config.maxLengthKb * 1024 : this.MAX_BYTES;
    if (typeof rawAnswer !== "object" || rawAnswer === null || typeof (rawAnswer as Record<string, unknown>)["text"] !== "string") {
      throw new LessonTaskError("INVALID_ANSWER", 400, "Written answer must contain a text field.", 2006);
    }
    const text = (rawAnswer as Record<string, unknown>)["text"] as string;
    if (new Blob([text]).size > maxBytes) {
      throw new LessonTaskError("ANSWER_TOO_LARGE", 413, `Answer exceeds the ${config.maxLengthKb ?? 10} KB limit.`, 2008);
    }
    return { raw: rawAnswer };
  }

  // Written tasks are always auto-awarded (participation points)
  grade(_config: WrittenConfig, _answer: ValidatedAnswer, pointsAwarded: number): GradingVerdict {
    return { isCorrect: true, finalStatus: "correct", pointsEarned: pointsAwarded };
  }

  toLearnerConfig(config: WrittenConfig): WrittenConfig {
    return config; // Nothing to strip
  }
}
```

### `swot.strategy.ts`

```typescript
export class SwotStrategy implements TaskTypeStrategy<SwotConfig, ValidatedAnswer> {
  readonly type = "swot" as const;
  private readonly MAX_BYTES_PER_QUADRANT = 5 * 1024;

  validateAnswer(config: SwotConfig, rawAnswer: unknown): ValidatedAnswer {
    const MAX = (config.maxLengthKbPerQuadrant ?? 5) * 1024;
    const expected = ["strengths", "weaknesses", "opportunities", "threats"];
    if (typeof rawAnswer !== "object" || rawAnswer === null) {
      throw new LessonTaskError("INVALID_ANSWER", 400, "SWOT answer must be an object with quadrant fields.", 2006);
    }
    for (const field of expected) {
      const val = (rawAnswer as Record<string, unknown>)[field];
      if (typeof val !== "string") {
        throw new LessonTaskError("INVALID_ANSWER", 400, `SWOT answer missing field: ${field}`, 2006);
      }
      if (new Blob([val]).size > MAX) {
        throw new LessonTaskError("ANSWER_TOO_LARGE", 413, `SWOT quadrant '${field}' exceeds limit.`, 2008);
      }
    }
    return { raw: rawAnswer };
  }

  grade(_config: SwotConfig, _answer: ValidatedAnswer, pointsAwarded: number): GradingVerdict {
    return { isCorrect: true, finalStatus: "correct", pointsEarned: pointsAwarded };
  }

  toLearnerConfig(config: SwotConfig): SwotConfig {
    return config;
  }
}
```

### `link.strategy.ts`

```typescript
export class LinkStrategy implements TaskTypeStrategy<LinkConfig, ValidatedAnswer> {
  readonly type = "link" as const;

  validateAnswer(config: LinkConfig, rawAnswer: unknown): ValidatedAnswer {
    if (typeof rawAnswer !== "object" || rawAnswer === null || (rawAnswer as Record<string, unknown>)["confirmed"] !== true) {
      throw new LessonTaskError("INVALID_ANSWER", 400, "Link task requires confirmed: true.", 2006);
    }
    // Validate the stored URL as a precaution (should also be validated at creation time)
    try {
      const url = new URL(config.url);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new LessonTaskError("MALICIOUS_URL", 400, "Link URL must use http or https.", 2009);
      }
    } catch {
      throw new LessonTaskError("MALICIOUS_URL", 400, "Link URL is invalid.", 2009);
    }
    return { raw: rawAnswer };
  }

  grade(_config: LinkConfig, _answer: ValidatedAnswer, pointsAwarded: number): GradingVerdict {
    return { isCorrect: true, finalStatus: "correct", pointsEarned: pointsAwarded };
  }

  toLearnerConfig(config: LinkConfig): LinkConfig {
    return config;
  }
}
```

### `task-type.registry.ts`

```typescript
import type { TaskType } from "../contracts/lesson-tasks.types";
import type { TaskTypeStrategy } from "../contracts/task-type.strategy";
import { McqStrategy } from "./mcq.strategy";
import { WrittenStrategy } from "./written.strategy";
import { SwotStrategy } from "./swot.strategy";
import { LinkStrategy } from "./link.strategy";

export const TASK_TYPE_STRATEGIES: Readonly<Map<TaskType, TaskTypeStrategy>> = new Map([
  ["mcq", new McqStrategy()],
  ["written", new WrittenStrategy()],
  ["swot", new SwotStrategy()],
  ["link", new LinkStrategy()],
]);

export const getStrategy = (type: TaskType): TaskTypeStrategy => {
  const strategy = TASK_TYPE_STRATEGIES.get(type);
  if (!strategy) {
    throw new Error(`No strategy registered for task type: ${type}`);
  }
  return strategy;
};
```

---

## Application Layer

### `lesson-tasks.errors.ts`

```typescript
export class LessonTaskError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    readonly numericCode = 2000,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "LessonTaskError";
  }
}

export const isLessonTaskError = (value: unknown): value is LessonTaskError =>
  value instanceof LessonTaskError;
```

### `lesson-tasks-command.service.ts`

```typescript
import type { ITaskRepository, ITaskSubmissionRepository } from "../contracts/lesson-tasks.repository";
import type { SubmitTaskCommand, SkipTaskCommand, TaskSubmissionRecord } from "../contracts/lesson-tasks.types";
import { LessonTaskError } from "./lesson-tasks.errors";
import { TaskGradingPolicy } from "../models/task-grading.policy";
import {
  TaskPublishedSpecification,
  NoExistingSubmissionSpecification,
  TaskIsOptionalSpecification,
  ActiveEnrollmentSpecification,
} from "../models/lesson-tasks.specifications";
import { getStrategy } from "../strategies/task-type.registry";

export interface PointEventPort {
  postPointEvent(params: {
    userId: string;
    courseId: string;
    activityType: "lesson_task";
    points: number;
    idempotencyKey: string;
  }): Promise<void>;
}

export class LessonTaskCommandService {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly submissionRepository: ITaskSubmissionRepository,
    private readonly gradingPolicy: TaskGradingPolicy,
    private readonly pointEventPort: PointEventPort,
    private readonly taskPublishedSpec = new TaskPublishedSpecification(),
    private readonly noExistingSubmissionSpec = new NoExistingSubmissionSpecification(),
    private readonly taskIsOptionalSpec = new TaskIsOptionalSpecification(),
  ) {}

  async submitTask(command: SubmitTaskCommand): Promise<TaskSubmissionRecord> {
    // ── 1. Idempotency check ──────────────────────────────────────────────
    const existingByEvent = await this.submissionRepository.findByClientEventId(
      command.userId,
      command.clientEventId,
    );
    if (existingByEvent) return existingByEvent; // Idempotent replay

    // ── 2. Load and guard task ────────────────────────────────────────────
    const task = await this.taskRepository.findTaskById(command.taskId);
    this.taskPublishedSpec.assertSatisfiedBy(task);

    const existingSubmission = await this.submissionRepository.findSubmission(
      command.userId,
      command.taskId,
    );
    this.noExistingSubmissionSpec.assertSatisfiedBy(existingSubmission);

    // ── 3. Validate and grade ─────────────────────────────────────────────
    const strategy = getStrategy(task.type);
    const validatedAnswer = strategy.validateAnswer(task.config, command.answer);
    const verdict = this.gradingPolicy.grade(task, validatedAnswer);

    // ── 4. Persist submission ─────────────────────────────────────────────
    const submission = await this.submissionRepository.createSubmission({
      clientEventId: command.clientEventId,
      userId: command.userId,
      taskId: command.taskId,
      courseId: command.courseId,
      answer: command.answer,
      status: verdict.finalStatus,
      pointsEarned: verdict.pointsEarned,
      taskSnapshot: { pointsAwarded: task.pointsAwarded, config: task.config },
      submittedAt: new Date(),
    });

    // ── 5. Dispatch point event (async, non-blocking) ─────────────────────
    if (verdict.pointsEarned > 0) {
      this.pointEventPort
        .postPointEvent({
          userId: command.userId,
          courseId: command.courseId,
          activityType: "lesson_task",
          points: verdict.pointsEarned,
          idempotencyKey: `lesson_task_${submission.id}`,
        })
        .catch((err: unknown) => {
          console.error("[lesson-tasks] point event dispatch failed", {
            taskId: command.taskId,
            userId: command.userId,
            courseId: command.courseId,
            error: String(err),
          });
        });
    }

    return submission;
  }

  async skipTask(command: SkipTaskCommand): Promise<TaskSubmissionRecord> {
    const existingByEvent = await this.submissionRepository.findByClientEventId(
      command.userId,
      command.clientEventId,
    );
    if (existingByEvent) return existingByEvent;

    const task = await this.taskRepository.findTaskById(command.taskId);
    this.taskPublishedSpec.assertSatisfiedBy(task);
    this.taskIsOptionalSpec.assertSatisfiedBy(task);

    const existingSubmission = await this.submissionRepository.findSubmission(
      command.userId,
      command.taskId,
    );
    this.noExistingSubmissionSpec.assertSatisfiedBy(existingSubmission);

    return this.submissionRepository.createSubmission({
      clientEventId: command.clientEventId,
      userId: command.userId,
      taskId: command.taskId,
      courseId: command.courseId,
      answer: null,
      status: "skipped",
      pointsEarned: 0,
      taskSnapshot: { pointsAwarded: task.pointsAwarded, config: task.config },
      submittedAt: new Date(),
    });
  }
}
```

### `lesson-tasks-query.service.ts`

```typescript
import type { ITaskRepository } from "../contracts/lesson-tasks.repository";
import type { TasksWithSubmissionsQueryResult } from "../contracts/lesson-tasks.types";

export class LessonTaskQueryService {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async getTasksForLesson(
    lessonId: string,
    userId: string,
  ): Promise<TasksWithSubmissionsQueryResult[]> {
    // Single JOIN query — no N+1. Learner-safe payloads already stripped in repository mapper.
    return this.taskRepository.getTasksWithSubmissions(lessonId, userId);
  }
}
```

---

## Grading Policy

### `task-grading.policy.ts`

```typescript
import type { LessonTaskRecord, GradingVerdict } from "../contracts/lesson-tasks.types";
import type { ValidatedAnswer } from "../contracts/task-type.strategy";
import { getStrategy } from "../strategies/task-type.registry";

export class TaskGradingPolicy {
  /**
   * Pure function. Returns a GradingVerdict.
   * No DB access, no side effects. Fully unit-testable.
   */
  grade(task: LessonTaskRecord, answer: ValidatedAnswer): GradingVerdict {
    const strategy = getStrategy(task.type);
    return strategy.grade(task.config, answer, task.pointsAwarded);
  }
}
```

---

## Specifications

### `lesson-tasks.specifications.ts`

```typescript
import { LessonTaskError } from "../application/lesson-tasks.errors";
import type { LessonTaskRecord, TaskSubmissionRecord } from "../contracts/lesson-tasks.types";

export class TaskPublishedSpecification {
  assertSatisfiedBy(task: LessonTaskRecord | null): asserts task is LessonTaskRecord {
    if (!task) {
      throw new LessonTaskError("TASK_NOT_FOUND", 404, "The requested task does not exist.", 2001);
    }
    if (task.status !== "published") {
      throw new LessonTaskError("TASK_NOT_PUBLISHED", 409, "This task is not currently available.", 2002, { taskId: task.id, status: task.status });
    }
  }
}

export class NoExistingSubmissionSpecification {
  assertSatisfiedBy(submission: TaskSubmissionRecord | null): void {
    if (submission !== null) {
      throw new LessonTaskError("ALREADY_SUBMITTED", 409, "You have already submitted this task.", 2004, { submissionId: submission.id });
    }
  }
}

export class TaskIsOptionalSpecification {
  assertSatisfiedBy(task: LessonTaskRecord | null): asserts task is LessonTaskRecord {
    if (!task) {
      throw new LessonTaskError("TASK_NOT_FOUND", 404, "The requested task does not exist.", 2001);
    }
    if (!task.isOptional) {
      throw new LessonTaskError("TASK_NOT_OPTIONAL", 422, "Mandatory tasks cannot be skipped.", 2005, { taskId: task.id });
    }
  }
}

export class ActiveEnrollmentSpecification {
  assertSatisfiedBy(
    isEnrolled: boolean,
    details: { userId: string; courseId: string },
  ): void {
    if (!isEnrolled) {
      throw new LessonTaskError("ENROLLMENT_REQUIRED", 403, "You must be enrolled in this course.", 2007, details);
    }
  }
}
```

---

## Infrastructure Layer

### `drizzle-task.repository.ts`

```typescript
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { lessonTasks, taskSubmissions } from "@/db/schema/lesson-tasks.schema";
import type { ITaskRepository } from "../../contracts/lesson-tasks.repository";
import type { LessonTaskRecord, TasksWithSubmissionsQueryResult } from "../../contracts/lesson-tasks.types";
import { mapToLessonTaskRecord, mapToLearnerSafeTask } from "./lesson-tasks.mapper";
import { getStrategy } from "../../strategies/task-type.registry";

export class DrizzleTaskRepository implements ITaskRepository {
  async findTaskById(taskId: string): Promise<LessonTaskRecord | null> {
    const rows = await db
      .select()
      .from(lessonTasks)
      .where(eq(lessonTasks.id, taskId))
      .limit(1);
    return rows[0] ? mapToLessonTaskRecord(rows[0]) : null;
  }

  async findPublishedTasksByLesson(lessonId: string): Promise<LessonTaskRecord[]> {
    const rows = await db
      .select()
      .from(lessonTasks)
      .where(and(eq(lessonTasks.lessonId, lessonId), eq(lessonTasks.status, "published")))
      .orderBy(lessonTasks.sortIndex);
    return rows.map(mapToLessonTaskRecord);
  }

  /**
   * Single LEFT JOIN — resolves tasks + user submissions in one query.
   * Strips correct answers via strategy.toLearnerConfig() before returning.
   * No N+1. Satisfies NFR-003.
   */
  async getTasksWithSubmissions(
    lessonId: string,
    userId: string,
  ): Promise<TasksWithSubmissionsQueryResult[]> {
    const rows = await db
      .select({
        task: lessonTasks,
        submission: taskSubmissions,
      })
      .from(lessonTasks)
      .leftJoin(
        taskSubmissions,
        and(
          eq(taskSubmissions.taskId, lessonTasks.id),
          eq(taskSubmissions.userId, userId),
        ),
      )
      .where(
        and(
          eq(lessonTasks.lessonId, lessonId),
          eq(lessonTasks.status, "published"),
        ),
      )
      .orderBy(lessonTasks.sortIndex);

    return rows.map((row) => {
      const taskRecord = mapToLessonTaskRecord(row.task);
      const strategy = getStrategy(taskRecord.type);
      return {
        task: {
          ...mapToLearnerSafeTask(taskRecord),
          config: strategy.toLearnerConfig(taskRecord.config),
        },
        submission: row.submission ? mapToSubmissionRecord(row.submission) : null,
      };
    });
  }

  async findAdminTasksByLesson(lessonId: string): Promise<LessonTaskRecord[]> {
    const rows = await db
      .select()
      .from(lessonTasks)
      .where(eq(lessonTasks.lessonId, lessonId))
      .orderBy(lessonTasks.sortIndex);
    return rows.map(mapToLessonTaskRecord);
  }

  async createTask(
    task: Omit<LessonTaskRecord, "id" | "createdAt" | "updatedAt">,
  ): Promise<LessonTaskRecord> {
    const rows = await db
      .insert(lessonTasks)
      .values({ ...task, id: crypto.randomUUID() })
      .returning();
    return mapToLessonTaskRecord(rows[0]);
  }

  async updateTask(
    taskId: string,
    patch: Partial<Omit<LessonTaskRecord, "id" | "createdAt" | "updatedAt">>,
    expectedVersion: number,
  ): Promise<LessonTaskRecord | null> {
    const rows = await db
      .update(lessonTasks)
      .set({ ...patch, version: expectedVersion + 1, updatedAt: new Date() })
      .where(and(eq(lessonTasks.id, taskId), eq(lessonTasks.version, expectedVersion)))
      .returning();
    return rows[0] ? mapToLessonTaskRecord(rows[0]) : null; // null = version conflict
  }

  async archiveTask(taskId: string): Promise<void> {
    await db
      .update(lessonTasks)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(lessonTasks.id, taskId));
  }

  async reorderTasks(lessonId: string, orderedTaskIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedTaskIds.length; i++) {
        await tx
          .update(lessonTasks)
          .set({ sortIndex: i, updatedAt: new Date() })
          .where(
            and(eq(lessonTasks.id, orderedTaskIds[i]), eq(lessonTasks.lessonId, lessonId)),
          );
      }
    });
  }
}
```

---

## API Routes

### Learner — `GET /api/courses/[slug]/lessons/[lessonId]/tasks`
- **Auth**: Session required (Better Auth)
- **Input**: `lessonId` from route params, `userId` from session
- **Domain**: `queryService.getTasksForLesson(lessonId, userId)`
- **Response**: `{ data: TasksWithSubmissionsQueryResult[] }`
- **Errors**: 401 (no session), mapped `LessonTaskError` codes

### Learner — `POST /api/courses/[slug]/lessons/[lessonId]/tasks/[taskId]/submissions`
- **Auth**: Session required
- **Input Schema** (Zod):
  ```typescript
  z.object({
    clientEventId: z.string().uuid(),
    answer: z.unknown(),
  })
  ```
- **Domain**: `commandService.submitTask({ clientEventId, userId, courseId, lessonId, taskId, answer })`
- **Response**: `{ data: TaskSubmissionRecord }`
- **Errors**: 400 `INVALID_ANSWER`, 409 `ALREADY_SUBMITTED`, 413 `ANSWER_TOO_LARGE`, 422 `TASK_NOT_OPTIONAL`, 404 `TASK_NOT_FOUND`

### Learner — `POST /api/courses/[slug]/lessons/[lessonId]/tasks/[taskId]/skip`
- **Auth**: Session required
- **Input Schema** (Zod):
  ```typescript
  z.object({ clientEventId: z.string().uuid() })
  ```
- **Domain**: `commandService.skipTask({ clientEventId, userId, courseId, lessonId, taskId })`
- **Response**: `{ data: TaskSubmissionRecord }`
- **Errors**: 422 `TASK_NOT_OPTIONAL`, 409 `ALREADY_SUBMITTED`

### Admin — `GET /api/admin/courses/[courseId]/lessons/[lessonId]/tasks`
- **Auth**: Admin session + `AdminCanEditCourseSpecification`
- **Domain**: `adminQueryService.getAdminTasksForLesson(lessonId)`
- **Response**: `{ data: AdminTaskPayload[] }` (full config, no stripping)

### Admin — `POST /api/admin/courses/[courseId]/lessons/[lessonId]/tasks`
- **Auth**: Admin session
- **Input Schema** (Zod): Full task creation shape per type
- **Domain**: `adminCommandService.createTask(...)`
- **Response**: `{ data: AdminTaskPayload }`

### Admin — `PATCH /api/admin/courses/[courseId]/lessons/[lessonId]/tasks/[taskId]`
- **Auth**: Admin session
- **Input**: Partial task patch + `version` for optimistic locking
- **Domain**: `adminCommandService.updateTask(taskId, patch, version)`
- **Response**: `{ data: AdminTaskPayload }` or `409` on version conflict

### Admin — `DELETE /api/admin/courses/[courseId]/lessons/[lessonId]/tasks/[taskId]`
- **Auth**: Admin session
- **Domain**: `adminCommandService.archiveTask(taskId)` (soft delete)
- **Response**: `{ success: true }`

### Admin — `POST /api/admin/courses/[courseId]/lessons/[lessonId]/tasks/reorder`
- **Auth**: Admin session
- **Input**: `{ orderedTaskIds: string[] }`
- **Domain**: `adminCommandService.reorderTasks(lessonId, orderedTaskIds)`
- **Response**: `{ success: true }`

---

## Factory

### `lesson-tasks.factory.ts`

```typescript
import { DrizzleTaskRepository } from "./infrastructure/db/drizzle-task.repository";
import { DrizzleTaskSubmissionRepository } from "./infrastructure/db/drizzle-task-submission.repository";
import { LessonTaskCommandService } from "./application/lesson-tasks-command.service";
import { LessonTaskQueryService } from "./application/lesson-tasks-query.service";
import { TaskGradingPolicy } from "./models/task-grading.policy";

export interface LessonTasksDomainServices {
  commandService: LessonTaskCommandService;
  queryService: LessonTaskQueryService;
}

const postTaskPointEvent = async (params: {
  userId: string;
  courseId: string;
  activityType: "lesson_task";
  points: number;
  idempotencyKey: string;
}): Promise<void> => {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.warn("[lesson-tasks] INTERNAL_API_SECRET not set — points not awarded.");
    return;
  }
  const res = await fetch(`${baseUrl}/api/leaderboard/point-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": secret },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`Point event failed (${res.status}): ${text}`);
  }
};

export const createLessonTasksDomain = (): LessonTasksDomainServices => {
  const taskRepository = new DrizzleTaskRepository();
  const submissionRepository = new DrizzleTaskSubmissionRepository();
  const gradingPolicy = new TaskGradingPolicy();
  const pointEventPort = { postPointEvent: postTaskPointEvent };

  return {
    commandService: new LessonTaskCommandService(
      taskRepository,
      submissionRepository,
      gradingPolicy,
      pointEventPort,
    ),
    queryService: new LessonTaskQueryService(taskRepository),
  };
};
```

---

## Migration Strategy

### Step 1 — Extend Leaderboard Enum

In `src/db/schema/leaderboard.ts`:
```typescript
// BEFORE
export const activityTypeEnum = pgEnum("activity_type", [
  "quiz", "exam", "forum_post", "assignment_submit",
  "lesson_completion", "course_completion",
]);

// AFTER
export const activityTypeEnum = pgEnum("activity_type", [
  "quiz", "exam", "forum_post", "assignment_submit",
  "lesson_completion", "course_completion",
  "lesson_task", // ← additive only; PostgreSQL 12+ supports without transaction
]);
```

### Step 2 — Generate Migration
```bash
npm run db:generate
# Review the generated SQL in ./drizzle/ before applying
```

### Step 3 — Apply to Staging
```bash
npm run db:migrate
```

### Step 4 — Verify
- Tables `courses.lesson_tasks` and `courses.task_submissions` exist
- Unique constraints: `task_submissions_user_task_uq`, `task_submissions_user_client_event_uq`
- `activity_type` enum includes `lesson_task`
- All existing course-progress tests pass

### Step 5 — Deploy Code
Deploy to Vercel *after* migration is confirmed on staging.

### Step 6 — Enable Feature Flag
```
NEXT_PUBLIC_FF_LESSON_TASKS_V1=true
```

### Rollback Plan
```sql
-- Safe: both tables are additive. Rollback = drop them.
DROP TABLE IF EXISTS courses.task_submissions;
DROP TABLE IF EXISTS courses.lesson_tasks;
-- Note: the 'lesson_task' enum value cannot be removed in PostgreSQL,
-- but is safe to leave unused. Code rollback is a Vercel deployment rollback.
```

---

## Testing Strategy

### Unit Tests (No DB, No Network)
| Test File | What It Covers |
|---|---|
| `mcq.strategy.spec.ts` | `validateAnswer` rejects bad payloads; `grade` returns correct/incorrect; `toLearnerConfig` strips `correctOptionId` |
| `written.strategy.spec.ts` | Text payload validated; 10 KB limit enforced; always grades `correct` |
| `swot.strategy.spec.ts` | 4 quadrants required; per-quadrant size limit; always grades `correct` |
| `link.strategy.spec.ts` | `confirmed: true` required; non-https URLs rejected; always grades `correct` |
| `task-grading.policy.spec.ts` | Delegates to correct strategy per type; returns correct `GradingVerdict` |
| `lesson-tasks.specifications.spec.ts` | Each specification throws the right `LessonTaskError` code on failure |

### Mock-Based Service Tests
| Test File | What It Covers |
|---|---|
| `lesson-tasks-command.service.spec.ts` | Idempotency replay; submit flow (correct, incorrect); skip flow; point event dispatched on correct; point event NOT dispatched on incorrect/skip; `ALREADY_SUBMITTED` on double submit |
| `lesson-tasks-query.service.spec.ts` | Returns sanitized task list with submission states; empty list when no tasks |

### API Route Tests
| Test File | What It Covers |
|---|---|
| `tasks-learner-route.spec.ts` | 401 when unauthenticated; 200 with correct payload; `correctOptionId` absent from response |
| `tasks-admin-route.spec.ts` | 403 for non-admin; 201 on create; 409 on version conflict; 404 on archive of missing task |

---

## Verification Plan

### Automated
```bash
npm run type-check   # Zero TypeScript errors
npm run lint         # Zero lint warnings
npm run test         # All unit + mock tests pass
```

### Manual Checklist
- [ ] Admin: Create MCQ task on a lesson (title, 4 options, correct answer, 10 points, mandatory)
- [ ] Admin: Create Written task (5 points, optional)
- [ ] Admin: Publish both tasks
- [ ] Learner: Complete lesson → Tasks section appears
- [ ] Learner: Inspect network response → `correctOptionId` absent
- [ ] Learner: Submit correct MCQ → Status `correct`, 10 points → Leaderboard reflects within SLA
- [ ] Learner: Attempt second MCQ submission → API returns 409 `ALREADY_SUBMITTED`
- [ ] Learner: Submit Written → Status `correct`, 5 points awarded immediately
- [ ] Learner: Skip Written (optional) → Status `skipped`, 0 points, card dismissed
- [ ] Admin: Archive MCQ task → Learner view no longer shows it; historical submission preserved in DB
- [ ] DB: Verify no duplicate rows in `point_events` for the same `idempotencyKey`

---

## Open Questions / Risks

| Question | Assumption | Action Required |
|---|---|---|
| Retroactive mandatory tasks — does adding a mandatory task to a completed lesson revoke course completion? | No — completion status is sealed | Needs product confirmation before FR-016 is fully implemented |
| Rich text for task prompts? | Plain text only initially | Iterate in a follow-on spec |
| Point reversals on archive? | No — `point_events` is immutable | Document in runbook |
| Incorrect MCQ → reveal correct answer to learner? | Yes — shown after submission for learning value | Confirm in UI spec |
| Rate limit configuration | Reuse existing rate-limit middleware per user | Confirm threshold with infra team |
