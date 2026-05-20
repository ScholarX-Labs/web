"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Loader2,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CourseCompletionCelebrationPhase =
  | "generating"
  | "ready"
  | "failed";

interface CourseCompletionCelebrationProps {
  open: boolean;
  phase: CourseCompletionCelebrationPhase;
  courseTitle?: string;
  certificateUrl?: string;
  certificateNumber?: string;
  onDismiss: () => void;
}

const phaseCopy = {
  generating: {
    eyebrow: "Course complete",
    title: "Generating your certificate",
    description:
      "We saved your final lesson completion and are preparing your certificate now.",
  },
  ready: {
    eyebrow: "Certificate ready",
    title: "Your achievement is official",
    description:
      "Your certificate has been issued and is ready to view or share.",
  },
  failed: {
    eyebrow: "Course complete",
    title: "Certificate generation needs a retry",
    description:
      "Your course completion was saved, but the certificate could not be generated yet.",
  },
} as const;

export function CourseCompletionCelebration({
  open,
  phase,
  courseTitle,
  certificateUrl,
  certificateNumber,
  onDismiss,
}: CourseCompletionCelebrationProps) {
  const shouldReduceMotion = useReducedMotion();
  const copy = phaseCopy[phase];
  const isPending = phase === "generating";
  const isReady = phase === "ready";
  const isFailed = phase === "failed";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-completion-title"
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_32px_120px_rgba(15,23,42,0.34)] dark:border-slate-700 dark:bg-slate-950"
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: 0.94 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 18, scale: 0.97 }
            }
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.44,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-4 top-4 z-20 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-blue/50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Close completion message"
            >
              <X className="size-4" />
            </button>

            <div className="relative overflow-hidden bg-linear-to-br from-teal-50 via-white to-orange-50 px-8 pb-7 pt-9 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-teal-500 via-hero-blue to-orange-400" />

              {!shouldReduceMotion ? (
                <div className="pointer-events-none absolute inset-0">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <motion.span
                      key={index}
                      className={cn(
                        "absolute h-8 w-1 rounded-full",
                        index % 2 === 0 ? "bg-teal-400/45" : "bg-orange-400/45",
                      )}
                      style={{
                        left: `${14 + index * 14}%`,
                        top: index % 2 === 0 ? "16%" : "24%",
                      }}
                      initial={{ opacity: 0, y: 16, rotate: -18 }}
                      animate={{
                        opacity: [0, 1, 0],
                        y: [-8, -34, -52],
                        rotate: [-18, 12, 28],
                      }}
                      transition={{
                        duration: 1.4,
                        delay: 0.08 * index,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              ) : null}

              <div className="relative mx-auto mb-5 flex size-24 items-center justify-center">
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-full",
                    isFailed
                      ? "bg-amber-100 dark:bg-amber-500/15"
                      : "bg-teal-100 dark:bg-teal-500/15",
                  )}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : isPending
                        ? { scale: [1, 1.1, 1], opacity: [0.9, 0.55, 0.9] }
                        : { scale: [0.92, 1.04, 1], opacity: [0.75, 1, 0.95] }
                  }
                  transition={{
                    duration: isPending ? 1.4 : 0.7,
                    repeat: isPending ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className={cn(
                    "relative flex size-16 items-center justify-center rounded-2xl text-white shadow-lg",
                    isFailed
                      ? "bg-amber-500 shadow-amber-500/25"
                      : "bg-teal-600 shadow-teal-600/25",
                  )}
                  initial={shouldReduceMotion ? false : { rotate: -8 }}
                  animate={shouldReduceMotion ? undefined : { rotate: 0 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                >
                  {isReady ? (
                    <CheckCircle2 className="size-8" />
                  ) : isFailed ? (
                    <TriangleAlert className="size-8" />
                  ) : (
                    <Award className="size-8" />
                  )}
                </motion.div>
              </div>

              <div className="relative text-center">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                  {copy.eyebrow}
                </p>
                <h2
                  id="course-completion-title"
                  className="text-2xl font-bold tracking-normal text-slate-950 dark:text-white"
                >
                  {copy.title}
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {copy.description}
                </p>
                {courseTitle ? (
                  <p className="mx-auto mt-3 max-w-xs truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                    {courseTitle}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 px-8 py-6">
              {isPending ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <Loader2 className="size-4 animate-spin text-hero-blue" />
                    Issuing certificate
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <motion.div
                      className="h-full rounded-full bg-linear-to-r from-teal-500 via-hero-blue to-orange-400"
                      initial={{ width: shouldReduceMotion ? "72%" : "18%" }}
                      animate={
                        shouldReduceMotion
                          ? { width: "72%" }
                          : { width: ["18%", "72%", "46%", "88%"] }
                      }
                      transition={{
                        duration: 1.4,
                        repeat: shouldReduceMotion ? 0 : Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {certificateNumber && isReady ? (
                <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200">
                  {certificateNumber}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                {certificateUrl && isReady ? (
                  <Button asChild className="h-11 flex-1 cursor-pointer">
                    <Link href={certificateUrl}>
                      View certificate
                      <ExternalLink className="size-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant={certificateUrl && isReady ? "outline" : "default"}
                  className="h-11 flex-1 cursor-pointer"
                  onClick={onDismiss}
                >
                  {isPending ? "Keep watching" : "Continue learning"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
