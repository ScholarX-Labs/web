"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import type { CardConfig } from "./stage-timeline";
import { Skeleton } from "@/components/ai-search/ui/skeleton";
import { shimmerCardVariants } from "@/lib/ai-search-animations";
import { cn } from "@/lib/utils";

interface ShimmerCardProps {
  delay: number;
}

const ShimmerCard = memo(function ShimmerCard({ delay }: ShimmerCardProps) {
  return (
    <motion.div
      variants={shimmerCardVariants}
      initial="initial"
      animate="animate"
      custom={delay}
      exit="exit"
      className="shimmer-card-aurora relative overflow-hidden rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-xl p-5"
    >
      <div className="shimmer-sweep" />

      <div className="shimmer-card-content relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        <div className="space-y-2 mt-2">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </div>

        <div className="mt-5 space-y-2">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-2 w-4/5 rounded-full" />
          <Skeleton className="mt-5 h-8 w-full rounded-lg" />
        </div>
      </div>
    </motion.div>
  );
});

interface ShimmerCardGridProps {
  cardConfig: CardConfig;
  cardCount?: number;
}

export function ShimmerCardGrid({
  cardConfig,
  cardCount = 6,
}: ShimmerCardGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        cardConfig.auroraEnabled && "aurora-active",
        cardConfig.floatEnabled && "float-active",
      )}
      style={
        {
          "--aurora-color": cardConfig.glowColor,
          "--shimmer-opacity": cardConfig.shimmerOpacity,
        } as React.CSSProperties
      }
    >
      {Array.from({ length: cardCount }).map((_, i) => (
        <ShimmerCard key={i} delay={i * 100} />
      ))}
    </div>
  );
}
