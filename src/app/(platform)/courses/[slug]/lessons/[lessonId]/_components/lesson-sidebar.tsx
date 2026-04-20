"use client";

import { PlayCircle, Lock, CheckCircle2, BookOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DrawerContent } from "@/components/ui/drawer-sheet";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { motion } from "framer-motion";

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

const listVariants = {
  visible: { transition: { staggerChildren: 0.05 } },
  hidden: {},
};

const itemVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function LessonSidebar({
  courseSlug,
  currentLessonId,
  lessons,
  className,
}: LessonSidebarProps) {
  const { isDrawerOpen, setDrawerOpen } = useUILayoutStore();
  const completedCount = lessons.filter((l) => l.isCompleted).length;
  
  // Calculate total duration (mock calculation assuming 15m average if not provided properly)
  const totalDuration = "1h 45m"; 

  const SidebarContent = () => (
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

        {/* Course Progress Mini Map */}
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

      {/* Lessons List Container */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 group cursor-default">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-blue-400/40 transition-colors">Section 1: Fundamentals</span>
          <div className="h-px flex-1 bg-white/[0.03]" />
        </div>

        <motion.nav
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] xl:max-h-[60vh] pr-1.5 -mr-1.5 custom-scrollbar"
        >
          {lessons.map((lesson, index) => {
            const isCurrent = lesson.id === currentLessonId;

            return (
              <motion.div
                key={lesson.id}
                variants={itemVariants}
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
                    </div>
                  </div>

                  {/* Active Slide-in Indicator */}
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

  return (
    <>
      {/* Desktop Sidebar — h-fit for short lists, and max-h for long lists */}
      <aside
        className={cn(
          "flex flex-col rounded-[24px] p-6 h-fit self-start",
          "bg-white/[0.03] backdrop-blur-[40px]",
          "border border-white/10 shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)]",
          className
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Curriculum Drawer */}
      {isDrawerOpen && (
        <DrawerContent className="p-6 bg-[#050812]/95 backdrop-blur-[60px] border-t border-white/10 rounded-t-[32px]">
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
          <SidebarContent />
        </DrawerContent>
      )}
    </>
  );
}

