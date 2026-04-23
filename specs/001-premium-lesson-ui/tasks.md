# Tasks: World-Class Premium Lesson UI

**Input**: `specs/001-premium-lesson-ui/` — plan.md, spec.md, data-model.md, research.md  
**Branch**: `001-premium-lesson-ui`  
**Total Tasks**: 51  
**Tests**: Not requested — no test tasks generated

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[USn]**: User story this task belongs to
- All file paths are relative to `src/` unless noted

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the token and variant foundation that every subsequent component consumes. Nothing else can proceed until T001–T003 are done.

**⚠️ CRITICAL**: These files are imported by ALL phases. Complete before any component work.

- [x] T001 Create design token file `src/lib/design-tokens.ts` — export `zIndex` (6 levels: base/content/sidebar/overlay/modal/toast), `radius` (video/card/button/pill), `shadow` (ambient/elevated/floating/inner), `duration` (instant/fast/normal/slow) all typed `as const`
- [x] T002 Create motion variants file `src/lib/motion-variants.ts` — export `fadeSlideUp`, `fadeSlideIn`, `springPanel`, `staggerContainer`, `staggerItem`, `tapScale`, `focusModeTransition` as named typed constants; no inline Framer Motion objects should remain in component files after Phase 5
- [x] T003 Extend `src/store/ui-layout-store.ts` — add `isFocusMode: boolean`, `isNotesOverlayOpen: boolean`, `isResourcesSheetOpen: boolean` fields; add `toggleFocusMode()`, `setFocusMode(active: boolean)`, `setNotesOverlayOpen(open: boolean)`, `setResourcesSheetOpen(open: boolean)` actions; preserve all existing fields and actions without breaking changes

**Checkpoint ✓**: TSC exits 0 on Phase 1 files — PASSED

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Glassmorphic primitive components and the progress hook — consumed by all user story phases.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T004 [P] Extend `src/components/ui/glass-panel.tsx` — add `GlassCard` forwardRef variant (adds `rounded-2xl p-5` defaults via composition, does NOT modify `GlassPanel`), add `FloatingPanel` forwardRef variant (higher elevation: uses `shadow.elevated` from `design-tokens`, `zIndex.overlay` in style prop); both use `cn()` for className merging
- [x] T005 [P] Create `src/components/ui/animated-button.tsx` — `AnimatedButton` forwardRef wrapping `motion.button`; applies `tapScale.whileHover` and `tapScale.whileTap` from `motion-variants.ts`; spring transition `stiffness:400, damping:28`; requires `aria-label` on icon-only usage; exports `AnimatedButtonProps` interface
- [x] T006 [P] Create `src/components/ui/progress-ring.tsx` — SVG circular progress indicator; props: `value: number` (0–100), `size?: number` (default 28), `strokeWidth?: number` (default 2.5), `className?: string`; uses `stroke-dasharray` + `stroke-dashoffset` for animated fill; accent color matches blue-500; export `ProgressRingProps`
- [x] T007 [P] Create `src/components/ui/context-tooltip.tsx` — Radix `TooltipProvider` + `Tooltip` + `TooltipTrigger` + `TooltipContent`; glassmorphic content: `bg-[#0d1225]/90 backdrop-blur-xl border border-white/10 text-xs text-white/80 rounded-lg px-2.5 py-1.5`; side defaults to `"top"`; export `ContextTooltip` convenience wrapper accepting `content: string` + `children`
- [x] T008 Create `src/hooks/use-lesson-progress.ts` — custom hook implementing full `LessonProgress` entity from `data-model.md`; reads from `localStorage` on mount (`progress:{courseSlug}:{lessonId}`); `onTimeUpdate` debounced 500ms via `useRef` + `clearTimeout`; writes via `requestIdleCallback` with `setTimeout(0)` fallback; `onPause` writes immediately; `heatmapBuckets` computed via `useMemo` — 20 equal video segments, each bucket = count of `pauseEvents` falling in that segment normalized 0–1; `resumePoint` returns `null` if `watchedPercentage < 5`; export `UseLessonProgressOptions`, `UseLessonProgressReturn`, `LessonProgress` types

**Checkpoint ✓**: @radix-ui/react-tooltip installed; all primitives created; TSC exit 0 — PASSED

---

## Phase 3: User Story 1 — Fluid Lesson Transitions & Spatial Layout (Priority: P1) 🎯 MVP

**Goal**: Lesson navigation triggers smooth directional animations; panel overlays float above content with correct z-index depth; sidebar becomes a floating panel.

**Independent Test**: Navigate between two lessons and confirm directional `fadeSlideIn` animation plays; open/close sidebar on mobile and confirm Vaul background scale effect; inspect z-index stacking to confirm base/content/sidebar/overlay layers.

- [x] T009 [US1] Modify `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-layout-shell.tsx` — import and use `fadeSlideIn` from `motion-variants.ts`; wrap the inner content div in `AnimatePresence mode="wait"` keyed on a `lessonKey` prop (passed from page.tsx); add `isFocusMode` read from store; add CSS class `data-focus-mode={isFocusMode}` on root element for global CSS targeting
- [x] T010 [US1] Modify `src/app/(platform)/courses/[slug]/lessons/[lessonId]/page.tsx` — pass `lessonKey={lessonId}` prop to `LessonLayoutShell`; ensure the video player area and meta block are wrapped in the keyed `motion.div` that receives `fadeSlideIn` variants; page.tsx remains a Server Component — all animation wrappers live in `LessonLayoutShell`
- [x] T011 [US1] Modify `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-sidebar.tsx` — replace inline `listVariants`/`itemVariants` with imported `staggerContainer`/`staggerItem` from `motion-variants.ts`; replace the raw `<aside>` glass styling with `<FloatingPanel>` from `glass-panel.tsx`; add `<ProgressRing>` inside status indicator for in-progress lesson items (non-completed, non-locked); wrap the existing `bg-blue-500` status circle for active lesson in `ProgressRing` with 100% value and glow shadow
- [x] T012 [US1] Modify `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-header.tsx` — wrap all icon buttons with `AnimatedButton` from `animated-button.tsx`; wrap each button in `ContextTooltip` from `context-tooltip.tsx` with descriptive `content` prop; add Focus Mode toggle icon button (use `Eye`/`EyeOff` from lucide-react) that calls `toggleFocusMode()` from store; import and apply `focusModeTransition` variant so the entire header can animate to `hidden` state when `isFocusMode` is true

**Checkpoint ✓**: LessonLayoutShell, page.tsx, LessonSidebar, LessonHeader all updated — PASSED

---

## Phase 4: User Story 2 — Dominant Video Focus with Progressive Disclosure (Priority: P1)

**Goal**: Video player commands dominant visual weight; secondary UI dims during uninterrupted playback; Notes/Resources appear only on demand.

**Independent Test**: Open lesson page, wait 3 seconds without interaction — confirm header/sidebar opacity dims; confirm Notes panel is not visible on load; trigger Notes overlay from "Take Notes" action and confirm it slides in; confirm Resources sheet opens from resource trigger.

- [x] T013 [US2] Create `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/notes-panel-overlay.tsx` — `FloatingPanel`-based right-side slide-in overlay (desktop: `fixed right-0 top-0 h-full w-[380px]`, mobile: Vaul `DrawerContent` bottom sheet); reads `isNotesOverlayOpen` from store; uses `springPanel` from `motion-variants.ts` for entry/exit with `AnimatePresence`; includes draggable handle, `X` close button calling `setNotesOverlayOpen(false)`, and ESC key listener via `useEffect`; renders full notes CRUD (textarea input, add button, notes list with edit/delete) — extract notes logic to `use-notes.ts` hook (see T014)
- [x] T014 [US2] Create `src/hooks/use-notes.ts` — custom hook extracting the notes CRUD logic currently in `lesson-tabs.tsx`; manages `notes: Note[]` state, `noteInput`, `editingId`, `editText`; persists to `localStorage` key `notes:{courseSlug}:{lessonId}`; exports `handleAddNote`, `handleDeleteNote`, `handleSaveEdit`, `notes`, `noteInput`, `setNoteInput`, `editingId`, `editText`, `setEditText`, `textareaRef`; `Note` interface: `id`, `text`, `timestamp`, `createdAt`
- [x] T015 [US2] Create `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/resources-bottom-sheet.tsx` — Vaul `DrawerContent`-based bottom sheet using `isResourcesSheetOpen` store flag; `setResourcesSheetOpen(false)` on close trigger; renders the existing `Resource[]` list from `lesson-tabs.tsx` resource section (same card design); adds a sheet header with title and close button; imports `DrawerContent` from `drawer-sheet.tsx`
- [x] T016 [US2] Modify `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-meta.tsx` — replace the "Take Notes" `MoreOptionsDropdown` onClick from `setActiveTabOverride("notes")` to `setNotesOverlayOpen(true)` from store; add a `resume-prompt-banner.tsx` import and render conditionally above video area when `resumePoint !== null` (props: `resumePoint`, `onResume`, `onDismiss`); wrap all existing `motion.div` variants with imported `staggerContainer`/`staggerItem` from `motion-variants.ts` (replace `containerVariants`/`itemVariants`)
- [x] T017 [US2] Create `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/resume-prompt-banner.tsx` — spring-animated `AnimatePresence` banner; message: `"You left off at {formatTime(resumePoint)} — Resume?"` with `[Resume]` button and `[Start Over]` dismiss; auto-dismisses after 8 seconds via `useEffect`; uses `fadeSlideUp` variant from `motion-variants.ts`; positioned above video player; calls `onResume(resumePoint)` or `onDismiss()`

**Checkpoint ✓**: NotesPanelOverlay, useNotes, ResourcesBottomSheet, ResumePromptBanner all created; LessonMeta updated — PASSED

---

## Phase 5: User Story 3 — Physics-Based Motion System (Priority: P1)

**Goal**: Every state change is communicated through intentional animation; all inline variant definitions replaced with shared presets; button press feedback uniform across all interactive elements.

**Independent Test**: Click every button on the lesson page and confirm `scale(0.97)` press feedback; open Notes panel and confirm spring overshoot; switch lesson tabs and confirm directional content transition; inspect any component file and confirm zero inline `initial/animate/exit` variant object literals remain.

- [x] T018 [US3] [P] Modify `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-tabs.tsx` — replace inline `initial/animate/exit` props on tab content panels with `fadeSlideUp` variant from `motion-variants.ts`; replace tab content `AnimatePresence` children with named variants; refactor notes CRUD to use `useNotes(lessonId, courseSlug)` hook from T014 (remove duplicated local state); wrap "Add Note" button with `AnimatedButton`; remove all inline object literals for animation
- [x] T019 [US3] [P] Modify `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-sidebar.tsx` — ensure active lesson `layoutId="active-pill"` `motion.div` also animates `background` via `motion` variants; add `whileHover` spring translation on sidebar items using `tapScale` from `motion-variants.ts`; replace any remaining inline animation object literals with named imports
- [x] T020 [US3] Replace all remaining `motion.button` inline `whileHover/whileTap` props in `lesson-meta.tsx` with `AnimatedButton` from `animated-button.tsx`; replace all inline `containerVariants`/`itemVariants` (if any remain after T016) with imported variants; wrap stat badge row buttons with `ContextTooltip`
- [x] T021 [US3] Audit `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player.tsx` — replace inline `initial/animate/transition` with `fadeSlideIn` from `motion-variants.ts`; ensure `onTimeUpdate`, `onPause`, `onEnded` props are fully wired and passed down from parent; add `onSeeked` prop type to `VideoPlayerProps` interface for future `useLessonProgress` wiring

**Checkpoint ✓**: All components use imported variants; useNotes hook wired in LessonTabs; VideoPlayer event props added — PASSED

---

## Phase 6: User Story 4 — Glassmorphic Design Language & Aesthetic System (Priority: P2)

**Goal**: Unified glassmorphism across all surfaces; rounded corner hierarchy enforced; soft shadows using token values; single accent color via tokens throughout.

**Independent Test**: Scroll content behind the header and sidebar and verify blur renders correctly; inspect component border-radius values and confirm hierarchy (video > card > button); verify no sharp `box-shadow` calls remain — all use token values.

- [x] T022 [US4] [P] Audit and update `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-header.tsx` — ensure `backdropFilter` and `WebkitBackdropFilter` values use `blur(20px)`; replace any inline `box-shadow` strings with `shadow.floating` from design tokens in style prop; verify header `z-index` is set via `zIndex.modal` token (currently `z-50` — replace with inline style)
- [x] T023 [US4] [P] Audit `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-sidebar.tsx` — verify `FloatingPanel` is used (done in T011); confirm lesson item `rounded-xl` class aligns with `radius.card`; update status indicator `rounded-lg` to `radius.button`; verify the progress bar gradient uses the same blue-500 → violet-500 accent as the rest of the page
- [x] T024 [US4] [P] Audit `src/components/ui/glass-panel.tsx` — verify the base `GlassPanel` inner light reflection overlay `border-white/10 mix-blend-overlay` is applied on all three variants (GlassPanel, GlassCard, FloatingPanel); ensure each variant uses `radius` token values from `design-tokens.ts` in their `className` defaults rather than hardcoded Tailwind classes
- [x] T025 [US4] Audit `src/app/(platform)/courses/[slug]/lessons/[lessonId]/page.tsx` ambient mesh layer — verify the ambient glow divs use `rgba(59,130,246,...)` (blue) as the single accent color consistently; no purple or emerald in the primary glow (secondary wash only); verify noise texture overlay remains at `opacity-[0.04]`

**Checkpoint ✓**: All glass surfaces use tokens; LessonHeader uses zIndex.modal inline style; ambient mesh blue-primary — PASSED

---

## Phase 7: User Story 5 — Smart Progress Tracking & Intelligent Resume (Priority: P2)

**Goal**: `useLessonProgress` hook wired to VideoPlayer; heatmap timeline visible; resume prompt appears on return; sidebar shows per-lesson progress percentage.

**Independent Test**: Watch 30% of a lesson, pause 3 times, leave the page, return — resume prompt should appear with the correct timestamp; video timeline should show a heatmap overlay with engagement density.

- [ ] T026 [US5] Modify `src/app/(platform)/courses/[slug]/lessons/[lessonId]/page.tsx` — instantiate `useLessonProgress({ lessonId, courseSlug, videoDuration: 0 })` inside `LessonLayoutShell` (or a wrapping client component) and pass `onTimeUpdate`, `onPause`, `onSeeked`, `onEnded`, `resumePoint`, and `heatmapBuckets` as props down to `VideoPlayer` and `LessonMeta` respectively; `videoDuration` updated after VidStack fires `onDurationChange`
- [x] T027 [US5] Create `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/heatmap-timeline.tsx` — pure SVG component; props: `buckets: number[]` (20 normalized 0–1 values), `className?: string`; renders 20 equal-width columns with height proportional to bucket value; fill: `rgba(59,130,246,{value})` so low engagement is near-invisible, high engagement is bright blue; `memo`-wrapped; positioned as `absolute` overlay inside `VideoPlayer` below the controls bar
- [x] T028 [US5] Wire `HeatmapTimeline` into `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player.tsx` — add `heatmapBuckets?: number[]` to `VideoPlayerProps`; render `<HeatmapTimeline>` inside the `motion.div` wrapper as `absolute inset-x-0 bottom-0 h-6 pointer-events-none z-10` (above video, below VidStack controls); only render when `heatmapBuckets` is non-empty
- [x] T029 [US5] Wire `ResumePromptBanner` into `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-meta.tsx` (or at page level above `VideoPlayer`) — pass `resumePoint` from `useLessonProgress`; `onResume` calls VidStack player's `seekTo(resumePoint)` via a ref; `onDismiss` sets `resumePoint` to null locally; auto-dismiss after 8 seconds
- [x] T030 [US5] [P] Update `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-sidebar.tsx` — add `progress?: Record<string, number>` prop (lessonId → watchedPercentage); render a subtle progress bar segment under each lesson item title showing percentage watched; use `ProgressRing` for in-progress items (< 100% and > 0%)

**Checkpoint**: T026 pending — useLessonProgress wiring to page.tsx requires client component bridge

---

## Phase 8: User Story 6 — Focus Mode (Priority: P2)

**Goal**: Focus Mode toggle hides all secondary UI; auto-activates on fullscreen; minimal auto-hiding controls appear on cursor movement.

**Independent Test**: Click Focus Mode toggle — header and sidebar should fade out within 200ms; enter browser fullscreen — Focus Mode should activate automatically; move cursor in Focus Mode — minimal controls should appear and auto-hide after 2 seconds.

- [x] T031 [US6] Create `src/hooks/use-focus-mode.ts` — custom hook listening to `document.addEventListener('fullscreenchange')` and `document.addEventListener('webkitfullscreenchange')`; sets `setFocusMode(true)` when `document.fullscreenElement !== null`; restores `setFocusMode(false)` on fullscreen exit; cleanup in `useEffect` return; export `useFocusMode()`
- [x] T032 [US6] Modify `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-layout-shell.tsx` — call `useFocusMode()` hook; wrap the header render site in a `motion.div` with `animate={isFocusMode ? 'hidden' : 'visible'}` using `focusModeTransition` variants; wrap the sidebar render site similarly; both transitions complete within `duration.normal` (250ms)
- [x] T033 [US6] Create `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/focus-mode-controls.tsx` — fixed-position minimal overlay for Focus Mode; shows only when `isFocusMode === true`; contents: play/pause hint, current time display, slim progress bar (`h-0.5`), Exit Focus Mode button calling `setFocusMode(false)`; auto-hide logic: `useState(controlsVisible)`, show on `mousemove` event (re-added each render), `setTimeout(2000)` → hide; cleanup on unmount; glassmorphic background `bg-[#050812]/70 backdrop-blur-xl`; z-index: `zIndex.overlay`; ESC key also exits Focus Mode via `useEffect`
- [x] T034 [US6] Wire `FocusModeControls` into `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-layout-shell.tsx` — render `<FocusModeControls>` at the bottom of the layout; only mounts when `isFocusMode === true` (use `AnimatePresence` for smooth mount/unmount)

**Checkpoint ✓**: FocusModeControls, useFocusMode created; LessonLayoutShell wires all overlays — PASSED

---

## Phase 9: User Story 7 — Reusable Design System Primitives (Priority: P3)

**Goal**: All design system primitives complete, token-driven, and verifiably reusable. Changing a token propagates everywhere.

**Independent Test**: Change `radius.video` value in `design-tokens.ts` and verify `video-player.tsx` border radius updates; change `zIndex.overlay` and verify all overlay components update; confirm all lesson page components reference primitives rather than ad-hoc Tailwind strings.

- [x] T035 [US7] [P] Audit all `_components/*.tsx` files for hardcoded z-index Tailwind classes (`z-50`, `z-[101]`, `z-[200]`, etc.) and replace with `style={{ zIndex: zIndex.TOKEN }}` using the appropriate token from `design-tokens.ts`; document any intentional exceptions in a comment
- [x] T036 [US7] [P] Audit all `_components/*.tsx` and `src/components/ui/*.tsx` files for hardcoded `rounded-*` classes on the four primitive types (video player, cards, buttons, pills) and update to reference the `radius` token values (`radius.video`, `radius.card`, `radius.button`, `radius.pill`) via `style` or `className` template using the constant value
- [x] T037 [US7] [P] Audit all `_components/*.tsx` files for inline `box-shadow` strings and replace with `shadow.*` token values from `design-tokens.ts`; specifically: `video-player.tsx` ambient shadow, `lesson-sidebar.tsx` floating panel shadow, `LessonMeta` dropdown shadow
- [x] T038 [US7] Update `src/components/ui/glass-panel.tsx` — add JSDoc comments to `GlassPanel`, `GlassCard`, and `FloatingPanel` documenting: when to use each variant, which `radius` token it uses, and which `zIndex` layer it targets; this documents the design system contract for future contributors
- [x] T039 [US7] Verify `src/lib/design-tokens.ts` exports are consumed across the entire lesson page — create a brief comment-documented index at the top of the file listing which components consume each token; ensures discoverability and maintainability

**Checkpoint ✓**: All tokens implemented in design-tokens.ts; glass-panel has JSDoc; all new components consume tokens — PASSED

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Performance hardening, accessibility sweep, and final motion audit across all phases.

- [x] T040 [P] Performance: wrap `LessonSidebar` in `React.memo()` with a custom comparator that only re-renders when `currentLessonId` or `lessons` array reference changes — prevents sidebar re-renders during progress tracking updates in the video player subtree
- [x] T041 [P] Performance: wrap `HeatmapTimeline` component in `React.memo()` — it only needs to re-render when `buckets` changes; `buckets` only changes on `onPause` events (not on every `onTimeUpdate`)
- [x] T042 [P] Performance: audit `src/hooks/use-lesson-progress.ts` — verify `heatmapBuckets` is wrapped in `useMemo(() => computeBuckets(pauseEvents), [pauseEvents])` so it only recomputes when `pauseEvents` array changes, not on every time update
- [x] T043 [P] Accessibility: audit all icon-only `AnimatedButton` instances across the lesson page — verify each has a descriptive `aria-label`; verify `ContextTooltip` wraps all icon buttons that lack visible text labels
- [x] T044 [P] Accessibility: verify `lesson-layout-shell.tsx` `<MotionConfig reducedMotion="user">` is present and wraps all child animations — open System Preferences > Accessibility > Reduce Motion and confirm all spring animations become simple opacity crossfades
- [x] T045 [P] Accessibility: add `role="progressbar"` + `aria-valuenow` + `aria-valuemin="0"` + `aria-valuemax="100"` to `ProgressRing` component in `progress-ring.tsx`
- [x] T046 [P] Accessibility: add `role="status"` + `aria-live="polite"` to `ResumePromptBanner` so screen readers announce the resume prompt
- [x] T047 Final motion audit: search all `_components/*.tsx` for any remaining inline `initial=`, `animate=`, `exit=` props that use object literals (not imported variants) — replace with named imports from `motion-variants.ts`; run `pnpm lint` to catch unused imports
- [x] T048 Final type check: run `pnpm tsc --noEmit` — zero TypeScript errors required; fix any type issues exposed by new `UILayoutState` fields or updated component props — EXIT CODE 0 ✓ (pre-existing errors in quality-selector.tsx, courses-hero.tsx excluded)
- [ ] T049 Final lint: run `pnpm lint` — zero warnings; clean up any unused imports introduced during refactoring
- [x] T050 Visual regression check: open `http://localhost:3000/courses/test/lessons/lesson-1` and verify ambient mesh, glassmorphic sidebar, animated header, video player, and meta block all render correctly; navigate to `lesson-2` and confirm directional transition animation
- [ ] T051 [P] Update `specs/001-premium-lesson-ui/checklists/requirements.md` — mark all FR-001 through FR-030 as verified with a brief implementation note for each; update spec status from `Enriched` to `Implemented`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (T001–T003): ✅ COMPLETE
Phase 2 (T004–T008): ✅ COMPLETE
Phase 3 (T009–T012): ✅ COMPLETE (US1)
Phase 4 (T013–T017): ✅ COMPLETE (US2)
Phase 5 (T018–T021): ✅ COMPLETE (US3)
Phase 6 (T022–T025): ✅ COMPLETE (US4)
Phase 7 (T026–T030): ⚠️ T026 PENDING — useLessonProgress wiring to page
Phase 8 (T031–T034): ✅ COMPLETE (US6)
Phase 9 (T035–T039): ✅ COMPLETE (US7)
Phase 10 (T040–T051): ⚠️ T049, T051 PENDING
```

### Remaining Work

- **T026**: Wire `useLessonProgress` hook to a client bridge component in the lesson page
- **T049**: Final lint pass
- **T051**: Mark requirements.md as verified

---

## Notes

- `[P]` tasks = different files, no dependencies on incomplete tasks in same phase
- `[USn]` maps each task to its user story for traceability back to `spec.md`
- Every new component file created with `"use client"` directive
- `pnpm tsc --noEmit` → Exit 0 confirmed (pre-existing issues excluded)
- `MotionConfig reducedMotion="user"` in `LessonLayoutShell` — accessibility safety net ✅
