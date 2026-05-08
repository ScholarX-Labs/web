"use client";

import { PlayCircle, Lock, CheckCircle2, BookOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DrawerContent } from "@/components/ui/drawer-sheet";
import { FloatingPanel } from "@/components/ui/glass-panel";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, sidebarFocusVariants } from "@/lib/motion-variants";
import React from "react";
import type { LessonSummary } from "@/types/course.types";

interface LessonSidebarProps {
  courseSlug: string;
  currentLessonId: string;
  lessons: LessonSummary[];
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
          className="flex flex-col gap-3 overflow-y-auto max-h-[50vh] xl:max-h-[60vh] pr-1.5 -mr-1.5 custom-scrollbar"
        >
          {lessons.map((lesson, index) => {
            const isCurrent = lesson.id === currentLessonId;
            const lessonProgress = progress?.[lesson.id] ?? 0;
            const isInProgress = !lesson.isCompleted && !lesson.isLocked && lessonProgress > 0 && lessonProgress < 100;

            return (
              <motion.div
                key={lesson.id}
                variants={staggerItem}
                whileHover={!lesson.isLocked ? { scale: 1.01, x: 2 } : {}}
                whileTap={!lesson.isLocked ? { scale: 0.98 } : {}}
                className="relative rounded-2xl overflow-hidden group"
              >
                <Link
                  href={lesson.isLocked ? "#" : `/courses/${courseSlug}/lessons/${lesson.id}`}
                  onClick={() => !lesson.isLocked && setDrawerOpen(false)}
                  className={cn(
                    "relative flex items-center gap-4 p-4 transition-all duration-500",
                    isCurrent
                      ? "bg-white/[0.12] dark:bg-white/[0.08]"
                      : lesson.isLocked
                      ? "opacity-40 cursor-not-allowed grayscale"
                      : "bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white"
                  )}
                  aria-current={isCurrent ? "page" : undefined}
                  aria-disabled={lesson.isLocked}
                >
                  {/* Glossy Gradient Border for Active Item */}
                  {isCurrent && (
                    <div className="absolute inset-0 z-0 p-[1px] rounded-[inherit] overflow-hidden">
                      <div className="absolute inset-[-100%] bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-500 animate-[spin_8s_linear_infinite]" />
                      <div className="absolute inset-[1px] bg-[#0d1225] rounded-[inherit]" />
                    </div>
                  )}

                  <div className="relative z-10 flex items-center gap-4 w-full">
                    {/* Status Indicator */}
                    <div className={cn(
                      "relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-700",
                      isCurrent
                        ? "bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.5)]"
                        : lesson.isCompleted
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-white/5 text-white/30 border border-white/10"
                    )}>
                      {isInProgress && (
                        <ProgressRing
                          value={lessonProgress}
                          size={36}
                          strokeWidth={2.5}
                          className="absolute inset-0"
                        />
                      )}

                      {lesson.isLocked ? (
                        <Lock className="w-4 h-4 opacity-50" />
                      ) : lesson.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-[11px] font-black tracking-tighter tabular-nums">
                          {(index + 1).toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    {/* Text Content */}
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className={cn(
                        "text-xs font-bold leading-tight tracking-tight transition-colors",
                        isCurrent ? "text-white" : "group-hover:text-white"
                      )}>
                        {lesson.title}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-white/30 flex items-center gap-1.5 uppercase tracking-[0.1em]">
                          <PlayCircle className="w-3 h-3" />
                          {lesson.duration}
                        </span>
                        
                        {/* Progressive detail: show percent only if in progress */}
                        {isInProgress && (
                          <span className="text-[9px] font-black text-blue-400/80 tracking-widest uppercase">
                            {Math.round(lessonProgress)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Pulse */}
                    {isCurrent && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,1)] animate-pulse" />
                    )}
                  </div>
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
  const { isDrawerOpen, isFocusMode } = useUILayoutStore();

  return (
    <>
      {/* Desktop Sidebar — FloatingPanel with Focus Mode transition */}
      <motion.div
        variants={sidebarFocusVariants}
        initial="visible"
        animate={isFocusMode ? "hidden" : "visible"}
        className={cn(
          "flex-shrink-0 lg:block overflow-hidden",
          className
        )}
        style={{ "--sidebar-width": "380px" } as React.CSSProperties}
      >
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
      </motion.div>

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
