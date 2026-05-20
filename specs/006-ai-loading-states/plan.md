# Implementation Plan: Premium AI Search Loading States

**Branch**: `006-ai-loading-states` | **Date**: 2026-05-19 | **Revised**: v2 (critical review fixes) | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification for Apple-grade AI search loading choreography

---

## Summary

Replace the current basic loading states (static skeleton cards + `Loader2` spinner) with a stunning, stage-driven loading choreography that communicates AI cognition progress. The system cycles through 5 cognitive stages (Thinking → Analyzing → Remodeling → Curating → Done), each with a unique animated orb, color palette, status message, and skeleton card intensity level. All animations use existing Framer Motion + CSS — zero new dependencies.

**v2 revision**: Fixes four critical failures from the initial plan — duplicate hook instantiation (single source of truth), stale closure / memory leak in timer hook, aurora border z-index conflict (mask-composite), and `backgroundPosition` animation (GPU-only `translateX`). Also introduces ISP-segregated config interfaces and CSS custom property card architecture for zero-JS stage transitions on the card layer.

---

## Technical Context

| Field | Value |
|---|---|
| **Language/Version** | TypeScript 5.x + React 19, Next.js 16 (App Router) |
| **Primary Dependencies** | Framer Motion (existing), CSS `@keyframes` (existing), Tailwind CSS v4 |
| **Animation System** | Dual: Framer Motion for component-driven state animations, CSS `@keyframes` for infinite/looping micro-animations |
| **Current State** | `CardSkeleton` (basic shimmer), `Loader2` spinner, `StreamingMessageSkeleton` (rudimentary orb) |
| **Testing** | `tsc --noEmit`, ESLint, manual browser + Chrome DevTools Performance tab |
| **Bundle Constraint** | < 5KB gzipped increase |

---

## SOLID Architecture Analysis

| Principle | Application |
|---|---|
| **S**ingle Responsibility | Each component owns one visual layer: `AIThinkingOrb` = orb shape/motion, `ThinkingStageIndicator` = text + progress, `LoadingStateOverlay` = composition, `ShimmerCard` = skeleton card. `useStageTimeline` = time-based state machine only. |
| **O**pen/Closed | Adding a new stage (e.g., "RANKING") requires only adding an entry to the `STAGE_CONFIG` array — zero component changes. Stages are data-driven, not hardcoded. |
| **L**iskov Substitution | `LoadingStateOverlay` is a drop-in replacement for the current `CardSkeleton` grid — same outer dimensions, same parent container. |
| **I**nterface Segregation | `AIThinkingOrb` receives only `OrbConfig` (gradient, scale, borderRadius, rotation, glowColor). `ThinkingStageIndicator` receives only `IndicatorConfig` (label, gradient). `ShimmerCard` receives only `{ delay }` — stage behavior is inherited via CSS custom properties. No component receives more props than it uses. |
| **D**ependency Inversion | All stage definitions live in a pure data config (`stage-timeline.ts`). Components depend on the `LoadingStage` enum and their own config slice, not on timer implementation details. The timer hook is swappable (time-based → SSE-based) without touching visual components. |

---

## Stage Data Model — ISP-Segregated

The monolithic `StageConfig` is split into three sub-interfaces. Each component receives only the slice it needs. `StageConfig` composes all three for the top-level config array.

```typescript
// src/components/ai-search/loading/stage-timeline.ts

export enum LoadingStage {
  THINKING = "thinking",
  ANALYZING = "analyzing",
  REMODELING = "remodeling",
  CURATING = "curating",
  DONE = "done",
}

export interface OrbConfig {
  stage: LoadingStage;
  gradient: string;
  glowColor: string;
  scale: number;
  borderRadius: string;
  rotation: number;
}

export interface IndicatorConfig {
  stage: LoadingStage;
  label: string;
  gradient: string;
}

export interface CardConfig {
  shimmerOpacity: number;     // 0–0.15, maps to --shimmer-opacity CSS var
  auroraEnabled: boolean;     // maps to --aurora-active class toggle
  floatEnabled: boolean;      // maps to --float-active class toggle
  glowColor: string;          // maps to --aurora-color CSS var
}

export interface StageConfig {
  orb: OrbConfig;
  indicator: IndicatorConfig;
  card: CardConfig;
  duration: number;           // ms before advancing to next stage
}

export const STAGE_CONFIG: StageConfig[] = [
  {
    orb: {
      stage: LoadingStage.THINKING,
      gradient: "from-sky-400 to-sky-600",
      glowColor: "rgba(56, 189, 248, 0.3)",
      scale: 1.0,
      borderRadius: "50%",
      rotation: 0,
    },
    indicator: {
      stage: LoadingStage.THINKING,
      label: "Understanding your query...",
      gradient: "from-sky-400 to-sky-600",
    },
    card: {
      shimmerOpacity: 0.045,
      auroraEnabled: false,
      floatEnabled: false,
      glowColor: "rgba(56, 189, 248, 0.3)",
    },
    duration: 2000,
  },
  {
    orb: {
      stage: LoadingStage.ANALYZING,
      gradient: "from-violet-400 to-purple-600",
      glowColor: "rgba(139, 92, 246, 0.3)",
      scale: 1.05,
      borderRadius: "50%",
      rotation: 0,
    },
    indicator: {
      stage: LoadingStage.ANALYZING,
      label: "Evaluating opportunities...",
      gradient: "from-violet-400 to-purple-600",
    },
    card: {
      shimmerOpacity: 0.075,
      auroraEnabled: false,
      floatEnabled: false,
      glowColor: "rgba(139, 92, 246, 0.3)",
    },
    duration: 2000,
  },
  {
    orb: {
      stage: LoadingStage.REMODELING,
      gradient: "from-emerald-400 to-green-600",
      glowColor: "rgba(52, 211, 153, 0.3)",
      scale: 1.1,
      borderRadius: "35%",
      rotation: 0,
    },
    indicator: {
      stage: LoadingStage.REMODELING,
      label: "Refining your results...",
      gradient: "from-emerald-400 to-green-600",
    },
    card: {
      shimmerOpacity: 0.105,
      auroraEnabled: true,
      floatEnabled: false,
      glowColor: "rgba(52, 211, 153, 0.3)",
    },
    duration: 2000,
  },
  {
    orb: {
      stage: LoadingStage.CURATING,
      gradient: "from-amber-400 to-orange-500",
      glowColor: "rgba(245, 158, 11, 0.3)",
      scale: 0.9,
      borderRadius: "50%",
      rotation: 45,
    },
    indicator: {
      stage: LoadingStage.CURATING,
      label: "Selecting the best matches...",
      gradient: "from-amber-400 to-orange-500",
    },
    card: {
      shimmerOpacity: 0.135,
      auroraEnabled: true,
      floatEnabled: true,
      glowColor: "rgba(245, 158, 11, 0.3)",
    },
    duration: 2000,
  },
  {
    orb: {
      stage: LoadingStage.DONE,
      gradient: "from-white to-transparent",
      glowColor: "transparent",
      scale: 0,
      borderRadius: "50%",
      rotation: 0,
    },
    indicator: {
      stage: LoadingStage.DONE,
      label: "",
      gradient: "from-white to-transparent",
    },
    card: {
      shimmerOpacity: 0.15,
      auroraEnabled: true,
      floatEnabled: true,
      glowColor: "transparent",
    },
    duration: 0,
  },
];
```

**Why ISP matters here**: When a new engineer opens `AIThinkingOrb` and sees `props: OrbConfig`, they immediately know what's in scope — `gradient`, `scale`, `borderRadius`, `rotation`, `glowColor`. No `shimmerIntensity`, no `auroraEnabled`, no `label`. The component contract is self-documenting.

---

## Implementation Steps

### Step 1 — Stage Timeline Hook: `src/components/ai-search/loading/stage-timeline.ts`

**What**: Pure state machine that advances through `STAGE_CONFIG` on a timer. Uses a cancellation guard pattern to prevent stale closures and orphaned timeout IDs.

**Critical fix**: The v1 plan's `advance()` function was defined inside `useEffect` and then referenced inside a `setStageIndex` updater that scheduled the next timeout — a stale closure that could fire after unmount. The v1 also overwrote `intervalRef.current` without clearing the previous value, orphaning timeout IDs on rapid `isLoading` toggles.

**v2 implementation**:

```typescript
"use client";

import { useState, useEffect, useRef } from "react";

export enum LoadingStage { /* ... as above ... */ }
export interface OrbConfig { /* ... as above ... */ }
export interface IndicatorConfig { /* ... as above ... */ }
export interface CardConfig { /* ... as above ... */ }
export interface StageConfig { /* ... as above ... */ }
export const STAGE_CONFIG: StageConfig[] = [ /* ... as above ... */ ];

export function useStageTimeline(isLoading: boolean) {
  const [stageIndex, setStageIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setStageIndex(0);
      // Clear any in-flight timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Cancellation guard — prevents setState on unmounted component
    // and ensures rapid isLoading toggles don't orphan previous chains
    let cancelled = false;

    const schedule = (idx: number) => {
      const config = STAGE_CONFIG[idx];
      if (!config || idx >= STAGE_CONFIG.length - 1) return;

      timeoutRef.current = setTimeout(() => {
        if (cancelled) return;            // ← guard against post-unmount fire
        setStageIndex(idx + 1);
        schedule(idx + 1);               // ← chain next stage
      }, config.duration);
    };

    schedule(0);                          // ← start chain from THINKING

    return () => {
      cancelled = true;                   // ← mark chain as dead
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading]);

  const currentStage = STAGE_CONFIG[stageIndex] ?? STAGE_CONFIG[0];
  const progress = (stageIndex + 1) / STAGE_CONFIG.length;

  return { stageIndex, currentStage, progress };
}
```

**Design decisions**:
- **Cancellation guard** (`let cancelled = false`) — The cleanup function sets `cancelled = true`, which the scheduled callback checks before calling `setStageIndex`. This prevents React 17 "setState on unmounted component" warnings and React 18 no-op calls.
- **Recursive `schedule()` chain** — Each timeout schedules the next, ensuring only one timeout is alive at a time. `timeoutRef.current` always points to the active timeout, so cleanup is precise.
- **No `advance()` inside `setStageIndex` updater** — The v1 plan's pattern of scheduling timeouts inside a state updater was a stale closure anti-pattern. The v2 uses `idx` parameter passing instead.
- **`isLoading` as sole effect dependency** — The effect restarts the chain from scratch when `isLoading` flips. The cleanup clears the previous chain before starting a new one.
- Timer-based advancement (not SSE) — simple, deterministic, no server dependency.
- `isLoading` reset immediately zeroes the stage — instant transition to results.

---

### Step 2 — Single Source of Truth: `src/components/ai-search/ai-search-page-enhanced.tsx`

**What**: The feature root calls `useStageTimeline` **once** and passes the result down as props. This eliminates the v1 critical failure where `SearchButtonLoader` and `LoadingStateOverlay` each instantiated their own timeline, causing desynchronized UI.

**Current integration point** (`ai-search-page-enhanced.tsx`):

```tsx
function EnhancedAISearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") ?? "";
  const [activeQuery, setActiveQuery] = useState(queryParam);
  const resultsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { data: results = [], isLoading, isFetching } = useSearch(queryParam);
  const hasSearched = queryParam.trim().length > 0;
  const loading = isLoading || isFetching;

  // ... existing code ...

  return (
    <div className={`flex flex-col min-h-screen ${rubik.variable}`}>
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} className="flex-1">
        <div ref={heroRef}>
          <SearchHero onSearch={handleSearch} isLoading={loading} />
        </div>
        {/* ... */}
      </motion.div>
    </div>
  );
}
```

**After**:

```tsx
import { useStageTimeline } from "@/components/ai-search/loading";

function EnhancedAISearchPageInner() {
  // ... existing state ...

  const loading = isLoading || isFetching;

  // ★ SINGLE SOURCE OF TRUTH — hook called exactly once
  const { currentStage, stageIndex, progress } = useStageTimeline(loading);

  return (
    <div className={`flex flex-col min-h-screen ${rubik.variable}`}>
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} className="flex-1">
        <div ref={heroRef}>
          <SearchHero
            onSearch={handleSearch}
            isLoading={loading}
            indicatorConfig={currentStage.indicator}   // ★ prop, not hook
          />
        </div>
        <motion.div key={hasSearched ? "results-visible" : "results-hidden"} ...>
          {hasSearched && (
            <SearchResults
              query={activeQuery}
              results={results}
              isLoading={loading}
              onScrollToTop={handleScrollToTop}
              currentStage={currentStage}              // ★ prop, not hook
              stageIndex={stageIndex}                  // ★ prop, not hook
              progress={progress}                      // ★ prop, not hook
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
```

**Key invariant**: `SearchButtonLoader` and `LoadingStateOverlay` share the exact same `currentStage` reference. Zero drift. If the stage says "ANALYZING", both the button label and the orb color are violet simultaneously.

---

### Step 3 — AI Thinking Orb: `src/components/ai-search/loading/ai-thinking-orb.tsx`

**What**: The central animated orb that morphs through stages. Receives only `OrbConfig`.

**Visual spec**:

```
THINKING stage:
┌──────────────────────────┐
│     ╭──────────╮         │
│     │  ● pulse │         │  Single circle, breathing scale
│     │  ● glow  │         │  Shadow: 0 0 40px rgba(sky, 0.3)
│     ╰──────────╯         │
└──────────────────────────┘

ANALYZING stage:
┌──────────────────────────┐
│      ╭──╮  ╭──╮         │
│      │● │↻│ ●│         │  Two orbs orbit shared center
│      ╰──╯  ╰──╯         │  4s rotation cycle
└──────────────────────────┘

REMODELING stage:
┌──────────────────────────┐
│    ╭────────────╮        │
│    │  morphing   │       │  Elongated pill, border-radius morphs
│    │  shape      │       │  35% radius, slight X-stretch
│    ╰────────────╯        │
└──────────────────────────┘

CURATING stage:
┌──────────────────────────┐
│         ◆                │  Diamond (45° rotation)
│        ╱╲               │  Compact, spinning 2s cycle
│       ╱  ╲              │
└──────────────────────────┘

DONE stage:
┌──────────────────────────┐
│       ✦  ✦  ✦           │  Sparkle burst particles
│      ✦  💥  ✦           │  Scale 1→0 + opacity 1→0
│       ✦  ✦  ✦           │  400ms implosion
└──────────────────────────┘
```

**Implementation**:

```typescript
"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LoadingStage, OrbConfig } from "./stage-timeline";
import { orbContainerVariants, orbPulseVariants, orbMorphVariants } from "@/lib/ai-search-animations";

interface AIThinkingOrbProps {
  orbConfig: OrbConfig;
}

export function AIThinkingOrb({ orbConfig }: AIThinkingOrbProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="flex items-center justify-center h-32">
        <div
          className={`h-16 w-16 rounded-full bg-gradient-to-br ${orbConfig.gradient}`}
          style={{ boxShadow: `0 0 30px ${orbConfig.glowColor}` }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-32 w-full">
      <AnimatePresence mode="wait">
        {orbConfig.stage === LoadingStage.THINKING && (
          <ThinkingOrb key="thinking" gradient={orbConfig.gradient} />
        )}
        {orbConfig.stage === LoadingStage.ANALYZING && (
          <AnalyzingOrb key="analyzing" gradient={orbConfig.gradient} />
        )}
        {orbConfig.stage === LoadingStage.REMODELING && (
          <RemodelingOrb key="remodeling" orbConfig={orbConfig} />
        )}
        {orbConfig.stage === LoadingStage.CURATING && (
          <CuratingOrb key="curating" gradient={orbConfig.gradient} />
        )}
        {orbConfig.stage === LoadingStage.DONE && (
          <DoneOrb key="done" />
        )}
      </AnimatePresence>

      {/* Ambient glow — always present, color shifts with stage */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl opacity-30 pointer-events-none"
        animate={{
          background: `radial-gradient(circle, ${orbConfig.glowColor}, transparent 70%)`,
        }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  );
}
```

Sub-orb implementations:

- **ThinkingOrb**: `motion.div` with `variants={orbPulseVariants}` — scale `[1, 1.08, 1]` at 3s cycle
- **AnalyzingOrb**: Two `motion.div`s with CSS `animate-orbit` / `animate-orbit-reverse` classes — `@keyframes orbit` 4s cycle
- **RemodelingOrb**: `motion.div` with `variants={orbMorphVariants}` — `borderRadius: ["50%", "35%", "50%"]` + `scaleX: [1, 1.3, 1]` at 3s cycle
- **CuratingOrb**: `motion.div` with CSS `animate-spin-compact` class — `@keyframes spin-compact` 2s cycle, `rotate(45deg) scale(0.9)`
- **DoneOrb**: `motion.div` with `exit={{ scale: 0, opacity: 0 }}` + 6 particle `motion.div`s using `sparkleBurstVariants`

All sub-orbs enter/exit with `variants={orbContainerVariants}` via `AnimatePresence mode="wait"`.

---

### Step 4 — Thinking Stage Indicator: `src/components/ai-search/loading/thinking-stage-indicator.tsx`

**What**: Stage text with typewriter animation + thin progress bar. Receives only `IndicatorConfig` + `progress`.

```typescript
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { IndicatorConfig } from "./stage-timeline";

interface ThinkingStageIndicatorProps {
  indicatorConfig: IndicatorConfig;
  progress: number;
}

export function ThinkingStageIndicator({
  indicatorConfig,
  progress,
}: ThinkingStageIndicatorProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || !indicatorConfig.label) {
      setDisplayedText(indicatorConfig.label);
      return;
    }

    setDisplayedText("");
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    indicatorConfig.label.split("").forEach((char, i) => {
      timeouts.push(
        setTimeout(() => {
          if (cancelled) return;
          setDisplayedText((prev) => prev + char);
        }, i * 40),
      );
    });

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [indicatorConfig.label, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        <motion.p
          key={indicatorConfig.stage}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-semibold tracking-wide text-foreground/80 text-center"
          role="status"
          aria-live="polite"
        >
          <span className={`bg-gradient-to-r ${indicatorConfig.gradient} bg-clip-text text-transparent`}>
            {displayedText}
          </span>
          {showCursor && indicatorConfig.label && (
            <span className="ml-0.5 text-foreground/40 animate-blink">▌</span>
          )}
        </motion.p>
      </AnimatePresence>

      <div className="w-full h-0.5 bg-foreground/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${indicatorConfig.gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
    </div>
  );
}
```

**Key details**:
- Typewriter at 40ms/char → ~1.36s for "Understanding your query..." — finishes before 2s stage transition
- Cancellation guard on typewriter timeouts — prevents stale updates on rapid stage changes
- `shouldReduceMotion` branch — shows full text instantly, skips cursor blink
- Progress bar is a thin 2px line (`h-0.5`) — subtle but informative

---

### Step 5 — ShimmerCard + ShimmerCardGrid: CSS Custom Property Architecture

**What**: 6 skeleton cards with aurora borders, staggered entrance, and stage-driven intensity. **The cards receive only `{ delay }` as a prop** — all stage behavior is inherited via CSS custom properties on the grid container.

**Critical v2 fix**: The v1 plan animated `backgroundPosition` on a Framer Motion div — a non-compositor property that triggers paint on every frame across all 6 cards (360 paints/second at 60fps). The v2 uses `transform: translateX()` on an absolutely-positioned overlay — compositor-only, zero paint.

**Critical v2 fix**: The v1 plan used `z-index: -1` + a solid-fill `::after` pseudo-element for the aurora border. This breaks when Framer Motion children use non-zero `z-index`. The v2 uses `mask-composite: exclude` — no z-index games, no solid fill, stacking-context-safe.

#### ShimmerCardGrid (inside LoadingStateOverlay)

```typescript
import React, { memo } from "react";
import { motion } from "framer-motion";
import { CardConfig } from "./stage-timeline";
import { Skeleton } from "@/components/ai-search/ui/skeleton";
import { cn } from "@/lib/utils";

interface ShimmerCardProps {
  delay: number;
}

const ShimmerCard = memo(function ShimmerCard({ delay }: ShimmerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay / 1000,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="shimmer-card-aurora relative overflow-hidden rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-xl p-5"
    >
      {/* Shimmer sweep — GPU-only translateX, opacity from CSS var */}
      <div className="shimmer-sweep" />

      {/* Float animation — toggled via parent class */}
      <div className="shimmer-card-content relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="space-y-2 mt-2">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </div>
        <div className="mt-5 space-y-2">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-2 w-4/5 rounded-full" />
          <Skeleton className="mt-5 h-8 w-full rounded-lg" />
        </div>
      </div>
    </motion.div>
  );
});

interface ShimmerCardGridProps {
  cardConfig: CardConfig;
  cardCount: number;
}

export function ShimmerCardGrid({ cardConfig, cardCount }: ShimmerCardGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        cardConfig.auroraEnabled && "aurora-active",
        cardConfig.floatEnabled && "float-active",
      )}
      style={{
        "--aurora-color": cardConfig.glowColor,
        "--shimmer-opacity": cardConfig.shimmerOpacity,
      } as React.CSSProperties}
    >
      {Array.from({ length: cardCount }).map((_, i) => (
        <ShimmerCard key={i} delay={i * 100} />
      ))}
    </div>
  );
}
```

**Why `React.memo` with `{ delay }` only**: Stage transitions change `cardConfig` on the grid container, which updates CSS custom properties via `style` attribute and toggles `aurora-active`/`float-active` classes. The 6 `ShimmerCard` instances don't re-render — CSS variable inheritance handles the visual change. This eliminates 6 concurrent Framer Motion variant re-evaluations on every 2-second stage tick.

---

### Step 6 — Loading State Overlay: `src/components/ai-search/loading/loading-state-overlay.tsx`

**What**: Composition root that orchestrates all loading sub-components. **Receives stage as props — does not call `useStageTimeline`.**

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { StageConfig } from "./stage-timeline";
import { AIThinkingOrb } from "./ai-thinking-orb";
import { ThinkingStageIndicator } from "./thinking-stage-indicator";
import { ShimmerCardGrid } from "./shimmer-card-grid";

interface LoadingStateOverlayProps {
  isLoading: boolean;
  currentStage: StageConfig;
  stageIndex: number;
  progress: number;
  cardCount?: number;
}

export function LoadingStateOverlay({
  isLoading,
  currentStage,
  stageIndex,
  progress,
  cardCount = 6,
}: LoadingStateOverlayProps) {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Orb + Stage Indicator section */}
      <div className="flex flex-col items-center gap-4 py-8">
        <AIThinkingOrb orbConfig={currentStage.orb} />
        <ThinkingStageIndicator
          indicatorConfig={currentStage.indicator}
          progress={progress}
        />
      </div>

      {/* Shimmer Card Grid — CSS vars set on container, cards inherit */}
      <ShimmerCardGrid cardConfig={currentStage.card} cardCount={cardCount} />
    </motion.div>
  );
}
```

---

### Step 7 — Search Button Loader: `src/components/ai-search/loading/search-button-loader.tsx`

**What**: Replaces the `Loader2` spinner in the hero submit button with a gradient sweep + stage label. **Receives `IndicatorConfig` as a prop — does not call `useStageTimeline`.**

**Critical v2 fix**: The v1 plan called `useStageTimeline(isLoading)` inside this component, creating a second independent timer chain that desynchronized from the overlay's chain.

```typescript
"use client";

import { IndicatorConfig } from "./stage-timeline";

interface SearchButtonLoaderProps {
  indicatorConfig: IndicatorConfig;
}

export function SearchButtonLoader({ indicatorConfig }: SearchButtonLoaderProps) {
  return (
    <>
      {/* Animated gradient sweep — CSS translateX, not backgroundPosition */}
      <div className="shimmer-sweep absolute inset-0 rounded-xl" />
      <span
        className={`bg-gradient-to-r ${indicatorConfig.gradient} bg-clip-text text-transparent text-xs font-semibold relative z-10`}
      >
        {indicatorConfig.label}
      </span>
    </>
  );
}
```

**Integration in hero button** (`search-hero-enhanced.tsx`):

Replace:
```tsx
{isLoading ? (
  <>
    <Loader2 className="w-5 h-5 animate-spin" />
    <span>Searching opportunities...</span>
  </>
) : (...)}
```

With:
```tsx
{isLoading ? (
  <SearchButtonLoader indicatorConfig={indicatorConfig} />
) : (...)}
```

Where `indicatorConfig` is received as a prop from the parent that owns the single `useStageTimeline` instance.

---

### Step 8 — CSS Keyframes + Aurora + Shimmer: `src/app/ai-search/ai-search.css`

Add these new `@keyframes` and utility classes:

```css
/* ===== NEW KEYFRAMES FOR LOADING STATES ===== */

/* Orbiting animation for ANALYZING stage dual-orbs */
@keyframes orbit {
  0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
}

@keyframes orbit-reverse {
  0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
  100% { transform: rotate(-360deg) translateX(20px) rotate(360deg); }
}

.animate-orbit {
  animation: orbit 4s linear infinite;
}

.animate-orbit-reverse {
  animation: orbit-reverse 4s linear infinite;
}

/* Aurora border rotation — uses mask-composite: exclude (no z-index: -1) */
@keyframes aurora-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Aurora border — mask-composite reveals BORDER only */
.shimmer-card-aurora {
  position: relative;
  --aurora-color: rgba(51, 153, 204, 0.3);
  --shimmer-opacity: 0.05;
}

.shimmer-card-aurora::before {
  content: "";
  position: absolute;
  inset: -1.5px;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg,
    var(--aurora-color),
    transparent 40%,
    var(--aurora-color),
    transparent 80%,
    var(--aurora-color)
  );
  animation: aurora-rotate 4s linear infinite;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 1.5px;
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
}

/* Toggled by parent grid container class */
.aurora-active .shimmer-card-aurora::before {
  opacity: 1;
}

/* Shimmer sweep — GPU-only translateX transform */
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
  z-index: 0;
}

/* Compact spin for CURATING stage diamond */
@keyframes spin-compact {
  0% { transform: rotate(45deg) scale(0.9); }
  100% { transform: rotate(405deg) scale(0.9); }
}

.animate-spin-compact {
  animation: spin-compact 2s linear infinite;
}

/* Typing cursor blink */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.animate-blink {
  animation: blink 530ms step-end infinite;
}

/* Gentle floating for CURATING stage skeleton cards */
@keyframes float-gentle {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}

/* Toggled by parent grid container class */
.float-active .shimmer-card-content {
  animation: float-gentle 3s ease-in-out infinite;
}

/* Particle burst for DONE stage */
@keyframes particle-burst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--px, 30px), var(--py, -30px)) scale(0);
    opacity: 0;
  }
}

.animate-particle-burst {
  animation: particle-burst 600ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

/* Morph animation for REMODELING stage border-radius */
@keyframes morph {
  0%, 100% { border-radius: 50%; }
  50% { border-radius: 35%; }
}

.animate-morph {
  animation: morph 3s ease-in-out infinite;
}

/* ===== REDUCED MOTION ===== */

@media (prefers-reduced-motion: reduce) {
  .animate-orbit,
  .animate-orbit-reverse,
  .animate-spin-compact,
  .animate-morph,
  .animate-float-gentle,
  .animate-particle-burst,
  .shimmer-sweep,
  .shimmer-card-aurora::before {
    animation: none !important;
  }

  .float-active .shimmer-card-content {
    animation: none !important;
  }

  .shimmer-card-aurora::before {
    opacity: 0.15 !important;
  }
}
```

**Key v2 changes from v1**:
1. **Aurora border**: `mask-composite: exclude` instead of `z-index: -1` + solid-fill `::after`. No stacking context conflicts with Framer Motion children.
2. **Shimmer sweep**: `transform: translateX()` instead of `backgroundPosition`. Compositor-only, zero paint per frame.
3. **CSS variable drive**: `--aurora-color`, `--shimmer-opacity` set on grid container, inherited by cards. `--aurora-active` and `--float-active` driven by parent class toggles.
4. **Reduced motion**: Centralized `@media` block — kills all looping animations, shows aurora as static 15% opacity border.

---

### Step 9 — Framer Motion Variants: `src/lib/ai-search-animations.ts`

Add these new variants:

```typescript
// Orb base variants — used by AIThinkingOrb via AnimatePresence
export const orbContainerVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
  },
};

// Orb breathing pulse for THINKING stage
export const orbPulseVariants: Variants = {
  animate: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Orb morphing for REMODELING stage
export const orbMorphVariants: Variants = {
  animate: {
    borderRadius: ["50%", "35%", "50%"],
    scaleX: [1, 1.3, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Stage text variants — cross-fade between stages
export const stageTextVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.2 },
  },
};

// Progress bar variants
export const progressBarVariants: Variants = {
  initial: { width: "0%" },
  animate: (progress: number) => ({
    width: `${progress * 100}%`,
    transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
  }),
};

// Shimmer card entrance variants (exit only — entrance handled by ShimmerCard)
export const shimmerCardVariants: Variants = {
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.3 },
  },
};

// Sparkle burst for DONE stage particles
export const sparkleBurstVariants: Variants = {
  initial: { scale: 0, opacity: 1, x: 0, y: 0 },
  animate: (angle: number) => {
    const distance = 40;
    const rad = (angle * Math.PI) / 180;
    return {
      scale: [0, 1.2, 0],
      opacity: [1, 1, 0],
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
    };
  },
};
```

---

### Step 10 — Barrel Export: `src/components/ai-search/loading/index.ts`

```typescript
export { AIThinkingOrb } from "./ai-thinking-orb";
export { ThinkingStageIndicator } from "./thinking-stage-indicator";
export { LoadingStateOverlay } from "./loading-state-overlay";
export { SearchButtonLoader } from "./search-button-loader";
export { ShimmerCardGrid } from "./shimmer-card-grid";
export {
  useStageTimeline,
  LoadingStage,
  STAGE_CONFIG,
} from "./stage-timeline";
export type {
  OrbConfig,
  IndicatorConfig,
  CardConfig,
  StageConfig,
} from "./stage-timeline";
```

---

### Step 11 — Integration: `src/components/ai-search/ai-search-page-enhanced.tsx`

**The single source of truth mount point.** This is the most critical integration step.

**Current**:
```tsx
<SearchHero onSearch={handleSearch} isLoading={loading} />
```

**After**:
```tsx
<SearchHero
  onSearch={handleSearch}
  isLoading={loading}
  indicatorConfig={currentStage.indicator}
/>
```

**Current**:
```tsx
<SearchResults
  query={activeQuery}
  results={results}
  isLoading={loading}
  onScrollToTop={handleScrollToTop}
/>
```

**After**:
```tsx
<SearchResults
  query={activeQuery}
  results={results}
  isLoading={loading}
  onScrollToTop={handleScrollToTop}
  currentStage={currentStage}
  stageIndex={stageIndex}
  progress={progress}
/>
```

---

### Step 12 — Integration: `src/components/ai-search/search-results-enhanced.tsx`

**Current code** (lines 287–297):
```tsx
{isLoading && (
  <motion.div ... className="grid ...">
    {Array.from({ length: 6 }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </motion.div>
)}
```

**Replace with**:
```tsx
<AnimatePresence>
  {isLoading && (
    <LoadingStateOverlay
      isLoading={isLoading}
      currentStage={currentStage}
      stageIndex={stageIndex}
      progress={progress}
    />
  )}
</AnimatePresence>
```

**New props on SearchResults**:
```tsx
interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  onScrollToTop: () => void;
  currentStage: StageConfig;    // ← NEW
  stageIndex: number;           // ← NEW
  progress: number;             // ← NEW
}
```

---

### Step 13 — Integration: `src/components/ai-search/search-hero-enhanced.tsx`

**Current code** (lines 189–193):
```tsx
{isLoading ? (
  <>
    <Loader2 className="w-5 h-5 animate-spin" />
    <span>Searching opportunities...</span>
  </>
) : (...)}
```

**Replace with**:
```tsx
{isLoading ? (
  <SearchButtonLoader indicatorConfig={indicatorConfig} />
) : (...)}
```

**New props on SearchHero**:
```tsx
interface SearchHeroProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  indicatorConfig: IndicatorConfig;   // ← NEW
}
```

---

### Step 14 — Integration: `src/components/ai-search/chat-message.tsx`

The chat context is **isolated** from the search hero/results flow — it's a different UI mode. Here, `useStageTimeline` is called locally since there's no shared parent with the hero button.

```tsx
export function StreamingMessageSkeleton() {
  // Chat context: standalone timeline (not shared with search hero)
  const { currentStage, stageIndex, progress } = useStageTimeline(true);

  return (
    <div className="flex w-full gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <BotAvatar size="sm" className="mt-1 shrink-0" />
      <div className="flex w-full max-w-4xl flex-col gap-4">
        <LoadingStateOverlay
          isLoading={true}
          currentStage={currentStage}
          stageIndex={stageIndex}
          progress={progress}
          cardCount={3}
        />
      </div>
    </div>
  );
}
```

**Note**: `cardCount={3}` for chat context vs `6` for search results. The `useStageTimeline(true)` here is correct because `StreamingMessageSkeleton` is only rendered while streaming is active — it's effectively the single source of truth for its own subtree.

---

## Data Flow Diagram

```
User submits search query
│
│  ★ SINGLE SOURCE OF TRUTH
│
├── ai-search-page-enhanced.tsx
│   │
│   │  useStageTimeline(loading) ── called ONCE
│   │  ├── currentStage: StageConfig
│   │  ├── stageIndex: number
│   │  └── progress: number
│   │
│   │  Stage advancement (timer chain):
│   │  ├── t=0s: stageIndex=0 (THINKING)
│   │  ├── t=2s: stageIndex=1 (ANALYZING)
│   │  ├── t=4s: stageIndex=2 (REMODELING)
│   │  ├── t=6s: stageIndex=3 (CURATING)
│   │  └── t=8s: stageIndex=4 (DONE)
│   │
│   ├── SearchHero
│   │   └── SearchButtonLoader
│   │       └── receives indicatorConfig={currentStage.indicator}  ← PROP
│   │           ├── gradient → text color
│   │           └── label → button text
│   │
│   └── SearchResults
│       └── LoadingStateOverlay
│           ├── receives currentStage, stageIndex, progress  ← PROPS
│           │
│           ├── AIThinkingOrb
│           │   └── receives orbConfig={currentStage.orb}   ← PROP
│           │       ├── gradient → orb fill
│           │       ├── scale → orb size
│           │       ├── borderRadius → orb shape
│           │       └── rotation → orb angle
│           │
│           ├── ThinkingStageIndicator
│           │   └── receives indicatorConfig, progress       ← PROPS
│           │       ├── label → typewriter text
│           │       ├── gradient → text + bar color
│           │       └── progress → bar width
│           │
│           └── ShimmerCardGrid
│               └── receives cardConfig={currentStage.card}  ← PROP
│                   ├── Sets CSS vars on grid container:
│                   │   ├── --aurora-color → aurora border gradient
│                   │   ├── --shimmer-opacity → sweep brightness
│                   │   ├── aurora-active class → aurora opacity
│                   │   └── float-active class → card float
│                   │
│                   └── ShimmerCard × 6  (React.memo, prop: { delay })
│                       ├── inherits --aurora-color via CSS cascade
│                       ├── inherits --shimmer-opacity via CSS cascade
│                       ├── aurora border via ::before mask-composite
│                       ├── shimmer sweep via translateX CSS animation
│                       └── float via parent class toggle
│                       ★ ZERO JS RE-RENDERS ON STAGE CHANGE
│
└── Results arrive (loading=false)
    ├── useStageTimeline resets to stageIndex=0
    ├── AnimatePresence exits LoadingStateOverlay (opacity 0)
    └── Results grid enters with cardVariants stagger
```

---

## Animation Performance Budget

| Metric | Target | How Verified |
|---|---|---|
| FPS during loading | ≥ 58fps on mid-range | Chrome DevTools Performance tab |
| Compositor-only animated props | 100% are `transform` or `opacity` | Code review — no `backgroundPosition`, `left`, `top`, `width` in loops |
| Layout thrash | 0 forced reflows per frame | No `offsetHeight`/`getBoundingClientRect` in animation paths |
| Paint per frame | ≤ 2 paint layers per card | `backdrop-blur` on card container only; shimmer is `transform: translateX()` |
| Card re-renders per stage tick | 0 | `React.memo` + CSS var inheritance — DevTools Profiler confirms |
| Bundle increase | < 5KB gzipped | `next build` output comparison |

---

## Reduced Motion Strategy

Two layers of defense:

### 1. CSS `@media` (see Step 8)
Kills all looping `@keyframes` animations. Shows aurora as static 15% opacity border.

### 2. Framer Motion `useReducedMotion()` (in components)
Programmatic fallback in `AIThinkingOrb` and `ThinkingStageIndicator`:

- **AIThinkingOrb**: Renders a static `div` with `bg-gradient-to-br ${gradient}` and `box-shadow` glow. No `AnimatePresence`, no sub-orbs.
- **ThinkingStageIndicator**: Shows full `indicatorConfig.label` instantly (no typewriter). No cursor blink. Progress bar still animates width (single transition, not looping).

---

## Edge Cases

| Scenario | Handling |
|---|---|
| Results arrive in < 2s (before first stage transition) | `isLoading` flips to false → `useStageTimeline` effect cleanup fires (`cancelled = true`, timeout cleared) → `AnimatePresence` exits overlay → results enter. No visual glitch. |
| Results arrive mid-stage (e.g., during ANALYZING) | Same as above — immediate exit. The orb doesn't need to reach DONE. |
| Rapid search → cancel → search again | `isLoading` toggles false → true. The cleanup function from the first `isLoading=true` effect sets `cancelled = true` and clears the timeout. The new effect starts a fresh chain from THINKING. No orphaned timeouts. |
| User navigates away and back during loading | Component unmounts → `cancelled = true` + `clearTimeout`. Remount → new chain from THINKING. |
| Two simultaneous searches (race condition) | Not possible — UI disables the search button during loading. |
| `prefers-reduced-motion` enabled | CSS kills loop animations. Components render static fallbacks. |
| Dark mode | All gradients use Tailwind `dark:` variants. CSS custom properties resolve to dark-safe colors. |
| Mobile viewport (375px) | ShimmerCardGrid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — same as current. Orb + indicator scale down on mobile. |
| Very slow network (> 8s) | After CURATING stage, stays at DONE (scale:0 orb, empty text, full-progress bar, fully-lit skeletons) until results arrive. No infinite stage cycling. |
| Chat streaming context (chat-message.tsx) | `useStageTimeline(true)` called locally — correct because it's an isolated subtree, not shared with the search hero. |

---

## Verification Checklist

| # | Test | Expected Result |
|---|---|---|
| 1 | Submit a search query on `/ai-search` | Loading overlay appears with THINKING orb + "Understanding your query..." text |
| 2 | Wait 2s during loading | Orb transitions to ANALYZING (violet, two orbiting orbs) + "Evaluating opportunities..." |
| 3 | Wait 4s during loading | Orb transitions to REMODELING (emerald, morphing pill) + "Refining your results..." + aurora borders appear |
| 4 | Wait 6s during loading | Orb transitions to CURATING (amber, spinning diamond) + "Selecting the best matches..." + cards float |
| 5 | Results arrive at any point | Loading overlay exits smoothly, results grid enters with stagger |
| 6 | Hero button during loading | Shows gradient sweep + stage label — **synchronized with orb** (same stage at the same time) |
| 7 | Hero button label vs orb state | **Always identical** — both driven by same `currentStage` from single hook |
| 8 | Rapid search → cancel → search again | No orphaned animations, no "stuck" stage, chain restarts cleanly from THINKING |
| 9 | Enable `prefers-reduced-motion` | Static orb, instant text, simple pulse skeletons — no orbit/morph/aurora |
| 10 | Dark mode | All loading visuals render correctly in dark theme |
| 11 | Mobile viewport (375px) | Single column skeleton grid, centered orb, readable text |
| 12 | Chrome DevTools Performance tab | ≥ 58fps during loading animation |
| 13 | Chrome DevTools Profiler | 0 ShimmerCard re-renders on stage transition (React.memo + CSS vars) |
| 14 | `tsc --noEmit` | No TypeScript errors |
| 15 | `npm run lint` | No new lint errors |
| 16 | Bundle size check | < 5KB gzipped increase from baseline |

---

## Dependency Map (No New Packages)

```
framer-motion (existing)    ← AnimatePresence, motion, useReducedMotion
@/lib/ai-search-animations  ← new variants (orbContainerVariants, etc.)
@/app/ai-search/ai-search.css ← new @keyframes + mask-composite aurora + shimmer-sweep
React 19 (existing)         ← useState, useEffect, useRef, memo
```

Zero new npm dependencies.

---

## File Summary

### New Files (7)

| # | File | Lines (est.) | Purpose |
|---|---|---|---|
| 1 | `src/components/ai-search/loading/stage-timeline.ts` | ~120 | Stage enum, ISP-segregated config interfaces, STAGE_CONFIG array, `useStageTimeline` hook with cancellation guard |
| 2 | `src/components/ai-search/loading/ai-thinking-orb.tsx` | ~180 | 5 sub-orb components + main orchestrator, receives `OrbConfig` only |
| 3 | `src/components/ai-search/loading/thinking-stage-indicator.tsx` | ~80 | Typewriter text + progress bar, receives `IndicatorConfig` + `progress` only |
| 4 | `src/components/ai-search/loading/shimmer-card-grid.tsx` | ~70 | Grid container (sets CSS vars) + `React.memo` ShimmerCard (prop: `delay` only) |
| 5 | `src/components/ai-search/loading/loading-state-overlay.tsx` | ~50 | Composition root, receives `StageConfig` + `stageIndex` + `progress` (no hook) |
| 6 | `src/components/ai-search/loading/search-button-loader.tsx` | ~30 | Button gradient sweep + stage label, receives `IndicatorConfig` only (no hook) |
| 7 | `src/components/ai-search/loading/index.ts` | ~15 | Barrel exports + types |

### Modified Files (5)

| # | File | Change |
|---|---|---|
| 1 | `src/app/ai-search/ai-search.css` | Add 8 `@keyframes` + mask-composite aurora + `shimmer-sweep` + `float-active` + reduced-motion block (~100 lines) |
| 2 | `src/lib/ai-search-animations.ts` | Add 7 new variant exports (~80 lines) |
| 3 | `src/components/ai-search/ai-search-page-enhanced.tsx` | Call `useStageTimeline` once, pass `currentStage`/`stageIndex`/`progress` as props to children (~15 lines changed) |
| 4 | `src/components/ai-search/search-results-enhanced.tsx` | Replace `CardSkeleton` with `LoadingStateOverlay`; accept + forward stage props (~10 lines changed) |
| 5 | `src/components/ai-search/search-hero-enhanced.tsx` | Replace `Loader2` with `SearchButtonLoader`; accept + forward `indicatorConfig` prop (~5 lines changed) |
| 6 | `src/components/ai-search/chat-message.tsx` | Replace `StreamingMessageSkeleton` inner content; call `useStageTimeline` locally (isolated context) (~8 lines changed) |

**Total estimated new code**: ~545 lines
**Total estimated modified code**: ~38 lines changed + ~180 lines added to existing files
