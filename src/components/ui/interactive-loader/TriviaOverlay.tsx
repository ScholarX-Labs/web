import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriviaQuestion, TriviaOption, UserLoaderPreferences } from './types';
import { audioHapticController } from './AudioHapticController';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TriviaOverlayProps {
  questions: TriviaQuestion[];
  preferences: UserLoaderPreferences;
  onStatsUpdate: (isCorrect: boolean) => void;
}

export function TriviaOverlay({ questions, preferences, onStatsUpdate }: TriviaOverlayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Cycle to next question if we run out (unlikely for short loads)
  const question = questions[currentQuestionIndex % Math.max(1, questions.length)];

  const handleSelect = (option: TriviaOption) => {
    if (selectedOption !== null) return;
    setSelectedOption(option.id);
    setShowExplanation(true);
    onStatsUpdate(option.isCorrect);

    if (option.isCorrect) {
      audioHapticController.playSuccessSound(preferences);
      audioHapticController.triggerSuccessHaptic(preferences);
    } else {
      audioHapticController.triggerPopHaptic(preferences); // mild feedback for wrong
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6"
      role="region"
      aria-live="polite"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
          Did you know?
        </span>
      </div>

      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-6">
        {question.question}
      </h3>

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const isCorrect = option.isCorrect;
          const showAsCorrect = showExplanation && isCorrect;
          const showAsWrong = showExplanation && isSelected && !isCorrect;

          let btnClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ";
          
          if (!showExplanation) {
            btnClass += "border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-indigo-300";
          } else if (showAsCorrect) {
            btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300";
          } else if (showAsWrong) {
            btnClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
          } else {
            btnClass += "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 opacity-50";
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={showExplanation}
              className={btnClass}
              style={{ minHeight: '44px' }} // Touch target size
            >
              <span className="text-sm font-medium">{option.text}</span>
              {showExplanation && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {showExplanation && showAsWrong && <XCircle className="w-5 h-5 text-red-500" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-sm text-indigo-900 dark:text-indigo-200">
              {question.explanation}
            </div>
            <button
              onClick={handleNext}
              className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              style={{ minHeight: '44px' }}
            >
              Next Question
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
