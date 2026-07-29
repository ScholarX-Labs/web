# Implementation Plan: Interactive Entertaining Loading State

**Branch**: `019-interactive-loading-state` | **Date**: 2026-07-29 | **Spec**: [spec.md](file:///c:/Users/dell/Documents/ScholarX/V2/web/specs/019-interactive-loading-state/spec.md)  
**Input**: Feature specification from `specs/019-interactive-loading-state/spec.md`

## Summary

Build an Apple-caliber, interactive, entertaining loading state system for ScholarX that transforms long async waits (> 800ms) into productive, delighting micro-experiences. Includes context-relevant scholarship micro-trivia, dynamic multi-stage progress track, bubble-pop stress relief mini-game, Web Audio API sound chimes, and an anti-flicker 300ms delay threshold.

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 15 App Router (React 19)  
**Primary Dependencies**: Framer Motion, Tailwind CSS, Lucide Icons, Web Audio API, `navigator.vibrate`  
**Storage**: `localStorage` (user preferences via `IPreferencesRepository`), `sessionStorage` (learner loading stats via `IStatsRepository`)  
**Testing**: Vitest / React Testing Library  
**Target Platform**: Desktop & Mobile Web Browsers  
**Project Type**: Web Application UI Subsystem  
**Performance Goals**: 60 FPS animation loop, < 50ms mount latency after 300ms threshold delay  
**Constraints**: Zero external audio asset network calls; zero UI flicker on fast (< 300ms) requests  
**Scale/Scope**: Reusable domain services, state machine, hook, and UI primitives for all ScholarX loading surfaces

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Architecture & SOLID Patterns**: PASSED — Hexagonal architecture with strict layer separation: domain (contracts/application/infrastructure) isolated from React components. State machine, services, and policies in `domain/`; React bindings in `hooks/`; presentation in `components/`; utilities in `lib/`.
- **Principle II: Type Safety**: PASSED — Discriminated unions for all loading phases, branded context domain types, strict repository interfaces, no `any` types.
- **Principle III: Testing**: PASSED — Domain services, state machine reducer, and policies testable without React or DOM (pure TS). UI components tested via RTL.
- **Principle IV: Premium UX**: PASSED — Glassmorphic overlay design, Framer Motion spring micro-interactions, accessibility ARIA live regions, and `prefers-reduced-motion` compliance.
- **Principle V: Performance**: PASSED — Canvas physics engine isolated from React render cycle via `requestAnimationFrame` + `useRef`; 300ms threshold anti-flicker timer driven by the state machine.

## Project Structure

### Documentation (this feature)

```text
specs/019-interactive-loading-state/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 research findings
├── data-model.md        # Phase 1 data models & state machine
├── quickstart.md        # Component integration guide
└── contracts/
    └── loader-component-contract.md # Component & Hook API contracts
```

### Source Code

```text
src/
├── domain/
│   └── interactive-loader/
│       ├── contracts/
│       │   ├── index.ts
│       │   ├── interactive-loader.types.ts     # Discriminated unions, branded types, DTOs
│       │   ├── interactive-loader.events.ts    # Domain events (discriminated union)
│       │   ├── trivia.repository.ts            # ITriviaRepository port
│       │   ├── preferences.repository.ts       # IPreferencesRepository port
│       │   └── stats.repository.ts             # IStatsRepository port
│       ├── application/
│       │   ├── index.ts
│       │   ├── loader-state-machine.ts         # Pure reducer: State → Event → State
│       │   ├── loader-command.service.ts       # Write operations (start, complete, fail, retry)
│       │   ├── loader-query.service.ts         # Read operations (elapsed, currentStage, phase)
│       │   ├── trivia-query.service.ts         # Contextual trivia selection logic
│       │   ├── loader.mapper.ts                # Domain <-> DTO transformations
│       │   └── loader.errors.ts                # Typed error hierarchy
│       ├── factory/
│       │   ├── index.ts
│       │   └── interactive-loader-domain.factory.ts  # Composition root with DI
│       └── infrastructure/
│           ├── index.ts
│           ├── static-trivia.repository.ts     # ITriviaRepository impl (bundled JSON)
│           └── storage/
│               ├── preferences.repository.ts   # IPreferencesRepository impl (localStorage)
│               └── stats.repository.ts         # IStatsRepository impl (sessionStorage)
├── components/
│   └── interactive-loader/                     # Presentation-only React components
│       ├── InteractiveLoader.tsx               # Main overlay container (state-driven)
│       ├── TriviaOverlay.tsx                   # Micro-trivia Q&A card
│       ├── ProgressStageTrack.tsx              # Animated multi-stage milestone track
│       ├── BubblePopGame.tsx                   # Mini-game React shell (canvas ref host)
│       ├── LoaderPreferencesPanel.tsx          # Sound/haptic/game mode toggles
│       ├── index.ts                            # Public exports
│       └── canvas/
│           ├── bubble-physics.engine.ts        # requestAnimationFrame physics loop
│           └── bubble-renderer.ts              # Canvas 2D drawing (separated from lifecycle)
├── hooks/
│   └── use-interactive-loader.ts               # Bridges domain services + React lifecycle
└── lib/
    └── interactive-loader/
        ├── audio-haptic-controller.ts           # Web Audio API synthesizer adapter
        └── trivia-data.ts                      # Static curated trivia JSON bank (data asset)
```

## Architecture & Layer Responsibilities

```
┌─────────────────────────────────────────────────────────────┐
│                     components/interactive-loader/           │
│  Presentation layer: React components, canvas renderers     │
│  Responsibilities: DOM rendering, event capture, animation  │
│  Dependencies: hooks/use-interactive-loader (not domain/)   │
├─────────────────────────────────────────────────────────────┤
│                     hooks/use-interactive-loader             │
│  Application bridge: Connects domain services to React      │
│  Responsibilities: Lifecycle management, preference sync    │
│  Dependencies: domain/interactive-loader/factory            │
├─────────────────────────────────────────────────────────────┤
│                     lib/interactive-loader/                  │
│  Utilities: Framework-agnostic helpers and asset data       │
│  Responsibilities: Audio synthesis, static trivia bank      │
│  Dependencies: None                                         │
├─────────────────────────────────────────────────────────────┤
│                     domain/interactive-loader/               │
│  Core business logic: Pure TypeScript, zero React imports   │
│  Responsibilities: State machine, services, policies        │
│  Dependencies: Its own contracts/ only (inversion)          │
└─────────────────────────────────────────────────────────────┘
```

**Dependency Rule**: Components → Hook → Domain Factory → Domain Services/Contracts → Pure TS.
Never import domain internals directly into components. Never import React into domain.

## Design Patterns

### 1. State Machine (Reducer Pattern) — `loader-state-machine.ts`
- **Purpose**: Model loading lifecycle as explicit states and transitions.
- **Shape**: `type State = { phase: LoadingPhase; stages: Stage[]; error?: Error }` with a pure reducer `(State, Event) => State`.
- **Events**: `LOAD_STARTED | THRESHOLD_EXCEEDED | STAGE_ADVANCED | OPERATION_COMPLETED | OPERATION_FAILED | RETRY_INITIATED | DISMISSED`.
- **Why**: Every state is exhaustively enumerable; impossible states are unrepresentable. Testable without DOM.

### 2. Repository Pattern — `contracts/*.repository.ts` + `infrastructure/*`
- **Ports** (interfaces in contracts): `ITriviaRepository`, `IPreferencesRepository`, `IStatsRepository`.
- **Adapters** (implementations in infrastructure): `StaticTriviaRepository`, `LocalStoragePreferencesRepository`, `SessionStorageStatsRepository`.
- **Why**: Data sources are swappable. Trivia can move from static JSON to API without touching domain services.

### 3. Adapter Pattern — `lib/interactive-loader/audio-haptic-controller.ts`
- **Port** (inferred by usage): `IAudioController { playChime(): void; playPop(): void; setMuted(muted: boolean): void; }`.
- **Adapter**: Web Audio API implementation with procedural tone synthesis.
- **Why**: Isolates browser API quirks. Future-proof for alternative audio engines.

### 4. Factory (Composition Root) — `factory/interactive-loader-domain.factory.ts`
- Assembles all domain services with their repository dependencies.
- Provides a single `createInteractiveLoaderDomain()` entry point for the hook.
- **Why**: Centralizes wiring; avoids service locator anti-pattern.

### 5. Specification Pattern — (in `application/` as needed)
- **Purpose**: Encapsulate domain rules as testable predicate objects.
- **Example**: `TriviaRelevantToDomainSpecification` ensures trivia matches the current context.

### 6. Mapper Pattern — `application/loader.mapper.ts`
- Pure functions transforming domain entities → DTOs for UI consumption.
- **Why**: UI never receives raw domain state; prevents coupling.

## Type Safety Strategy

- **Discriminated unions** for `LoadingPhase` (`'idle' | 'threshold_wait' | 'active_loading' | 'completing' | 'error' | 'dismissed'`), state machine events, and domain events.
- **Branded types** for `SessionId` and `TriviaId` to prevent primitive confusion:
  ```typescript
  export type SessionId = string & { readonly __brand: 'SessionId' };
  ```
- **Strict repository interfaces** with readonly params and explicit return types.
- **Zod schemas** for runtime validation of `UserLoaderPreferences` at the localStorage boundary.
- **Exhaustive switch guards** in the state machine reducer — the compiler enforces every event is handled.
- **No `any`**, no `as` casts escaping boundary checks.

## Performance Strategy

| Concern | Approach |
|---------|----------|
| Animation (60 FPS) | Canvas physics loop via `requestAnimationFrame` + `useRef` — no React render on each frame |
| Mount latency | Lazy load mini-game chunk; `React.lazy(() => import('./BubblePopGame'))` |
| Anti-flicker | State machine enforces 300ms threshold — loader DOM never mounts for fast ops |
| Re-render isolation | Canvas game state stored in refs, not React state |
| Bundle size | Domain layer tree-shakeable; audio uses procedural synthesis (zero MP3 assets) |

## Accessibility & Motion Strategy

- `prefers-reduced-motion` CSS media query detected via `useMediaQuery` hook → Framer Motion `useReducedMotion` for JS animations.
- All canvas/particle animations have a static fallback state (progress badges instead of particles).
- ARIA live region (`role="status"` + `aria-live="polite"`) announces stage changes to screen readers.
- Keyboard navigation: Tab between trivia options, Enter/ Space to select, Esc to collapse/minimize.
- Focus trapping when the overlay is in `'active_loading'` or `'completing'` phase.

## Testing Strategy by Layer

| Layer | Tool | What to test |
|-------|------|-------------|
| `domain/application/` | Vitest (pure TS) | State machine reducer exhaustive transitions, trivia selection policy, mapper correctness, error types |
| `domain/infrastructure/` | Vitest | Repository read/write, localStorage mocking, trivia filtering |
| `hooks/` | Vitest + RTL + renderHook | Lifecycle bridging, preference sync, timer cleanup |
| `components/` | Vitest + RTL + jsdom | Render states, keyboard nav, ARIA attributes, reduced-motion fallback |
| `canvas/` | Vitest | Physics tick correctness, boundary collision, bubble generation |

## Complexity Tracking

> No constitution violations. Architecture is hexagonal with strict dependency inversion. Domain layer adds zero React imports. All external IO (storage, audio, canvas) is behind port interfaces.
