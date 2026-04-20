"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, BookOpen, Clock, CheckCircle2,
  Share2, Bookmark, MoreHorizontal, Check, Link2,
  Flag, NotebookPen, Gauge
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LessonTabs } from "./lesson-tabs";

interface LessonMetaProps {
  lessonId: string;
  title: string;
  lessonIndex: number;
  totalLessons: number;
  courseSlug: string;
  prevLessonId?: string;
  prevLessonTitle?: string;
  nextLessonId?: string;
  nextLessonTitle?: string;
  duration?: string;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// ── Inline Toast ──────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-medium shadow-xl"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── More Options Dropdown ─────────────────────────────────────
interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}

function MoreOptionsDropdown({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: DropdownItem[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[100]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-12 z-[101] w-64 rounded-2xl overflow-hidden bg-[#0d1225]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]"
          >
            <div className="p-1.5 flex flex-col gap-0.5">
              {items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.onClick(); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group",
                    item.danger
                      ? "hover:bg-red-500/10 text-red-400/80 hover:text-red-400"
                      : "hover:bg-white/[0.06] text-white/70 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    item.danger ? "bg-red-500/10" : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{item.label}</span>
                    <span className="text-[10px] opacity-50">{item.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Component ────────────────────────────────────────────
export function LessonMeta({
  lessonId,
  title,
  lessonIndex,
  totalLessons,
  courseSlug,
  prevLessonId,
  prevLessonTitle,
  nextLessonId,
  nextLessonTitle,
  duration = "18 min",
}: LessonMetaProps) {
  const progress = ((lessonIndex + 1) / totalLessons) * 100;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [activeTabOverride, setActiveTabOverride] = useState<"notes" | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareData = { title: `Lesson: ${title}`, url };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard");
      }
    } catch {
      // User cancelled or no clipboard API
    }
  }, [title, showToast]);

  const handleBookmark = useCallback(() => {
    setIsBookmarked((prev) => {
      const next = !prev;
      showToast(next ? "Lesson bookmarked" : "Bookmark removed");
      return next;
    });
  }, [showToast]);

  const moreOptions: DropdownItem[] = [
    {
      icon: <Gauge className="w-3.5 h-3.5" />,
      label: "Playback Speed",
      description: "Adjust video playback rate",
      onClick: () => showToast("Use the player controls for speed"),
    },
    {
      icon: <NotebookPen className="w-3.5 h-3.5" />,
      label: "Take Notes",
      description: "Open note-taking panel",
      onClick: () => setActiveTabOverride("notes"),
    },
    {
      icon: <Link2 className="w-3.5 h-3.5" />,
      label: "Copy Link",
      description: "Copy lesson URL to clipboard",
      onClick: () => {
        navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard");
      },
    },
    {
      icon: <Flag className="w-3.5 h-3.5" />,
      label: "Report Issue",
      description: "Flag a problem with this lesson",
      onClick: () => showToast("Report submitted — thank you!"),
      danger: true,
    },
  ];

  return (
    <>
      <Toast visible={toast.visible} message={toast.message} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5"
      >
        {/* ─── PROGRESS BAR ─── */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50 font-medium">Course Progress</span>
            <span className="text-white/80 font-semibold tabular-nums">
              {lessonIndex + 1} / {totalLessons}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            />
          </div>
        </motion.div>

        {/* ─── LESSON TITLE + ACTIONS ─── */}
        <motion.div variants={itemVariants} className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
              <BookOpen className="w-3.5 h-3.5" />
              Lesson {lessonIndex + 1}
            </div>
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
              {title}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 pt-1">
            {/* Bookmark */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleBookmark}
              className={cn(
                "w-9 h-9 rounded-xl backdrop-blur-sm border flex items-center justify-center transition-all",
                isBookmarked
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                  : "bg-white/10 hover:bg-white/20 border-white/10 text-white/70"
              )}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark lesson"}
              aria-pressed={isBookmarked}
            >
              <Bookmark className={cn("w-4 h-4 transition-all", isBookmarked && "fill-current")} />
            </motion.button>

            {/* Share */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 transition-colors"
              aria-label="Share lesson"
            >
              <Share2 className="w-4 h-4" />
            </motion.button>

            {/* More Options */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMoreOptions((v) => !v)}
                className={cn(
                  "w-9 h-9 rounded-xl backdrop-blur-sm border flex items-center justify-center transition-all",
                  showMoreOptions
                    ? "bg-white/20 border-white/20 text-white"
                    : "bg-white/10 hover:bg-white/20 border-white/10 text-white/70"
                )}
                aria-label="More options"
                aria-expanded={showMoreOptions}
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.button>
              <MoreOptionsDropdown
                open={showMoreOptions}
                onClose={() => setShowMoreOptions(false)}
                items={moreOptions}
              />
            </div>
          </div>
        </motion.div>

        {/* ─── Stats Badges ─── */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] border border-white/10 text-xs font-medium text-white/70">
            <Clock className="w-3.5 h-3.5" />
            {duration}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            In Progress
          </div>
        </motion.div>

        {/* ─── TABS: Overview / Notes / Resources ─── */}
        <motion.div variants={itemVariants}>
          <LessonTabs
            lessonId={lessonId}
            courseSlug={courseSlug}
            initialTab={activeTabOverride}
            onTabChange={() => setActiveTabOverride(undefined)}
          />
        </motion.div>

        {/* ─── PREV / NEXT NAVIGATION ─── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {prevLessonId ? (
            <Link
              href={`/courses/${courseSlug}/lessons/${prevLessonId}`}
              className="group flex items-center gap-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/20 p-4 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-white/40 font-medium">Previous</span>
                <span className="text-sm font-semibold text-white/80 truncate">
                  {prevLessonTitle ?? "Previous Lesson"}
                </span>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextLessonId && (
            <Link
              href={`/courses/${courseSlug}/lessons/${nextLessonId}`}
              className="group flex items-center justify-end gap-3 rounded-2xl bg-gradient-to-br from-blue-600/30 to-violet-600/20 hover:from-blue-600/40 hover:to-violet-600/30 border border-blue-500/20 hover:border-blue-500/40 p-4 transition-all duration-200"
            >
              <div className="flex flex-col items-end min-w-0">
                <span className="text-xs text-blue-300/70 font-medium">Next Up</span>
                <span className="text-sm font-semibold text-white/90 truncate">
                  {nextLessonTitle ?? "Next Lesson"}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center shrink-0 group-hover:bg-blue-500/50 transition-colors">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </Link>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
