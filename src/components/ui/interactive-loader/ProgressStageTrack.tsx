import React from 'react';
import { motion } from 'framer-motion';
import { LoadingStage } from './types';
import { Check, Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ProgressStageTrackProps {
  stages: LoadingStage[];
  currentStageIndex: number;
}

export function ProgressStageTrack({ stages, currentStageIndex }: ProgressStageTrackProps) {
  if (!stages || stages.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-4" role="status" aria-live="polite">
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isComplete = index < currentStageIndex || stage.isComplete;
          const isCurrent = index === currentStageIndex && !stage.isComplete;
          const isPending = index > currentStageIndex && !stage.isComplete;

          return (
            <motion.div
              key={stage.id}
              initial={false}
              animate={{
                opacity: isPending ? 0.5 : 1,
                x: isCurrent ? 8 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-4"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center w-8 h-8">
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{index + 1}</span>
                  </div>
                )}
                
                {/* Connecting line */}
                {index < stages.length - 1 && (
                  <div 
                    className={twMerge(
                      "absolute top-8 left-1/2 -ml-px w-0.5 h-6 -mb-6 z-[-1]",
                      isComplete ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
                    )} 
                  />
                )}
              </div>

              <div className="flex-1">
                <p className={twMerge(
                  "text-sm font-medium transition-colors duration-300",
                  isComplete ? "text-zinc-900 dark:text-zinc-100" : 
                  isCurrent ? "text-indigo-700 dark:text-indigo-300" : 
                  "text-zinc-500 dark:text-zinc-400"
                )}>
                  {stage.label}
                </p>
                {stage.description && isCurrent && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-zinc-500 dark:text-zinc-400 mt-1"
                  >
                    {stage.description}
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
