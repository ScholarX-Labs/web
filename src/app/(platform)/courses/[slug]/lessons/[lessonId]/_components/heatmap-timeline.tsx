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
  const minOpacity = 0.04; // Near-invisible base

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn(
        "w-full h-full block transition-opacity duration-700",
        "opacity-20 group-hover:opacity-100", // "Ghost" state until hover
        className
      )}
      aria-hidden="true"
    >
      {buckets.map((value, i) => {
        // High-end vibrant color scaling
        const opacity = minOpacity + value * 0.9;
        const barHeight = 2 + value * (height - 2); 
        return (
          <rect
            key={i}
            x={i * bucketWidth + 0.5}
            y={height - barHeight}
            width={bucketWidth - 1}
            height={barHeight}
            rx={0.5}
            fill="#3b82f6" // blue-500
            style={{ opacity }}
            className="transition-all duration-1000 ease-out"
          />
        );
      })}
    </svg>
  );
});

HeatmapTimeline.displayName = "HeatmapTimeline";
