"use client";

import React, { useRef } from "react";
import {
  MediaPlayer,
  MediaProvider,
  isYouTubeProvider,
  type MediaPlayerInstance,
  type PlayerSrc,
} from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { cn } from "@/lib/utils";
import { HeatmapTimeline } from "./heatmap-timeline";
import { motion } from "framer-motion";
import { springApple } from "@/lib/motion-variants";

import { useUILayoutStore } from "@/store/ui-layout-store";

interface VideoPlayerProps {
  title: string;
  src: string;
  thumbnails?: string;
  className?: string;
  /** From useLessonProgress */
  heatmapBuckets?: number[];
  onTimeUpdate?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onSeeked?: (from: number, to: number) => void;
  onEnded?: () => void;
  onDurationChange?: (duration: number) => void;
}

const getNumericDetail = (event: unknown): number | null => {
  if (typeof event === "number") return event;
  if (typeof event !== "object" || event === null) return null;

  const detail = "detail" in event ? event.detail : event;
  if (typeof detail === "number") return detail;

  return null;
};

const getCurrentTime = (event: unknown): number | null => {
  if (typeof event === "number") return event;
  if (typeof event !== "object" || event === null) return null;

  const detail = "detail" in event ? event.detail : event;
  if (
    typeof detail === "object" &&
    detail !== null &&
    "currentTime" in detail
  ) {
    const currentTime = (detail as { currentTime?: unknown }).currentTime;
    return typeof currentTime === "number" ? currentTime : null;
  }

  return null;
};

const toPlayerSrc = (src: string): PlayerSrc => {
  if (/youtube\.com|youtu\.be/i.test(src)) {
    return { src, type: "video/youtube" };
  }

  return src;
};

export const VideoPlayer = React.forwardRef<MediaPlayerInstance, VideoPlayerProps>(
  ({
    title,
    src,
    thumbnails,
    className,
    heatmapBuckets,
    onTimeUpdate,
    onPause,
    onSeeked,
    onEnded,
    onDurationChange,
  }, ref) => {
    const seekFromRef = useRef<number>(0);
    const { isFocusMode } = useUILayoutStore();
    const playerSrc = toPlayerSrc(src);

    return (
      <div className="group relative w-full">
        {/* Atmospheric Ambilight (Breathing Glow) */}
        <div className={cn(
          "pointer-events-none absolute -inset-6 z-0 hidden lg:block transition-opacity duration-1000",
          isFocusMode ? "opacity-100" : "opacity-60"
        )}>
          <div className="absolute inset-0 rounded-[3rem] bg-blue-600/20 blur-[80px] animate-pulse duration-[10000ms]" />
          <div className="absolute inset-x-20 inset-y-10 rounded-[3rem] bg-violet-600/15 blur-[100px] animate-pulse duration-[15000ms] delay-1000" />
        </div>

        {/* Floor Reflection Shadow */}
        <div className="pointer-events-none absolute -bottom-10 inset-x-8 h-20 bg-blue-500/10 blur-[40px] rounded-[50%] z-0" />
        <motion.div
          animate={{
            scale: 1,
            y: 0,
            zIndex: isFocusMode ? 45 : 10,
          }}
          transition={springApple}
          className={cn(
            "relative w-full transition-all duration-700",
            isFocusMode ? "overflow-visible" : "overflow-hidden w-full",
            "rounded-2xl lg:rounded-3xl",
            "border border-white/10",
            "shadow-2xl transition-shadow duration-500",
            className
          )}
          style={isFocusMode ? {
            width: "min(calc(100vw - 80px), calc((100vh - 120px) * (16 / 9)))",
            height: "auto",
            aspectRatio: "16 / 9",
            margin: "auto",
            boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
          } : {
            boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Inner glass light reflection (Apple-style top edge highlight) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent z-20" />

        <MediaPlayer
          ref={ref}
          title={title}
          src={playerSrc}
          playsInline
          className="w-full aspect-video"
          onProviderSetup={(provider) => {
            if (isYouTubeProvider(provider)) {
              provider.cookies = true;
            }
          }}
          onTimeUpdate={(event) => {
            const currentTime = getCurrentTime(event);
            if (currentTime !== null) onTimeUpdate?.(currentTime);
          }}
          onPause={() => {
            const currentTime = ref && "current" in ref
              ? ref.current?.currentTime
              : null;
            if (typeof currentTime === "number") onPause?.(currentTime);
          }}
          onSeeked={(event) => {
            const currentTime = getNumericDetail(event);
            if (currentTime !== null) {
              onSeeked?.(seekFromRef.current, currentTime);
            }
          }}
          onSeeking={(event) => {
            const currentTime = getNumericDetail(event);
            if (currentTime !== null) {
              seekFromRef.current = currentTime;
            }
          }}
          onEnd={() => onEnded?.()}
          onDurationChange={(event) => {
            const duration = getNumericDetail(event);
            if (duration !== null) onDurationChange?.(duration);
          }}
        >
          <MediaProvider />
          <DefaultVideoLayout
            thumbnails={thumbnails}
            icons={defaultLayoutIcons}
          />
        </MediaPlayer>

        {/* Heatmap overlay — above video, below VidStack controls */}
        {heatmapBuckets && heatmapBuckets.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-2 pb-[52px]">
            <HeatmapTimeline buckets={heatmapBuckets} />
          </div>
        )}
      </motion.div>
    </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
