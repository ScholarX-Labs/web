"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCompletionBannerProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

/**
 * LessonCompletionBanner — A "Spatial UI" style notification that appears
 * when a lesson is successfully completed (reaches 95%).
 */
export function LessonCompletionBanner({ isVisible }: LessonCompletionBannerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(10px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
        >
          <div className={cn(
            "flex items-center gap-3 px-6 py-3 rounded-2xl",
            "bg-emerald-500/10 backdrop-blur-2xl border border-emerald-500/20",
            "shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)]"
          )}>
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-emerald-400/20 blur-md rounded-full"
              />
              <CheckCircle2 className="w-6 h-6 text-emerald-400 relative z-10" />
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight leading-none">
                Lesson Completed!
              </span>
              <span className="text-[10px] font-medium text-emerald-400/80 uppercase tracking-widest mt-1">
                95% Milestone Achieved
              </span>
            </div>

            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-emerald-300/50" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
