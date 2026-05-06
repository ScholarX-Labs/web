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
  courseId?:   string; // Added to support completion actions
  /** Total video duration in seconds. Pass 0 until VidStack fires onDurationChange. */
  videoDuration: number;
  /** Optional callback when the entire course is considered complete */
  onCourseCompleted?: (courseId: string) => void;
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
const COMPLETE_AT_PCT = 94; // Lowered slightly to ensure animation fires before end

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

// Module-scoped pending maps keyed by storageKey
const _pendingProgress = new Map<string, LessonProgress>();
const _pendingHandle = new Map<string, { id: number; type: "idle" | "timeout" }>();

function _flushWriteForKey(key: string) {
  const p = _pendingProgress.get(key);
  if (!p) return;
  try {
    // Synchronous localStorage write as the primary flush mechanism.
    localStorage.setItem(key, JSON.stringify(p));
  } catch {
    // ignore
  }
  _pendingProgress.delete(key);
  const prev = _pendingHandle.get(key);
  if (prev) _pendingHandle.delete(key);
}

function _cancelPendingForKey(key: string) {
  const prev = _pendingHandle.get(key);
  if (!prev) return;
  try {
    if (prev.type === "idle" && "cancelIdleCallback" in globalThis) {
      (globalThis as unknown as Window).cancelIdleCallback(prev.id);
    } else {
      clearTimeout(prev.id);
    }
  } catch {}
  _pendingHandle.delete(key);
}

function scheduleWriteProgress(progress: LessonProgress, delay = 0) {
  const key = storageKey(progress.courseSlug, progress.lessonId);
  // Store latest progress immediately so it's available for synchronous flush.
  _pendingProgress.set(key, progress);

  // Cancel any previously scheduled handle for this key.
  _cancelPendingForKey(key);

  const scheduleIdleWrite = () => {
    const writeNow = () => _flushWriteForKey(key);
    if ("requestIdleCallback" in globalThis) {
      const id = (globalThis as unknown as Window).requestIdleCallback(writeNow, { timeout: 1000 });
      _pendingHandle.set(key, { id, type: "idle" });
    } else {
      const id = setTimeout(writeNow, 0) as unknown as number;
      _pendingHandle.set(key, { id, type: "timeout" });
    }
  };

  if (delay > 0) {
    const timerId = setTimeout(() => {
      // After debounce delay, schedule idle write
      scheduleIdleWrite();
    }, delay) as unknown as number;
    _pendingHandle.set(key, { id: timerId, type: "timeout" });
  } else {
    scheduleIdleWrite();
  }
}

 

// ─── Heatmap Computation (Pure) ───────────────────────────────────────────────

function computeHeatmapBuckets(
  pauseEvents: number[],
  videoDuration: number
): number[] {
  const buckets = new Array<number>(HEATMAP_BUCKETS).fill(0);
  
  // Fallback: Generate subtle "atmospheric noise" if no data exists
  if (pauseEvents.length === 0) {
    // Return a stable "mesh" of low values (0.05 - 0.15) for background texture
    return buckets.map((_, i) => 0.05 + (Math.sin(i * 0.8) + 1) * 0.05);
  }

  if (videoDuration <= 0) return buckets;

  const bucketWidth = videoDuration / HEATMAP_BUCKETS;

  for (const pausePos of pauseEvents) {
    const idx = Math.min(
      Math.floor(pausePos / bucketWidth),
      HEATMAP_BUCKETS - 1
    );
    buckets[idx]++;
  }

  const max = Math.max(...buckets, 1);
  return buckets.map((v) => Math.max(0.05, v / max)); // Ensure baseline visibility
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
  courseId,
  videoDuration: initialDuration,
  onCourseCompleted,
}: UseLessonProgressOptions): UseLessonProgressReturn {
  // ... rest of state initialization ...
  const _initialStored = typeof window !== 'undefined' ? readProgress(courseSlug, lessonId) : null;
  const [progress, setProgress] = useState<LessonProgress | null>(() => {
    if (
      _initialStored &&
      !_initialStored.completedAt &&
      _initialStored.watchedPercentage >= 5
    )
      return _initialStored;
    return {
      lessonId,
      courseSlug,
      lastPosition:           0,
      watchedPercentage:      0,
      pauseEvents:            [],
      seekEvents:             [],
      highEngagementSegments: [],
      sessionStartedAt:       Date.now(),
      completedAt:            null,
    };
  });

  const [videoDuration, setVideoDuration] = useState<number>(() => (initialDuration > 0 ? initialDuration : 0));

  const [resumePoint] = useState<number | null>(() => {
    if (
      _initialStored &&
      !_initialStored.completedAt &&
      _initialStored.watchedPercentage >= 5 &&
      _initialStored.lastPosition > 10
    ) {
      return _initialStored.lastPosition;
    }
    return null;
  });

  const isFirstLoad = useRef(true);

  useEffect(() => {
    isFirstLoad.current = false;
  }, [lessonId, courseSlug]);

  const heatmapBuckets = useMemo(
    () => computeHeatmapBuckets(progress?.pauseEvents ?? [], videoDuration),
    [progress?.pauseEvents, videoDuration]
  );

  const updateProgress = useCallback(
    (updater: (prev: LessonProgress) => LessonProgress, immediate = false) => {
      setProgress((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        scheduleWriteProgress(next, immediate ? 0 : DEBOUNCE_MS);
        return next;
      });
    },
    []
  );

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

  // Ref to prevent multiple completion triggers
  const hasTriggeredCompletion = useRef(false);

  // Handle completion trigger
  useEffect(() => {
    if (!progress || !courseId || !onCourseCompleted) return;

    const isComplete = progress.completedAt || progress.watchedPercentage >= COMPLETE_AT_PCT;
    
    if (isComplete && !hasTriggeredCompletion.current) {
      console.log(`[PROGRESS] Lesson ${lessonId} reached completion threshold. Triggering course completion.`);
      hasTriggeredCompletion.current = true;
      onCourseCompleted(courseId);
    }
  }, [progress, courseId, onCourseCompleted, lessonId]);

  useEffect(() => {
    const key = storageKey(courseSlug, lessonId);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        _flushWriteForKey(key);
        _cancelPendingForKey(key);
      }
    };
    const handlePageHide = () => {
      _flushWriteForKey(key);
      _cancelPendingForKey(key);
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      // Ensure latest pending progress is persisted synchronously before unmount
      _flushWriteForKey(key);
      _cancelPendingForKey(key);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [courseSlug, lessonId]);

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
