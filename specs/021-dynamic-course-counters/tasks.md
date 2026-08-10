# Tasks: Dynamic Course Counters

**Input**: Design documents from `/specs/021-dynamic-course-counters/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create `src/domain/courses/contracts/course-metrics.contract.ts` with types and Zod schemas
- [x] T002 [P] Create `src/components/courses/counter.constants.ts` with animation constants

---

## Phase 2: Foundational (Data & Cache Layer)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add counters entry to `cachePolicy` in `src/lib/cache/cache-policy.ts`
- [x] T004 Implement live count query in `src/domain/courses/infrastructure/db/next-courses.repository.ts`
- [x] T005 Implement counter cache helpers in `src/domain/courses/application/course-cache.ts`
- [x] T006 Implement `CourseMetricsService` in `src/domain/courses/application/course-metrics.service.ts`
- [x] T007 Implement unit tests for `CourseMetricsService` in `src/domain/courses/application/course-metrics.service.test.ts`
- [x] T008 Wire `CourseMetricsService` into factory in `src/domain/courses/factory/next-course-domain.factory.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Truthful Social Proof at First Glance (Priority: P1) 🎯 MVP

**Goal**: Display accurate, cached counter data instantly with digit-aware transitions.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create `AnimatedCounter` component in `src/components/courses/animated-counter.tsx`
- [x] T010 [P] [US1] Create tests for `AnimatedCounter` in `src/components/courses/animated-counter.test.tsx`
- [x] T011 [US1] Create `CountersSkeleton` component in `src/components/courses/counters-skeleton.tsx`
- [x] T012 [US1] Create `CourseCountersDisplay` component in `src/components/courses/course-counters-display.tsx`
- [x] T013 [US1] Create `CourseCountersSection` component in `src/components/courses/course-counters-section.tsx`
- [x] T014 [US1] Implement `InlineEnrollmentBadge` component in `src/components/courses/inline-enrollment-badge.tsx`
- [x] T015 [US1] Integrate `CourseCountersSection` into `src/app/(platform)/courses/[slug]/page.tsx`

**Checkpoint**: User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Live Activity Signal on Real Events (Priority: P2)

**Goal**: Show a brief +N indicator when real enrollments happen via background polling.

### Implementation for User Story 2

- [x] T016 [P] [US2] Create `ActivityBadge` component in `src/components/courses/activity-badge.tsx`
- [x] T017 [P] [US2] Create tests for `ActivityBadge` in `src/components/courses/activity-badge.test.tsx`
- [x] T018 [US2] Create API route handler in `src/app/api/courses/[slug]/counters/route.ts`
- [x] T019 [US2] Create tests for API route in `src/app/api/courses/[slug]/counters/route.test.ts`
- [x] T020 [US2] Trigger cache invalidation in `src/domain/courses/application/next-course-enrollment.service.ts`
- [x] T021 [US2] Update `CourseCountersDisplay` in `src/components/courses/course-counters-display.tsx` to include TanStack Query polling

**Checkpoint**: User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Resilient Counters Under Failure (Priority: P3)

**Goal**: Ensure graceful fallback to denormalized data if Redis/DB are down.

### Implementation for User Story 3

- [x] T022 [US3] Add fallback tests to `src/domain/courses/application/course-metrics.service.test.ts` to simulate Redis/DB outages.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T023 [P] Run type-checking (`pnpm tsc --noEmit`) to verify strict typing
- [x] T024 [P] Run linter (`pnpm lint`) on all modified files
- [x] T025 Execute Playwright E2E tests for the course detail page

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies
- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Depends on US1 UI components.
- **User Story 3 (P3)**: Relies on Foundational code; can be worked on concurrently with US2.

### Parallel Opportunities
- T001 and T002 in Phase 1 can be done in parallel.
- All tasks marked `[P]` can run in parallel.
- Component creation in US1 (T009-T010) can be done in parallel with T011.
