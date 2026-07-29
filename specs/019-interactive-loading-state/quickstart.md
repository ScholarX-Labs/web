# Quickstart & Integration Guide: Interactive Entertaining Loading State

**Feature Branch**: `019-interactive-loading-state`  
**Date**: 2026-07-29  
**Spec**: [spec.md](file:///c:/Users/dell/Documents/ScholarX/V2/web/specs/019-interactive-loading-state/spec.md)

## 1. Component Usage Example

```tsx
'use client';

import { useState, useCallback } from 'react';
import { InteractiveLoader } from '@/components/interactive-loader';

const STAGES = [
  { id: 'profile',    order: 1, label: 'Reading Learner Profile',           isComplete: false, isCurrent: true  },
  { id: 'querying',   order: 2, label: 'Querying 50,000+ Global Opportunities', isComplete: false, isCurrent: false },
  { id: 'ranking',    order: 3, label: 'Ranking AI Confidence Scores',       isComplete: false, isCurrent: false },
];

export function ScholarshipMatchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Perform async fetch...
      // Call advanceStage() via onStageAdvance or use InteractiveLoader internally
    } catch (e) {
      setError('Connection timed out while querying matches.');
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    handleStart();
  }, [handleStart]);

  return (
    <div>
      <button onClick={handleStart}>Find Matches</button>

      <InteractiveLoader
        isLoading={isLoading}
        domain="scholarship_match"
        title="ScholarX AI Matchmaker"
        stages={STAGES}
        error={error}
        onRetry={handleRetry}
        onComplete={() => setIsLoading(false)}
      />
    </div>
  );
}
```

---

## 2. Testing & Verification

1. **Test Threshold Anti-Flicker (< 300ms)**:  
   Trigger a simulated fast request (100ms) and verify `<InteractiveLoader />` stays unmounted.

2. **Test Trivia & Mini-Game (> 800ms)**:  
   Trigger a simulated slow request (3000ms), answer a trivia question, pop bubbles, and verify sound/haptic toggle button works cleanly.

3. **Test Accessibility**:  
   Enable OS reduced motion (`prefers-reduced-motion: reduce`), open loader, and verify high-intensity particle animations are replaced with static elegant status badges.
