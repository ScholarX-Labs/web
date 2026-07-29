# Component Contract: Interactive Loader Component APIs

**Feature Branch**: `019-interactive-loading-state`  
**Date**: 2026-07-29  
**Spec**: [spec.md](file:///c:/Users/dell/Documents/ScholarX/V2/web/specs/019-interactive-loading-state/spec.md)

## 1. Primary Component Interface: `<InteractiveLoader />`

```typescript
import { ReactNode } from 'react';
import { LoadingContextDomain, LoadingStage } from '../types';

export interface InteractiveLoaderProps {
  /** Whether the async operation is currently loading */
  isLoading: boolean;
  
  /** Functional context for trivia and wording selection */
  domain?: LoadingContextDomain;
  
  /** Title displayed at the top of the loading overlay */
  title?: string;
  
  /** Optional array of progress stages */
  stages?: LoadingStage[];
  
  /** Index of currently active stage */
  currentStageIndex?: number;
  
  /** Initial delay before showing loader (default: 300ms) */
  delayThresholdMs?: number;
  
  /** Error message if loading fails */
  error?: string | null;
  
  /** Callback fired when user clicks retry on error state */
  onRetry?: () => void;
  
  /** Callback fired when loader auto-dismisses after completion */
  onComplete?: () => void;
  
  /** Children rendered underneath or replaced upon loading completion */
  children?: ReactNode;
}
```

---

## 2. Hook Contract: `useInteractiveLoader()`

```typescript
export interface UseInteractiveLoaderOptions {
  isLoading: boolean;
  domain?: LoadingContextDomain;
  stages?: string[];
  delayThresholdMs?: number;
  onComplete?: () => void;
}

export interface UseInteractiveLoaderReturn {
  /** Resolved display phase */
  phase: 'idle' | 'threshold_wait' | 'active_loading' | 'completing' | 'error' | 'dismissed';
  
  /** Current stage details */
  currentStage: LoadingStage | null;
  
  /** Elapsed loading time in milliseconds */
  elapsedMs: number;
  
  /** User preference controls */
  preferences: UserLoaderPreferences;
  updatePreferences: (updates: Partial<UserLoaderPreferences>) => void;
  
  /** Action handlers */
  advanceStage: () => void;
  triggerRetry: () => void;
}
```
