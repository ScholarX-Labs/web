---
description: "Task list for Interactive Entertaining Loading State implementation"
---

# Tasks: Interactive Entertaining Loading State

**Input**: Design documents from `specs/019-interactive-loading-state/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create component directory structure in `src/components/ui/interactive-loader/`
- [ ] T002 Verify UI dependencies (Framer Motion, Lucide React) in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Create `LoadingSessionState`, `LoadingStage`, and `UserLoaderPreferences` interfaces in `src/components/ui/interactive-loader/types.ts`
- [ ] T004 [P] Create `trivia-data.ts` in `src/components/ui/interactive-loader/trivia-data.ts` with contextual trivia banks
- [ ] T005 Create `AudioHapticController.ts` in `src/components/ui/interactive-loader/AudioHapticController.ts` for Web Audio API synthesis
- [ ] T006 Implement `useInteractiveLoader` hook in `src/components/ui/interactive-loader/useInteractiveLoader.ts` (depends on types, AudioHapticController)
- [ ] T007 Create module exports in `src/components/ui/interactive-loader/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Interactive Micro-Trivia & Skill Bites during AI Matching (Priority: P1) 🎯 MVP

**Goal**: As a learner waiting for AI scholarship matching, answer rapid 1-question scholarship trivia bites.

**Independent Test**: Can be fully tested by triggering a simulated 5-second loading state, verifying trivia overlay appears after 300ms, and interacting with trivia options.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Create `TriviaOverlay` component in `src/components/ui/interactive-loader/TriviaOverlay.tsx`
- [ ] T009 [US1] Create main `InteractiveLoader` container in `src/components/ui/interactive-loader/InteractiveLoader.tsx` integrating `useInteractiveLoader` and `TriviaOverlay`

**Checkpoint**: At this point, User Story 1 (Threshold wait & Trivia overlay) should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Dynamic Visual Stages & Multi-Step Progress Indicators (Priority: P2)

**Goal**: See clear, entertaining stage-by-stage status messages accompanied by delightful ambient visual animations.

**Independent Test**: Trigger a multi-stage process and verify progress indicators update fluidly with stage badges.

### Implementation for User Story 2

- [ ] T010 [P] [US2] Create `ProgressStageTrack` component in `src/components/ui/interactive-loader/ProgressStageTrack.tsx`
- [ ] T011 [US2] Integrate `ProgressStageTrack` into `src/components/ui/interactive-loader/InteractiveLoader.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Interactive Bubble-Popping & Mini-Game Stress Relief (Priority: P3)

**Goal**: Interactive mini-game (popping knowledge bubbles) to release tension during high-stress operations.

**Independent Test**: Interact with floating elements, verify haptic/sound toggle, and confirm cleanup on game end.

### Implementation for User Story 3

- [ ] T012 [P] [US3] Create `BubblePopGame` component in `src/components/ui/interactive-loader/BubblePopGame.tsx` utilizing Framer Motion
- [ ] T013 [US3] Integrate `BubblePopGame` into `src/components/ui/interactive-loader/InteractiveLoader.tsx`

**Checkpoint**: All interactive modes (Trivia, Stages, Mini-Game) are functional.

---

## Phase 6: User Story 4 - Uninterrupted Task Transition (Priority: P4)

**Goal**: Smooth auto-dismissal and success banner when background loading task finishes without jarring interruptions.

**Independent Test**: Complete a loading cycle while playing the mini-game and verify a 500ms success state before smooth fade-out.

### Implementation for User Story 4

- [ ] T014 [US4] Implement transition & success banner states in `src/components/ui/interactive-loader/InteractiveLoader.tsx`
- [ ] T015 [US4] Implement error/retry fallback states in `src/components/ui/interactive-loader/InteractiveLoader.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T016 [P] Verify `prefers-reduced-motion` compliance in all Framer Motion components
- [ ] T017 [P] Implement `aria-live="polite"` and keyboard navigation (Tab/Enter) in `TriviaOverlay` and `InteractiveLoader`
- [ ] T018 Code cleanup and adherence to ScholarX styling and glassmorphism standards

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3-6)**: Must run sequentially in priority order (US1 -> US2 -> US3 -> US4) because they progressively integrate into `InteractiveLoader.tsx`.
- **Polish (Phase 7)**: Depends on all user stories being completed

### Parallel Opportunities

- Types, `trivia-data.ts`, and `AudioHapticController.ts` in Foundational Phase can be created in parallel.
- `TriviaOverlay.tsx` (US1), `ProgressStageTrack.tsx` (US2), and `BubblePopGame.tsx` (US3) presenter components can be created in parallel before they are integrated into `InteractiveLoader.tsx`.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 (Setup & Foundational)
2. Complete Phase 3 (US1 - Trivia Overlay)
3. STOP and VALIDATE: Test US1 independently.

### Incremental Delivery

1. Foundation ready.
2. Add US1 → Test.
3. Add US2 (Stage Tracks) → Test.
4. Add US3 (Bubble Pop) → Test.
5. Add US4 (Transitions & Fallbacks) → Test.
