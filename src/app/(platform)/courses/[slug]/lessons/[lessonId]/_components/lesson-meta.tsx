"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, BookOpen, Clock,
  Bookmark, MoreHorizontal, Check, Link2,
  Flag, NotebookPen, Gauge, Plus
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LessonTabs } from "./lesson-tabs";
import { ResumePromptBanner } from "./resume-prompt-banner";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ContextTooltip } from "@/components/ui/context-tooltip";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { staggerContainer, staggerItem, scaleFade, metaFocusVariants } from "@/lib/motion-variants";
import { zIndex } from "@/lib/design-tokens";

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
  resumePoint?: number | null;
  onResume?: (position: number) => void;
}

// ── Inline Toast ───────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-medium shadow-xl"
          style={{ zIndex: zIndex.toast }}
        >
          <Check className="w-4 h-4 text-emerald-400" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── More Options Dropdown ──────────────────────────────────────────────────────
interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}

function MoreOptionsDropdown({ open, onClose, items }: {
  open: boolean; onClose: () => void; items: DropdownItem[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0" style={{ zIndex: zIndex.modal - 1 }} onClick={onClose} />
          <motion.div
            variants={scaleFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 top-12 w-64 rounded-2xl overflow-hidden bg-[#0d1225]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]"
            style={{ zIndex: zIndex.modal }}
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

// ── Main Component ─────────────────────────────────────────────────────────────
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
  resumePoint,
  onResume,
}: LessonMetaProps) {
  const idx = Number(lessonIndex) || 0;
  const total = Number(totalLessons) || 1;
  const progress = (idx / total) * 100;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const timerRef = useRef<number | null>(null);
  const [activeTabOverride, setActiveTabOverride] = useState<"notes" | undefined>(undefined);
  const [showResumePrompt, setShowResumePrompt] = useState(!!resumePoint);
  const { setNotesOverlayOpen, isFocusMode } = useUILayoutStore();

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    // Clear any existing timer to avoid clobbering concurrent toasts
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
      timerRef.current = null;
    }, 2500);
  }, []);

  // Cleanup timer on unmount to avoid leaking timeouts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Ensure the resume prompt appears if resumePoint is loaded after mount.
  useEffect(() => {
    if (resumePoint != null && !showResumePrompt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowResumePrompt(true);
    }
  }, [resumePoint, showResumePrompt]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    // Prefer the Web Share API when available; fall back to clipboard.
    try {
      const nav = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
        canShare?: (data: ShareData) => boolean;
      };

      const hasShare = typeof nav !== "undefined" && typeof nav.share === "function";
      const hasCanShare = typeof nav !== "undefined" && typeof nav.canShare === "function";

      if (hasShare) {
        try {
          // If canShare is available, check before calling share.
          if (hasCanShare && nav.canShare) {
            const can = nav.canShare({ title: `Lesson: ${title}`, url });
            if (can) {
              await nav.share!({ title: `Lesson: ${title}`, url });
              return;
            }
          } else {
            // If canShare is not available, still try share and fall back on failure.
            await nav.share!({ title: `Lesson: ${title}`, url });
            return;
          }
        } catch {
          // Sharing failed or was cancelled — fall back to clipboard below.
        }
      }

      // Fallback: use Clipboard API if available.
      if (typeof navigator?.clipboard?.writeText === "function") {
        try {
          await navigator.clipboard.writeText(url);
          showToast("Link copied to clipboard");
          return;
        } catch (err) {
          showToast("Failed to copy link");
          return;
        }
      }

      // Last resort: inform the user sharing isn't supported.
      showToast("Sharing not supported on this device");
    } catch (err) {
      showToast("Failed to share or copy link");
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
      // Use overlay instead of tab switch
      onClick: () => setNotesOverlayOpen(true),
    },
    {
      icon: <Link2 className="w-3.5 h-3.5" />,
      label: "Copy Link",
      description: "Copy lesson URL to clipboard",
      onClick: async () => {
        try {
          if (typeof navigator?.clipboard?.writeText === "function") {
            await navigator.clipboard.writeText(window.location.href);
            showToast("Link copied to clipboard");
          } else {
            showToast("Copy not supported on this device");
          }
        } catch (err) {
          showToast("Failed to copy link");
        }
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

      {/* Resume Prompt Banner */}
      {showResumePrompt && resumePoint != null && (
        <ResumePromptBanner
          resumePoint={resumePoint}
          onResume={(pos) => {
            onResume?.(pos);
            setShowResumePrompt(false);
          }}
          onDismiss={() => setShowResumePrompt(false)}
        />
      )}

      <motion.div
        variants={metaFocusVariants}
        animate={isFocusMode ? "hidden" : "visible"}
        className="flex flex-col gap-10"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-5"
        >
        {/* ─── PROGRESS BAR ─── */}
        <motion.div variants={staggerItem} className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Course Momentum</span>
            <span className="text-xs font-bold text-blue-400 tabular-nums">
              {idx} of {total} Lessons
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>
        </motion.div>

        {/* ─── LESSON TITLE + ACTIONS ─── */}
        <motion.div variants={staggerItem} className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40">
                <BookOpen className="w-3 h-3 text-blue-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/80">Episode {idx}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black tracking-tighter text-white leading-[0.95] drop-shadow-sm">
              {title}
            </h1>
          </div>

          {/* Action Buttons — Spatial Glass Icons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ContextTooltip content={isBookmarked ? "Saved" : "Save Lesson"}>
              <AnimatedButton
                onClick={handleBookmark}
                className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                  isBookmarked
                    ? "bg-blue-600 text-white shadow-blue-500/20"
                    : "bg-white/5 hover:bg-white/10 text-white/40 border border-white/10"
                )}
              >
                <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
              </AnimatedButton>
            </ContextTooltip>

            <ContextTooltip content="Quick Note">
              <AnimatedButton
                onClick={() => setNotesOverlayOpen(true)}
                className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 flex items-center justify-center transition-all duration-500"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </AnimatedButton>
            </ContextTooltip>

            <ContextTooltip content="More Options">
              <div className="relative">
                <AnimatedButton
                  onClick={() => setShowMoreOptions((v) => !v)}
                  className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 border border-white/10",
                    showMoreOptions ? "bg-white/20 text-white" : "bg-white/5 hover:bg-white/10 text-white/40"
                  )}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </AnimatedButton>
                <MoreOptionsDropdown
                  open={showMoreOptions}
                  onClose={() => setShowMoreOptions(false)}
                  items={moreOptions}
                />
              </div>
            </ContextTooltip>
          </div>
        </motion.div>

        {/* ─── Stats Badges ─── */}
        <motion.div variants={staggerItem} className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/40 py-1 border-b border-white/10">
            <Clock className="w-3.5 h-3.5" />
            {duration}
          </div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-400 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Learning
          </div>
        </motion.div>

        {/* ─── TABS ─── */}
        <motion.div variants={staggerItem} className="mt-4">
          <LessonTabs
            lessonId={lessonId}
            courseSlug={courseSlug}
            initialTab={activeTabOverride}
            onTabChange={() => setActiveTabOverride(undefined)}
          />
        </motion.div>

        {/* ─── PREV / NEXT NAVIGATION ─── */}
        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4 mt-4">
          {prevLessonId ? (
            <Link
              href={`/courses/${courseSlug}/lessons/${prevLessonId}`}
              className="group relative flex items-center gap-4 rounded-3xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 p-5 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <div className="relative z-10 flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Previous</span>
                <span className="text-sm font-bold text-white/70 group-hover:text-white truncate">
                  {prevLessonTitle ?? "Back"}
                </span>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextLessonId && (
            <Link
              href={`/courses/${courseSlug}/lessons/${nextLessonId}`}
              className="group relative flex items-center justify-end gap-4 rounded-3xl bg-[#101428] border border-blue-500/20 p-5 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-violet-600/10 opacity-40 group-hover:opacity-70 transition-opacity" />
              <div className="relative z-10 flex flex-col items-end min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">Next Up</span>
                <span className="text-sm font-bold text-white group-hover:scale-[1.02] origin-right transition-transform truncate">
                  {nextLessonTitle ?? "Continue"}
                </span>
              </div>
              <div className="relative z-10 w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] group-hover:scale-110 transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </Link>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  </>
);
}
