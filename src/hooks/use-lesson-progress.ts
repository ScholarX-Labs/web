"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonProgress {
  lessonId:  string;
  courseSlug: string;
  lastPosition:  number;                         // seconds into video
  watchedPercentage: number;                     // 0–100
  pauseEvents: number[];                         // video positions (s) where user paused
  seekEvents: { from: number; to: number }[];    // rewind/forward events
  highEngagementSegments: [number, number][];    // computed [startSec, endSec] tuples
  sessionStartedAt: number;                      // unix ms — current session start
  completedAt: number | null;                    // unix ms — null if not completed
}

export interface UseLessonProgressOptions {
  lessonId:    string;
  courseSlug:  string;
  /** Total video duration in seconds. Pass 0 until VidStack fires onDurationChange. */
  videoDuration: number;
}

export interface UseLessonProgressReturn {
  progress: LessonProgress | null;
  /** Non-null when watchedPercentage >= 5% and user has left+returned */
  resumePoint: number | null;
  /** 20 normalized values (0–1) representing engagement density per segment */
  heatmapBuckets: number[];
  /** Debounced — call on every VidStack onTimeUpdate event */
  onTimeUpdate: (currentTime: number) => void;
  /** Immediate write — call on VidStack onPause event */
  onPause: (currentTime: number) => void;
  /** Immediate track — call on VidStack onSeeked event */
  onSeeked: (from: number, to: number) => void;
  /** Marks lesson as completed */
  onEnded: () => void;
  /** Force-update duration after VidStack fires onDurationChange */
  setVideoDuration: (d: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HEATMAP_BUCKETS = 20;
const DEBOUNCE_MS     = 500;
const COMPLETE_AT_PCT = 90;

// ─── Storage Helpers ──────────────────────────────────────────────────────────

function storageKey(courseSlug: string, lessonId: string): string {
  return `progress:${courseSlug}:${lessonId}`;
}

function readProgress(courseSlug: string, lessonId: string): LessonProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(courseSlug, lessonId));
    if (!raw) return null;
    return JSON.parse(raw) as LessonProgress;
  } catch {
    return null;
  }
}

function writeProgress(progress: LessonProgress): void {
  const write = () => {
    try {
      localStorage.setItem(
        storageKey(progress.courseSlug, progress.lessonId),
        JSON.stringify(progress)
      );
    } catch {
      // Storage quota exceeded or private browsing — silently ignore
    }
  };

  // Prefer requestIdleCallback for non-blocking writes; fall back to setTimeout
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(write, { timeout: 1000 });
  } else {
    setTimeout(write, 0);
  }
}

// ─── Heatmap Computation (Pure) ───────────────────────────────────────────────

function computeHeatmapBuckets(
  pauseEvents: number[],
  videoDuration: number
): number[] {
  const buckets = new Array<number>(HEATMAP_BUCKETS).fill(0);
  if (videoDuration <= 0 || pauseEvents.length === 0) return buckets;

  const bucketWidth = videoDuration / HEATMAP_BUCKETS;

  for (const pausePos of pauseEvents) {
    const idx = Math.min(
      Math.floor(pausePos / bucketWidth),
      HEATMAP_BUCKETS - 1
    );
    buckets[idx]++;
  }

  const max = Math.max(...buckets, 1);
  return buckets.map((v) => v / max); // Normalize to 0–1
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useLessonProgress — Smart progress tracking hook.
 *
 * Single Responsibility: all progress domain logic lives here.
 * VideoPlayer becomes a pure presentation component.
 *
 * Persistence: localStorage with requestIdleCallback writes.
 * Debouncing: onTimeUpdate debounced 500ms; onPause writes immediately.
 * Heatmap: computed via useMemo from pauseEvents, 20 equal segments.
 * Resume: resumePoint is non-null only when user has returned to a lesson
 *         they previously watched >= 5% of.
 */
export function useLessonProgress({
  lessonId,
  courseSlug,
  videoDuration: initialDuration,
}: UseLessonProgressOptions): UseLessonProgressReturn {
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [videoDuration, setVideoDuration] = useState(initialDuration);
  const [resumePoint, setResumePoint] = useState<number | null>(null);

  // Debounce ref for onTimeUpdate
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether this is a fresh page load (to show resume prompt)
  const isFirstLoad = useRef(true);

  // ── Mount: read persisted progress ────────────────────────────────────────
  useEffect(() => {
    const stored = readProgress(courseSlug, lessonId);
    if (stored) {
      setProgress(stored);
      // Show resume prompt if user previously watched >= 5%
      if (stored.watchedPercentage >= 5 && stored.lastPosition > 10) {
        setResumePoint(stored.lastPosition);
      }
    } else {
      setProgress({
        lessonId,
        courseSlug,
        lastPosition:           0,
        watchedPercentage:      0,
        pauseEvents:            [],
        seekEvents:             [],
        highEngagementSegments: [],
        sessionStartedAt:       Date.now(),
        completedAt:            null,
      });
    }
    isFirstLoad.current = false;
  }, [lessonId, courseSlug]);

  // ── Update videoDuration when prop changes ────────────────────────────────
  useEffect(() => {
    if (initialDuration > 0) setVideoDuration(initialDuration);
  }, [initialDuration]);

  // ── Heatmap (memoized — only recalculate when pauseEvents changes) ────────
  const heatmapBuckets = useMemo(
    () => computeHeatmapBuckets(progress?.pauseEvents ?? [], videoDuration),
    [progress?.pauseEvents, videoDuration]
  );

  // ── Internal updater ──────────────────────────────────────────────────────
  const updateProgress = useCallback(
    (updater: (prev: LessonProgress) => LessonProgress, immediate = false) => {
      setProgress((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        if (immediate) {
          writeProgress(next);
        } else {
          // Debounced write
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(() => writeProgress(next), DEBOUNCE_MS);
        }
        return next;
      });
    },
    []
  );

  // ── Event Handlers ────────────────────────────────────────────────────────

  const onTimeUpdate = useCallback(
    (currentTime: number) => {
      updateProgress((prev) => {
        const pct =
          videoDuration > 0
            ? Math.min(100, (currentTime / videoDuration) * 100)
            : prev.watchedPercentage;

        return {
          ...prev,
          lastPosition:      currentTime,
          watchedPercentage: Math.max(prev.watchedPercentage, pct),
        };
      });
    },
    [updateProgress, videoDuration]
  );

  const onPause = useCallback(
    (currentTime: number) => {
      updateProgress((prev) => ({
        ...prev,
        lastPosition: currentTime,
        pauseEvents:  [...prev.pauseEvents, currentTime],
      }), /* immediate */ true);
    },
    [updateProgress]
  );

  const onSeeked = useCallback(
    (from: number, to: number) => {
      updateProgress((prev) => ({
        ...prev,
        seekEvents: [...prev.seekEvents, { from, to }],
      }), /* immediate */ true);
    },
    [updateProgress]
  );

  const onEnded = useCallback(() => {
    updateProgress((prev) => ({
      ...prev,
      watchedPercentage: 100,
      completedAt: prev.completedAt ?? Date.now(),
    }), /* immediate */ true);
  }, [updateProgress]);

  // ── Also mark completed when watchedPercentage >= threshold ──────────────
  useEffect(() => {
    if (
      progress &&
      progress.watchedPercentage >= COMPLETE_AT_PCT &&
      !progress.completedAt
    ) {
      updateProgress((prev) => ({
        ...prev,
        completedAt: Date.now(),
      }), /* immediate */ true);
    }
  }, [progress?.watchedPercentage, updateProgress]);

  // ── Cleanup debounce timer on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    progress,
    resumePoint,
    heatmapBuckets,
    onTimeUpdate,
    onPause,
    onSeeked,
    onEnded,
    setVideoDuration,
  };
}
