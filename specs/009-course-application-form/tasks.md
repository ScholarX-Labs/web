# Tasks: Course Application Form

**Input**: Design documents from `/specs/009-course-application-form/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Include focused route, domain, and component tests because the spec explicitly requires validation, concurrency/idempotency, enrollment gating, and premium UI state coverage.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the implementation task graph and align feature entry points with the approved contract.

- [X] T001 Audit current enrollment/application code paths in `src/components/courses`, `src/lib/enrollment`, `src/lib/api/courses.service.ts`, `src/domain/courses/application`, and `src/app/api/courses/[[...path]]`
- [X] T002 Create feature task tracking in `specs/009-course-application-form/tasks.md` and keep it updated as implementation progresses

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the backend foundation that all learner and admin stories depend on.

- [X] T003 Add `course_applications` persistence model, enums, checks, and indexes in `src/db/schema/courses-db.schema.ts`
- [X] T004 Add and/or generate the matching migration in `drizzle/` for the application table and index plan
- [X] T005 [P] Add course application domain types, Zod schemas, transition rules, and DTO mappers under `src/domain/courses/contracts/` and `src/domain/courses/application/`
- [X] T006 [P] Extend `src/domain/courses/infrastructure/db/next-courses.repository.ts` with application create/read/update methods and learner/admin projections
- [X] T007 Refactor `src/domain/courses/application/next-course-enrollment.service.ts` to use dedicated course applications instead of generic inquiries
- [X] T008 Add standard API envelope helpers and application error mapping for learner/admin course application routes

**Checkpoint**: Dedicated application storage and server-side domain rules are in place.

---

## Phase 3: User Story 1 - Submit Required Course Application (Priority: P1) 🎯 MVP

**Goal**: Learners can submit the required application for courses that enforce the form gate.

**Independent Test**: Open a required-form course, launch the application modal, submit a valid application, and receive a pending-review response instead of direct enrollment.

### Tests for User Story 1

- [ ] T009 [P] [US1] Update learner route tests in `src/app/api/courses/[[...path]]/route.test.ts` for the submit endpoint envelope and successful application creation
- [ ] T010 [P] [US1] Add service tests for application submission validation/idempotency in `src/domain/courses/application/next-course-enrollment.service.test.ts`
- [X] T011 [P] [US1] Add client strategy tests in `src/lib/enrollment/strategies/enrollment-strategies.test.ts` for the expanded application payload and response handling

### Implementation for User Story 1

- [X] T012 [US1] Upgrade learner application request/response types in `src/lib/api/courses.service.ts` to the approved payload and `/api/v1/...` contract
- [X] T013 [US1] Implement `POST /api/v1/courses/:courseId/enroll/application` and `GET /api/v1/courses/:courseId/enroll/application/status` route handlers under `src/app/api/v1/courses/`
- [X] T014 [US1] Extend `src/lib/enrollment/strategies/course-application.strategy.ts` with the full typed application payload and field-level error handling
- [X] T015 [US1] Replace `src/components/courses/course-application-form.tsx` with the 4-step premium application stepper flow
- [X] T016 [US1] Add learner application status surface in `src/components/courses/course-application-status.tsx` and wire it into `src/components/courses/enroll-modal.tsx`

**Checkpoint**: Learners can submit a full course application and see application state instead of a generic inquiry.

---

## Phase 4: User Story 2 - Enforce Conditional Applicant Fields (Priority: P1)

**Goal**: The application captures only the fields required for the learner’s selected status and validates them consistently.

**Independent Test**: Select each learner status and verify the exact conditional fields become required client-side and server-side.

### Tests for User Story 2

- [ ] T017 [P] [US2] Add validation matrix tests for learner status branches in `src/domain/courses/application/next-course-application.validation.test.ts`
- [ ] T018 [P] [US2] Add component tests for conditional field reveals and step navigation in `src/components/courses/enroll-modal.test.ts`

### Implementation for User Story 2

- [X] T019 [US2] Implement discriminated learner-status validation schemas and safe conditional serialization in `src/domain/courses/application/`
- [X] T020 [US2] Wire conditional fields, focus management, and review-step summaries into `src/components/courses/course-application-form.tsx`

**Checkpoint**: Conditional applicant data is enforced consistently across UI and server boundaries.

---

## Phase 5: User Story 3 - Protect Enrollment Boundary (Priority: P1)

**Goal**: Direct enrollment cannot bypass the required application policy.

**Independent Test**: Attempt direct enrollment for a required-form course without an approved application and confirm the flow is blocked server-side.

### Tests for User Story 3

- [ ] T021 [P] [US3] Extend `src/app/api/courses/[[...path]]/route.test.ts` for enrollment-blocking behavior
- [X] T022 [P] [US3] Extend `src/lib/enrollment/strategies/enrollment-strategies.test.ts` and related executor tests for required-form mode selection

### Implementation for User Story 3

- [X] T023 [US3] Update enrollment gate logic in `src/domain/courses/application/next-course-enrollment.service.ts` and `src/lib/enrollment/enrollment-executor.ts` to use real application status
- [ ] T024 [US3] Update learner CTA copy and modal branching in course page components and `src/components/courses/enroll-modal-actions.tsx`

**Checkpoint**: The application gate is authoritative and non-required-form enrollment still behaves exactly as before.

---

## Phase 6: User Story 4 - Review Applications Operationally (Priority: P2)

**Goal**: Admins can list, inspect, and update course applications with bounded transitions.

**Independent Test**: Submit an application, open it in the admin review area, update status, and confirm learner-facing state reflects the change.

### Tests for User Story 4

- [ ] T025 [P] [US4] Add admin route/service tests for list/detail/status update in `src/app/api/admin/[[...path]]` and `src/domain/admin/application/`
- [ ] T026 [P] [US4] Add UI tests for admin review list/detail rendering and safe narrative display

### Implementation for User Story 4

- [ ] T027 [US4] Add admin application read/write services and narrow ports under `src/domain/admin/application/` and `src/domain/courses/contracts/`
- [ ] T028 [US4] Implement `/api/v1/admin/course-applications` list/detail/status routes under `src/app/api/v1/admin/course-applications/`
- [ ] T029 [US4] Build admin list/detail UI under `src/app/admin/course-applications/` and supporting components in `src/components/admin/`

**Checkpoint**: Admins can operationally review course applications without leaking private data into public surfaces.

---

## Phase 7: User Story 5 - Scale Application Intake (Priority: P3)

**Goal**: The application flow remains correct and usable under retries, duplicates, and campaign bursts.

**Independent Test**: Repeated submits for the same learner/course remain idempotent and admin list filters remain usable on seeded data.

### Tests for User Story 5

- [ ] T030 [P] [US5] Add concurrency/idempotency tests for duplicate submit protection
- [ ] T031 [P] [US5] Add contract tests for standard error envelopes, `429 RATE_LIMITED`, and field errors

### Implementation for User Story 5

- [ ] T032 [US5] Add submit abuse controls, idempotency handling, and `Retry-After` behavior in learner application routes/services
- [ ] T033 [US5] Add pagination/filter query support and compact projections for admin application lists

**Checkpoint**: Duplicate protection, rate limiting, and admin-scale query paths are implemented.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finish integration, verification, and documentation-level checks.

- [ ] T034 [P] Add visual polish, reduced-motion handling, and responsive fixes across `src/components/courses/`
- [ ] T035 [P] Sanitize/output-encode admin narrative rendering and verify no private data leaks through logs or public payloads
- [X] T036 Run `pnpm run typecheck`
- [X] T037 Run `pnpm run test`
- [ ] T038 Validate the manual scenarios in `specs/009-course-application-form/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 must complete first.
- Phase 2 blocks all user stories.
- User Stories 1, 2, and 3 depend on Phase 2.
- User Story 4 depends on Phase 2 and the core application persistence from User Story 1.
- User Story 5 depends on the learner and admin core paths existing.
- Polish depends on all implemented stories.

### User Story Dependencies

- **US1** is the MVP and first delivery slice.
- **US2** depends on the US1 form/request structure.
- **US3** depends on the US1 application persistence and status model.
- **US4** depends on US1 persistence and status transitions.
- **US5** depends on US1 and US4 routes/services.

### Parallel Opportunities

- T005 and T006 can run in parallel after T003.
- Test tasks marked `[P]` can be written in parallel when their target surface is known.
- UI polish and security verification in Phase 8 can run in parallel after feature completion.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Deliver US1 and US3 together so the learner flow and server gate stay consistent.
3. Add US2 validation and stepper refinement.
4. Add admin review and scale hardening.

### Incremental Delivery

1. Dedicated application persistence and validation.
2. Learner submit/status flow.
3. Enrollment enforcement.
4. Admin operations.
5. Rate limiting, concurrency, and polish.
