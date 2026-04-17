"use client";

import { useEffect } from "react";
import { Course } from "@/types/course.types";
import { motion, useReducedMotion } from "framer-motion";
import { GraduationCap, ArrowRight, BookOpen } from "lucide-react";
import confetti from "canvas-confetti";

interface EnrollmentSuccessProps {
  course: Course;
  onClose: () => void;
}

export function EnrollmentSuccess({ course, onClose }: EnrollmentSuccessProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    // Fire confetti burst upon mounting
    const end = Date.now() + 1.5 * 1000;
    const colors = ["#3399cc", "#ff6a3a", "#ffffff"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [shouldReduceMotion]);

  return (
    <div className="relative flex flex-col items-center justify-center space-y-6 overflow-hidden py-8 text-center">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-48 rounded-full bg-linear-to-b from-cyan-100/70 to-transparent blur-2xl dark:from-cyan-500/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
      />

      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 0 }
            : { scale: 0.65, opacity: 0, y: 10 }
        }
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                scale: [0.65, 1.06, 1],
                opacity: 1,
                y: [10, -4, 0],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.22 }
            : { duration: 0.62, ease: [0.16, 1, 0.3, 1] }
        }
        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-hero-blue to-hero-blue-dark shadow-2xl shadow-hero-blue/30 ring-8 ring-hero-blue/10"
      >
        {!shouldReduceMotion && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border border-cyan-200/70"
            animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <GraduationCap className="w-12 h-12 text-white ml-2" />
      </motion.div>

      <div className="space-y-2">
        <motion.h2
          initial={{ y: shouldReduceMotion ? 0 : 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.1,
            duration: shouldReduceMotion ? 0.18 : 0.35,
          }}
          className="text-3xl font-extrabold text-slate-900 dark:text-white"
        >
          You&apos;re enrolled!
        </motion.h2>
        <motion.p
          initial={{ y: shouldReduceMotion ? 0 : 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: shouldReduceMotion ? 0.2 : 0.35 }}
          className="mx-auto max-w-sm text-slate-500 dark:text-slate-400"
        >
          Your learning journey in{" "}
          <span className="font-bold text-slate-900 dark:text-slate-200">
            {course.title}
          </span>{" "}
          begins now.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28, duration: 0.25 }}
          className="inline-flex rounded-full border border-cyan-200/70 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-cyan-700 dark:border-cyan-500/35 dark:bg-cyan-500/10 dark:text-cyan-300"
        >
          Learning Access Unlocked
        </motion.div>
      </div>

      <motion.div
        initial={{ y: shouldReduceMotion ? 0 : 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: shouldReduceMotion ? 0.2 : 0.35 }}
        className="flex w-full flex-col gap-3 pt-6"
      >
        <motion.button
          onClick={() => {
            onClose();
            // In a real app we'd navigate to the lesson player:
            // router.push(ROUTES.LESSON(course.slug, "start"));
          }}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 py-4 font-bold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          whileHover={shouldReduceMotion ? undefined : { y: -1, scale: 1.01 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-[-32%] w-[34%] bg-linear-to-r from-transparent via-white/35 to-transparent"
            animate={
              shouldReduceMotion
                ? undefined
                : { x: ["0%", "235%"], opacity: [0, 0.7, 0] }
            }
            transition={
              shouldReduceMotion
                ? undefined
                : { duration: 2.1, repeat: Infinity, ease: "easeInOut" }
            }
          />
          <BookOpen className="w-4 h-4" />
          Start Learning Now
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </motion.button>

        <button
          onClick={onClose}
          className="flex w-full items-center justify-center rounded-xl py-4 font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          Explore More Courses
        </button>
      </motion.div>
    </div>
  );
}
