"use client";

import { PlayCircle, Lock, CheckCircle2, BookOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DrawerContent } from "@/components/ui/drawer-sheet";
import { FloatingPanel } from "@/components/ui/glass-panel";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion-variants";
import React from "react";

interface LessonContent {
  id: string;
  title: string;
  duration: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
  isLocked?: boolean;
}

interface LessonSidebarProps {
  courseSlug: string;
  currentLessonId: string;
  lessons: LessonContent[];
  className?: string;
  /** Optional per-lesson watch percentage map: lessonId → 0-100 */
  progress?: Record<string, number>;
}

const SidebarInner = React.memo(function SidebarInner({
  courseSlug,
  currentLessonId,
  lessons,
  progress,
}: Omit<LessonSidebarProps, "className">) {
  const { setDrawerOpen } = useUILayoutStore();
  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const totalDuration = "1h 45m";

  return (
    <div className="flex h-full flex-col gap-6 text-white">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-sm text-white tracking-tight">Curriculum</h3>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{totalDuration} total</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold text-white/60 tabular-nums">
              {completedCount}/{lessons.length}
            </span>
          </div>
        </div>

        {/* Course Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / lessons.length) * 100}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 group cursor-default">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-blue-400/40 transition-colors">
            Section 1: Fundamentals
          </span>
          <div className="h-px flex-1 bg-white/[0.03]" />
        </div>

        <motion.nav
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] xl:max-h-[60vh] pr-1.5 -mr-1.5 custom-scrollbar"
        >
          {lessons.map((lesson, index) => {
            const isCurrent = lesson.id === currentLessonId;
            const lessonProgress = progress?.[lesson.id] ?? 0;
            const isInProgress = !lesson.isCompleted && !lesson.isLocked && lessonProgress > 0 && lessonProgress < 100;

            return (
              <motion.div
                key={lesson.id}
                variants={staggerItem}
                whileHover={!lesson.isLocked ? { x: 4, backgroundColor: "rgba(255,255,255,0.04)" } : {}}
                whileTap={!lesson.isLocked ? { scale: 0.985 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="rounded-xl overflow-hidden"
              >
                <Link
                  href={lesson.isLocked ? "#" : `/courses/${courseSlug}/lessons/${lesson.id}`}
                  onClick={() => !lesson.isLocked && setDrawerOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3.5 p-3.5 transition-all duration-300",
                    isCurrent
                      ? "bg-white/[0.08] dark:bg-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] outline outline-1 outline-white/10"
                      : lesson.isLocked
                      ? "opacity-30 cursor-not-allowed grayscale"
                      : "text-white/50 hover:text-white"
                  )}
                  aria-current={isCurrent ? "page" : undefined}
                  aria-disabled={lesson.isLocked}
                >
                  {/* Status Indicator */}
                  <div className={cn(
                    "relative w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500",
                    isCurrent
                      ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                      : lesson.isCompleted
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-white/5 text-white/20 border border-white/5"
                  )}>
                    {/* ProgressRing overlay for in-progress lessons */}
                    {isInProgress && (
                      <ProgressRing
                        value={lessonProgress}
                        size={28}
                        strokeWidth={2}
                        className="absolute inset-0"
                      />
                    )}

                    {lesson.isLocked ? (
                      <Lock className="w-3 h-3" />
                    ) : lesson.isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold">{index + 1}</span>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className={cn(
                      "text-xs font-semibold line-clamp-1 leading-none tracking-tight transition-colors",
                      isCurrent ? "text-white" : "group-hover:text-white"
                    )}>
                      {lesson.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-white/20 flex items-center gap-1 uppercase tracking-wider">
                        <PlayCircle className="w-2.5 h-2.5" />
                        {lesson.duration}
                      </span>
                      {/* Per-lesson progress bar */}
                      {lessonProgress > 0 && !lesson.isCompleted && (
                        <div className="flex-1 h-0.5 rounded-full bg-white/5 overflow-hidden max-w-[40px]">
                          <div
                            className="h-full rounded-full bg-blue-500/60"
                            style={{ width: `${lessonProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Indicator — layoutId animates between lessons */}
                  {isCurrent && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute right-3 w-1 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
      </div>
    </div>
  );
});

export const LessonSidebar = React.memo(function LessonSidebar({
  courseSlug,
  currentLessonId,
  lessons,
  className,
  progress,
}: LessonSidebarProps) {
  const { isDrawerOpen } = useUILayoutStore();

  return (
    <>
      {/* Desktop Sidebar — FloatingPanel with proper elevation token */}
      <FloatingPanel
        className={cn("flex flex-col p-6 h-fit self-start", className)}
        style={{ borderRadius: "1.5rem" }}
      >
        <SidebarInner
          courseSlug={courseSlug}
          currentLessonId={currentLessonId}
          lessons={lessons}
          progress={progress}
        />
      </FloatingPanel>

      {/* Mobile Curriculum Drawer */}
      {isDrawerOpen && (
        <DrawerContent className="p-6 bg-[#050812]/95 backdrop-blur-[60px] border-t border-white/10 rounded-t-[32px]">
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
          <SidebarInner
            courseSlug={courseSlug}
            currentLessonId={currentLessonId}
            lessons={lessons}
            progress={progress}
          />
        </DrawerContent>
      )}
    </>
  );
});
