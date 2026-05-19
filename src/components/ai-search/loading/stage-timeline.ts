"use client";

import { useState, useEffect, useRef } from "react";

export enum LoadingStage {
  THINKING = "thinking",
  ANALYZING = "analyzing",
  REMODELING = "remodeling",
  CURATING = "curating",
  DONE = "done",
}

export interface OrbConfig {
  stage: LoadingStage;
  gradient: string;
  glowColor: string;
  scale: number;
  borderRadius: string;
  rotation: number;
}

export interface IndicatorConfig {
  stage: LoadingStage;
  label: string;
  gradient: string;
}

export interface CardConfig {
  shimmerOpacity: number;
  auroraEnabled: boolean;
  floatEnabled: boolean;
  glowColor: string;
}

export interface StageConfig {
  orb: OrbConfig;
  indicator: IndicatorConfig;
  card: CardConfig;
  duration: number;
}

export const STAGE_CONFIG: StageConfig[] = [
  {
    orb: {
      stage: LoadingStage.THINKING,
      gradient: "from-sky-400 to-sky-600",
      glowColor: "rgba(56, 189, 248, 0.3)",
      scale: 1.0,
      borderRadius: "50%",
      rotation: 0,
    },
    indicator: {
      stage: LoadingStage.THINKING,
      label: "Understanding your query...",
      gradient: "from-sky-400 to-sky-600",
    },
    card: {
      shimmerOpacity: 0.045,
      auroraEnabled: false,
      floatEnabled: false,
      glowColor: "rgba(56, 189, 248, 0.3)",
    },
    duration: 2000,
  },
  {
    orb: {
      stage: LoadingStage.ANALYZING,
      gradient: "from-violet-400 to-purple-600",
      glowColor: "rgba(139, 92, 246, 0.3)",
      scale: 1.05,
      borderRadius: "50%",
      rotation: 0,
    },
    indicator: {
      stage: LoadingStage.ANALYZING,
      label: "Evaluating opportunities...",
      gradient: "from-violet-400 to-purple-600",
    },
    card: {
      shimmerOpacity: 0.075,
      auroraEnabled: false,
      floatEnabled: false,
      glowColor: "rgba(139, 92, 246, 0.3)",
    },
    duration: 2000,
  },
  {
    orb: {
      stage: LoadingStage.REMODELING,
      gradient: "from-emerald-400 to-green-600",
      glowColor: "rgba(52, 211, 153, 0.3)",
      scale: 1.1,
      borderRadius: "35%",
      rotation: 0,
    },
    indicator: {
      stage: LoadingStage.REMODELING,
      label: "Refining your results...",
      gradient: "from-emerald-400 to-green-600",
    },
    card: {
      shimmerOpacity: 0.105,
      auroraEnabled: true,
      floatEnabled: false,
      glowColor: "rgba(52, 211, 153, 0.3)",
    },
    duration: 2000,
  },
  {
    orb: {
      stage: LoadingStage.CURATING,
      gradient: "from-amber-400 to-orange-500",
      glowColor: "rgba(245, 158, 11, 0.3)",
      scale: 0.9,
      borderRadius: "50%",
      rotation: 45,
    },
    indicator: {
      stage: LoadingStage.CURATING,
      label: "Selecting the best matches...",
      gradient: "from-amber-400 to-orange-500",
    },
    card: {
      shimmerOpacity: 0.135,
      auroraEnabled: true,
      floatEnabled: true,
      glowColor: "rgba(245, 158, 11, 0.3)",
    },
    duration: 2000,
  },
  {
    orb: {
      stage: LoadingStage.DONE,
      gradient: "from-white to-transparent",
      glowColor: "transparent",
      scale: 0,
      borderRadius: "50%",
      rotation: 0,
    },
    indicator: {
      stage: LoadingStage.DONE,
      label: "",
      gradient: "from-white to-transparent",
    },
    card: {
      shimmerOpacity: 0.15,
      auroraEnabled: true,
      floatEnabled: true,
      glowColor: "transparent",
    },
    duration: 0,
  },
];

export function useStageTimeline(isLoading: boolean) {
  const [stageIndex, setStageIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) {
      // Defer reset to avoid setState-in-effect lint rule
      const resetTimer = setTimeout(() => setStageIndex(0), 0);
      return () => {
        clearTimeout(resetTimer);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }

    let cancelled = false;

    const schedule = (idx: number) => {
      const config = STAGE_CONFIG[idx];
      if (!config || idx >= STAGE_CONFIG.length - 1) return;

      timeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        setStageIndex(idx + 1);
        schedule(idx + 1);
      }, config.duration);
    };

    schedule(0);

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading]);

  const currentStage = STAGE_CONFIG[stageIndex] ?? STAGE_CONFIG[0];
  const progress = (stageIndex + 1) / STAGE_CONFIG.length;

  return { stageIndex, currentStage, progress };
}
