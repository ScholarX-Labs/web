"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Share2, Tv2, Check, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ContextTooltip } from "@/components/ui/context-tooltip";
import { MobileCurriculumTrigger } from "./mobile-curriculum-trigger";
import { FocusToggleFloating } from "./focus-toggle-floating";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { focusModeTransition } from "@/lib/motion-variants";
import { zIndex } from "@/lib/design-tokens";

interface LessonHeaderProps {
  slug: string;
  lessonTitle: string;
}

export function LessonHeader({ slug, lessonTitle }: LessonHeaderProps) {
  const [copied, setCopied] = useState(false);
  const { isFocusMode, toggleFocusMode } = useUILayoutStore();
  const router = useRouter();

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareData = { title: `Lesson: ${lessonTitle}`, url };
    try {
      const hasShare = typeof navigator !== "undefined" && typeof (navigator as any).share === "function";
      const hasCanShare = typeof navigator !== "undefined" && typeof (navigator as any).canShare === "function";

      if (hasShare) {
        try {
          // If canShare exists, ask it first; otherwise assume share is available
          if (hasCanShare) {
            const can = (navigator as any).canShare(shareData);
            if (can) {
              await (navigator as any).share(shareData);
              return;
            }
          } else {
            await (navigator as any).share(shareData);
            return;
          }
        } catch (err) {
          // Sharing failed or was cancelled — fall back to clipboard below.
        }
      }

      // Fallback: use Clipboard API if available.
      if (typeof navigator?.clipboard?.writeText === "function") {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        } catch {
          // Clipboard write failed — swallow to preserve UX
        }
      }
    } catch {
      // User cancelled or an unexpected error occurred
    }
  }, [lessonTitle]);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={isFocusMode ? "hidden" : "visible"}
      variants={focusModeTransition}
      className={cn(
        "sticky top-4 z-50 mx-auto flex w-[95%] max-w-[1400px] items-center justify-between gap-4 rounded-[2rem] border border-white/10 px-6 py-3.5 shadow-2xl backdrop-blur-3xl transition-all duration-700",
        isFocusMode ? "pointer-events-none" : "pointer-events-auto"
      )}
      style={{
        zIndex: zIndex.modal,
        backgroundColor: "rgba(5, 8, 18, 0.65)",
        boxShadow: "0 20px 50px -10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)",
      }}
    >
      {/* LEFT — Back navigation + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <ContextTooltip content="Back to course">
          <AnimatedButton
            aria-label="Back to course"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center"
            onClick={() => router.push(`/courses/${slug}`)}
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </AnimatedButton>
        </ContextTooltip>

        {/* Divider + Breadcrumb */}
        <div className="hidden sm:flex items-center gap-3 min-w-0">
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2 min-w-0">
            <Tv2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-sm font-medium text-white/70 truncate max-w-[280px] lg:max-w-[420px]">
              {lessonTitle}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT — actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile curriculum button */}
        <MobileCurriculumTrigger />

        {/* Focus Mode Toggle (Header Variant) */}
        <FocusToggleFloating variant="header" />

        {/* Share button */}
        <ContextTooltip content={copied ? "Copied!" : "Share lesson"}>
          <AnimatedButton
            aria-label="Share lesson"
            onClick={handleShare}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
            style={{ color: copied ? "rgb(52 211 153)" : "rgba(255,255,255,0.7)" }}
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5" />Copied!</>
            ) : (
              <><Share2 className="w-3.5 h-3.5" />Share</>
            )}
          </AnimatedButton>
        </ContextTooltip>

        {/* In Progress badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="text-xs font-semibold text-blue-300">In Progress</span>
        </div>
      </div>
    </motion.header>
  );
}
