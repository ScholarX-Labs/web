"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { IndicatorConfig } from "./stage-timeline";

interface ThinkingStageIndicatorProps {
  indicatorConfig: IndicatorConfig;
  progress: number;
}

export function ThinkingStageIndicator({
  indicatorConfig,
  progress,
}: ThinkingStageIndicatorProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (shouldReduceMotion || !indicatorConfig.label) {
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setDisplayedText(indicatorConfig.label);
      }, 0));
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    // Reset display via deferred callback
    timers.push(setTimeout(() => {
      if (cancelled) return;
      setDisplayedText("");

      // Schedule typewriter characters
      indicatorConfig.label.split("").forEach((char, i) => {
        timers.push(setTimeout(() => {
          if (cancelled) return;
          setDisplayedText((prev) => prev + char);
        }, 40 + i * 40));
      });
    }, 0));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [indicatorConfig.label, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        <motion.p
          key={indicatorConfig.stage}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-semibold tracking-wide text-foreground/80 text-center"
          role="status"
          aria-live="polite"
        >
          <span
            className={`bg-gradient-to-r ${indicatorConfig.gradient} bg-clip-text text-transparent`}
          >
            {displayedText}
          </span>
          {showCursor && indicatorConfig.label && (
            <span className="ml-0.5 text-foreground/40 animate-blink">▌</span>
          )}
        </motion.p>
      </AnimatePresence>

      <div className="w-full h-0.5 bg-foreground/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${indicatorConfig.gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
    </div>
  );
}
