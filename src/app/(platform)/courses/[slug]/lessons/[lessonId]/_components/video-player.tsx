"use client";

import React, { memo } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { cn } from "@/lib/utils"; // Assuming utils standard cn is present

interface VideoPlayerProps {
  title: string;
  src: string;
  thumbnails?: string;
  poster?: string;
  className?: string;
}

/**
 * Encapsulated VideoPlayer component leveraging VidStack.
 * Following SOLID principles, this component has a Single Responsibility: rendering the video player.
 */
export const VideoPlayer = memo(
  ({ title, src, thumbnails, poster, className }: VideoPlayerProps) => {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-3xl bg-black ring-1 ring-slate-900/10 shadow-2xl shadow-black/40 dark:ring-white/10 dark:shadow-black/60",
          className
        )}
      >
        <MediaPlayer
          title={title}
          src={src}
          playsInline
          className="w-full aspect-video"
          crossOrigin
        >
          <MediaProvider />
          <DefaultVideoLayout
            thumbnails={thumbnails}
            icons={defaultLayoutIcons}
            poster={poster}
          />
        </MediaPlayer>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
