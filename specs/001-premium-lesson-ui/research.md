# Research: Premium Lesson UI Redesign

**Feature**: 001-premium-lesson-ui
**Date**: 2026-04-20

## 1. Technical Context Unknowns

### Q1: State Management for Shared Layout Transitions
- **Requirement**: Components must transition smoothly into modals using Framer Motion's `layoutId`. This requires a global understanding of what element is Currently Active.
- **Decision**: Use `zustand` for managing the `activeLessonId` or `expandedWidgetId` state globally.
- **Rationale**: Zustand is already installed in `package.json` (`zustand: ^5.0.11`), is highly performant (no react context re-render cascade), and perfectly handles state without boilerplate.
- **Alternatives**: React Context (rejected due to re-render cascade risk in heavily animated UIs).

### Q2: Client vs Server Component Boundaries
- **Requirement**: Vaul and Framer Motion are highly interactive and require DOM access, thus demanding `"use client"`.
- **Decision**: Follow the **Container/Presentational pattern** adapted for Next.js App Router. The `page.tsx` will fetch lesson data and stream it as a Server Component. The interactive shell (`LessonInteractiveLayout.tsx`), Video Player, Sidebar, and Drawers will be Client Components.
- **Rationale**: Meets Constitution Principle I (Architecture & SOLID) and Principle V (Performance). Prevents client-side bundle bloat on initial page load.

### Q3: Use of GSAP vs Framer Motion
- **Requirement**: The user prompt mentioned GSAP alongside Framer Motion and Vaul.
- **Decision**: Prioritize **Framer Motion** for 99% of interactions (especially `layoutId` shared transitions). Avoid GSAP unless an explicit timeline sequence is too complex.
- **Rationale**: Mixing GSAP and Framer Motion introduces conflicting DOM manipulation techniques and heavily impacts bundle size (Performance violation). Framer Motion solves the exact `layoutId` use case perfectly.

### Q4: Bottom Drawer Integration
- **Requirement**: Mobile-first sliding drawer via `vaul`.
- **Decision**: Introduce `vaul` drawer wrapping the `LessonSidebar` on smaller breakpoints (`md:hidden`). Use the native `Drawer.Root shouldScaleBackground` property to achieve the scale-down effect.
- **Rationale**: Explicitly aligns with User Story 2.

## Implementation Guidelines Verified
- Everything can be structured cleanly.
- Type Safety (Principle II) will be enforced across all Zustand stores and component props.
