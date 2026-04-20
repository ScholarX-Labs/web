# Implementation Plan: Premium Lesson UI Redesign

**Feature**: 001-premium-lesson-ui
**Branch**: `001-premium-lesson-ui`
**Status**: Core Architecture Planned

## Technical Context

We are implementing an "Apple-perfect" glassmorphism UI for our Lesson pages in Next.js. We will use Framer Motion for `layoutId` object transitions and Vaul for Bottom Sheet drawers. State will be managed by Zustand to sync the expanded/collapsed state of interactive widgets without causing React Context re-render bloat.

### Constitution Check
- **Principle I (SOLID/Architecture)**: UI elements are decoupled. We will implement `InteractiveWidget` components that abstract the Framer Motion layout mechanics, adhering to the Single Responsibility Principle.
- **Principle II (Type Safety)**: Zustand stores and Framer Motion prop interfaces will be strictly typed in TypeScript.
- **Principle III (Testing)**: Unit tests for the Zustand store. Visual verification for animations.
- **Principle IV (Premium UX)**: Direct alignment with the feature goal (Glassmorphism, 60fps physics-based animations).
- **Principle V (Performance)**: We constrain client-heavy libraries to designated "use client" islands while keeping `page.tsx` as a Server Component.

## Phase 1: Data Model & Contracts (Completed)
- `data-model.md` details the Zustand UI State Store (`activeWidgetId`, `drawerOpen`).
- No external API contracts are modified for this frontend-only task.

## Phase 2: Component Architecture Outline

1. **State Store (`src/store/ui-layout-store.ts`)**:
   - Manages global state of active widgets and drawer visibility.

2. **Feature Shell (`src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-interactive-layout.tsx`)**:
   - Wraps the static lesson blocks.
   - Provides `AnimatePresence` and `LayoutGroup` from Framer Motion.

3. **Vaul Wrapper (`src/components/ui/drawer-sheet.tsx`)**:
   - Pre-configured Vaul drawer with background-scaling (`shouldScaleBackground`) and custom Apple-style drag handles.

4. **Glassmorphic Primitives (`src/components/ui/glass-panel.tsx`)**:
   - Reusable `div` wrappers abstracting Tailwind class string complexities (`backdrop-blur-3xl bg-white/10 dark:bg-black/30 border border-white/20 shadow-2xl`).

## Phase 3: Execution Strategy

- Refactor `lesson-sidebar.tsx` to conditionally render inside a `Vaul` drawer on mobile.
- Refactor `video-player.tsx` to act as a `layoutId` interactive component capable of expanding when initiated.
