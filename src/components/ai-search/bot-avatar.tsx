"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showOnlineBadge?: boolean;
}

export function BotAvatar({ size = "md", className, showOnlineBadge }: BotAvatarProps) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  };

  const iconSizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full overflow-hidden transition-all duration-500",
          "bg-linear-to-br from-sky-500 via-blue-600 to-violet-600",
          "shadow-[0_0_20px_rgba(51,170,204,0.3)]",
          sizeClasses[size],
        )}
      >
        {/* Animated inner glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)] animate-pulse" />
        
        {/* Rotating border effect */}
        <div className="absolute inset-[-100%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.2)_180deg,transparent_360deg)]" />

        <Sparkles className={cn("relative z-10 text-white drop-shadow-md", iconSizeClasses[size])} />
      </div>

      {showOnlineBadge && (
        <div className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      )}
    </div>
  );
}
