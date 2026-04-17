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

interface VideoPlayerProps {
  /** Accessible title shown in the player and for screen readers. */
  title: string;
  /**
   * Video source. Accepts any VidStack-compatible src string:
   * - HLS manifest:  "https://cdn.example.com/stream.m3u8"
   * - DASH manifest: "https://cdn.example.com/stream.mpd"
   * - YouTube:       "youtube/<VIDEO_ID>"      (quality selector auto-hides)
   * - Direct MP4:    "https://cdn.example.com/video.mp4"
   */
  src: string;
  thumbnails?: string;
  poster?: string;
  className?: string;

  /** Fired frequently during playback to track where the user is */
  onTimeUpdate?: (currentTime: number) => void;
  /** Fired when playback pauses, providing a reliable point to save progress */
  onPause?: (currentTime: number) => void;
  /** Fired exactly when the video reaches the end */
  onEnded?: () => void;
}

/**
 * VideoPlayer — Single-responsibility component for video playback.
 *
 * Quality control is delegated to `<QualitySelector>` which resolves options
 * from VidStack's media context via `useVideoQualityOptions()`. The selector
 * is injected into the DefaultVideoLayout chrome through the `slots.settingsAfter`
 * slot — no custom layout required.
 *
 * The selector gracefully self-hides when:
 *   - The source is YouTube (read-only quality list)
 *   - The source is a flat MP4 (no renditions)
 *   - No qualities have loaded yet
 */
export const VideoPlayer = memo(
  ({
    title,
    src,
    thumbnails,
    poster,
    className,
    onTimeUpdate,
    onPause,
    onEnded,
  }: VideoPlayerProps) => {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-3xl bg-black",
          "ring-1 ring-slate-900/10 dark:ring-white/10",
          "shadow-2xl shadow-black/40 dark:shadow-black/60",
          className
        )}
      >
        <MediaPlayer
          title={title}
          src={src}
          playsInline
          className="w-full aspect-video"
          crossOrigin
          // --- Tracking Callbacks ---
          onTimeUpdate={(e) => onTimeUpdate?.(e.detail.currentTime)}
          onPause={(e) => onPause?.(e.detail.currentTime)}
          onEnd={() => onEnded?.()}
        >
          <MediaProvider />
          <DefaultVideoLayout
            thumbnails={thumbnails}
            icons={defaultLayoutIcons}
            poster={poster}
            slots={{
              /**
               * VidStack slots let us inject custom UI nodes directly into the
               * player chrome without overriding the entire layout.
               * `settingsAfter` places our picker right after the native settings
               * gear icon in the bottom-right control bar.
               */
              settingsAfter: <QualitySelector />,
            }}
          />
        </MediaPlayer>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
