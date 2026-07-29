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
  domain = 'general',
  stages = [],
  currentStageIndex = 0,
  delayThresholdMs = 300,
  error = null,
  onComplete,
  onRetry
}: UseInteractiveLoaderOptions) {
  const [phase, setPhase] = useState<LoadingPhase>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [preferences, setPreferences] = useState<UserLoaderPreferences>(DEFAULT_PREFERENCES);
  const startTimeRef = useRef<number>(0);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('scholarx_loader_preferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
      
      // Check OS reduced motion preference
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setPreferences(prev => ({ ...prev, simplifiedAnimations: true }));
      }
    } catch (e) {
      // Ignore errors if localStorage is unavailable
    }
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserLoaderPreferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates };
      try {
        localStorage.setItem('scholarx_loader_preferences', JSON.stringify(newPrefs));
      } catch (e) {
        // Ignore errors
      }
      return newPrefs;
    });
  }, []);

  // 1. Idle/Dismissed -> Threshold Wait
  useEffect(() => {
    if (isLoading && (phase === 'idle' || phase === 'dismissed')) {
      setPhase('threshold_wait');
      startTimeRef.current = Date.now();
    }
  }, [isLoading, phase]);

  // 2. Threshold Wait -> Active Loading
  useEffect(() => {
    if (isLoading && phase === 'threshold_wait') {
      const timer = setTimeout(() => {
        setPhase('active_loading');
        audioHapticController.init();
      }, delayThresholdMs);
      return () => clearTimeout(timer);
    }
  }, [isLoading, phase, delayThresholdMs]);

  // 3. Active Loading -> Completing OR Threshold Wait -> Dismissed
  useEffect(() => {
    if (!isLoading) {
      if (phase === 'active_loading' && !error) {
        setPhase('completing');
        audioHapticController.playSuccessSound(preferences);
        audioHapticController.triggerSuccessHaptic(preferences);
      } else if (phase === 'threshold_wait') {
        setPhase('dismissed');
        if (onComplete) onComplete();
      }
    }
  }, [isLoading, phase, error, preferences, onComplete]);

  // 4. Completing -> Dismissed
  useEffect(() => {
    if (phase === 'completing') {
      const timer = setTimeout(() => {
        setPhase('dismissed');
        if (onComplete) onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // 5. Any -> Error
  useEffect(() => {
    if (error && phase !== 'error' && phase !== 'dismissed' && phase !== 'idle') {
      setPhase('error');
    }
  }, [error, phase]);

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
