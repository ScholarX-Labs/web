"use client";

import { motion } from "framer-motion";
import type { StageConfig } from "./stage-timeline";
import { AIThinkingOrb } from "./ai-thinking-orb";
import { ThinkingStageIndicator } from "./thinking-stage-indicator";
import { ShimmerCardGrid } from "./shimmer-card-grid";

interface LoadingStateOverlayProps {
  isLoading: boolean;
  currentStage: StageConfig;
  progress: number;
  cardCount?: number;
}

export function LoadingStateOverlay({
  isLoading,
  currentStage,
  progress,
  cardCount = 6,
}: LoadingStateOverlayProps) {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 py-8">
        <AIThinkingOrb orbConfig={currentStage.orb} />
        <ThinkingStageIndicator
          indicatorConfig={currentStage.indicator}
          progress={progress}
        />
      </div>

      <ShimmerCardGrid cardConfig={currentStage.card} cardCount={cardCount} />
    </motion.div>
  );
}
