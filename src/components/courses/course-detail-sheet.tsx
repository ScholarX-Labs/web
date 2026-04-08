"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Clock3, Star, Users, X } from "lucide-react";
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
        duration: 380,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        onComplete: () => {
          element.style.overflow = "auto";
          const grid = document.querySelector("[data-active-grid='true']") as HTMLElement | null;
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
    const grid = document.querySelector("[data-active-grid='true']") as HTMLElement | null;
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

    const grid = document.querySelector("[data-active-grid='true']") as HTMLElement | null;
    if (grid) {
      grid.removeAttribute("data-dimmed");
      grid.removeAttribute("data-active-grid");
    }

    if (element && originRect && !prefersReducedMotion) {
      await playReverse(element, originRect, {
        duration: 280,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
      });
    }

    const activeCard = document.querySelector("[data-active-card='true']") as HTMLElement | null;
    if (activeCard) {
      activeCard.style.transition = "opacity 160ms ease-in";
      activeCard.style.opacity = "1";
      activeCard.removeAttribute("data-active-card");
    }

    onClose();
  }, [isDismissing, onClose, originRect, playReverse, prefersReducedMotion]);

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
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    transition: {
      duration: prefersReducedMotion ? 0.12 : 0.22,
      delay: prefersReducedMotion ? 0 : 0.38 + index * 0.04,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
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
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-xl"
        onClick={handleDismiss}
      />

      <div
        ref={sheetRef}
        className={cn(
          "relative z-10 w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.35)] dark:bg-slate-950",
          "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]",
        )}
      >
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
            <motion.div {...reveal(0)} className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                ScholarX Detail Surface
              </p>
              <h2 className="max-w-md text-3xl font-black tracking-tight sm:text-4xl">
                {course.title}
              </h2>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/75">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {course.rating?.toFixed(1) ?? "4.9"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <Users className="h-4 w-4" />
                  {course.studentsCount?.toLocaleString() ?? "1,200"} enrolled
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <Clock3 className="h-4 w-4" />
                  {course.duration || "12h 30m"}
                </span>
              </div>
            </motion.div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-8">
              <motion.div {...reveal(1)} className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hero-blue">
                  {intent === "enroll" ? "Enrollment preview" : "Course detail"}
                </p>
                <h3 className="mt-1 truncate text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                  {course.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  By {course.instructor?.name || "Expert Instructor"}
                </p>
              </motion.div>

              <button
                onClick={handleDismiss}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                aria-label="Close detail sheet"
                style={{ opacity: flipComplete ? 1 : 0 }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <motion.div {...reveal(2)} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Why this course
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {course.description}
                    </p>
                  </motion.div>

                  <motion.div {...reveal(3)}>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      What you&apos;ll learn
                    </h4>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {learningOutcomes.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div {...reveal(4)} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-200">
                        {course.instructor?.avatar ? (
                          <img
                            src={course.instructor.avatar}
                            alt={course.instructor.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {course.instructor?.name || "Expert Instructor"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {course.instructor?.title || "Principal Instructor"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.aside {...reveal(5)} className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Enrollment
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {isPaid ? `$${course.currentPrice}` : "Free"}
                      </p>
                    </div>
                    <BookOpen className="h-6 w-6 text-hero-blue" />
                  </div>

                  <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    <p>• Lifetime access</p>
                    <p>• Certificate of completion</p>
                    <p>• Premium course experience</p>
                  </div>

                  {isEnrolled ? (
                    <Link
                      href={ROUTES.LESSON(course.slug, "1")}
                      className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                    >
                      Resume Learning
                    </Link>
                  ) : (
                    <button
                      onClick={onEnrollIntent}
                      className="inline-flex w-full items-center justify-center rounded-full bg-hero-blue px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-hero-blue-dark"
                    >
                      {isPaid ? "Continue to Enrollment" : "Enroll for Free"}
                    </button>
                  )}

                  <Link
                    href={`${ROUTES.COURSE_DETAIL(course.slug)}?intent=enroll`}
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    View full enrollment flow
                  </Link>
                </motion.aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
