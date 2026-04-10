"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, ChevronRight, Loader2 } from "lucide-react";
import { Course } from "@/types/course.types";

interface EnrollModalActionsProps {
  course: Course;
  isPaid: boolean;
  isEnrolling: boolean;
  shouldReduceMotion: boolean;
  processingStep: number;
  processingSteps: string[];
  onSubmit: () => void;
}

export function EnrollModalActions({
  course,
  isPaid,
  isEnrolling,
  shouldReduceMotion,
  processingStep,
  processingSteps,
  onSubmit,
}: EnrollModalActionsProps) {
  return (
    <div className="pt-2">
      {course.isSubscribed ? (
        <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
          <button
            onClick={() => {
              // Usually closeModal is handled by the parent, but here we just want to ensure navigation
              // onSubmit in this context might be wired to enrollment, so we'll use a direct link or trigger
              // For now, mirroring the "Continue" behavior
              window.location.href = `/courses/${course.slug}`;
            }}
            className="group relative w-full overflow-hidden rounded-xl bg-emerald-500 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] hover:bg-emerald-600"
          >
            <span className="relative z-10 flex items-center justify-between">
              <span className="flex items-center gap-2">
                Continue Learning
              </span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </motion.div>
      ) : !isPaid ? (
        <motion.div
          animate={
            shouldReduceMotion ? undefined : { scale: isEnrolling ? 1 : 1 }
          }
          whileHover={{ scale: isEnrolling ? 1 : 1.015 }}
          whileTap={{ scale: isEnrolling ? 1 : 0.985 }}
        >
          <button
            onClick={onSubmit}
            disabled={isEnrolling}
            className="relative w-full overflow-hidden rounded-xl bg-linear-to-r from-hero-blue to-hero-blue-dark py-4 font-bold text-white shadow-lg shadow-hero-blue/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {!shouldReduceMotion && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-[-34%] w-[36%] bg-linear-to-r from-transparent via-white/40 to-transparent"
                animate={isEnrolling ? { x: ["0%", "270%"] } : undefined}
                transition={
                  isEnrolling
                    ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    : undefined
                }
              />
            )}

            <span className="relative z-10 flex items-center justify-center gap-2">
              {isEnrolling ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enrolling...
                </>
              ) : (
                "Enroll for Free"
              )}
            </span>
          </button>
        </motion.div>
      ) : (
        <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
          <button
            onClick={onSubmit}
            disabled={isEnrolling}
            className="group relative w-full overflow-hidden rounded-xl bg-slate-900 px-6 py-4 font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-900"
          >
            {!shouldReduceMotion && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-[-38%] w-[38%] bg-linear-to-r from-transparent via-white/25 to-transparent"
                animate={isEnrolling ? { x: ["0%", "280%"] } : undefined}
                transition={
                  isEnrolling
                    ? { duration: 1.25, repeat: Infinity, ease: "easeInOut" }
                    : undefined
                }
              />
            )}

            <span className="relative z-10 flex items-center justify-between">
              <span className="flex items-center gap-2">
                {isEnrolling
                  ? "Starting secure checkout"
                  : course.requiresForm
                    ? "Apply Now"
                    : "Checkout Now"}
              </span>
              <span className="flex items-center gap-2">
                ${course.currentPrice}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </span>
          </button>
        </motion.div>
      )}

      {!course.isSubscribed && (
        <>
          <AnimatePresence>
            {isEnrolling && (
              <motion.div
                initial={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                }
                transition={{ duration: shouldReduceMotion ? 0.16 : 0.25 }}
                className="mt-3 space-y-2"
              >
                <div className="overflow-hidden rounded-full bg-slate-100/90 p-1 dark:bg-slate-800/80">
                  <motion.div
                    className="h-1.5 rounded-full bg-linear-to-r from-cyan-500 via-hero-blue to-orange-400"
                    animate={
                      shouldReduceMotion
                        ? { width: "66%" }
                        : { width: ["24%", "76%", "42%", "85%"] }
                    }
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.2 }
                        : { duration: 1.3, repeat: Infinity, ease: "easeInOut" }
                    }
                  />
                </div>

                <motion.p
                  key={processingStep}
                  initial={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 5 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }
                  }
                  transition={{ duration: shouldReduceMotion ? 0.12 : 0.22 }}
                  className="text-center text-[12px] font-medium text-slate-600 dark:text-slate-300"
                >
                  {processingSteps[processingStep]}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-4 flex items-center justify-center gap-1.5 px-4 text-center text-xs text-slate-500">
            <CreditCard className="h-3.5 w-3.5" />
            Secure enrollment. Cancel anytime within 30 days.
          </p>
        </>
      )}
    </div>
  );
}
