# Data Model & State Transitions: Interactive Entertaining Loading State

**Feature Branch**: `019-interactive-loading-state`  
**Date**: 2026-07-29  
**Spec**: [spec.md](file:///c:/Users/dell/Documents/ScholarX/V2/web/specs/019-interactive-loading-state/spec.md) | **Research**: [research.md](file:///c:/Users/dell/Documents/ScholarX/V2/web/specs/019-interactive-loading-state/research.md)

## 1. Core Entities & TypeScript Interfaces

### File: `contracts/interactive-loader.types.ts`

```typescript
// ── Branded Types ──────────────────────────────────────────
export type SessionId = string & { readonly __brand: 'SessionId' };
export type TriviaId = string  & { readonly __brand: 'TriviaId' };

// ── Discriminated State ────────────────────────────────────
export type LoadingPhase =
  | 'idle'
  | 'threshold_wait'
  | 'active_loading'
  | 'completing'
  | 'error'
  | 'dismissed';

export type LoadingContextDomain =
  | 'scholarship_match'
  | 'course_enrollment'
  | 'video_processing'
  | 'certificate_generation'
  | 'general';

// ── Stage Model ─────────────────────────────────────────────
export interface LoadingStage {
  id: string;
  order: number;
  label: string;
  description?: string;
  isComplete: boolean;
  isCurrent: boolean;
}

// ── Session State (immutable, fed by reducer) ──────────────
export interface LoadingSessionState {
  readonly sessionId: SessionId;
  readonly contextDomain: LoadingContextDomain;
  readonly phase: LoadingPhase;
  readonly startTime: number;
  readonly elapsedMs: number;
  readonly stages: readonly LoadingStage[];
  readonly currentStageIndex: number;
  readonly errorDetails?: {
    readonly message: string;
    readonly code?: string;
    readonly canRetry: boolean;
  };
}

// ── State Machine Events (discriminated union) ─────────────
export type LoaderEvent =
  | { type: 'LOAD_STARTED'; domain: LoadingContextDomain }
  | { type: 'THRESHOLD_EXCEEDED' }
  | { type: 'STAGE_ADVANCED' }
  | { type: 'OPERATION_COMPLETED' }
  | { type: 'OPERATION_FAILED'; message: string; code?: string; canRetry: boolean }
  | { type: 'RETRY_INITIATED' }
  | { type: 'DISMISSED' };

// ── Trivia ──────────────────────────────────────────────────
export interface TriviaOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TriviaQuestion {
  id: TriviaId;
  category: LoadingContextDomain;
  question: string;
  options: TriviaOption[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TriviaAnswerResult {
  questionId: TriviaId;
  selectedOptionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
}

// ── User Preferences ────────────────────────────────────────
export interface UserLoaderPreferences {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  gameModeEnabled: boolean;
  simplifiedAnimations: boolean;
}

// ── Session Stats ───────────────────────────────────────────
export interface LearnerSessionStats {
  triviaAnswered: number;
  triviaCorrect: number;
  bubblesPopped: number;
  totalProductiveWaitTimeMs: number;
}
```

### File: `contracts/interactive-loader.events.ts`

```typescript
export type LoaderDomainEventType =
  | 'LOADING_SESSION_STARTED'
  | 'LOADING_SESSION_COMPLETED'
  | 'LOADING_SESSION_FAILED'
  | 'TRIVIA_ANSWERED'
  | 'BUBBLE_POPPED';

export interface LoadingSessionStartedEvent {
  type: 'LOADING_SESSION_STARTED';
  payload: { sessionId: SessionId; domain: LoadingContextDomain };
  timestamp: number;
}

export interface LoadingSessionCompletedEvent {
  type: 'LOADING_SESSION_COMPLETED';
  payload: { sessionId: SessionId; elapsedMs: number };
  timestamp: number;
}

export interface LoadingSessionFailedEvent {
  type: 'LOADING_SESSION_FAILED';
  payload: { sessionId: SessionId; error: string };
  timestamp: number;
}

export interface TriviaAnsweredEvent {
  type: 'TRIVIA_ANSWERED';
  payload: TriviaAnswerResult;
  timestamp: number;
}

export interface BubblePoppedEvent {
  type: 'BUBBLE_POPPED';
  payload: { sessionId: SessionId };
  timestamp: number;
}

export type LoaderDomainEvent =
  | LoadingSessionStartedEvent
  | LoadingSessionCompletedEvent
  | LoadingSessionFailedEvent
  | TriviaAnsweredEvent
  | BubblePoppedEvent;
```

### File: `contracts/trivia.repository.ts`

```typescript
export interface ITriviaRepository {
  getQuestionsByDomain(domain: LoadingContextDomain, limit?: number): TriviaQuestion[];
  getQuestionById(id: TriviaId): TriviaQuestion | undefined;
  getAllDomains(): LoadingContextDomain[];
}
```

### File: `contracts/preferences.repository.ts`

```typescript
export interface IPreferencesRepository {
  get(): UserLoaderPreferences;
  update(updates: Partial<UserLoaderPreferences>): void;
}
```

### File: `contracts/stats.repository.ts`

```typescript
export interface IStatsRepository {
  get(): LearnerSessionStats;
  recordTriviaAnswer(result: TriviaAnswerResult): void;
  recordBubblePop(): void;
  recordWaitTime(ms: number): void;
  reset(): void;
}
```

---

## 2. State Machine (Reducer Pattern)

### State → Event → State (Pure Reducer)

The state machine is a pure function `reducer(state: LoadingSessionState, event: LoaderEvent): LoadingSessionState`.
This makes every state transition deterministic, exhaustively testable, and free of side effects.

```
                    ┌──────────────────────────────────────┐
                    │              IDLE                     │
                    │  phase: 'idle'                        │
                    │  stages: [], sessionId: null          │
                    └────────┬─────────────────────────────┘
                             │ LOAD_STARTED
                             ▼
                    ┌──────────────────────────────────────┐
                    │          THRESHOLD_WAIT               │
                    │  phase: 'threshold_wait'              │
                    │  timer: 300ms countdown               │
                    └──────┬──────────────────┬────────────┘
                           │                  │
                    DISMISSED◄──── < 300ms ───┤
                           │                  │ THRESHOLD_EXCEEDED
                           │                  ▼
                           │      ┌──────────────────────────┐
                           │      │     ACTIVE_LOADING       │
                           │      │  phase: 'active_loading' │
                           │      │  stages: [...]           │
                           │      └──┬────┬────┬────┬────────┘
                           │         │    │    │    │
                           │         │    │    │    └── OPERATION_FAILED
                           │         │    │    │                   │
                           │         │    │    │                   ▼
                           │         │    │    │          ┌──────────────────┐
                           │         │    │    │          │      ERROR      │
                           │         │    │    │          │ phase: 'error'  │
                           │         │    │    │          │ error: { ... }  │
                           │         │    │    │          └──┬──────────┬───┘
                           │         │    │    │    RETRY ◄──┘          └── DISMISSED
                           │         │    │    │
                           │         │    │    └── OPERATION_COMPLETED
                           │         │    │                   │
                           │         │    │                   ▼
                           │         │    │          ┌──────────────────┐
                           │         │    │          │   COMPLETING     │
                           │         │    │          │ phase: 'completing'
                           │         │    │          │ 500ms success    │
                           │         │    │          └──────┬───────────┘
                           │         │    │                 │ DISMISSED
                           │         │    │                 ▼
                           │         │    │          ┌──────────────────┐
                           │         │    │          │   DISMISSED      │──► [*]
                           │         │    │          └──────────────────┘
                           │         │    │
                           │    STAGE_ADVANCED   (updates currentStageIndex)
                           │         │
                           │    User interactions (trivia, mini-game) are
                           │    transient UI state, NOT machine states.
                           │    The machine stays in 'active_loading'
                           │    while the user plays; only the operation
                           │    completion/failure transitions it out.
```

### Key Design Decision

Trivia interaction and mini-game are **UI-level overlays**, not state machine phases. The machine remains in `'active_loading'` while the user answers trivia or pops bubbles. This avoids combinatorial explosion of states and keeps the reducer simple. The active sub-mode (trivia vs. game vs. progress) is tracked as a lightweight UI string, not a domain state.

### Reducer Exhaustiveness Check

```typescript
export function loaderReducer(
  state: LoadingSessionState,
  event: LoaderEvent
): LoadingSessionState {
  switch (event.type) {
    case 'LOAD_STARTED':      { /* ... */ }
    case 'THRESHOLD_EXCEEDED': { /* ... */ }
    case 'STAGE_ADVANCED':    { /* ... */ }
    case 'OPERATION_COMPLETED': { /* ... */ }
    case 'OPERATION_FAILED':  { /* ... */ }
    case 'RETRY_INITIATED':   { /* ... */ }
    case 'DISMISSED':         { /* ... */ }
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
```

---

## 3. Storage & Persistence Schema

- **Key**: `scholarx_loader_preferences`  
  **Storage Type**: `localStorage`  
  **Payload**: `JSON.stringify(UserLoaderPreferences)`

- **Key**: `scholarx_loader_stats`  
  **Storage Type**: `sessionStorage`  
  **Payload**: `JSON.stringify(LearnerSessionStats)`
