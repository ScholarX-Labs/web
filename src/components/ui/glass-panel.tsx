"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export const GlassPanel = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "bg-white/40 dark:bg-black/30 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-xl overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Subtle inner light reflection effect mimicking visionOS */}
      <div className="pointer-events-none absolute inset-0 rounded-inherit border border-white/10 mix-blend-overlay" />
      {children}
    </motion.div>
  );
});
GlassPanel.displayName = "GlassPanel";
