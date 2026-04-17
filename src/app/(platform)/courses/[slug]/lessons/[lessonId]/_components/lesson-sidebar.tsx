"use client";

import { PlayCircle, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
}

/**
 * Encapsulated sidebar component for lesson navigation.
 * Displays a beautifully styled list of lessons within the course.
 */
export function LessonSidebar({
  courseSlug,
  currentLessonId,
  lessons,
  className,
}: LessonSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-4 w-full lg:max-w-xs xl:max-w-sm rounded-3xl bg-white/50 dark:bg-card/30 backdrop-blur-3xl border border-white/20 dark:border-white/10 p-6 shadow-xl",
        className
      )}
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
          Up Next
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          {lessons.length} Lessons
        </span>
      </div>

      <nav className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
        {lessons.map((lesson) => {
          const isCurrent = lesson.id === currentLessonId;

          return (
            <Link
              key={lesson.id}
              href={`/courses/${courseSlug}/lessons/${lesson.id}`}
              className={cn(
                "group relative flex items-start gap-4 p-3 rounded-2xl transition-all duration-300",
                isCurrent
                  ? "bg-slate-900 shadow-md text-white dark:bg-white dark:text-slate-900"
                  : "hover:bg-white/80 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
              )}
              aria-current={isCurrent ? "page" : undefined}
            >
              {/* Status Icon */}
              <div
                className={cn(
                  "mt-0.5 flex items-center justify-center min-w-5 h-5",
                  isCurrent
                    ? "text-white dark:text-slate-900"
                    : lesson.isCompleted
                    ? "text-emerald-500"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                {lesson.isLocked ? (
                  <Lock className="w-4 h-4" />
                ) : lesson.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
              </div>

              {/* Lesson Text */}
              <div className="flex flex-col gap-1 w-full">
                <span
                  className={cn(
                    "text-sm font-medium line-clamp-2 leading-tight transition-colors",
                    isCurrent
                      ? "text-white dark:text-slate-900"
                      : "group-hover:text-slate-900 dark:group-hover:text-white"
                  )}
                >
                  {lesson.title}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isCurrent
                      ? "text-white/70 dark:text-slate-900/70"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {lesson.duration}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
