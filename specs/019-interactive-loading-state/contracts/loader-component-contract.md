# Component Contract: Interactive Loader Component APIs

**Feature Branch**: `019-interactive-loading-state`  
**Date**: 2026-07-29  
**Spec**: [spec.md](file:///c:/Users/dell/Documents/ScholarX/V2/web/specs/019-interactive-loading-state/spec.md)

## 1. Primary Component Interface: `<InteractiveLoader />`

```typescript
import { ReactNode } from 'react';
import type { LoadingContextDomain, LoadingStage } from '@/domain/interactive-loader/contracts';

export interface InteractiveLoaderProps {
  /** Whether the async operation is currently loading */
  isLoading: boolean;

  /** Functional context for trivia and wording selection */
  domain?: LoadingContextDomain;

  /** Title displayed at the top of the loading overlay */
  title?: string;

  /** Optional array of progress stages (drives ProgressStageTrack) */
  stages?: LoadingStage[];

  /** Index of currently active stage */
  currentStageIndex?: number;

  /** Initial delay before showing loader (default: 300ms) */
  delayThresholdMs?: number;

  /** Error message if loading fails — transitions to error phase */
  error?: string | null;

  /** Whether the error allows retry (default: true) */
  errorCanRetry?: boolean;

  /** Callback fired when user clicks retry on error state */
  onRetry?: () => void;

  /** Callback fired when loader auto-dismisses after completion */
  onComplete?: () => void;

  /** Callback fired when the overlay is collapsed/minimized by user */
  onDismiss?: () => void;

  /** Children rendered underneath or revealed upon loading completion */
  children?: ReactNode;
}
```

---

## 2. Hook Contract: `useInteractiveLoader()`

```typescript
import type {
  LoadingContextDomain,
  LoadingSessionState,
  LoadingStage,
  TriviaQuestion,
  UserLoaderPreferences,
  LearnerSessionStats,
} from '@/domain/interactive-loader/contracts';

export interface UseInteractiveLoaderOptions {
  /** Whether the async operation is currently loading */
  isLoading: boolean;

  /** Functional context for trivia and wording selection */
  domain?: LoadingContextDomain;

  /** Human-readable stage labels for progress tracking */
  stages?: readonly string[];

  /** Initial delay before showing loader (default: 300ms) */
  delayThresholdMs?: number;

  /** Callback fired when loader auto-dismisses after completion */
  onComplete?: () => void;
}

export interface UseInteractiveLoaderReturn {
  /** Resolved display phase (drives which UI sections render) */
  phase: LoadingSessionState['phase'];

  /** Current stage details for ProgressStageTrack */
  currentStage: LoadingStage | null;

  /** Elapsed loading time in milliseconds (for display) */
  elapsedMs: number;

  /** All stages with completion status */
  stages: readonly LoadingStage[];

  /** Current trivia question (null if no question is active) */
  currentTrivia: TriviaQuestion | null;

  /** Cumulative session stats */
  stats: LearnerSessionStats;

  /** User preference controls */
  preferences: UserLoaderPreferences;
  updatePreferences: (updates: Partial<UserLoaderPreferences>) => void;

  /** Action handlers */
  answerTrivia: (optionId: string) => void;
  popBubble: () => void;
  advanceStage: () => void;
  triggerRetry: () => void;
  collapse: () => void;
}
```
