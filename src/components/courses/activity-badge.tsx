"use client";

import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { ActivityBadgeProps } from "@/domain/courses/contracts/course-metrics.contract";
import { COUNTER_ANIMATION } from "./counter.constants";

export function ActivityBadge({
  increment,
  dismissAfterMs = COUNTER_ANIMATION.ACTIVITY_BADGE_DISMISS_MS,
}: ActivityBadgeProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, dismissAfterMs);

    return () => clearTimeout(timer);
  }, [increment, dismissAfterMs]);

  if (increment <= 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, scale: shouldReduceMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10, scale: shouldReduceMotion ? 1 : 0.95 }}
          transition={{
            duration: COUNTER_ANIMATION.ACTIVITY_BADGE_ENTRANCE_MS / 1000,
            ease: "easeOut",
          }}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium dark:bg-emerald-900/30 dark:text-emerald-400 ml-2 align-middle shadow-xs"
        >
          <span className="relative flex h-2 w-2">
            {!shouldReduceMotion && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          +{increment} just now
        </motion.div>
      )}
    </AnimatePresence>
  );
}
