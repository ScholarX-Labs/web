import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInteractiveLoader } from './useInteractiveLoader';
import { TriviaOverlay } from './TriviaOverlay';
import { ProgressStageTrack } from './ProgressStageTrack';
import { BubblePopGame } from './BubblePopGame';
import { getTriviaForDomain } from './trivia-data';
import { LoadingContextDomain, LoadingStage } from './types';
import { AlertCircle, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InteractiveLoaderProps {
  isLoading: boolean;
  domain?: LoadingContextDomain;
  title?: string;
  stages?: LoadingStage[];
  currentStageIndex?: number;
  delayThresholdMs?: number;
  error?: string | null;
  onRetry?: () => void;
  onComplete?: () => void;
  children?: ReactNode;
}

export function InteractiveLoader({
  isLoading,
  domain = 'general',
  title = 'Working on it...',
  stages = [],
  currentStageIndex = 0,
  delayThresholdMs = 300,
  error,
  onRetry,
  onComplete,
  children
}: InteractiveLoaderProps) {
  const { 
    phase, 
    currentStage, 
    preferences, 
    updatePreferences,
    triggerRetry
  } = useInteractiveLoader({
    isLoading,
    domain,
    stages,
    currentStageIndex,
    delayThresholdMs,
    error,
    onComplete,
    onRetry
  });

  const triviaBank = React.useMemo(() => getTriviaForDomain(domain), [domain]);
  
  // Track local stats
  const handleStatsUpdate = (isCorrect: boolean) => {
    // In a real app, save to sessionStorage or global store
  };
  
  const handlePop = () => {
    // In a real app, save to sessionStorage
  };

  const toggleSound = () => {
    updatePreferences({ soundEnabled: !preferences.soundEnabled });
  };

  // Do not render anything if idle, threshold_wait, or dismissed (and we show children instead)
  if (phase === 'idle' || phase === 'threshold_wait' || phase === 'dismissed') {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <AnimatePresence mode="wait">
        {(phase === 'active_loading' || phase === 'completing' || phase === 'error') && (
          <motion.div
            key="interactive-loader-overlay"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // smooth spring
            className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-2xl"
            aria-busy={phase === 'active_loading'}
            aria-live="assertive"
          >
            {/* Top controls */}
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={toggleSound}
                className="p-3 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-zinc-800 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors"
                aria-label={preferences.soundEnabled ? "Mute sounds" : "Enable sounds"}
              >
                {preferences.soundEnabled ? <Volume2 className="w-5 h-5 text-zinc-700 dark:text-zinc-300" /> : <VolumeX className="w-5 h-5 text-zinc-400" />}
              </button>
            </div>

            {/* Bubble Game layer */}
            {phase === 'active_loading' && (
              <BubblePopGame preferences={preferences} onPop={handlePop} />
            )}

            {/* Content layer */}
            <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
              
              {/* Header */}
              {phase !== 'error' && (
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center"
                >
                  <h2 className="text-2xl md:text-3xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {phase === 'completing' ? 'All done!' : title}
                  </h2>
                </motion.div>
              )}

              {/* Error State */}
              {phase === 'error' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-8 text-center max-w-md w-full shadow-xl"
                >
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">Something went wrong</h3>
                  <p className="text-red-700 dark:text-red-400 mb-6">{error || 'An unexpected error occurred while loading.'}</p>
                  
                  {onRetry && (
                    <button
                      onClick={triggerRetry}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors w-full sm:w-auto"
                      style={{ minHeight: '44px' }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Try Again
                    </button>
                  )}
                </motion.div>
              )}

              {/* Completing State Banner */}
              {phase === 'completing' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center gap-4 shadow-lg"
                >
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-medium text-lg">Results are ready, bringing you there...</p>
                </motion.div>
              )}

              {/* Active Loading Split Layout */}
              {phase === 'active_loading' && (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Left side: Stage Tracker (if provided) */}
                  <div className="w-full flex justify-center">
                    {stages.length > 0 ? (
                      <ProgressStageTrack stages={stages} currentStageIndex={currentStageIndex} />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                    )}
                  </div>
                  
                  {/* Right side: Trivia/Game UI */}
                  <div className="w-full">
                    <TriviaOverlay 
                      questions={triviaBank} 
                      preferences={preferences}
                      onStatsUpdate={handleStatsUpdate}
                    />
                  </div>

                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Underlying content is hidden while loader is active, unless we want a skeleton */}
      <div className="hidden">
        {children}
      </div>
    </div>
  );
}

// Needed because we reference this icon locally
function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
