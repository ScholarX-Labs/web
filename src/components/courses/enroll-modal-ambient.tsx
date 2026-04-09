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
      <motion.div
        className="absolute -left-14 -top-16 h-40 w-40 rounded-full bg-cyan-200/30 blur-2xl dark:bg-cyan-500/20"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 16, 0],
                y: [0, -10, 0],
                opacity: [0.5, 0.9, 0.5],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <motion.div
        className="absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-orange-200/25 blur-2xl dark:bg-orange-500/15"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -14, 0],
                y: [0, 8, 0],
                opacity: [0.45, 0.85, 0.45],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 9.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.35,
              }
        }
      />
    </div>
  );
}
