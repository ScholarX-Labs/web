---
description: "Task list for Lesson Tasks feature implementation"
---

# Tasks: 022-lesson-tasks

**Input**: Design documents from `specs/022-lesson-tasks/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Add 'lesson_task' to activityTypeEnum in src/db/schema/leaderboard.ts
- [ ] T002 Generate migration for enum update with `npm run db:generate`
- [ ] T003 Apply migration to local dev DB with `npm run db:migrate`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Define core types and DTOs in src/domain/courses/lesson-tasks/contracts/lesson-tasks.types.ts
- [ ] T005 [P] Create repository interfaces in src/domain/courses/lesson-tasks/contracts/lesson-tasks.repository.ts
- [ ] T006 [P] Create Strategy interface in src/domain/courses/lesson-tasks/contracts/task-type.strategy.ts
- [ ] T007 [P] Implement DrizzleTaskRepository in src/domain/courses/lesson-tasks/infrastructure/db/drizzle-task.repository.ts
- [ ] T008 [P] Implement DrizzleTaskSubmissionRepository in src/domain/courses/lesson-tasks/infrastructure/db/drizzle-task-submission.repository.ts
- [ ] T009 Create Domain Factory in src/domain/courses/lesson-tasks/lesson-tasks.factory.ts (Depends on T004-T008)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Complete a Lesson Task (Priority: P1) 🎯 MVP

**Goal**: Learners can view tasks after a lesson, submit answers, and receive points. Focuses on MCQ, Written, and SWOT types.

**Independent Test**: A learner can view a seeded MCQ task, submit a correct answer, and receive points via the backend API.

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create McqStrategy in src/domain/courses/lesson-tasks/strategies/mcq.strategy.ts
- [ ] T011 [P] [US1] Create WrittenStrategy in src/domain/courses/lesson-tasks/strategies/written.strategy.ts
- [ ] T012 [P] [US1] Create SwotStrategy in src/domain/courses/lesson-tasks/strategies/swot.strategy.ts
- [ ] T013 [US1] Register strategies in src/domain/courses/lesson-tasks/strategies/task-type.registry.ts
- [ ] T014 [P] [US1] Create TaskGradingPolicy in src/domain/courses/lesson-tasks/models/task-grading.policy.ts
- [ ] T015 [P] [US1] Create Specifications in src/domain/courses/lesson-tasks/models/lesson-tasks.specifications.ts
- [ ] T016 [P] [US1] Create LessonTaskError in src/domain/courses/lesson-tasks/application/lesson-tasks.errors.ts
- [ ] T017 [US1] Implement LessonTaskCommandService in src/domain/courses/lesson-tasks/application/lesson-tasks-command.service.ts
- [ ] T018 [US1] Implement LessonTaskQueryService in src/domain/courses/lesson-tasks/application/lesson-tasks-query.service.ts
- [ ] T019 [US1] Wire services into Factory in src/domain/courses/lesson-tasks/lesson-tasks.factory.ts
- [ ] T020 [P] [US1] Implement GET API route in src/app/api/courses/[slug]/lessons/[lessonId]/tasks/route.ts
- [ ] T021 [P] [US1] Implement POST submissions route in src/app/api/courses/[slug]/lessons/[lessonId]/tasks/[taskId]/submissions/route.ts
- [ ] T022 [P] [US1] Implement POST skip route in src/app/api/courses/[slug]/lessons/[lessonId]/tasks/[taskId]/skip/route.ts
- [ ] T023 [P] [US1] Implement TanStack Query hooks in src/components/hooks/use-lesson-tasks.ts
- [ ] T024 [P] [US1] Build wrapper TaskCard component in src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/task-card.tsx
- [ ] T025 [P] [US1] Build McqTaskCard component in src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/tasks/mcq-task-card.tsx
- [ ] T026 [P] [US1] Build WrittenTaskCard component in src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/tasks/written-task-card.tsx
- [ ] T027 [P] [US1] Build SwotTaskCard component in src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/tasks/swot-task-card.tsx
- [ ] T028 [US1] Assemble LessonTaskSection in src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-task-section.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently via API or UI with seeded DB tasks.

---

## Phase 4: User Story 2 - Add and Configure Tasks in the Course Builder (Priority: P1)

**Goal**: Admins can construct, configure, and reorder lesson tasks in the curriculum editor.

**Independent Test**: An admin can create a new task in the editor, and it appears in the database and subsequent API responses.

### Implementation for User Story 2

- [ ] T029 [P] [US2] Implement admin GET/POST route in src/app/api/admin/courses/[courseId]/lessons/[lessonId]/tasks/route.ts
- [ ] T030 [P] [US2] Implement admin PATCH/DELETE route in src/app/api/admin/courses/[courseId]/lessons/[lessonId]/tasks/[taskId]/route.ts
- [ ] T031 [P] [US2] Implement admin POST reorder route in src/app/api/admin/courses/[courseId]/lessons/[lessonId]/tasks/reorder/route.ts
- [ ] T032 [P] [US2] Implement admin data hooks in src/components/hooks/use-admin-lesson-tasks.ts
- [ ] T033 [P] [US2] Build MCQ config form in src/components/admin/tasks/task-type-form/mcq-form.tsx
- [ ] T034 [P] [US2] Build Written config form in src/components/admin/tasks/task-type-form/written-form.tsx
- [ ] T035 [P] [US2] Build SWOT config form in src/components/admin/tasks/task-type-form/swot-form.tsx
- [ ] T036 [US2] Assemble LessonTaskEditor component in src/components/admin/tasks/lesson-task-editor.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Course Builder tasks can now populate the learner UI.

---

## Phase 5: User Story 3 - External Link Tasks via Honor System (Priority: P2)

**Goal**: Support external links as a valid task type with an honor-system checkoff.

**Independent Test**: Admins can add link tasks; learners can complete them by confirming action.

### Implementation for User Story 3

- [ ] T037 [P] [US3] Create LinkStrategy in src/domain/courses/lesson-tasks/strategies/link.strategy.ts
- [ ] T038 [US3] Register LinkStrategy in src/domain/courses/lesson-tasks/strategies/task-type.registry.ts
- [ ] T039 [P] [US3] Build LinkTaskCard learner UI in src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/tasks/link-task-card.tsx
- [ ] T040 [P] [US3] Build Link config form in src/components/admin/tasks/task-type-form/link-form.tsx

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, tests, and final checks.

- [ ] T041 [P] Implement `NEXT_PUBLIC_FF_LESSON_TASKS_V1` feature flag guard logic where necessary
- [ ] T042 [P] Write unit tests for Strategies in src/domain/courses/lesson-tasks/strategies/*.spec.ts
- [ ] T043 [P] Write unit tests for TaskGradingPolicy and Specifications
- [ ] T044 [P] Write mock-based tests for LessonTaskCommandService
- [ ] T045 Write integration tests for learner API routes
- [ ] T046 Write integration tests for admin API routes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (Learner Flow) and User Story 2 (Admin Flow) can run in parallel
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- The UI, API routes, and strategy files within any given story are largely marked `[P]` because they can be scaffolded independently once contracts are defined.
- After foundation is complete, frontend engineers can build `TaskCard` and admin forms while backend engineers implement the `CommandService` and `QueryService`.
