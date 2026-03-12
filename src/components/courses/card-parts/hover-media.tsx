"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HoverMediaProps {
  thumbnail: string;
  title: string;
  videoPreviewUrl?: string;
  className?: string;
}

export function HoverMedia({ thumbnail, title, videoPreviewUrl, className }: HoverMediaProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoPreviewUrl) {
      timeoutRef.current = setTimeout(() => {
        setShowVideo(true);
      }, 400); // 400ms delay debouncing to avoid fast-hover blasting
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowVideo(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const activeSrc = thumbnail || "https://images.unsplash.com/photo-1620064916958-605375619af8?q=80&w=800&auto=format&fit=crop";

  return (
    <div 
      className={cn("relative w-full h-full overflow-hidden group/media", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={activeSrc}
        alt={title}
        fill
        className={cn(
          "object-cover transition-transform duration-700 ease-out",
          isHovered && !showVideo ? "scale-110" : "scale-100"
        )}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      
      {videoPreviewUrl && showVideo && (
        <video
          src={videoPreviewUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-10 animate-in fade-in duration-500"
        />
      )}
      
      {/* Subtle cinematic gradient overlay on hover */}
      <div className="absolute inset-0 bg-linear-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
    </div>
  );
}