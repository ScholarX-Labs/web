"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  /** Progress value 0–100 */
  value: number;
  /** Diameter in pixels. Default: 28 */
  size?: number;
  /** Stroke width in pixels. Default: 2.5 */
  strokeWidth?: number;
  className?: string;
}

/**
 * ProgressRing — Circular SVG progress indicator.
 *
 * Renders a thin circular track with an animated fill arc.
 * Used in lesson sidebar for in-progress lesson status indicators
 * and as a completion badge for partially-watched lessons.
 *
 * Accessibility: role="progressbar" + aria attributes for screen readers.
 */
export const ProgressRing = React.memo(function ProgressRing({
  value,
  size = 28,
  strokeWidth = 2.5,
  className,
}: ProgressRingProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("rotate-[-90deg]", className)}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clampedValue}% complete`}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgb(59,130,246)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
});

ProgressRing.displayName = "ProgressRing";
