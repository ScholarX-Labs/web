'use client';

import React, { useState, useCallback } from 'react';
import { InteractiveLoader } from '@/components/ui/interactive-loader';
import { LoadingStage } from '@/components/ui/interactive-loader/types';

export default function LoaderDemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  
  const [stages, setStages] = useState<LoadingStage[]>([
    { id: '1', order: 1, label: 'Connecting to AI Matchmaker...', isComplete: false, isCurrent: true },
    { id: '2', order: 2, label: 'Scanning 50,000+ global opportunities', isComplete: false, isCurrent: false },
    { id: '3', order: 3, label: 'Ranking confidence scores', isComplete: false, isCurrent: false },
    { id: '4', order: 4, label: 'Finalizing your matches', isComplete: false, isCurrent: false },
  ]);

  const simulateLoading = useCallback((shouldFail = false, fastMode = false) => {
    setIsLoading(true);
    setError(null);
    setCurrentStageIndex(0);
    
    // Reset stages
    setStages(prev => prev.map((s, i) => ({ 
      ...s, 
      isComplete: false, 
      isCurrent: i === 0 
    })));

    if (fastMode) {
      // Complete under the 300ms threshold (anti-flicker test)
      setTimeout(() => {
        setIsLoading(false);
      }, 150);
      return;
    }

    // Normal multi-stage progression
    let step = 0;
    const interval = setInterval(() => {
      step++;
      
      if (step >= 4) {
        clearInterval(interval);
        if (shouldFail) {
          setError('Connection timed out while fetching opportunities. Please try again.');
        } else {
          setStages(prev => prev.map(s => ({ ...s, isComplete: true, isCurrent: false })));
          // Wait for the success banner to show before unmounting
          setTimeout(() => setIsLoading(false), 800);
        }
        return;
      }

      setCurrentStageIndex(step);
      setStages(prev => prev.map((s, i) => ({
        ...s,
        isComplete: i < step,
        isCurrent: i === step
      })));

    }, 2500); // 2.5 seconds per stage to allow time for trivia/games
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 flex flex-col items-center justify-center font-sans">
      
      <div className="max-w-2xl w-full space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Interactive Loader Demo</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Test the UI UX Pro Max implementations of the new loading states.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => simulateLoading(false, false)}
            className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95 flex flex-col items-center gap-2"
          >
            <span>Standard Load</span>
            <span className="text-xs text-indigo-200 font-normal">~10s with Trivia & Games</span>
          </button>
          
          <button 
            onClick={() => simulateLoading(true, false)}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95 flex flex-col items-center gap-2"
          >
            <span>Error State</span>
            <span className="text-xs text-red-200 font-normal">Fails at the end</span>
          </button>

          <button 
            onClick={() => simulateLoading(false, true)}
            className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95 flex flex-col items-center gap-2"
          >
            <span>Fast Load (Anti-Flicker)</span>
            <span className="text-xs text-emerald-200 font-normal">&lt; 300ms (No UI)</span>
          </button>
        </div>
        
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
          <strong>Pro-tip:</strong> During the standard load, try clicking the floating bubbles (haptics + sound) and answering the trivia question! 
          You can toggle sounds via the top-right button while loading.
        </div>
      </div>

      {/* The Loader Component */}
      {/* We mount it at the page level so it overlays everything when active */}
      <InteractiveLoader
        isLoading={isLoading}
        domain="scholarship_match"
        title="AI Matchmaker is Working..."
        stages={stages}
        currentStageIndex={currentStageIndex}
        error={error}
        onRetry={() => simulateLoading(false, false)}
      />
      
    </div>
  );
}
