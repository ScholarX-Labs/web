"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HeatmapTimelineProps {
  /** 20 normalized engagement values (0–1) from useLessonProgress */
  buckets: number[];
  className?: string;
}

/**
 * HeatmapTimeline — SVG engagement density overlay.
 *
 * Renders 20 equal-width columns above the video timeline.
 * Column opacity = engagement density: low engagement is near-invisible,
 * high engagement is bright blue (rgba(59,130,246,value)).
 *
 * Usage: Position as absolute overlay inside VideoPlayer, pointer-events-none.
 */
export const HeatmapTimeline = React.memo(function HeatmapTimeline({
  buckets,
  className,
}: HeatmapTimelineProps) {
  if (!buckets || buckets.length === 0) return null;

  const width = 100; // viewBox width units
  const height = 24; // viewBox height units
  const bucketWidth = width / buckets.length;
  const minOpacity = 0.08;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full h-6 block", className)}
      aria-hidden="true"
    >
      {buckets.map((value, i) => {
        const opacity = minOpacity + value * (1 - minOpacity);
        const barHeight = 4 + value * (height - 4); // min 4px, max full height
        return (
          <rect
            key={i}
            x={i * bucketWidth + 0.5}
            y={height - barHeight}
            width={bucketWidth - 1}
            height={barHeight}
            rx={1}
            fill={`rgba(59,130,246,${opacity.toFixed(2)})`}
          />
        );
      })}
    </svg>
  );
});

HeatmapTimeline.displayName = "HeatmapTimeline";
