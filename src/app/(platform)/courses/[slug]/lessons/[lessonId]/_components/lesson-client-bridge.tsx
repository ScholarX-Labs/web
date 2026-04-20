"use client";

import React, { useRef, useState } from "react";
import { useLessonProgress } from "@/hooks/use-lesson-progress";
import { VideoPlayer } from "./video-player";
import { LessonMeta } from "./lesson-meta";
import { LessonSidebar } from "./lesson-sidebar";
import type { MediaPlayerInstance } from "@vidstack/react";

interface LessonClientBridgeProps {
  lessonId: string;
  courseSlug: string;
  lessonTitle: string;
  lessonIndex: number;
  totalLessons: number;
  prevLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  lessons: any[]; // The full curriculum array
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
    if (playerRef.current) {
      playerRef.current.currentTime = position;
      playerRef.current.play();
    }
  };

  return (
    <main className="flex flex-1 flex-col lg:flex-row gap-6 p-4 lg:p-6 xl:p-8 w-full max-w-[1800px] mx-auto">
      {/* ── LEFT: VIDEO + META ───────────────────────────── */}
      <div className="flex flex-1 flex-col gap-5 min-w-0">
        {/* Video Player */}
        <VideoPlayer
          ref={playerRef}
          key={lessonId}
          title={lessonTitle}
          src="youtube/_cMxraX_5RE"
          thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
          heatmapBuckets={heatmapBuckets}
          onTimeUpdate={onTimeUpdate}
          onPause={onPause}
          onSeeked={onSeeked}
          onEnded={onEnded}
          onDurationChange={setVideoDuration}
        />

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
      </div>

      {/* ── RIGHT: CURRICULUM SIDEBAR ───────────────────── */}
      <LessonSidebar
        courseSlug={courseSlug}
        currentLessonId={lessonId}
        lessons={lessons}
        className="hidden lg:flex shrink-0 w-80 xl:w-96"
        progress={{
          [lessonId]: progress?.watchedPercentage ?? 0,
        }}
      />
    </main>
  );
}
