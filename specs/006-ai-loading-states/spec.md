# Feature Specification: Premium AI Search Loading States

**Feature Branch**: `006-ai-loading-states`
**Created**: 2026-05-19
**Revised**: 2026-05-19 (v2 — critical review fixes)
**Status**: Draft
**Input**: "I want more Beautiful Loading State with Stunning Animations with Different States like Thinking, Remodeling etc..."

---

## Problem Statement

The current AI search loading experience is functional but uninspiring:

1. **Search Hero** — Shows a basic `Loader2` spinner + "Searching opportunities..." text on the submit button during loading
2. **Search Results** — Renders 6 static `CardSkeleton` components with a simple Framer Motion background-position animation (shimmer sweep)
3. **Chat Streaming** — Has a rudimentary Siri-like orb (3 spinning/pulsing colored blobs) + "Synthesizing intelligence..." text + glassmorphism skeleton cards

These loading states fail to communicate **what the AI is doing** at any given moment, feel disconnected from the brand's premium positioning, and provide no progressive disclosure of the search lifecycle.

---

## Design Vision

**Apple-grade loading choreography** — every millisecond of wait time should feel intentional, informative, and visually stunning. The loading experience should:

1. **Communicate AI cognition stages** — Users see what the AI is doing (Thinking → Analyzing → Remodeling → Curating → Done), not just "loading..."
2. **Morph between states fluidly** — Transitions between stages use organic, physics-based animations (orb morphing, color shifting, scale breathing) — not hard cuts
3. **Maintain spatial consistency** — The loading indicator occupies the same spatial region throughout, preventing layout shift
4. **Layer depth progressively** — Skeleton cards appear with staggered cascade, each revealing subtle motion (gradient shimmer, gentle float, aurora border glow)
5. **Feel alive** — The entire loading composition breathes, pulses, and responds with micro-animations that make the wait feel shorter
6. **Stay synchronized** — A single stage timeline drives all loading visuals (orb, indicator, cards, button) — zero drift between UI layers

---

## Loading State Architecture

### Stage Lifecycle

The AI search loading experience progresses through **5 distinct cognitive stages**, each with unique visuals, colors, and messaging:

```
┌──────────┐     ┌───────────┐     ┌────────────┐     ┌──────────┐     ┌──────┐
│ THINKING │ ──► │ ANALYZING │ ──► │ REMODELING │ ──► │ CURATING │ ──► │ DONE │
│  0-2s    │     │  2-4s     │     │  4-6s      │     │  6-8s    │     │      │
└──────────┘     └───────────┘     └────────────┘     └──────────┘     └──────┘
   Cyan pulse      Violet spin      Emerald morph     Gold shimmer    Reveal
   "Understanding   "Evaluating      "Refining your    "Selecting the   Results
    your query..."   opportunities"   results..."       best matches"
```

| Stage | Duration | Orb Color | Orb Motion | Message | Skeleton Style |
|---|---|---|---|---|---|
| **THINKING** | 0–2s | `#3399cc` (Scholar Blue) | Slow breathing pulse, single orb | "Understanding your query..." | Subtle fade-in, minimal shimmer |
| **ANALYZING** | 2–4s | `#8b5cf6` (Violet) | Orb splits into 2, orbit each other | "Evaluating opportunities..." | Cards begin shimmer sweep |
| **REMODELING** | 4–6s | `#10b981` (Emerald) | Orbs merge, morph into elongated shape | "Refining your results..." | Aurora border glow appears |
| **CURATING** | 6–8s | `#f59e0b` (Amber/Gold) | Compact spinning with particle trail | "Selecting the best matches..." | Cards gentle float, gradient shift |
| **DONE** | 8s+ | Fade to transparent | Orb implodes with sparkle burst | (none — results reveal) | Cross-fade to real cards |

### Stage Transition Timing

```
Time ──────────────────────────────────────────────────►

0s          2s          4s          6s          8s
│           │           │           │           │
│ THINKING  │ ANALYZING │ REMODELING│ CURATING  │ DONE
│ ██████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░│
│           │           │           │           │
│  orb pulse│  orb split│  orb morph│  orb spin │  orb burst
│  + fade   │  + orbit  │  + merge  │  + trail  │  + reveal
```

Each transition uses a **600ms cross-fade** with easing `[0.23, 1, 0.32, 1]` (Apple's signature spring curve).

### Single Source of Truth Rule

**Critical invariant**: `useStageTimeline` is called **exactly once** per loading session — at the nearest common ancestor that renders both the hero button and the results overlay. The current stage is propagated downward via props (or context if the tree is deep). No consumer may instantiate its own timeline.

```
ai-search-page-enhanced.tsx          ← HOOK CALLED HERE (once)
│
├── SearchHero
│   └── SearchButtonLoader stage={currentStage}    ← prop, not hook
│
└── SearchResults
    └── LoadingStateOverlay
        ├── AIThinkingOrb stage={currentStage}     ← prop, not hook
        ├── ThinkingStageIndicator stage={...}      ← prop, not hook
        └── ShimmerCardGrid (CSS vars from stage)   ← inherited, not hook
```

---

## Component Architecture

### New Components

| Component | File | Purpose |
|---|---|---|
| `AIThinkingOrb` | `src/components/ai-search/loading/ai-thinking-orb.tsx` | Central animated orb that morphs through stages |
| `ThinkingStageIndicator` | `src/components/ai-search/loading/thinking-stage-indicator.tsx` | Stage text + progress bar with typed-out animation |
| `LoadingStateOverlay` | `src/components/ai-search/loading/loading-state-overlay.tsx` | Full composition: orb + stages + shimmer skeleton cards |
| `SearchButtonLoader` | `src/components/ai-search/loading/search-button-loader.tsx` | Animated loader for the hero submit button |

### Component Hierarchy

```
<EnhancedAISearchPageInner>       ← useStageTimeline(isLoading) called ONCE
│  currentStage, stageIndex, progress
│
├── <SearchHero isLoading={loading}>
│   └── button:
│       {loading ? <SearchButtonLoader stage={currentStage} /> : ...}
│
└── <SearchResults isLoading={loading} ...>
    └── <LoadingStateOverlay
          currentStage={currentStage}
          stageIndex={stageIndex}
          progress={progress}
          cardCount={6}
        >
        ├── <AIThinkingOrb orbConfig={currentStage.orb} />
        ├── <ThinkingStageIndicator indicatorConfig={currentStage.indicator} progress={progress} />
        └── <ShimmerCardGrid>          ← CSS vars inherited from grid container
            └── <ShimmerCard delay={i*100} /> × 6    ← React.memo, props: { delay } only
```

### ISP-Segregated Config Interfaces

The monolithic `StageConfig` is split into three sub-interfaces composed at the top level. Each component receives only the config slice it uses:

```typescript
interface OrbConfig {
  stage: LoadingStage;
  gradient: string;
  glowColor: string;
  scale: number;
  borderRadius: string;
  rotation: number;
}

interface IndicatorConfig {
  stage: LoadingStage;
  label: string;
  gradient: string;
}

interface CardConfig {
  shimmerIntensity: number;   // 0–1
  auroraEnabled: boolean;
  floatEnabled: boolean;
  glowColor: string;           // drives --aurora-color CSS var
}

interface StageConfig {
  orb: OrbConfig;
  indicator: IndicatorConfig;
  card: CardConfig;
  duration: number;            // ms before advancing
}
```

---

## User Stories & Testing

### User Story 1 — Progressive loading perception (Priority: P1)

As a user searching for scholarships, I want to see the AI "thinking" through stages so that the wait feels purposeful and I know the system is working.

**Acceptance Scenarios**:

1. **Given** I submit a search query, **When** loading begins, **Then** I see an animated orb with the label "Understanding your query..." (THINKING stage).
2. **Given** loading has been active for 2+ seconds, **When** the stage transitions, **Then** the orb color shifts to violet, the label morphs to "Evaluating opportunities...", and the transition is smooth (no hard cut).
3. **Given** loading completes at any stage, **When** results arrive, **Then** the loading state smoothly cross-fades to the results grid.
4. **Given** the hero button and results overlay are both visible during loading, **When** the stage advances, **Then** both update simultaneously — no perceptible drift between button label and orb state.

### User Story 2 — Hero button loading state (Priority: P1)

As a user who just clicked "Discover Opportunities", I want the button to show an elegant loading animation instead of a basic spinner.

**Acceptance Scenarios**:

1. **Given** I click the search button, **When** loading begins, **Then** the button shows an animated gradient sweep + stage label instead of `Loader2` spinner.
2. **Given** the button is in loading state, **When** I hover it, **Then** no hover effects fire (button is disabled).

### User Story 3 — Skeleton card progression (Priority: P2)

As a user waiting for results, I want the skeleton cards to progressively come alive with subtle animations that hint at the data arriving.

**Acceptance Scenarios**:

1. **Given** loading is in the THINKING stage, **When** skeleton cards appear, **Then** they fade in with stagger and show a subtle gradient shimmer.
2. **Given** loading reaches the REMODELING stage, **When** cards are visible, **Then** aurora border glow appears on each card with staggered timing.
3. **Given** results arrive, **When** loading ends, **Then** skeleton cards cross-fade to real result cards with layout animation.

### User Story 4 — Accessibility & reduced motion (Priority: P1)

As a user with motion sensitivity, I want the loading states to respect my reduced motion preferences.

**Acceptance Scenarios**:

1. **Given** I have `prefers-reduced-motion: reduce` enabled, **When** the loading state renders, **Then** all animations are replaced with static fallbacks (solid orb color, static text, simple pulse skeletons).

---

## Requirements

### Functional

| ID | Requirement | Priority |
|---|---|---|
| F-01 | Loading state cycles through 5 stages: THINKING → ANALYZING → REMODELING → CURATING → DONE | P1 |
| F-02 | Each stage has a unique orb color, motion pattern, and status message | P1 |
| F-03 | Stage transitions use 600ms cross-fade with Apple-style spring easing | P1 |
| F-04 | Stage advancement is time-based (2s intervals) with auto-progression | P1 |
| F-05 | Loading completes instantly when real results arrive (early exit at any stage) | P1 |
| F-06 | AIThinkingOrb renders an organic morphing shape (not a simple circle) | P1 |
| F-07 | ThinkingStageIndicator shows typed-out text animation per stage | P2 |
| F-08 | ThinkingStageIndicator shows a thin progress bar that advances with stages | P2 |
| F-09 | ShimmerCardGrid renders 6 skeleton cards with staggered entrance (100ms apart) | P1 |
| F-10 | ShimmerCards show aurora border glow that intensifies in later stages | P2 |
| F-11 | ShimmerCards show gradient shimmer sweep animation driven by CSS `transform: translateX()`, not `backgroundPosition` | P1 |
| F-12 | Search hero button shows animated gradient sweep + stage label during loading | P1 |
| F-13 | Done stage triggers a sparkle burst animation on the orb before fading | P2 |
| F-14 | All components support `prefers-reduced-motion` with static fallbacks | P1 |
| F-15 | Loading state replaces both the current CardSkeleton grid and the hero Loader2 spinner | P1 |
| F-16 | `useStageTimeline` is called exactly once per loading session at the feature root; all consumers receive stage via props or CSS custom property inheritance | P1 |

### Non-Functional

| ID | Requirement | Priority |
|---|---|---|
| NF-01 | All animations run at 60fps on mid-range devices (no jank) | P1 |
| NF-02 | GPU-accelerated transforms only (transform, opacity, filter) — no `backgroundPosition`, `left`, `top`, `width`, or `height` in animation loops. Shimmer sweep uses `transform: translateX()` on an absolutely-positioned overlay. | P1 |
| NF-03 | `will-change: transform, opacity` on animated elements | P2 |
| NF-04 | Zero new npm dependencies — use existing Framer Motion + CSS animations | P1 |
| NF-05 | CSS animations use `@keyframes` in `ai-search.css` for reusable classes | P1 |
| NF-06 | Framer Motion variants in `ai-search-animations.ts` for component-driven animations | P1 |
| NF-07 | No layout shift during loading → results transition | P1 |
| NF-08 | TypeScript strict mode compliance — no `any` types | P1 |
| NF-09 | Each animation component is independently testable in Storybook | P3 |
| NF-10 | Total CSS/JS bundle increase < 5KB gzipped | P2 |
| NF-11 | `useStageTimeline` cleanup is cancellation-guarded — no `setState` on unmounted components; no orphaned timeout IDs on rapid `isLoading` toggles | P1 |
| NF-12 | ShimmerCard is wrapped in `React.memo` and receives only `{ delay }` as a prop — stage transitions are driven by CSS custom properties on the grid container, not by React re-renders | P1 |

---

## Animation Specifications

### AIThinkingOrb — Stage Motion Patterns

| Stage | Shape | Motion | CSS/FM |
|---|---|---|---|
| THINKING | Single soft circle | Slow scale pulse (1.0 → 1.08 → 1.0) at 3s cycle | Framer Motion `animate` |
| ANALYZING | Two orbiting circles | Two orbs orbit a shared center, 4s rotation cycle | CSS `@keyframes orbit` |
| REMODELING | Elongated pill shape | Border-radius morphs (50% → 35%) + slight X-stretch, 3s cycle | Framer Motion `animate` on `borderRadius` + `scaleX` |
| CURATING | Compact spinning diamond | 45° rotation + scale(0.9), 2s spin cycle | CSS `@keyframes spin-compact` |
| DONE | Imploding circle | Scale 1 → 0 + opacity 1 → 0 + radial particles, 400ms | Framer Motion `exit` |

### AIThinkingOrb — Color Gradients Per Stage

| Stage | Gradient | Glow Color |
|---|---|---|
| THINKING | `from-sky-400 to-sky-600` | `rgba(56, 189, 248, 0.3)` |
| ANALYZING | `from-violet-400 to-purple-600` | `rgba(139, 92, 246, 0.3)` |
| REMODELING | `from-emerald-400 to-green-600` | `rgba(52, 211, 153, 0.3)` |
| CURATING | `from-amber-400 to-orange-500` | `rgba(245, 158, 11, 0.3)` |
| DONE | `from-white to-white/0` | Transparent |

### ShimmerCard — Aurora Border Effect

```
┌─────────────────────────────────┐
│ ╔═════════════════════════════╗ │  ← Aurora border: conic-gradient
│ ║                             ║ │     rotating around the card
│ ║   [Skeleton content]        ║ │     with color stops matching
│ ║                             ║ │     current stage color
│ ║                             ║ │
│ ╚═════════════════════════════╝ │
└─────────────────────────────────┘
```

**Implementation**: `mask-composite: exclude` technique on `::before` pseudo-element — no `z-index: -1`, no solid-fill `::after`. The mask reveals the conic gradient only in the 1.5px border region, preserving stacking context integrity for Framer Motion children:

```css
.shimmer-card-aurora::before {
  content: "";
  position: absolute;
  inset: -1.5px;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg,
    var(--aurora-color, rgba(56, 189, 248, 0.3)),
    transparent 40%,
    var(--aurora-color, rgba(56, 189, 248, 0.3)),
    transparent 80%,
    var(--aurora-color, rgba(56, 189, 248, 0.3))
  );
  animation: aurora-rotate 4s linear infinite;
  /* Mask reveals BORDER region only — no z-index games, no solid fill overlay */
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 1.5px;
}
```

### ShimmerCard — Shimmer Sweep (GPU-only)

The shimmer sweep is an absolutely-positioned overlay that moves with `transform: translateX()` — a compositor-only property. The sweep opacity is driven by CSS custom property `--shimmer-opacity`, which the grid container sets on stage change. Zero Framer Motion animation loops per card.

```css
@keyframes shimmer-sweep {
  from { transform: translateX(-200%); }
  to   { transform: translateX(200%); }
}

.shimmer-sweep {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, var(--shimmer-opacity, 0.05)) 50%,
    transparent 100%
  );
  animation: shimmer-sweep 2s linear infinite;
  will-change: transform;
  pointer-events: none;
}
```

### ShimmerCard — Stage-Driven CSS Custom Properties

The grid container sets CSS custom properties on stage change. All 6 cards inherit these variables via the CSS cascade — **zero JavaScript re-renders on stage transitions**:

| CSS Variable | Set By | Consumed By |
|---|---|---|
| `--aurora-color` | Grid container `style` attribute | `.shimmer-card-aurora::before` conic-gradient |
| `--shimmer-opacity` | Grid container `style` attribute | `.shimmer-sweep` background rgba alpha |
| `--aurora-active` | Grid container class toggle (`0` / `1`) | `.shimmer-card-aurora::before` opacity transition |
| `--float-active` | Grid container class toggle | `.shimmer-card-content` animation toggle |

### ThinkingStageIndicator — Typed Text Animation

```
Understanding your query...▌     ← Cursor blinks, text types out char-by-char
████████░░░░░░░░░░░░░░░░░░░░░░  ← Progress bar: 0-25% for stage 1
```

- Characters appear at 40ms intervals
- Cursor blinks at 530ms cycle
- Progress bar width: `stageIndex / totalStages * 100%`
- Bar color matches current stage orb gradient

---

## Files to Create/Modify

### New Files

| File | Type | Description |
|---|---|---|
| `src/components/ai-search/loading/ai-thinking-orb.tsx` | Component | Morphing orb — receives `OrbConfig` only |
| `src/components/ai-search/loading/thinking-stage-indicator.tsx` | Component | Stage text + progress bar — receives `IndicatorConfig` only |
| `src/components/ai-search/loading/loading-state-overlay.tsx` | Component | Full composition — receives `StageConfig` + `stageIndex` + `progress` as props (no hook) |
| `src/components/ai-search/loading/search-button-loader.tsx` | Component | Button loader — receives `IndicatorConfig` only (no hook) |
| `src/components/ai-search/loading/stage-timeline.ts` | Hook/Util | Stage progression logic (timer + state machine + ISP-segregated config) |
| `src/components/ai-search/loading/index.ts` | Barrel | Re-exports all loading components + types |

### Modified Files

| File | Change |
|---|---|
| `src/app/ai-search/ai-search.css` | Add new `@keyframes`: `orbit`, `morph`, `aurora-rotate`, `shimmer-sweep`, `spin-compact`, `type-cursor`, `float-gentle`, `particle-burst`. Add aurora mask-composite class. Add shimmer-sweep class. |
| `src/lib/ai-search-animations.ts` | Add Framer Motion variants: `orbContainerVariants`, `orbPulseVariants`, `orbMorphVariants`, `stageTextVariants`, `progressBarVariants`, `shimmerCardVariants`, `sparkleBurstVariants` |
| `src/components/ai-search/ai-search-page-enhanced.tsx` | Call `useStageTimeline(isLoading)` here — the single source of truth. Pass `currentStage`/`stageIndex`/`progress` down to `SearchHero` + `SearchResults`. |
| `src/components/ai-search/search-results-enhanced.tsx` | Replace `CardSkeleton` with `LoadingStateOverlay` (receives stage props, not hook). Accept and forward stage props from parent. |
| `src/components/ai-search/search-hero-enhanced.tsx` | Replace `Loader2` with `SearchButtonLoader` (receives `IndicatorConfig` prop, not hook). Accept and forward stage prop from parent. |
| `src/components/ai-search/chat-message.tsx` | Replace `StreamingMessageSkeleton` with `LoadingStateOverlay` (adapted for chat context). Call `useStageTimeline` locally here since this is an isolated chat context, not shared with the hero. |

---

## Accessibility

| Concern | Solution |
|---|---|
| Screen reader users | `aria-live="polite"` on stage indicator; `aria-busy="true"` on loading region; `role="status"` on progress bar |
| Motion sensitivity | All animations wrapped in `@media (prefers-reduced-motion: reduce)` — fallback to static colored orb + static text + simple pulse skeletons. Framer Motion components use `useReducedMotion()` hook for programmatic fallback. |
| Color blindness | Stage text changes on every transition (not color-dependent communication); progress bar uses both color + width |
| Keyboard navigation | Loading states are non-interactive; no focus trap issues |
