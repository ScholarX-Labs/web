---
description: "Task list for implementing the Premium Lesson UI Redesign"
---

# Tasks: Premium Lesson UI Redesign

**Input**: Design documents from `/specs/001-premium-lesson-ui/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Paths shown below map exactly to the Next.js `src/app/(platform)` router directory layout as derived from `plan.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic state architectural structure.

- [x] T001 Create `ui-layout-store.ts` implementing Zustand store explicitly typed per `data-model.md` in `src/store/ui-layout-store.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI primitives that MUST be completed before ANY user story can be implemented seamlessly inside them.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create generic Vaul Drawer utility wrapper matching iOS sheet dimensions in `src/components/ui/drawer-sheet.tsx`
- [x] T003 [P] Create Glass Panel utility component (Apple aesthetics) in `src/components/ui/glass-panel.tsx`
- [x] T004 Create `lesson-layout-shell.tsx` client wrapper for Framer Motion `AnimatePresence` in `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-layout-shell.tsx`

**Checkpoint**: Foundation ready - Client wrapper established. User story implementation can now begin.

---

## Phase 3: User Story 1 - Fluid Component Transitions (Priority: P1) 🎯 MVP

**Goal**: Enable components like the VideoPlayer to transition smoothly into expanded modals via Framer Motion `layoutId`.

**Independent Test**: Can click an active element, observe structural layout transformation into expanded mode smoothly in the viewport.

### Implementation for User Story 1

- [x] T005 [P] [US1] Integrate `layoutId` physics-based wrapper handling expanded states inside `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player.tsx`
- [x] T006 [US1] Refactor `page.tsx` structural flow to use `lesson-layout-shell.tsx` ensuring server-fetched data interpolates perfectly over client boundaries in `src/app/(platform)/courses/[slug]/lessons/[lessonId]/page.tsx`
- [x] T007 [US1] Dispatch active widget ID state to Zustand store on video player interactions in `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - iOS-Style Bottom Sheet Navigation (Priority: P1)

**Goal**: Render lesson sidebar natively as a scaled-background drawer on mobile breakpoints.

**Independent Test**: Simulating a mobile viewing environment triggers a bottom drawer handle. Swiping the handle naturally scales back the main lesson layout.

### Implementation for User Story 2

- [x] T008 [P] [US2] Reconfigure layout CSS grid to conceal static sidebar below `1024px` breakpoint in `src/app/(platform)/courses/[slug]/lessons/[lessonId]/page.tsx`
- [x] T009 [US2] Modify `lesson-sidebar.tsx` to conditionally wrap contents within `drawer-sheet.tsx` dynamically if on mobile breakpoint in `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-sidebar.tsx`
- [x] T010 [US2] Expose drawer trigger events leveraging Zustand `setDrawerOpen` method in `src/components/courses/courses-view.tsx` (or context trigger buttons).

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Glassmorphic Interface and Micro-Interactions (Priority: P2)

**Goal**: Apply fluid aesthetics across interactive UI components (hover/tap).

**Independent Test**: Header bar blurs scrolled content intensely; sidebar buttons feel tactically responsive physically (shrink on press).

### Implementation for User Story 3

- [x] T011 [P] [US3] Adapt `glass-panel.tsx` classes to wrap the main `page.tsx` header for intense backdrop blur inside `src/app/(platform)/courses/[slug]/lessons/[lessonId]/page.tsx`
- [x] T012 [P] [US3] Embed Framer Motion interaction props (`whileHover`, `whileTap`) to all active lesson links inside `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-sidebar.tsx`
- [x] T013 [P] [US3] Fine-tune drop shadows within `video-player.tsx` to simulate a volumetric, cinematic Ambilight effect based on the UI redesign research.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: System-wide health checks aligning with Constitution validation criteria.

- [x] T014 [P] Test and implement CSS `prefers-reduced-motion` conditionals for Framer Motion wrappers inside `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-layout-shell.tsx`
- [x] T015 Verify TypeScript type strictness checking explicitly on all newly added prop domains (Constitution Principle II).
- [x] T016 Execute production JS bundle audit to ensure Framer Motion and Vaul constraints did not violate Time-to-Interactive performance budgets.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion. User stories proceed sequentially in priority order (US1 → US2 → US3).
- **Polish (Final Phase)**: Depends on all user stories completing.

### Within Each User Story

- Components before complex layouts.
- Interaction wiring last.

### Parallel Opportunities

- Foundational component wrappers `drawer-sheet.tsx` and `glass-panel.tsx` can be developed structurally parallel to the Zustand store logic.
- Aesthetic refinements (US3 hover springs) can concurrently happen while deep wiring (US1) is tested.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`ui-layout-store.ts`)
2. Complete Phase 2: Foundational Shell (`lesson-layout-shell.tsx`)
3. Complete Phase 3: User Story 1 (Video Expand Transition)
4. **STOP and VALIDATE**: Test User Story 1 independently. Observe Framer Motion 60fps compliance.
5. Merge if clean.

### Incremental Delivery Next

1. Follow closely with User Story 2 (Drawer). Verify CSS scale behaviors aren't fighting Framer Motion wrapper layout tracking.
2. Finalize Glassmorphism aesthetic layer.
