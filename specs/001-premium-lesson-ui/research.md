# Research: World-Class Premium Lesson UI

**Feature**: 001-premium-lesson-ui  
**Phase**: 0 — Pre-Design Research  
**Date**: 2026-04-20

---

## 1. Layout Architecture: 3-Layer Z-Index System

**Decision**: Introduce a formal elevation token file (`design-tokens.ts`) exporting `zIndex`, `spacing`, `radius`, and `shadow` token maps. All components consume tokens — zero hardcoded z-index values.

**Rationale**: Currently, the codebase has z-index values scattered as literal Tailwind classes (`z-[101]`, `z-[200]`, `z-50`). This causes collision risk and is impossible to reason about at a glance. A single source-of-truth token file solves this definitively.

**Alternatives Considered**:
- CSS custom properties (`--z-modal: 50`) — rejected because TypeScript token map allows IDE autocomplete, type errors on invalid keys, and is framework-agnostic.
- Tailwind `theme.extend.zIndex` — viable supplement, but the base token map must exist for use in dynamic styles.

**Token Map (resolved)**:
```
zIndex.base     = 0
zIndex.content  = 10
zIndex.sidebar  = 20
zIndex.overlay  = 40
zIndex.modal    = 50
zIndex.toast    = 60
```

---

## 2. Motion System: Framer Motion Best Practices

**Decision**: Centralize all animation variants and transition presets into `src/lib/motion-variants.ts`. Components import named presets; they do not define inline `initial/animate/transition` objects.

**Rationale**: Currently `lesson-sidebar.tsx`, `lesson-meta.tsx`, `lesson-tabs.tsx`, and `video-player.tsx` each define their own variant objects (`containerVariants`, `itemVariants`, `listVariants`). This is duplicated and inconsistent — some use `spring`, some use `easeOut`, with different stiffness/damping values. Centralizing creates a design system for motion.

**Presets (resolved)**:
- `fadeSlideUp` — entry for metadata blocks: `opacity: 0 → 1, y: 20 → 0`, spring `stiffness: 300, damping: 24`
- `fadeSlideIn` — lesson-to-lesson page transition: directional, uses `AnimatePresence` key on `lessonId`
- `springPanel` — notes/resources/sidebar overlay: `spring stiffness: 120, damping: 18`, overshoots for physicality
- `staggerContainer` — wraps lists with `staggerChildren: 0.05`
- `staggerItem` — child of stagger: `opacity: 0 → 1, x: 12 → 0`
- `tapScale` — button press: `whileTap: { scale: 0.97 }`, `whileHover: { scale: 1.02 }`

**Reduced Motion**: `LessonLayoutShell` already uses `<MotionConfig reducedMotion="user">` — this is the correct pattern. All variants respect it automatically.

---

## 3. Smart Progress Tracking Architecture

**Decision**: Introduce `use-lesson-progress.ts` — a custom hook encapsulating all progress tracking domain logic. It uses `localStorage` as the persistence layer with a debounced write, and exposes a typed `LessonProgress` state. The hook is the **Single Responsibility** boundary for all tracking concerns.

**Rationale**: Progress tracking is non-trivial: it needs debouncing (avoid writes every 100ms), pause/rewind detection (accumulate events), and a heatmap computation. Embedding this in the `VideoPlayer` component violates SRP. A dedicated hook allows unit testing in isolation.

**Data structure (resolved)**:
```typescript
interface LessonProgress {
  lessonId: string;
  lastPosition: number;        // seconds
  watchedPercentage: number;   // 0-100
  pauseEvents: number[];       // timestamps of pause events (seconds)
  highEngagementSegments: [number, number][]; // [start, end] tuples
  completedAt?: number;        // unix ms
}
```

**Persistence**: `localStorage.setItem('progress:${courseSlug}:${lessonId}', JSON.stringify(...))` with `requestIdleCallback` fallback to `setTimeout(0)`. No backend needed for Phase 1.

**Alternatives Considered**:
- Zustand slice — rejected. Progress data is lesson-specific and ephemeral during session; global store introduces unnecessary breadth. LocalStorage–only hook is simpler and testable.
- Server-side persistence — out of scope per spec (FR noted as frontend-first with graceful degradation).

---

## 4. Focus Mode Implementation

**Decision**: Add `isFocusMode: boolean` and `toggleFocusMode: () => void` to `UILayoutStore`. Focus Mode:
1. Hides sidebar + lesson-meta via CSS `opacity-0 pointer-events-none` animated through Framer Motion.
2. Auto-activates on `fullscreenchange` event via a `use-focus-mode.ts` custom hook.
3. Auto-hides controls via a 2-second `setTimeout` that resets on `mousemove`.

**Rationale**: Focus Mode touches multiple components. Placing the boolean in the existing Zustand store keeps it as a single coordination point — exactly aligned with the store's current purpose (`activeLayoutId`, `isDrawerOpen`). No new state management library needed.

---

## 5. Design Token Architecture

**Decision**: Create `src/lib/design-tokens.ts` exporting:
- `zIndex` — elevation layers
- `radius` — component-category corner radii (`video: '1.5rem'`, `card: '1rem'`, `button: '0.75rem'`)
- `shadow` — depth semantic names (`elevated`, `floating`, `ambient`)
- `duration` — animation speed budget (`instant: 50ms`, `fast: 150ms`, `normal: 250ms`, `slow: 400ms`)

**Rationale**: Tailwind class strings like `rounded-2xl` and `shadow-[0_8px_30px...]` are scattered with no consistency guarantee. Tokens serve as the authoritative source that both Tailwind config and dynamic style objects consume.

**Pattern**: Tokens used directly in `style={}` for dynamic values; Tailwind `theme.extend` for static utility generation.

---

## 6. Glassmorphism Primitive: `GlassCard` vs `GlassPanel`

**Decision**: Rename `GlassPanel` → keep as-is but add `GlassCard` sub-variant with tighter padding and `rounded-2xl` default. Add `FloatingPanel` (higher elevation, larger shadow) for overlay use cases. Add `AnimatedButton` wrapper for consistent `tapScale` + hover.

**Rationale**: `GlassPanel` exists but lacks a coherent variant system. Components currently re-implement glassmorphism ad-hoc (`lesson-sidebar.tsx` line 184: inline `bg-white/[0.03] backdrop-blur-[40px]...`). Extracting to named variants eliminates this.

---

## 7. Notes Panel: Slide-in Overlay vs Tab

**Decision**: Notes remain in `LessonTabs` as a tab for desktop, AND get a floating slide-in variant activated through the "Take Notes" action in the `MoreOptionsDropdown`. The `NotesPanelOverlay` is a `FloatingPanel` positioned absolutely over the right side of the content area on desktop (spring-animated).

**Rationale**: The spec requires notes to "appear only on interaction" and "slide in, not page switch." The tab already handles desktop. The overlay pattern adds the missing mobile/contextual trigger path without breaking the existing tab UX.

---

## 8. Video Timeline Heatmap

**Decision**: Render a custom SVG heatmap bar overlaid on the VidStack player's progress bar area using a `useEffect + requestAnimationFrame` update cycle. The heatmap is computed from `LessonProgress.pauseEvents` bucketed into 20 equal segments.

**Rationale**: VidStack's `MediaPlayer` emits `onTimeUpdate`, `onPause`, `onSeeked` events which feed into the progress hook. The overlay approach avoids patching VidStack internals.

**Alternatives Considered**:
- VidStack `slots` API — limited to replacing control components, not overlaying on timeline.
- CSS gradient background on existing progress bar — insufficient visual fidelity; does not show per-segment density.

---

## 9. Existing Patterns Preserved

The following existing patterns are **correct** and will be retained:
- `MotionConfig reducedMotion="user"` in `LessonLayoutShell` — correct accessibility approach
- `LayoutGroup` wrapping whole layout — enables `layoutId` transitions between panels
- Zustand store pattern in `src/store/` — extend rather than replace
- VidStack `MediaPlayer` with YouTbe provider — extend with event handlers
- `localStorage` note persistence in `LessonTabs` — good pattern, move to dedicated hook
- Vaul `shouldScaleBackground` for iOS drawer effect — retain, it's already wired

---

## 10. Constitution Alignment

| Principle | Research Decision |
|-----------|-------------------|
| I (SOLID/Architecture) | Design tokens = SRP. Progress hook = SRP. Variants file = SRP. |
| II (Type Safety) | `LessonProgress`, `DesignTokens`, `MotionPreset` — all strictly typed, no `any` |
| III (Testing) | `use-lesson-progress` hook is pure enough for `renderHook` unit tests |
| IV (Premium UX) | Motion system + glassmorphism primitives directly serve this principle |
| V (Performance) | `requestIdleCallback` for tracking, `memo` on VideoPlayer, lazy sidebar content |
