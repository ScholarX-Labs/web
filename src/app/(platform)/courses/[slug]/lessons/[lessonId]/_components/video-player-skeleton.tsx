"use client";

/**
 * Glassmorphism loading skeleton for the video player.
 * Shown while CDN token is being fetched. Zero CLS — matches player aspect ratio.
 *
 * @see specs/018-bunny-net-video-migration/plan.md §7 Layer 5
 */

import { cn } from "@/lib/utils";

interface VideoPlayerSkeletonProps {
  className?: string;
}

export function VideoPlayerSkeleton({ className }: VideoPlayerSkeletonProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-2xl lg:rounded-3xl overflow-hidden",
        "border border-white/10",
        className,
      )}
      style={{
        aspectRatio: "16 / 9",
        boxShadow:
          "0 40px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      {/* Top edge glass highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />

      {/* Dark glass background */}
      <div className="w-full h-full bg-white/5 backdrop-blur-sm flex items-center justify-center">
        {/* Ambilight pulse animation */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 rounded-[3rem] bg-blue-600/10 blur-[80px] animate-pulse duration-[3000ms]" />
          <div className="absolute inset-x-20 inset-y-10 rounded-[3rem] bg-violet-600/8 blur-[100px] animate-pulse duration-[4000ms] delay-500" />
        </div>

        {/* Loading indicator */}
        <div className="relative flex flex-col items-center gap-3 z-10">
          {/* Spinning ring */}
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
          <p className="text-white/40 text-xs font-medium tracking-wide">
            Loading video...
          </p>
        </div>
      </div>
    </div>
  );
}
