# Tasks: Dynamic Course Details & Scholarship Alignment

**Input**: Design documents from `specs/023-dynamic-course-details/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`)
**Branch**: `023-dynamic-course-details`
**Prerequisites**: `plan.md` (required), `spec.md` (required)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an explicit file path.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify dependencies and test harness readiness for course details alignment.

- [x] T001 Verify project test environment and database schema configuration in `src/db/schema/courses-db.schema.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model and domain contract foundation required for all user stories.

- [x] T002 Add `learningOutcomes` and `targetAudience` JSONB columns to `dbCourses` in `src/db/schema/courses-db.schema.ts`
- [x] T003 [P] Add `learningOutcomes` and `targetAudience` to `Course` interface and expand `Instructor` type in `src/types/course.types.ts`
- [x] T004 Map `learningOutcomes` and `targetAudience` in `NextCoursesRepository` in `src/domain/courses/infrastructure/db/next-courses.repository.ts`
- [x] T005 Map `learningOutcomes` and `targetAudience` in `toCourse` transformation in `src/domain/courses/application/next-course-catalog.service.ts`
- [x] T006 [P] Create domain outcome resolver `resolveCourseLearningOutcomes` with scholarship-specific fallbacks in `src/lib/course-outcomes.ts`
- [x] T007 [P] Create unit tests for `resolveCourseLearningOutcomes` testing custom outcomes and fallback behavior in `src/lib/__tests__/course-outcomes.test.ts`

**Checkpoint**: Foundation complete. Learning outcomes are supported in the database schema, domain repository, and mapped with scholarship fallbacks.

---

## Phase 3: User Story 1 - Consistent & Accurate Course Understanding (Priority: P1) 🎯 MVP

**Goal**: Eliminate legacy coding-bootcamp copy and ensure 100% parity between the Course Detail PopUp Sheet and the Full Course Detail Page.

**Independent Test**: Navigate to `/courses`, open the quick-view popup on any course, and verify scholarship outcomes are shown. Navigate to `/courses/[slug]` and verify the exact same outcomes are rendered in the curriculum section.

- [x] T008 [US1] Update `CourseDetailSheet` to use `resolveCourseLearningOutcomes` and remove hardcoded coding-bootcamp `learningOutcomes` array in `src/components/courses/course-detail-sheet.tsx`
- [x] T009 [US1] Update `CourseCurriculum` to use `resolveCourseLearningOutcomes` and remove hardcoded "Master the fundamentals" / "Deploying your applications" array in `src/app/(platform)/courses/[slug]/_components/course-curriculum.tsx`
- [x] T010 [P] [US1] Update `messages/en/courses.json` and `messages/ar/courses.json` with scholarship-oriented fallback text strings for course detail sections
- [x] T011 [US1] Ensure `requiresForm: true` courses display consistent "Apply Now" CTA across both popup sheet and full page in `src/components/courses/course-detail-sheet.tsx` and `src/app/(platform)/courses/[slug]/_components/course-hero.tsx`

**Checkpoint**: MVP Complete! The popup sheet and detail page display identical scholarship-focused learning outcomes.

---

## Phase 4: User Story 2 - Course Creator / Admin Customization of Outcomes (Priority: P2)

**Goal**: Allow administrators to configure and edit custom scholarship learning outcomes directly within the admin course management dashboard.

**Independent Test**: As an admin, edit a course at `/admin/courses/[courseId]`, add 4 custom scholarship takeaways, save, and confirm that both public popup and detail page immediately reflect the new takeaways.

- [x] T012 [US2] Update `AdminCoursesService` and update schemas to accept and validate `learningOutcomes` and `targetAudience` in `src/domain/admin/application/admin-courses.service.ts`
- [x] T013 [US2] Update admin course mutation actions and hooks to support `learningOutcomes` in `src/actions/course.actions.ts` and `src/hooks/admin/use-admin-courses.ts`
- [x] T014 [US2] Add dynamic Learning Outcomes tag/list manager UI in Admin Course Detail Page in `src/app/admin/courses/[courseId]/page.tsx`
- [x] T015 [US2] Invalidate course catalog cache on admin course outcome updates in `src/domain/courses/application/course-cache.ts`

**Checkpoint**: Administrators can dynamically manage custom learning outcomes per course without code changes.

---

## Phase 5: User Story 3 - Academic & Scholarship-Focused Instructor Profile (Priority: P3)

**Goal**: Replace legacy tech-industry instructor bio and stats with academic mentorship credibility tailored to scholarship preparation.

**Independent Test**: Inspect the instructor section on `/courses/[slug]` to confirm the copy and credentials emphasize scholarship guidance, academic advisory, and funded opportunities.

- [x] T016 [US3] Update `CourseInstructor` component to replace hardcoded tech bootcamp bio ("transition into tech careers", "portfolios that get you hired") with scholarship mentorship copy in `src/app/(platform)/courses/[slug]/_components/course-instructor.tsx`
- [x] T017 [US3] Support dynamic instructor bio/title if provided on the instructor object in `src/app/(platform)/courses/[slug]/_components/course-instructor.tsx`

**Checkpoint**: All instructor surfaces reflect scholarship and academic admissions credibility.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Type check, lint verification, and responsive validation across screen sizes.

- [x] T018 [P] Run `npm run type-check` or `npx tsc --noEmit` to verify type safety across all updated files
- [x] T019 Run unit test suite `npm run test` or `npx vitest run src/lib/__tests__/course-outcomes.test.ts`
- [x] T020 [P] Verify responsive layout and scrolling behavior in `CourseDetailSheet` with 3 to 8 outcomes in `src/components/courses/course-detail-sheet.tsx`
- [x] T021 Run quickstart verification flow documented in `specs/023-dynamic-course-details/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on T001. Blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 (T002-T007). Delivers MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 2. Can run after or in parallel with US1.
- **User Story 3 (Phase 5)**: Depends on Phase 2.
- **Polish (Phase 6)**: Depends on US1, US2, and US3.

---

## Implementation Strategy

### MVP First (User Story 1)
1. Complete Foundational Phase (T002 - T007) to introduce database and domain support for outcomes.
2. Complete User Story 1 (T008 - T011) to eliminate all coding bootcamp copy and unify popup vs. page outcomes.
3. Test MVP immediately: verify that browsing any course shows scholarship prep copy on both surfaces.
4. Continue with US2 (Admin management) and US3 (Instructor credentials).
