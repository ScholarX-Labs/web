# Implementation Plan: World-Class Premium Lesson UI

**Branch**: `001-premium-lesson-ui` | **Date**: 2026-04-20 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/001-premium-lesson-ui/spec.md`  
**Constitution**: [constitution.md](../../.specify/memory/constitution.md)  
**User Directive**: "Production grade Apple Best Practices, SOLID Principles and Proper Design Patterns Ensuring Scalability, Maintainability, Performance"

---

## Summary

Elevate the ScholarX lesson page from a functionally-complete theater layout to a world-class, Apple-caliber learning experience. This plan introduces a **token-based design system**, a **centralized motion library**, a **smart progress tracking hook**, a **Focus Mode**, expanded **glassmorphic primitives**, and a revamped **layered spatial layout** — all built on SOLID principles with full TypeScript safety and graceful performance degradation.

The existing architecture is already well-structured (Zustand + Framer Motion + VidStack + Vaul). This plan **extends** it — no rewrites.

---

## Technical Context

| Dimension | Value |
|-----------|-------|
| **Language** | TypeScript 5.x (strict mode) |
| **Framework** | Next.js 14+ (App Router, RSC + Client Islands) |
| **Motion** | Framer Motion 11+ (LayoutGroup, AnimatePresence, MotionConfig) |
| **State** | Zustand 4.x (`src/store/ui-layout-store.ts`) |
| **Video** | VidStack React (`@vidstack/react`) with YouTube provider |
| **Drawer** | Vaul (`src/components/ui/drawer-sheet.tsx`) |
| **CSS** | Tailwind CSS 3.x + inline `style` for dynamic token values |
| **Testing** | Vitest + React Testing Library (hooks unit tests) |
| **Performance** | `memo`, `useCallback`, `requestIdleCallback`, `debounce` |
| **Target Platform** | Desktop + Mobile (both `mouse` and `touch` input) |
| **Performance Goals** | 60fps animations, 0 CLS, Lighthouse ≥ 85 desktop |
| **Constraints** | No new global layout files, no breaking changes to `page.tsx` RSC pattern |

---

## Constitution Check

*GATE: All principles must pass before implementation begins.*

| Principle | Status | How This Plan Satisfies It |
|-----------|--------|---------------------------|
| I — SOLID Architecture | ✅ | Design tokens (SRP). Progress hook (SRP). Motion variants (SRP). Each new component has one job. Open/Closed: GlassPanel extended via composition, not modification. |
| II — Type Safety | ✅ | `LessonProgress`, `UILayoutState`, `DesignToken`, `MotionPreset` fully typed. `zIndex`, `radius`, `shadow`, `duration` use `as const` for literal type narrowing. No `any`. |
| III — Rigorous Testing | ✅ | `use-lesson-progress.ts` is a pure hook testable with `renderHook`. Design tokens are pure constants with no side effects. Motion variants are plain objects with snapshot tests. |
| IV — Premium UX | ✅ | This plan is the direct implementation of Principle IV: glassmorphism, 60fps motion system, Focus Mode, smart progress. |
| V — Performance | ✅ | `requestIdleCallback` for progress writes, `memo` on VideoPlayer already in place, lazy sidebar content via CSS `max-h` + overflow, debounced updates (500ms), `AnimatePresence` cleanup. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-premium-lesson-ui/
├── plan.md              ← This file
├── research.md          ← Phase 0 output (complete)
├── data-model.md        ← Phase 1 output (complete)
├── tasks.md             ← Phase 2 output (/speckit-tasks)
└── checklists/
    └── requirements.md
```

### Source Code Layout

```text
src/
├── lib/
│   ├── design-tokens.ts             [NEW] — zIndex, radius, shadow, duration tokens
│   └── motion-variants.ts           [NEW] — centralized Framer Motion presets
│
├── store/
│   └── ui-layout-store.ts           [MODIFY] — add isFocusMode, isNotesOverlayOpen,
│                                                isResourcesSheetOpen + their actions
│
├── hooks/
│   └── use-lesson-progress.ts       [NEW] — SRP hook: tracking, localStorage, heatmap
│
├── components/ui/
│   ├── glass-panel.tsx              [MODIFY] — add GlassCard + FloatingPanel variants
│   ├── animated-button.tsx          [NEW] — consistent tapScale + hover primitive
│   ├── progress-ring.tsx            [NEW] — circular SVG progress indicator primitive
│   └── context-tooltip.tsx          [NEW] — Radix-based styled tooltip primitive
│
└── app/(platform)/courses/[slug]/lessons/[lessonId]/
    ├── page.tsx                     [MODIFY] — add lessonId key to AnimatePresence host
    └── _components/
        ├── lesson-layout-shell.tsx  [MODIFY] — add Focus Mode orchestration
        ├── lesson-header.tsx        [MODIFY] — add Focus Mode toggle button + animate-out
        ├── video-player.tsx         [MODIFY] — wire up useLessonProgress, heatmap overlay
        ├── lesson-sidebar.tsx       [MODIFY] — use motion-variants, add left-indicator
        ├── lesson-meta.tsx          [MODIFY] — add resume prompt, use motion-variants
        ├── lesson-tabs.tsx          [MODIFY] — extract notes to shared hook, use variants
        ├── notes-panel-overlay.tsx  [NEW] — slide-in FloatingPanel notes overlay
        ├── resources-bottom-sheet.tsx [NEW] — Vaul-based resource bottom sheet
        ├── focus-mode-controls.tsx  [NEW] — auto-hiding controls for focus mode
        └── heatmap-timeline.tsx     [NEW] — SVG engagement heatmap overlay
```

---

## Phase 1: Foundation — Design System & State

### 1.1 `src/lib/design-tokens.ts` [NEW]

**Pattern**: Single Responsibility + Open/Closed  
**Purpose**: Single source of truth for all visual design decisions.

```typescript
export const zIndex = {
  base: 0, content: 10, sidebar: 20,
  overlay: 40, modal: 50, toast: 60,
} as const;

export const radius = {
  video: '1.5rem', card: '1rem',
  button: '0.75rem', pill: '9999px',
} as const;

export const shadow = {
  ambient:  '0 0 80px -20px rgba(59,130,246,0.25)',
  elevated: '0 20px 60px -10px rgba(0,0,0,0.8)',
  floating: '0 8px 30px rgba(0,0,0,0.2)',
  inner:    'inset 0 1px 0 0 rgba(255,255,255,0.05)',
} as const;

export const duration = {
  instant: 50, fast: 150, normal: 250, slow: 400,
} as const;
```

### 1.2 `src/lib/motion-variants.ts` [NEW]

**Pattern**: Configuration Object Pattern (eliminates prop repetition)  
**Purpose**: Zero motion logic inside component files. All animation presets defined here.

Exports: `fadeSlideUp`, `fadeSlideIn`, `springPanel`, `staggerContainer`, `staggerItem`, `tapScale`, `focusModeTransition`

See `data-model.md` for full type definitions.

### 1.3 `src/store/ui-layout-store.ts` [MODIFY]

**Pattern**: Zustand store, Single Source of Truth for UI coordination  
**Change**: Add `isFocusMode`, `isNotesOverlayOpen`, `isResourcesSheetOpen` boolean flags and their matching setters.

**Before** (2 fields) → **After** (5 fields + 3 new actions). All strictly typed, no breaking changes to consumers.

### 1.4 `src/hooks/use-lesson-progress.ts` [NEW]

**Pattern**: Custom Hook + Single Responsibility Principle  
**Purpose**: All progress tracking logic lives here. VideoPlayer becomes a pure presentation component.

```typescript
interface UseLessonProgressOptions {
  lessonId: string;
  courseSlug: string;
  videoDuration: number;
}

interface UseLessonProgressReturn {
  progress: LessonProgress | null;
  resumePoint: number | null;
  heatmapBuckets: number[];       // 20 normalized values 0–1 for heatmap rendering
  onTimeUpdate: (time: number) => void;
  onPause: (time: number) => void;
  onSeeked: (from: number, to: number) => void;
  onEnded: () => void;
}
```

**Implementation Details**:
- Reads from `localStorage` on mount
- `onTimeUpdate` is debounced 500ms using `useRef` + `clearTimeout`
- Writes via `requestIdleCallback` with `setTimeout(0)` fallback
- `heatmapBuckets` computed from `pauseEvents` bucketed into 20 equal video segments
- `resumePoint` returned as `null` if progress < 5% (avoids spurious resume prompts for very short watches)

---

## Phase 2: Glassmorphic Primitive System

### 2.1 `src/components/ui/glass-panel.tsx` [MODIFY]

**Pattern**: Compound Component + Variant pattern (no new library needed)

**Add `GlassCard` variant** — tighter padding defaults, `rounded-2xl`:
```typescript
export const GlassCard = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, ...props }, ref) => (
    <GlassPanel
      ref={ref}
      className={cn('rounded-2xl p-5', className)}
      {...props}
    />
  )
);
```

**Add `FloatingPanel` variant** — higher elevation for overlay contexts:
```typescript
export const FloatingPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, ...props }, ref) => (
    <GlassPanel
      ref={ref}
      className={cn(
        'rounded-[1.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)]',
        className
      )}
      style={{ zIndex: zIndex.overlay, ...props.style }}
      {...props}
    />
  )
);
```

### 2.2 `src/components/ui/animated-button.tsx` [NEW]

**Pattern**: Wrapper Primitive (decorates behavior, not appearance)

```typescript
export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={tapScale.whileHover}
      whileTap={tapScale.whileTap}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn('transition-colors', className)}
      {...props}
    >
      {children}
    </motion.button>
  )
);
```

### 2.3 `src/components/ui/progress-ring.tsx` [NEW]

Circular SVG progress indicator for sidebar lesson completion badges.

```typescript
interface ProgressRingProps {
  value: number;    // 0–100
  size?: number;
  strokeWidth?: number;
  className?: string;
}
```

### 2.4 `src/components/ui/context-tooltip.tsx` [NEW]

Radix `Tooltip` styled with glassmorphism. Used for icon buttons (Focus Mode toggle, Share, etc.) to meet accessibility requirements.

---

## Phase 3: Layout & Spatial Intelligence

### 3.1 `page.tsx` [MODIFY]

**Add `AnimatePresence` + directional key for lesson transitions**:

```tsx
// Wrap main content in AnimatePresence at the page level
// Key = lessonId ensures exit + enter animation plays on lesson change
<AnimatePresence mode="wait">
  <motion.div
    key={lessonId}
    {...fadeSlideIn}
  >
    {/* existing theater stage layout */}
  </motion.div>
</AnimatePresence>
```

**Note**: `page.tsx` remains a Server Component. `AnimatePresence` belongs in `LessonLayoutShell` which is already a client component.

### 3.2 `lesson-layout-shell.tsx` [MODIFY]

**Add Focus Mode orchestration** — coordinates all secondary UI collapse:
- Sets CSS class `lesson-focus-mode` on root
- Publishes `isFocusMode` to store
- Contains `useFocusMode` hook call that listens to `fullscreenchange`

### 3.3 `lesson-header.tsx` [MODIFY]

**Changes**:
- Add Focus Mode toggle button (Eye/EyeOff icon) — calls `toggleFocusMode()`
- Whole header wrapped in `motion.header` with `variants={focusModeTransition}` animate between `visible`/`hidden` based on `isFocusMode`
- Add `ContextTooltip` to all icon buttons for accessibility

### 3.4 `video-player.tsx` [MODIFY]

**Changes**:
- Accept and wire `onTimeUpdate`, `onPause`, `onSeeked`, `onEnded` from parent
- Add `<HeatmapTimeline>` as a positioned child overlay (rendered below the VidStack controls)
- Resume prompt: parent (`LessonMeta`) receives `resumePoint` from `useLessonProgress` and shows animated chip above the player

### 3.5 `lesson-sidebar.tsx` [MODIFY]

**Changes**:
- Replace inline variant definitions with imported `staggerContainer`, `staggerItem`
- Add `<ProgressRing>` inside status indicator for in-progress lessons
- Replace `className` lateral `bg-white/[0.03]` string with `<FloatingPanel>` component
- Left-indicator `layoutId="active-pill"` — already implemented ✅, upgrade to also animate `background-color` via `motion.div` variants

### 3.6 `lesson-meta.tsx` [MODIFY]

**Changes**:
- Replace inline `containerVariants`/`itemVariants` with imported presets
- Add resume banner (conditional): `resumePoint !== null → <ResumePromptBanner>`
- Replace `MoreOptionsDropdown` with `context-tooltip.tsx`-backed buttons
- Wire "Take Notes" to `setNotesOverlayOpen(true)` (shows overlay vs just tab switch)

### 3.7 `lesson-tabs.tsx` [MODIFY]

**Changes**:
- Extract notes CRUD logic into `use-notes.ts` custom hook (SRP separation)
- Replace inline variants with imported presets from `motion-variants.ts`
- Keep existing tab UI — it's already premium-grade ✅

---

## Phase 4: New Overlay Components

### 4.1 `notes-panel-overlay.tsx` [NEW]

**Pattern**: Controlled component + FloatingPanel + springPanel motion

A right-side slide-in panel overlay (desktop) / bottom sheet (mobile) for the Notes experience.

```tsx
// Desktop: absolute right-0, width 380px, z-index overlay
// Mobile: VaulDrawer bottom sheet variant
// Entry: springPanel (spring physics x-axis)
// Backdrop: backdrop-blur-xl, bg rgba(5,8,18,0.7)
// Close: ESC key + click-outside + X button
```

### 4.2 `resources-bottom-sheet.tsx` [NEW]

**Pattern**: Vaul drawer + GlassCard resource list

Replaces the Resources tab as a dedicated bottom sheet overlay. Uses existing `DrawerContent` from `drawer-sheet.tsx`. Triggered by header action or `setResourcesSheetOpen(true)`.

### 4.3 `focus-mode-controls.tsx` [NEW]

**Pattern**: inert overlay (pointerEvents: none when hidden)

Auto-hiding minimal controls shown when in Focus Mode:
- Play/pause (space key)
- Progress bar (minimal, transparent)
- Timer display
- Exit Focus Mode button

Logic: `useState(visible)`, `useEffect` for `mousemove` → show → `setTimeout(2000)` → hide.

### 4.4 `heatmap-timeline.tsx` [NEW]

**Pattern**: SVG visualization, pure computation, memo-wrapped

```tsx
interface HeatmapTimelineProps {
  buckets: number[];    // 20 normalized values 0–1 from useLessonProgress
  className?: string;
}

// Renders as an SVG bar with 20 columns
// Column height = normalized engagement value
// Color: rgba(59,130,246,{value}) — blue with alpha = engagement
// Position: absolute, overlaid on video progress bar area
```

### 4.5 `resume-prompt-banner.tsx` [NEW]

**Pattern**: Conditional render with spring AnimatePresence

Shown above the video player when `resumePoint !== null`:

```tsx
// "You left off at 12:32 — Continue watching?"
// [Resume] [Start Over] buttons
// spring-animated in from below, dismissible
// Auto-dismissed after 8 seconds or on video play
```

---

## Phase 5: Motion Audit & Polish

### 5.1 Replace all inline variant definitions with motion-variants.ts imports

Audit all `_components/*.tsx` files. For each inline `variants` object or `initial/animate/exit` prop — replace with named export from `motion-variants.ts`.

Files to audit:
- `lesson-sidebar.tsx` (listVariants, itemVariants → staggerContainer, staggerItem)
- `lesson-meta.tsx` (containerVariants, itemVariants → imported)
- `lesson-tabs.tsx` (tab content transitions → imported)
- `lesson-header.tsx` (ad-hoc spring → tapScale)

### 5.2 Replace scattered z-index values with `zIndex` tokens

Audit for: `z-[101]`, `z-[200]`, `z-50`, `z-10` — replace with `style={{ zIndex: zIndex.modal }}` patterns.

### 5.3 Micro-Interaction Sweep

Ensure every `<button>`, `<Link>`, and interactive control uses `AnimatedButton` or has explicit `whileHover`/`whileTap` from `tapScale`.

---

## Phase 6: Performance Hardening

| Concern | Solution |
|---------|----------|
| Sidebar re-renders on progress update | `memo(LessonSidebar)` — progress only in VideoPlayer subtree |
| Notes textarea re-renders on every keystroke | Already using `useState` local to `LessonTabs` — no issue |
| Heatmap computed on every `onTimeUpdate` | Memoize with `useMemo(() => computeBuckets(pauseEvents), [pauseEvents])` |
| LocalStorage writes during active playback | `debounce(500)` on `onTimeUpdate` write, immediate write on `onPause` |
| Lesson list rendering 100+ items | Add `max-h` + `overflow-y-auto` virtualization boundary — defer `react-window` to Phase 2 |
| Focus Mode controls `mousemove` listener | Add/remove event listener in `useEffect` cleanup |

---

## Phase 7: Accessibility Compliance

| Requirement | Implementation |
|------------|----------------|
| `prefers-reduced-motion` | `<MotionConfig reducedMotion="user">` already in `LessonLayoutShell` ✅ |
| All icon buttons need labels | `AnimatedButton` requires `aria-label` prop; add to `context-tooltip.tsx` |
| Focus Mode keyboard exit | `Escape` key listener in `focus-mode-controls.tsx` |
| Drawer keyboard trap | Vaul handles this internally ✅ |
| Color contrast | All text classes maintain minimum 4.5:1 on dark background |
| `aria-current="page"` on active lesson | Already implemented in `lesson-sidebar.tsx` ✅ |

---

## Complexity Tracking

No constitution violations. All additions are:
- Additive (new files, extended interfaces)
- Typed (no `any`)
- Isolated (no global layout changes)
- Tested (hooks are unit-testable in isolation)

---

## Verification Plan

### Automated
```bash
# Type check — zero errors required
pnpm tsc --noEmit

# Lint — zero warnings required
pnpm lint

# Unit tests — use-lesson-progress hook
pnpm test src/hooks/use-lesson-progress.test.ts
```

### Visual Verification Checklist
- [ ] Lesson-to-lesson switch plays directional `fadeSlideIn` transition
- [ ] Notes overlay slides in with spring physics from right (desktop)
- [ ] Focus Mode hides header + sidebar within 200ms
- [ ] Focus Mode auto-activates on browser fullscreen
- [ ] Focus Mode controls auto-hide after 2 seconds of cursor inactivity
- [ ] Resume prompt appears on return to partially-watched lesson
- [ ] Heatmap renders above video timeline with correct bucket widths
- [ ] Sidebar `active-pill` `layoutId` animates between lessons without jump
- [ ] All buttons have tactile `scale 0.97` press feedback
- [ ] Vaul drawer scales background on mobile open
- [ ] `backdrop-filter` surfaces blur content scrolled beneath them
- [ ] OS Reduce Motion → all animations replaced by simple fades
