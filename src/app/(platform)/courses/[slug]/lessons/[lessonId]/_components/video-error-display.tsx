"use client";

/**
 * Glassmorphism error card for video playback failures.
 * Accessible with role="alert" and optional retry button.
 *
 * @see specs/018-bunny-net-video-migration/plan.md §7 Layer 5
 */

import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function VideoErrorDisplay({
  message,
  onRetry,
  className,
}: VideoErrorDisplayProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-2xl lg:rounded-3xl border border-white/10 overflow-hidden",
        className,
      )}
      style={{
        aspectRatio: "16 / 9",
        boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8)",
      }}
      role="alert"
    >
      {/* Glass top-edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="w-full h-full bg-white/5 backdrop-blur-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-8 max-w-sm">
          {/* Error icon */}
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" aria-hidden="true" />
          </div>

          {/* User-facing message */}
          <p className="text-white/70 text-sm leading-relaxed">{message}</p>

          {/* Retry button */}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              aria-label="Retry video playback"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl",
                "bg-white/10 hover:bg-white/20",
                "border border-white/10",
                "text-white/80 text-sm font-medium",
                "transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
              )}
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
