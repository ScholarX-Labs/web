# Data Model: World-Class Premium Lesson UI

**Feature**: 001-premium-lesson-ui  
**Phase**: 1 — Design & Contracts  
**Date**: 2026-04-20

---

## Entities

### 1. `LessonProgress`

Tracks per-learner, per-lesson engagement data. Stored in `localStorage` keyed as `progress:{courseSlug}:{lessonId}`.

```typescript
interface LessonProgress {
  lessonId: string;
  courseSlug: string;
  lastPosition: number;                   // seconds into video
  watchedPercentage: number;              // 0–100
  pauseEvents: number[];                  // video positions (seconds) where user paused
  seekEvents: { from: number; to: number }[]; // rewind/seek events
  highEngagementSegments: [number, number][];  // computed [startSec, endSec] tuples
  sessionStartedAt: number;               // unix ms — current session start
  completedAt: number | null;             // unix ms — null if not completed
}
```

**State Transitions**:
```
[initial] → watching → paused → watching → completed
                    ↘ abandoned (page left)
```

**Validation Rules**:
- `lastPosition` must be >= 0 and <= total video duration
- `watchedPercentage` must be 0–100
- `highEngagementSegments` are computed, never set manually
- `completedAt` is set when `watchedPercentage >= 90`

---

### 2. `UILayoutState` (Zustand — extended)

Global UI coordination state. Extends the existing `UILayoutStore`.

```typescript
interface UILayoutState {
  // Existing
  activeLayoutId: string | null;
  isDrawerOpen: boolean;

  // New additions
  isFocusMode: boolean;
  isNotesOverlayOpen: boolean;
  isResourcesSheetOpen: boolean;

  // Actions (existing)
  setActiveLayoutId: (id: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;

  // Actions (new)
  toggleFocusMode: () => void;
  setFocusMode: (active: boolean) => void;
  setNotesOverlayOpen: (open: boolean) => void;
  setResourcesSheetOpen: (open: boolean) => void;
}
```

---

### 3. `DesignToken` (static, no runtime mutation)

All design decisions encoded as typed constants.

```typescript
// src/lib/design-tokens.ts

export const zIndex = {
  base:    0,
  content: 10,
  sidebar: 20,
  overlay: 40,
  modal:   50,
  toast:   60,
} as const;

export const radius = {
  video:   '1.5rem',   // 24px — video player
  card:    '1rem',     // 16px — GlassCard, panels
  button:  '0.75rem',  // 12px — interactive controls
  pill:    '9999px',   // badges, progress rings
} as const;

export const shadow = {
  ambient: '0 0 80px -20px rgba(59,130,246,0.25)',
  elevated: '0 20px 60px -10px rgba(0,0,0,0.8)',
  floating: '0 8px 30px rgba(0,0,0,0.2)',
  inner:   'inset 0 1px 0 0 rgba(255,255,255,0.05)',
} as const;

export const duration = {
  instant: 50,
  fast:    150,
  normal:  250,
  slow:    400,
} as const;
```

---

### 4. `MotionPreset` (static variant definitions)

```typescript
// src/lib/motion-variants.ts

export const fadeSlideUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export const fadeSlideIn = {
  // Used with AnimatePresence key={lessonId} for lesson transitions
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -20 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

export const springPanel = {
  // Used for Notes/Resources/Sidebar overlay panels (spring physics)
  initial: { x: 400, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit:    { x: 400, opacity: 0 },
  transition: { type: 'spring', stiffness: 120, damping: 18 },
};

export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem = {
  hidden:  { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export const tapScale = {
  whileHover: { scale: 1.02 },
  whileTap:   { scale: 0.97 },
};

export const focusModeTransition = {
  // Secondary UI fade on focus mode activate
  visible:  { opacity: 1, pointerEvents: 'auto' },
  hidden:   { opacity: 0, pointerEvents: 'none' },
  transition: { duration: 0.2, ease: 'easeInOut' },
};
```

---

### 5. `LessonMeta` (Props contract — no runtime mutation)

The data shape flowing from `page.tsx` (Server Component) into client components.

```typescript
interface LessonData {
  id: string;
  title: string;
  duration: string;          // human-readable e.g. "18 min"
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  src: string;               // video source e.g. "youtube/_cMxraX_5RE"
  thumbnails?: string;       // VTT sprite file URL
  poster?: string;
  description?: string;
  resources?: Resource[];
}

interface Resource {
  id: string;
  type: 'pdf' | 'link' | 'video' | 'code';
  title: string;
  description: string;
  url: string;
  size?: string;
}
```

---

## Component → Entity Mapping

| Component | Entities Used | Access Pattern |
|-----------|--------------|----------------|
| `VideoPlayer` | `LessonProgress` (write), `UILayoutState.isFocusMode` (read) | `useLessonProgress()`, `useUILayoutStore()` |
| `LessonLayoutShell` | `UILayoutState` (all flags) | `useUILayoutStore()` |
| `LessonSidebar` | `UILayoutState.isDrawerOpen` | `useUILayoutStore()` |
| `LessonHeader` | `UILayoutState.isFocusMode`, `UILayoutState.toggleFocusMode` | `useUILayoutStore()` |
| `LessonMeta` | `LessonProgress` (read for resume prompt) | `useLessonProgress()` |
| `NotesPanelOverlay` | `UILayoutState.isNotesOverlayOpen` | `useUILayoutStore()` |
| `ResourcesBottomSheet` | `UILayoutState.isResourcesSheetOpen` | `useUILayoutStore()` |
| `GlassCard` / `GlassPanel` / `AnimatedButton` | `DesignToken` | Static import |
