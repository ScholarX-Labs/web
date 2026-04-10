"use client";

import { motion } from "framer-motion";

interface EnrollModalAmbientProps {
  shouldReduceMotion: boolean;
}

export function EnrollModalAmbient({
  shouldReduceMotion,
}: EnrollModalAmbientProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Cyan secondary glow */}
      <motion.div
        className="absolute -left-14 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-[80px] dark:bg-cyan-500/15"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 24, 0],
                y: [0, -18, 0],
                opacity: [0.35, 0.7, 0.35],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Primary Hero Blue glow */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-hero-blue/15 blur-[100px] dark:bg-hero-blue/10"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.45, 0.2],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }
        }
      />

      {/* Orange accent glow */}
      <motion.div
        className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-orange-300/15 blur-[80px] dark:bg-orange-500/10"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -20, 0],
                y: [0, 12, 0],
                opacity: [0.3, 0.65, 0.3],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }
        }
      />
    </div>
  );
}
