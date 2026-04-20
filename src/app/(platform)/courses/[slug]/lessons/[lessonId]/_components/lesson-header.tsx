"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Share2, Tv2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { MobileCurriculumTrigger } from "./mobile-curriculum-trigger";

interface LessonHeaderProps {
  slug: string;
  lessonTitle: string;
}

export function LessonHeader({ slug, lessonTitle }: LessonHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareData = { title: `Lesson: ${lessonTitle}`, url };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled
    }
  }, [lessonTitle]);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="sticky top-0 z-50 flex items-center justify-between gap-4 px-4 lg:px-6 py-3 shrink-0"
      style={{
        background: "linear-gradient(to bottom, rgba(5,8,18,0.95) 0%, rgba(5,8,18,0.7) 70%, transparent 100%)",
        WebkitBackdropFilter: "blur(20px)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* LEFT — Back navigation + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <motion.div whileHover={{ x: -3 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400 }}>
          <Link
            href={`/courses/${slug}`}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors"
            aria-label="Back to course"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </Link>
        </motion.div>

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

        {/* Share button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
          style={{ color: copied ? "rgb(52 211 153)" : "rgba(255,255,255,0.7)" }}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              Share
            </>
          )}
        </motion.button>

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
