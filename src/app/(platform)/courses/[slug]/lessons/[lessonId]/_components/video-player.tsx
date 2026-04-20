"use client";

import React, { memo, useRef } from "react";
import { MediaPlayer, MediaProvider, type MediaPlayerInstance } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { cn } from "@/lib/utils";
import { HeatmapTimeline } from "./heatmap-timeline";
import { motion } from "framer-motion";
import { fadeSlideIn } from "@/lib/motion-variants";

interface VideoPlayerProps {
  title: string;
  src: string;
  thumbnails?: string;
  poster?: string;
  className?: string;
  layoutId?: string;
  /** From useLessonProgress */
  heatmapBuckets?: number[];
  onTimeUpdate?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onSeeked?: (from: number, to: number) => void;
  onEnded?: () => void;
  onDurationChange?: (duration: number) => void;
}

export const VideoPlayer = memo(
  ({
    title,
    src,
    thumbnails,
    poster,
    className,
    layoutId = "video-player",
    heatmapBuckets,
    onTimeUpdate,
    onPause,
    onSeeked,
    onEnded,
    onDurationChange,
  }: VideoPlayerProps) => {
    const seekFromRef = useRef<number>(0);

    return (
      <motion.div
        layoutId={layoutId}
        {...fadeSlideIn}
        className={cn(
          "group relative w-full overflow-hidden",
          "rounded-2xl lg:rounded-3xl",
          "ring-1 ring-white/10",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_-10px_rgba(0,0,0,0.8),0_0_80px_-20px_rgba(59,130,246,0.25)]",
          className
        )}
      >
        {/* Inner glow on top edge for depth */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

        {/* Ambilight halo on hover */}
        <div className="pointer-events-none absolute -inset-[1px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-b from-blue-500/10 via-transparent to-violet-500/10 z-0" />

        <MediaPlayer
          title={title}
          src={src}
          playsInline
          className="w-full aspect-video"
          crossOrigin
          onTimeUpdate={(detail) => {
            if (typeof detail === "number") onTimeUpdate?.(detail);
          }}
          onPause={(detail) => {
            if (typeof detail === "number") onPause?.(detail);
          }}
          onSeeked={(detail) => {
            if (typeof detail === "number") {
              onSeeked?.(seekFromRef.current, detail);
            }
          }}
          onSeeking={(detail) => {
            if (typeof detail === "number") {
              seekFromRef.current = detail;
            }
          }}
          onEnd={() => onEnded?.()}
          onDurationChange={(detail) => {
            if (typeof detail === "number") onDurationChange?.(detail);
          }}
        >
          <MediaProvider />
          <DefaultVideoLayout
            thumbnails={thumbnails}
            icons={defaultLayoutIcons}
            poster={poster}
          />
        </MediaPlayer>

        {/* Heatmap overlay — above video, below VidStack controls */}
        {heatmapBuckets && heatmapBuckets.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-2 pb-[52px]">
            <HeatmapTimeline buckets={heatmapBuckets} />
          </div>
        )}
      </motion.div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
