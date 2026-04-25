"use client";

import React, { useRef, useState } from "react";
import { useLessonProgress } from "@/hooks/use-lesson-progress";
import { VideoPlayer } from "./video-player";
import { LessonMeta } from "./lesson-meta";
import { LessonSidebar } from "./lesson-sidebar";
import { motion } from "framer-motion";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { cn } from "@/lib/utils";
import { springApple } from "@/lib/motion-variants";
import type { MediaPlayerInstance } from "@vidstack/react";
import type { LessonSummary } from "@/types/course.types";

interface LessonClientBridgeProps {
  lessonId: string;
  courseSlug: string;
  lessonTitle: string;
  lessonIndex: number;
  totalLessons: number;
  prevLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  lessons: LessonSummary[]; // The full curriculum array
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
  lessonTitle,
  lessonIndex,
  totalLessons,
  prevLesson,
  nextLesson,
  lessons,
}: LessonClientBridgeProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const { isFocusMode } = useUILayoutStore();

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

  // 2. Resume Handler
  const handleResume = (position: number) => {
    const player = playerRef.current;
    if (!player) return;

    // Some player implementations return a Promise from `play()` (modern browsers).
    // Await resolution before seeking to avoid seek-during-load races.
    try {
      const maybePromise = player.play?.();
      if (maybePromise && typeof (maybePromise as any).then === "function") {
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
    <motion.main
      layout
      transition={springApple}
      className={cn(
        "flex flex-1 flex-col lg:flex-row mx-auto transition-all duration-700",
        isFocusMode 
          ? "w-screen max-w-none p-10 min-h-[100vh] justify-center items-center gap-0" 
          : "w-full max-w-[1800px] p-4 lg:p-6 xl:p-8 gap-6"
      )}
    >
      {/* ── LEFT: VIDEO + META ───────────────────────────── */}
      <motion.div
        layout
        className={cn(
          "flex flex-col min-w-0 transition-all duration-700",
          isFocusMode ? "w-full max-w-[1400px] gap-0" : "flex-1 gap-5"
        )}
      >
        {/* Video Player: use lesson-provided media when available */}
        {(() => {
          const currentLesson = lessons.find((l) => l.id === lessonId);
          const mediaSrc = currentLesson?.media?.src;
          const thumbnails = currentLesson?.media?.thumbnails;
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
              poster={poster}
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
        />
      </motion.div>

      {/* ── RIGHT: CURRICULUM SIDEBAR ───────────────────── */}
      <LessonSidebar
        courseSlug={courseSlug}
        currentLessonId={lessonId}
        lessons={lessons}
        className="hidden lg:flex shrink-0 w-80 xl:w-96"
        progress={{
          [lessonId]: progress?.watchedPercentage ?? 0,
          // Mock progress for previous lessons to make UI feel "Wired"
          ...(lessons[0]?.id && { [lessons[0].id]: 100 }),
          ...(lessons[1]?.id && { [lessons[1].id]: 100 }),
        }}
      />
    </motion.main>
  );
}
