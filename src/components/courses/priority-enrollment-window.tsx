"use client";

import { useEffect, useMemo } from "react";
import { Course } from "@/types/course.types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Loader2,
  ShieldCheck,
  PlayCircle,
  Award,
  CreditCard,
} from "lucide-react";
import Image from "next/image";

interface PriorityEnrollmentWindowProps {
  course: Course;
  isOpen: boolean;
  processingStep: number;
  processingSteps: string[];
  onClose: () => void;
}

export function PriorityEnrollmentWindow({
  course,
  isOpen,
  processingStep,
  processingSteps,
  onClose,
}: PriorityEnrollmentWindowProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      console.log("[PRIORITY-WINDOW] Opening with isOpen:", isOpen);
    }
  }, [isOpen]);

  const keynoteEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const keynoteTransition = shouldReduceMotion
    ? { duration: 0.15 }
    : { duration: 0.56, ease: keynoteEasing };

  const overlayClassName =
    "z-85 bg-slate-950/60 supports-backdrop-filter:backdrop-blur-lg transition-[opacity,background-color,backdrop-filter] duration-560 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
        }}
        overlayClassName={overlayClassName}
        className="z-90 sm:max-w-md p-0 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-[0_32px_95px_rgba(2,6,23,0.28)] ring-1 ring-slate-100/80 backdrop-blur-xl gap-0 duration-560 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-slate-800 dark:bg-card/95 dark:ring-slate-800/80"
      >
        {/* Animated background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-14 -top-16 h-40 w-40 rounded-full bg-cyan-200/30 blur-2xl dark:bg-cyan-500/20"
            animate={
              shouldReduceMotion
                ? undefined
                : { x: [0, 16, 0], y: [0, -10, 0], opacity: [0.5, 0.9, 0.5] }
            }
            transition={
              shouldReduceMotion
                ? undefined
                : { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }
          />
          <motion.div
            className="absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-orange-200/25 blur-2xl dark:bg-orange-500/15"
            animate={
              shouldReduceMotion
                ? undefined
                : { x: [0, -14, 0], y: [0, 8, 0], opacity: [0.45, 0.85, 0.45] }
            }
            transition={
              shouldReduceMotion
                ? undefined
                : {
                    duration: 9.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.35,
                  }
            }
          />
        </div>

        {/* Main content wrapper with entrance animation */}
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.92, y: 20 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.92, y: 20 }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0.2 }
              : { duration: 0.5, ease: keynoteEasing }
          }
          className="relative z-10 pointer-events-auto"
        >
          {/* Header Section */}
          <div className="border-b border-slate-100 bg-linear-to-br from-slate-50/95 to-slate-100/50 p-6 backdrop-blur-xl dark:border-slate-800 dark:from-slate-900/65 dark:to-slate-950/50">
            {/* Priority Badge with animated pulse */}
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8, scale: 0.95 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { duration: 0.4, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }
              }
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300"
            >
              <motion.span
                animate={
                  shouldReduceMotion ? undefined : { scale: [1, 1.2, 1] }
                }
                transition={
                  shouldReduceMotion
                    ? undefined
                    : {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.3,
                      }
                }
                className="inline-block"
              >
                ✨
              </motion.span>
              Priority Enrollment Window
            </motion.div>

            {/* Main title */}
            <motion.h2
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { duration: 0.4, delay: 0.2, ease: keynoteEasing }
              }
              className="text-lg font-bold text-slate-900 dark:text-white mb-1"
            >
              Your enrollment is processing
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { duration: 0.4, delay: 0.25, ease: keynoteEasing }
              }
              className="text-sm text-slate-500 dark:text-slate-400"
            >
              Securing your learning access
            </motion.p>

            {/* Animated progress indicator */}
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scaleX: 0, originX: 0 }
              }
              animate={{ opacity: 1, scaleX: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }
              }
              className="mt-4 h-1 rounded-full bg-linear-to-r from-cyan-400 via-hero-blue to-orange-400"
            />
          </div>

          {/* Course Info Section */}
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.2 }
                : { duration: 0.4, delay: 0.35, ease: keynoteEasing }
            }
            className="p-6"
          >
            {/* Course Card */}
            <div className="mb-6 flex gap-4 rounded-2xl border border-slate-100/50 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-slate-900/30">
              <motion.div
                className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 shadow-md"
                initial={
                  shouldReduceMotion ? { scale: 1 } : { scale: 0.8, opacity: 0 }
                }
                animate={{ scale: 1, opacity: 1 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0.2 }
                    : { duration: 0.4, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }
                }
              >
                <Image
                  src={
                    course.thumbnail ||
                    "https://images.unsplash.com/photo-1620064916958-605375619af8"
                  }
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </motion.div>
              <motion.div
                className="flex flex-col justify-center min-w-0"
                initial={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }
                }
                animate={{ opacity: 1, x: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0.2 }
                    : { duration: 0.4, delay: 0.4, ease: keynoteEasing }
                }
              >
                <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                  {course.title}
                </p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  By {course.instructor?.name || "Expert Instructor"}
                </p>
              </motion.div>
            </div>

            {/* Processing Steps */}
            <div className="space-y-4 mb-6">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Processing
              </h3>

              {/* Progress bar */}
              <div className="space-y-2">
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
                        : {
                            duration: 1.3,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                    }
                  />
                </div>

                {/* Current step text */}
                <motion.p
                  key={processingStep}
                  initial={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0.12 : 0.22,
                  }}
                  className="text-center text-sm font-medium text-slate-600 dark:text-slate-300 min-h-5"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-hero-blue" />
                    {processingSteps[processingStep]}
                  </span>
                </motion.p>
              </div>
            </div>

            {/* What you'll get */}
            <motion.div
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { duration: 0.4, delay: 0.5, ease: keynoteEasing }
              }
              className="space-y-3 rounded-xl border border-slate-100/50 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-slate-900/30"
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                You&apos;re getting instant access to
              </p>
              <motion.ul
                className="space-y-2"
                initial={false}
                animate={{
                  transition: {
                    staggerChildren: shouldReduceMotion ? 0 : 0.05,
                    delayChildren: shouldReduceMotion ? 0 : 0.55,
                  },
                }}
              >
                <motion.li
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                  initial={
                    shouldReduceMotion ? undefined : { opacity: 0, x: -4 }
                  }
                  animate={
                    shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
                  }
                >
                  <PlayCircle className="w-4 h-4 text-hero-blue shrink-0" />
                  {course.duration || "12 hours"} of video content
                </motion.li>
                <motion.li
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                  initial={
                    shouldReduceMotion ? undefined : { opacity: 0, x: -4 }
                  }
                  animate={
                    shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
                  }
                >
                  <Award className="w-4 h-4 text-hero-blue shrink-0" />
                  Certificate of completion
                </motion.li>
                <motion.li
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                  initial={
                    shouldReduceMotion ? undefined : { opacity: 0, x: -4 }
                  }
                  animate={
                    shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
                  }
                >
                  <ShieldCheck className="w-4 h-4 text-hero-blue shrink-0" />
                  Lifetime access
                </motion.li>
              </motion.ul>
            </motion.div>

            {/* Footer note */}
            <motion.p
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { duration: 0.4, delay: 0.7, ease: keynoteEasing }
              }
              className="text-center text-xs text-slate-500 mt-4 px-4 flex justify-center items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Completing your enrollment...
            </motion.p>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
