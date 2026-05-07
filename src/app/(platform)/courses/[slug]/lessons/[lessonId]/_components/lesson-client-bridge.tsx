"use client";

import React, { useRef, useState, useEffect } from "react";
import { useLessonProgress } from "@/hooks/use-lesson-progress";
import { markCourseCompleted } from "@/actions/certificates.actions";
import { triggerCelebration } from "@/lib/celebrations";
import { toast } from "sonner";
import { VideoPlayer } from "./video-player";
import { LessonMeta } from "./lesson-meta";
import { LessonSidebar } from "./lesson-sidebar";
import { LessonCompletionBanner } from "./lesson-completion-banner";
import { motion } from "framer-motion";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { cn } from "@/lib/utils";
import { springApple } from "@/lib/motion-variants";
import type { MediaPlayerInstance } from "@vidstack/react";
import type { LessonSummary } from "@/types/course.types";

interface LessonClientBridgeProps {
  lessonId: string;
  courseSlug: string;
  courseId?: string; // Support for completion actions
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
  courseId,
  lessonTitle,
  lessonIndex,
  totalLessons,
  prevLesson,
  nextLesson,
  lessons,
}: LessonClientBridgeProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const { isFocusMode } = useUILayoutStore();
  const [showLessonCelebration, setShowLessonCelebration] = useState(false);
  const hasCelebratedLesson = useRef(false);

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
    courseId,
    videoDuration: 0, // Will be updated via setVideoDuration
    onCourseCompleted: async (id) => {
      // Trigger if this is the last lesson (lessonIndex is 1-based)
      const isLastLesson = lessonIndex === totalLessons;
      if (isLastLesson) {
        try {
          await markCourseCompleted(id, {
            completedLessons: totalLessons,
            completionPercentage: 100,
          });
          
          triggerCelebration();
          toast.success("Congratulations! You've earned a certificate.", {
            description: "You can view and download it in your dashboard.",
            action: {
              label: "View Certificate",
              onClick: () => window.location.href = "/certificates",
            },
            duration: 10000,
          });
        } catch (err) {
          console.error("Failed to mark course as completed:", err);
        }
      }
    },
  });

  // 1a. Listen for current lesson completion to show the banner
  useEffect(() => {
    if (progress?.watchedPercentage && progress.watchedPercentage >= 95 && !hasCelebratedLesson.current) {
      hasCelebratedLesson.current = true;
      setShowLessonCelebration(true);
      
      // Auto-hide banner after 5 seconds
      const timer = setTimeout(() => setShowLessonCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [progress?.watchedPercentage]);

  // Reset celebration gate if lesson changes
  useEffect(() => {
    hasCelebratedLesson.current = false;
    setShowLessonCelebration(false);
  }, [lessonId]);

  // 2. Resume Handler
  const handleResume = (position: number) => {
    const player = playerRef.current;
    if (!player) return;

    // Some player implementations return a Promise from `play()` (modern browsers).
    // Await resolution before seeking to avoid seek-during-load races.
    try {
      const maybePromise = player.play?.();
      if (maybePromise instanceof Promise) {
        maybePromise
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
        "flex flex-1 flex-col lg:flex-row mx-auto transition-all duration-700 relative",
        isFocusMode 
          ? "w-screen max-w-none p-10 min-h-[100vh] justify-center items-center gap-0" 
          : "w-full max-w-[1800px] p-4 lg:p-6 xl:p-8 gap-6"
      )}
    >
      {/* Lesson Completion Animation Overlay */}
      <LessonCompletionBanner isVisible={showLessonCelebration} />

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
          const rawThumbnails = currentLesson?.media?.thumbnails;
          const thumbnails = Array.isArray(rawThumbnails) ? rawThumbnails[0] : rawThumbnails;
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
        }}
      />
    </motion.main>
  );
}
