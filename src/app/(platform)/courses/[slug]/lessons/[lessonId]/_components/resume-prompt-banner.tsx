"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Play } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { fadeSlideUp } from "@/lib/motion-variants";
import { zIndex } from "@/lib/design-tokens";
import { useEffect, useState } from "react";

interface ResumePromptBannerProps {
  /** Resume position in seconds */
  resumePoint: number;
  onResume: (position: number) => void;
  onDismiss: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * ResumePromptBanner — Spring-animated intelligent resume prompt.
 *
 * Shown when a learner returns to a partially-watched lesson.
 * Auto-dismisses after 8 seconds. Provides [Resume] and [Start Over] options.
 *
 * Position: fixed bottom toast-level, centered horizontally.
 */
export function ResumePromptBanner({
  resumePoint,
  onResume,
  onDismiss,
}: ResumePromptBannerProps) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // wait for exit animation
    }, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleResume = () => {
    setVisible(false);
    setTimeout(() => onResume(resumePoint), 100);
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-white/15 bg-[#0d1225]/90 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] text-white"
          style={{ zIndex: zIndex.toast }}
        >
          {/* Icon */}
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
          </div>

          {/* Text */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Continue watching?</span>
            <span className="text-xs text-white/50">You left off at {formatTime(resumePoint)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-2">
            <AnimatedButton
              onClick={handleResume}
              aria-label={`Resume from ${formatTime(resumePoint)}`}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]"
            >
              Resume
            </AnimatedButton>
            <AnimatedButton
              onClick={handleDismiss}
              aria-label="Start from beginning"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10"
            >
              <Check className="w-3 h-3" />
            </AnimatedButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
