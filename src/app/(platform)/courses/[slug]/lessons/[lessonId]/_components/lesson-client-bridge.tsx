"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useLessonProgress } from "@/hooks/use-lesson-progress";
import { VideoPlayer } from "./video-player";
import { LessonMeta } from "./lesson-meta";
import { LessonSidebar } from "./lesson-sidebar";
import { motion } from "framer-motion";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { cn } from "@/lib/utils";
import { springApple } from "@/lib/motion-variants";
import { syncLessonProgress } from "@/actions/course.actions";
import { toast } from "sonner";
import type { MediaPlayerInstance } from "@vidstack/react";
import type { LessonSummary } from "@/types/course.types";
import {
  CourseCompletionCelebration,
  type CourseCompletionCelebrationPhase,
} from "./course-completion-celebration";

interface LessonClientBridgeProps {
  lessonId: string;
  courseSlug: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  lessonIndex: number;
  totalLessons: number;
  prevLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  lessons: LessonSummary[]; // The full curriculum array
  initialIsCompleted?: boolean;
}

/**
 * LessonClientBridge — The "Brain" of the lesson page.
 *
 * This is a Client Component that wires the Server-provided data
 * to the interactive hooks (useLessonProgress) and manages the state
 * coordination between the VideoPlayer and LessonMeta.
 */
export function LessonClientBridge({
  lessonId,
  courseSlug,
  courseId,
  courseTitle,
  lessonTitle,
  lessonIndex,
  totalLessons,
  prevLesson,
  nextLesson,
  lessons,
  initialIsCompleted = false,
}: LessonClientBridgeProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const completionToastShownRef = useRef(false);
  const courseCompletionHandledRef = useRef(false);
  const certificateReadyTimerRef = useRef<number | null>(null);
  const { isFocusMode } = useUILayoutStore();
  const [courseCompletion, setCourseCompletion] = useState<{
    phase: CourseCompletionCelebrationPhase;
    certificateUrl?: string;
    certificateNumber?: string;
  } | null>(null);

  // 1. Initialize Progress Tracking
  const {
    progress,
    resumePoint,
    heatmapBuckets,
    onTimeUpdate,
    onPause,
    onSeeked,
    onEnded,
    setVideoDuration,
  } = useLessonProgress({
    lessonId,
    courseSlug,
    videoDuration: 0, // Will be updated via setVideoDuration
  });

  const isLessonCompleted = initialIsCompleted || Boolean(progress?.completedAt);

  // 2. Sync progress to server when completed or on unmount
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    if (certificateReadyTimerRef.current !== null) {
      window.clearTimeout(certificateReadyTimerRef.current);
      certificateReadyTimerRef.current = null;
    }

    completionToastShownRef.current = false;
    courseCompletionHandledRef.current = false;
    setCourseCompletion(null);
  }, [lessonId]);

  const syncToServer = useCallback(async () => {
    const p = progressRef.current;
    if (!p) return;
    return syncLessonProgress(lessonId, courseId, {
      completed: p.completedAt ? true : false,
      completedAt: p.completedAt
        ? new Date(p.completedAt).toISOString()
        : null,
      watchedPercentage: Math.round(p.watchedPercentage),
      lastPosition: Math.round(p.lastPosition),
    });
  }, [lessonId, courseId]);

  useEffect(() => {
    if (!progressRef.current?.completedAt) return;

    const isLikelyFinalLessonCompletion =
      lessonIndex >= totalLessons && !initialIsCompleted;

    if (!completionToastShownRef.current) {
      completionToastShownRef.current = true;

      if (isLikelyFinalLessonCompletion) {
        setCourseCompletion({ phase: "generating" });
      } else {
        toast.success("Lesson completed", {
          description: "Your progress is being saved to your account.",
          id: `lesson-completed-${lessonId}`,
        });
      }
    }

    void (async () => {
      const result = await syncToServer();

      if (!result?.success) {
        if (isLikelyFinalLessonCompletion) {
          setCourseCompletion({ phase: "failed" });
        }
        return;
      }

      const courseWasCompleted =
        result.progress?.course.status === "completed" &&
        Boolean(result.progress.course.completedAt) &&
        Boolean(result.progress.course.certificateEligibleAt);

      if (!courseWasCompleted) {
        if (isLikelyFinalLessonCompletion) {
          setCourseCompletion(null);
          toast.success("Lesson completed", {
            description: "Your progress is being saved to your account.",
            id: `lesson-completed-${lessonId}`,
          });
        }
        return;
      }

      if (courseCompletionHandledRef.current) return;
      courseCompletionHandledRef.current = true;

      if (!isLikelyFinalLessonCompletion) {
        setCourseCompletion({ phase: "generating" });
      }

      if (result.certificateError) {
        setCourseCompletion({ phase: "failed" });
        toast.error("Certificate generation failed", {
          description:
            "Your course completion was saved. You can retry certificate generation later.",
          id: `certificate-failed-${courseId}`,
        });
        return;
      }

      if (result.certificateUrl) {
        if (certificateReadyTimerRef.current !== null) {
          window.clearTimeout(certificateReadyTimerRef.current);
        }

        certificateReadyTimerRef.current = window.setTimeout(() => {
          setCourseCompletion({
            phase: "ready",
            certificateUrl: result.certificateUrl,
            certificateNumber: result.certificate?.certificateNumber,
          });
          certificateReadyTimerRef.current = null;
        }, 650);
      }
    })();
    // Intentionally only fire when completedAt first becomes truthy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress?.completedAt ? "completed" : "not-completed", syncToServer]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        syncToServer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [syncToServer]);

  useEffect(() => {
    return () => {
      syncToServer();
    };
  }, [syncToServer]);

  // 3. Resume Handler
  const handleResume = (position: number) => {
    const player = playerRef.current;
    if (!player) return;

    // Some player implementations return a Promise from `play()` (modern browsers).
    // Await resolution before seeking to avoid seek-during-load races.
    try {
      const maybePromise = player.play?.();
      if (
        maybePromise &&
        typeof (maybePromise as Promise<void>).then === "function"
      ) {
        (maybePromise as Promise<void>)
          .then(() => {
            // Ensure player still exists before seeking
            if (playerRef.current) playerRef.current.currentTime = position;
          })
          .catch((err) => {
            console.error("Failed to resume playback:", err);
          });
      } else {
        // play() did not return a promise — perform best-effort seek immediately
        player.currentTime = position;
      }
    } catch (err) {
      console.error("Error while attempting to resume playback:", err);
    }
  };

  return (
    <>
      <CourseCompletionCelebration
        open={Boolean(courseCompletion)}
        phase={courseCompletion?.phase ?? "generating"}
        courseTitle={courseTitle}
        certificateUrl={courseCompletion?.certificateUrl}
        certificateNumber={courseCompletion?.certificateNumber}
        onDismiss={() => setCourseCompletion(null)}
      />

      <motion.main
        layout
        transition={springApple}
        className={cn(
          "flex flex-1 flex-col lg:flex-row mx-auto transition-all duration-700",
          isFocusMode
            ? "w-screen max-w-none p-10 min-h-[100vh] justify-center items-center gap-0"
            : "w-full max-w-[1800px] p-4 lg:p-6 xl:p-8 gap-6",
        )}
      >
        {/* ── LEFT: VIDEO + META ───────────────────────────── */}
        <motion.div
          layout
          className={cn(
            "flex flex-col min-w-0 transition-all duration-700",
            isFocusMode ? "w-full max-w-[1400px] gap-0" : "flex-1 gap-5",
          )}
        >
          {/* Video Player: use lesson-provided media when available */}
          {(() => {
            const currentLesson = lessons.find((l) => l.id === lessonId);
            const mediaSrc = currentLesson?.media?.src;
            const thumbnails = Array.isArray(currentLesson?.media?.thumbnails)
              ? currentLesson.media.thumbnails[0]
              : currentLesson?.media?.thumbnails;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const poster = currentLesson?.media?.poster;

            if (!mediaSrc) {
              return (
                <div className="w-full aspect-video rounded-3xl bg-white/5 flex items-center justify-center text-white/40">
                  Video unavailable
                </div>
              );
            }

            return (
              <VideoPlayer
                ref={playerRef}
                key={lessonId}
                title={lessonTitle}
                src={mediaSrc}
                thumbnails={thumbnails}
                heatmapBuckets={heatmapBuckets}
                onTimeUpdate={onTimeUpdate}
                onPause={onPause}
                onSeeked={onSeeked}
                onEnded={onEnded}
                onDurationChange={setVideoDuration}
              />
            );
          })()}

          {/* Lesson Meta */}
          <LessonMeta
            lessonId={lessonId}
            title={lessonTitle}
            lessonIndex={lessonIndex}
            totalLessons={totalLessons}
            courseSlug={courseSlug}
            prevLessonId={prevLesson?.id}
            prevLessonTitle={prevLesson?.title}
            nextLessonId={nextLesson?.id}
            nextLessonTitle={nextLesson?.title}
            duration="18 min"
            resumePoint={resumePoint}
            onResume={handleResume}
            isCompleted={isLessonCompleted}
          />
        </motion.div>

        {/* ── RIGHT: CURRICULUM SIDEBAR ───────────────────── */}
        <LessonSidebar
          courseSlug={courseSlug}
          currentLessonId={lessonId}
          lessons={lessons}
          className="hidden lg:flex shrink-0 w-80 xl:w-96"
          progress={{
            [lessonId]: isLessonCompleted
              ? 100
              : (progress?.watchedPercentage ?? 0),
            ...Object.fromEntries(
              lessons
                .filter((l) => l.isCompleted)
                .map((l) => [l.id, 100]),
            ),
          }}
        />
      </motion.main>
    </>
  );
}
