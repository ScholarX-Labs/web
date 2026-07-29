import { useState, useEffect, useCallback, useRef } from 'react';
import { LoadingPhase, LoadingContextDomain, LoadingStage, UserLoaderPreferences } from './types';
import { audioHapticController } from './AudioHapticController';

export interface UseInteractiveLoaderOptions {
  isLoading: boolean;
  domain?: LoadingContextDomain;
  stages?: LoadingStage[];
  currentStageIndex?: number;
  delayThresholdMs?: number;
  error?: string | null;
  onComplete?: () => void;
  onRetry?: () => void;
}

const DEFAULT_PREFERENCES: UserLoaderPreferences = {
  soundEnabled: true,
  hapticsEnabled: true,
  gameModeEnabled: true,
  simplifiedAnimations: false,
};

export function useInteractiveLoader({
  isLoading,
  domain: _domain = 'general',
  stages = [],
  currentStageIndex = 0,
  delayThresholdMs = 300,
  error = null,
  onComplete,
  onRetry
}: UseInteractiveLoaderOptions) {
  const [phase, setPhase] = useState<LoadingPhase>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [preferences, setPreferences] = useState<UserLoaderPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem('scholarx_loader_preferences');
      const initial: UserLoaderPreferences = stored ? JSON.parse(stored) : { ...DEFAULT_PREFERENCES };
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        initial.simplifiedAnimations = true;
      }
      return initial;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });
  const startTimeRef = useRef<number>(0);

  // Track previous inputs for render-phase state adjustments
  const [prevIsLoading, setPrevIsLoading] = useState(isLoading);
  const [prevError, setPrevError] = useState(error);

  // 1. Adjust state during render when isLoading changes
  if (isLoading !== prevIsLoading) {
    setPrevIsLoading(isLoading);
    if (isLoading && (phase === 'idle' || phase === 'dismissed')) {
      setPhase('threshold_wait');
      startTimeRef.current = Date.now();
    } else if (!isLoading) {
      if (phase === 'active_loading' && !error) {
        setPhase('completing');
      } else if (phase === 'threshold_wait') {
        setPhase('dismissed');
      }
    }
  }

  // 2. Adjust state during render when error changes
  if (error !== prevError) {
    setPrevError(error);
    if (error && phase !== 'error' && phase !== 'dismissed' && phase !== 'idle') {
      setPhase('error');
    }
  }

  const updatePreferences = useCallback((updates: Partial<UserLoaderPreferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates };
      try {
        localStorage.setItem('scholarx_loader_preferences', JSON.stringify(newPrefs));
      } catch {
        // Ignore storage errors
      }
      return newPrefs;
    });
  }, []);

  // Handle threshold_wait -> active_loading transition
  useEffect(() => {
    if (isLoading && phase === 'threshold_wait') {
      const timer = setTimeout(() => {
        setPhase('active_loading');
        audioHapticController.init();
      }, delayThresholdMs);
      return () => clearTimeout(timer);
    }
  }, [isLoading, phase, delayThresholdMs]);

  // Handle side effects and completion when entering 'completing' or 'dismissed'
  useEffect(() => {
    if (phase === 'completing') {
      audioHapticController.playSuccessSound(preferences);
      audioHapticController.triggerSuccessHaptic(preferences);

      const timer = setTimeout(() => {
        setPhase('dismissed');
        if (onComplete) onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, preferences, onComplete]);

  // Handle onComplete when dismissed from threshold_wait
  useEffect(() => {
    if (phase === 'dismissed' && !isLoading) {
      if (onComplete) onComplete();
    }
  }, [phase, isLoading, onComplete]);

  // Elapsed time counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'active_loading') {
      interval = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const currentStage = stages && stages.length > 0 && currentStageIndex >= 0 && currentStageIndex < stages.length 
    ? stages[currentStageIndex] 
    : null;

  return {
    phase,
    currentStage,
    elapsedMs,
    preferences,
    updatePreferences,
    triggerRetry: onRetry || (() => {})
  };
}
