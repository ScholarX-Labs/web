"use client";

import React, { memo } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { cn } from "@/lib/utils";
import { QualitySelector } from "./quality-selector";
import { motion } from "framer-motion";
import { useUILayoutStore } from "@/store/ui-layout-store";

interface VideoPlayerProps {
  title: string;
  src: string;
  thumbnails?: string;
  poster?: string;
  className?: string;
  layoutId?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onEnded?: () => void;
}

export const VideoPlayer = memo(
  ({
    title,
    src,
    thumbnails,
    poster,
    className,
    layoutId = "video-player",
    onTimeUpdate,
    onPause,
    onEnded,
  }: VideoPlayerProps) => {
    const { setActiveLayoutId } = useUILayoutStore();

    return (
      <motion.div
        layoutId={layoutId}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "group relative w-full overflow-hidden",
          // Premium rounded shape
          "rounded-2xl lg:rounded-3xl",
          // Layered border — inner glow + outer shadow
          "ring-1 ring-white/10",
          // Cinematic volumetric shadow — blue ambilight
          "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_-10px_rgba(0,0,0,0.8),0_0_80px_-20px_rgba(59,130,246,0.25)]",
          className
        )}
      >
        {/* Inner glow on top edge for depth */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
        
        {/* Ambilight halo that pulses on hover */}
        <div className="pointer-events-none absolute -inset-[1px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-b from-blue-500/10 via-transparent to-violet-500/10 z-0" />

        <MediaPlayer
          title={title}
          src={src}
          playsInline
          className="w-full aspect-video"
          crossOrigin
          onTimeUpdate={(e) => onTimeUpdate?.(e.detail.currentTime)}
          onPause={(e) => onPause?.(e.detail.currentTime)}
          onEnd={() => onEnded?.()}
        >
          <MediaProvider />
          <DefaultVideoLayout
            thumbnails={thumbnails}
            icons={defaultLayoutIcons}
            poster={poster}
            slots={{ settingsAfter: <QualitySelector /> }}
          />
        </MediaPlayer>
      </motion.div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
