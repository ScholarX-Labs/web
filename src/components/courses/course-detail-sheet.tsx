"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Clock3, Sparkles, Star, Users, X } from "lucide-react";
import { Course } from "@/types/course.types";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CourseSurfaceIntent } from "@/stores/course-sheet.store";
import { useFlipAnimation } from "@/hooks/use-flip-animation";

interface CourseDetailSheetProps {
  course: Course;
  intent: CourseSurfaceIntent;
  originRect?: DOMRect | null;
  onClose: () => void;
  onEnrollIntent: () => void;
}

const learningOutcomes = [
  "Master the fundamentals from zero to hero",
  "Build real-world projects you can show off",
  "Understand the underlying architecture",
  "Performance-minded best practices and patterns",
];

export function CourseDetailSheet({
  course,
  intent,
  originRect,
  onClose,
  onEnrollIntent,
}: CourseDetailSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const { applyInverseFromRect, play, playReverse } = useFlipAnimation();
  const isPaid = (course.price ?? 0) > 0;
  const isEnrolled = Boolean(course.isSubscribed);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [flipComplete, setFlipComplete] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useLayoutEffect(() => {
    if (!sheetRef.current) {
      return;
    }

    const element = sheetRef.current;

    if (prefersReducedMotion || !originRect) {
      element.style.overflow = "auto";
      setFlipComplete(true);
      return;
    }

    applyInverseFromRect(element, originRect);

    const frame = requestAnimationFrame(() => {
      void play(element, {
        duration: 500,
        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
        onComplete: () => {
          element.style.overflow = "auto";
          const grid = document.querySelector(
            "[data-active-grid='true']",
          ) as HTMLElement | null;
          if (grid) {
            grid.style.contain = "auto";
            grid.style.pointerEvents = "auto";
          }
          setFlipComplete(true);
        },
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [applyInverseFromRect, originRect, play, prefersReducedMotion]);

  useEffect(() => {
    const grid = document.querySelector(
      "[data-active-grid='true']",
    ) as HTMLElement | null;
    if (!grid) return;

    grid.setAttribute("data-dimmed", "true");
    return () => {
      grid.removeAttribute("data-dimmed");
      grid.removeAttribute("data-active-grid");
      grid.style.contain = "auto";
      grid.style.pointerEvents = "auto";
    };
  }, []);

  const handleDismiss = useCallback(async () => {
    if (isDismissing) return;
    setIsDismissing(true);
    setFlipComplete(false);

    const element = sheetRef.current;
    if (element) {
      element.style.overflow = "hidden";
    }

    const grid = document.querySelector(
      "[data-active-grid='true']",
    ) as HTMLElement | null;
    if (grid) {
      grid.removeAttribute("data-dimmed");
      grid.removeAttribute("data-active-grid");
    }

    if (element && originRect && !prefersReducedMotion) {
      await playReverse(element, originRect, {
        duration: 420,
        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
      });
    }

    const activeCard = document.querySelector(
      "[data-active-card='true']",
    ) as HTMLElement | null;
    if (activeCard) {
      activeCard.style.transition = "opacity 160ms ease-in";
      activeCard.style.opacity = "1";
      activeCard.removeAttribute("data-active-card");
    }

    onClose();
  }, [isDismissing, onClose, originRect, playReverse, prefersReducedMotion]);

  useEffect(() => {
    if (!flipComplete || !closeButtonRef.current) return;

    closeButtonRef.current.focus({ preventScroll: true });
  }, [flipComplete]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDismiss]);

  const reveal = (index: number) => ({
    initial: false,
    animate: flipComplete
      ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
      : {
          opacity: 0,
          y: prefersReducedMotion ? 0 : 16,
          scale: 0.98,
          filter: "blur(4px)",
        },
    transition: {
      duration: prefersReducedMotion ? 0.2 : 0.55,
      delay: prefersReducedMotion ? 0 : 0.1 + index * 0.05,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  });

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Course details: ${course.title}`}
      className="fixed inset-0 z-[70] flex items-start justify-center px-4 py-4 sm:px-6 sm:py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.22 } }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
    >
      <button
        aria-label="Close course details"
        className="absolute inset-0 cursor-default bg-slate-950/58 backdrop-blur-2xl"
        onClick={handleDismiss}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="absolute left-1/2 top-[14%] h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute right-[14%] top-[8%] h-64 w-64 rounded-full bg-blue-500/12 blur-3xl" />
      </motion.div>

      <div
        ref={sheetRef}
        className={cn(
          "relative z-10 w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/30 bg-white/95 shadow-[0_48px_140px_rgba(15,23,42,0.4)] ring-1 ring-slate-100/80 dark:border-slate-800/70 dark:bg-slate-950/95 dark:ring-slate-800/80",
          "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-linear-to-b from-white/70 to-transparent dark:from-slate-900/50" />

        <div className="flex flex-col lg:flex-row">
          <div className="relative w-full lg:w-[44%] min-h-[260px] lg:min-h-[640px] overflow-hidden bg-slate-950">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-85"
              style={{
                backgroundImage: `url(${course.thumbnail || "https://images.unsplash.com/photo-1620064916958-605375619af8?q=80&w=1600&auto=format&fit=crop"})`,
                viewTransitionName: `course-thumbnail-${course.slug}`,
              }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <motion.div
              {...reveal(0)}
              className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white"
            >
              <h2 className="max-w-md text-3xl font-medium tracking-tight sm:text-4xl">
                {course.title}
              </h2>
              <div className="mt-4 flex flex-wrap gap-4 text-[15px] font-medium text-white/90">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4" />
                  {course.rating?.toFixed(1) ?? "4.9"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {course.studentsCount?.toLocaleString() ?? "1,200"} enrolled
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  {course.duration || "12h 30m"}
                </span>
              </div>
            </motion.div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="relative z-30 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/80 px-6 py-5 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/70 sm:px-10">
              <motion.div {...reveal(1)} className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  {intent === "enroll" ? "Enrollment preview" : "Course detail"}
                </p>
                <h3 className="mt-1.5 truncate text-2xl font-medium tracking-tight text-slate-900 dark:text-white">
                  {course.title}
                </h3>
              </motion.div>

              <button
                ref={closeButtonRef}
                onClick={handleDismiss}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                aria-label="Close detail sheet"
                style={{ opacity: flipComplete ? 1 : 0 }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-10">
              <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-8 pr-4">
                  <motion.div {...reveal(2)}>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
                      Overview
                    </h4>
                    <p className="mt-3 text-[17px] leading-relaxed text-slate-700 dark:text-slate-300">
                      {course.description}
                    </p>
                  </motion.div>

                  <motion.div {...reveal(3)} className="h-px w-full bg-slate-100 dark:bg-slate-800/60" />

                  <motion.div {...reveal(4)}>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
                      What you&apos;ll learn
                    </h4>
                    <ul className="mt-4 space-y-4">
                      {learningOutcomes.map((item) => (
                        <li
                          key={item}
                          className="flex items-start text-[17px] leading-relaxed text-slate-700 dark:text-slate-300"
                        >
                          <span className="mr-4 mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                <motion.aside
                  {...reveal(5)}
                  className="sticky top-5 flex flex-col gap-8"
                >
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
                      Investment
                    </h4>
                    <p className="mt-2 text-5xl font-light tracking-tight text-slate-900 dark:text-white">
                      {isPaid ? `$${course.currentPrice}` : "Free"}
                    </p>
                  </div>

                  <div className="space-y-4 text-[15px] text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-slate-400" /> Lifetime access to content</p>
                    <p className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-slate-400" /> Official completion certificate</p>
                    <p className="flex items-center gap-3"><Star className="h-5 w-5 text-slate-400" /> Premium learning experience</p>
                  </div>

                  <div className="pt-4">
                    {isEnrolled ? (
                      <Link
                        href={ROUTES.LESSON(course.slug, "1")}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-4 text-[15px] font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900"
                      >
                        Resume Learning
                      </Link>
                    ) : (
                      <button
                        onClick={onEnrollIntent}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-4 text-[15px] font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900"
                      >
                        {isPaid ? "Continue to Enrollment" : "Enroll for Free"}
                      </button>
                    )}
                  </div>
                </motion.aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
