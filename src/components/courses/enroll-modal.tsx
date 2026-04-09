"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Course } from "@/types/course.types";
import { useEnrollmentStore } from "@/stores/enrollment.store";
import { toast } from "sonner";
import {
  Loader2,
  ShieldCheck,
  PlayCircle,
  Award,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { EnrollmentSuccess } from "./enrollment-success";
import { PriorityEnrollmentWindow } from "./priority-enrollment-window";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { executeEnrollment } from "@/lib/enrollment/enrollment-executor";
import { EnrollmentContext } from "@/lib/enrollment/types";
import { emitEnrollmentEvent } from "@/lib/telemetry/enrollment-events";

interface EnrollModalProps {
  course: Course;
  autoOpen?: boolean;
  onDismiss?: () => void;
}

export const buildEnrollmentExecutionContext = (
  course: Course,
  context: EnrollmentContext | null,
): EnrollmentContext => {
  if (context) return context;

  return {
    command: {
      courseId: course.id,
      source: "deep_link",
      correlationId:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
      viewport:
        typeof window !== "undefined" && window.innerWidth >= 1024
          ? "desktop"
          : "mobile",
      reducedMotion: false,
    },
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      requiresForm: course.requiresForm,
      price: course.price,
    },
  };
};

export function EnrollModal({
  course,
  autoOpen = false,
  onDismiss,
}: EnrollModalProps) {
  const {
    isModalOpen,
    isEnrolling,
    isSuccess,
    context,
    openModal,
    closeModal,
    setLifecycle,
    setError,
    markAuthRedirect,
  } = useEnrollmentStore();
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [showPriorityWindow, setShowPriorityWindow] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const processingSteps = useMemo(
    () => [
      "Validating enrollment",
      "Preparing your learning space",
      "Securing access",
    ],
    [],
  );
  const modalCloseDuration = shouldReduceMotion ? 320 : 580;
  const modalHandoffGap = shouldReduceMotion ? 0 : 340;

  // Handle transition from main modal to priority enrollment window
  useEffect(() => {
    if (isEnrolling && !showPriorityWindow && !isAnimatingOut) {
      console.log("[ANIMATION-DEBUG] Starting exit animation sequence");
      // Trigger animation out
      setIsAnimatingOut(true);

      // After animation completes, show priority window
      const timer = setTimeout(() => {
        console.log(
          "[ANIMATION-DEBUG] Animation complete, showing priority window",
        );
        setShowPriorityWindow(true);
      }, modalCloseDuration + modalHandoffGap);

      return () => clearTimeout(timer);
    } else if (!isEnrolling && (showPriorityWindow || isAnimatingOut)) {
      console.log(
        "[ANIMATION-DEBUG] Resetting animation state (isEnrolling false)",
      );
      setShowPriorityWindow(false);
      setIsAnimatingOut(false);
    }
  }, [
    isEnrolling,
    showPriorityWindow,
    isAnimatingOut,
    modalCloseDuration,
    modalHandoffGap,
  ]);

  useEffect(() => {
    // Implement auto-open logic with a slight delay so page transitions nicely first
    if (autoOpen && !hasAutoOpened) {
      const timer = setTimeout(() => {
        openModal();
        setHasAutoOpened(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, hasAutoOpened, openModal]);

  const isPaid = (course.price ?? 0) > 0;
  const visualPhase = isSuccess
    ? "success"
    : isEnrolling
      ? "processing"
      : "open";
  const keynoteEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const keynoteTransition = shouldReduceMotion
    ? { duration: 0.15 }
    : { duration: 0.56, ease: keynoteEasing };

  const overlayClassName =
    visualPhase === "processing"
      ? "z-85 bg-slate-950/50 supports-backdrop-filter:backdrop-blur-md transition-[opacity,background-color,backdrop-filter] duration-560 ease-[cubic-bezier(0.22,1,0.36,1)]"
      : visualPhase === "success"
        ? "z-85 bg-slate-950/46 supports-backdrop-filter:backdrop-blur-sm transition-[opacity,background-color,backdrop-filter] duration-560 ease-[cubic-bezier(0.22,1,0.36,1)]"
        : "z-85 bg-slate-950/42 supports-backdrop-filter:backdrop-blur-xs transition-[opacity,background-color,backdrop-filter] duration-560 ease-[cubic-bezier(0.22,1,0.36,1)]";

  useEffect(() => {
    if (!isEnrolling) {
      setProcessingStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setProcessingStep((prev) => (prev + 1) % processingSteps.length);
    }, 900);

    return () => window.clearInterval(timer);
  }, [isEnrolling, processingSteps]);

  const handleEnrollFree = async () => {
    console.log("[ENROLL] handleEnrollFree clicked - courseId:", course.id);
    console.log(
      "[ANIMATION-DEBUG] Starting enrollment - will trigger exit animation",
    );
    const hadContext = Boolean(context);
    const executionContext = buildEnrollmentExecutionContext(course, context);
    const enrollmentStartedAt = Date.now();

    if (!hadContext) {
      console.log("[ENROLL] emitting enroll_click event");
      emitEnrollmentEvent({
        event: "enroll_click",
        timestamp: Date.now(),
        courseId: executionContext.command.courseId,
        sourceSurface: executionContext.command.source,
        correlationId: executionContext.command.correlationId,
      });
    }

    let isSuccessful = false;
    console.log("[ENROLL] calling setLifecycle(processing)");
    setLifecycle("processing");
    try {
      console.log(
        "[ENROLL] calling executeEnrollment with context:",
        executionContext,
      );
      const result = await executeEnrollment(executionContext);
      console.log("[ENROLL] executeEnrollment returned:", result);

      if (!result.ok) {
        if (result.code === "auth_required") {
          markAuthRedirect();
          closeModal();
          onDismiss?.();
          const redirectUrl = `${ROUTES.SIGNIN}?callbackUrl=${encodeURIComponent(pathname || "/")}`;
          router.push(redirectUrl);
          return;
        }

        setError();
        toast.error(result.message);
        return;
      }

      if (result.nextAction === "checkout" && result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      if (result.nextAction === "application" && result.applicationUrl) {
        router.push(result.applicationUrl);
        return;
      }

      // Keep processing visible long enough for a premium two-step transition
      const minProcessingDuration = shouldReduceMotion
        ? 260
        : modalCloseDuration + modalHandoffGap + 900;
      const elapsed = Date.now() - enrollmentStartedAt;
      const animationDelay = Math.max(minProcessingDuration - elapsed, 0);
      console.log(
        "[ANIMATION-DEBUG] Delaying success state by",
        animationDelay,
        "ms",
      );
      setTimeout(() => {
        console.log(
          "[ANIMATION-DEBUG] Now setting lifecycle to success after animation",
        );
        setLifecycle("success");
        toast.success(result.message || "Enrollment successful!");
        router.refresh();
      }, animationDelay);

      isSuccessful = true;
    } catch {
      setError();
      toast.error("Failed to enroll. Please try again.");
    } finally {
      if (!isSuccessful) {
        setLifecycle("modal_open");
      }
    }
  };

  return (
    <>
      {/* Main Enrollment Modal: close animation is driven by Dialog open state */}
      {isModalOpen && !showPriorityWindow && (
        <Dialog
          open={!isAnimatingOut}
          onOpenChange={(open) => {
            if (!open && !isEnrolling) {
              closeModal();
              onDismiss?.();
            }
          }}
        >
          <DialogContent
            onInteractOutside={(event) => {
              if (isEnrolling) {
                event.preventDefault();
                return;
              }

              closeModal();
            }}
            onEscapeKeyDown={(event) => {
              if (isEnrolling) {
                event.preventDefault();
                return;
              }

              closeModal();
            }}
            overlayClassName={overlayClassName}
            className="z-90 sm:max-w-md p-0 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-[0_32px_95px_rgba(2,6,23,0.28)] ring-1 ring-slate-100/80 backdrop-blur-xl gap-0 dark:border-slate-800 dark:bg-card/95 dark:ring-slate-800/80"
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -left-14 -top-16 h-40 w-40 rounded-full bg-cyan-200/30 blur-2xl dark:bg-cyan-500/20"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        x: [0, 16, 0],
                        y: [0, -10, 0],
                        opacity: [0.5, 0.9, 0.5],
                      }
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
                    : {
                        x: [0, -14, 0],
                        y: [0, 8, 0],
                        opacity: [0.45, 0.85, 0.45],
                      }
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

            <motion.div
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : visualPhase === "processing"
                    ? { opacity: 0.985, scale: 0.992, filter: "blur(0.22px)" }
                    : visualPhase === "success"
                      ? { opacity: 1, scale: 1.008, filter: "blur(0px)" }
                      : { opacity: 1, scale: 1, filter: "blur(0px)" }
              }
              transition={keynoteTransition}
              className="relative z-10 pointer-events-auto"
            >
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.div
                    key="enroll-form"
                    initial={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.95, y: 14 }
                    }
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.98, y: 8 }
                    }
                    transition={keynoteTransition}
                  >
                    <div className="border-b border-slate-100 bg-slate-50/95 p-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/65">
                      <DialogHeader>
                        <DialogTitle className="sr-only">
                          Enroll in {course.title}
                        </DialogTitle>
                      </DialogHeader>

                      <motion.div
                        aria-hidden
                        className="mb-4 h-0.75 origin-left rounded-full bg-linear-to-r from-cyan-400 via-hero-blue to-orange-400"
                        initial={{ scaleX: 0, opacity: 0.65 }}
                        animate={
                          shouldReduceMotion
                            ? { scaleX: 1, opacity: 0.85 }
                            : { scaleX: [0, 1], opacity: [0.65, 1, 0.8] }
                        }
                        transition={
                          shouldReduceMotion
                            ? { duration: 0.2 }
                            : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                        }
                      />

                      <div className="flex gap-4">
                        <motion.div
                          className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-md"
                          initial={{ scale: 0.92, rotate: -2, opacity: 0.8 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          transition={{
                            duration: 0.42,
                            ease: [0.32, 0.72, 0, 1],
                          }}
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
                        <div className="flex flex-col justify-center min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                            {course.title}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1 truncate">
                            By {course.instructor?.name || "Expert Instructor"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          What you get
                        </h4>
                        <motion.ul
                          className="space-y-3"
                          initial={false}
                          animate={{
                            transition: {
                              staggerChildren: shouldReduceMotion ? 0 : 0.06,
                            },
                          }}
                        >
                          <motion.li
                            className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
                            initial={
                              shouldReduceMotion
                                ? undefined
                                : { opacity: 0, x: -6 }
                            }
                            animate={
                              shouldReduceMotion
                                ? undefined
                                : { opacity: 1, x: 0 }
                            }
                          >
                            <PlayCircle className="w-5 h-5 text-hero-blue" />
                            {course.duration || "12 hours"} of high-quality
                            video content
                          </motion.li>
                          <motion.li
                            className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
                            initial={
                              shouldReduceMotion
                                ? undefined
                                : { opacity: 0, x: -6 }
                            }
                            animate={
                              shouldReduceMotion
                                ? undefined
                                : { opacity: 1, x: 0 }
                            }
                          >
                            <Award className="w-5 h-5 text-hero-blue" />
                            Certificate of completion included
                          </motion.li>
                          <motion.li
                            className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
                            initial={
                              shouldReduceMotion
                                ? undefined
                                : { opacity: 0, x: -6 }
                            }
                            animate={
                              shouldReduceMotion
                                ? undefined
                                : { opacity: 1, x: 0 }
                            }
                          >
                            <ShieldCheck className="w-5 h-5 text-hero-blue" />
                            Lifetime access to all updates
                          </motion.li>
                        </motion.ul>
                      </div>

                      <div className="pt-2">
                        {!isPaid ? (
                          <motion.div
                            animate={
                              shouldReduceMotion
                                ? undefined
                                : { scale: isEnrolling ? 1 : 1 }
                            }
                            whileHover={{ scale: isEnrolling ? 1 : 1.015 }}
                            whileTap={{ scale: isEnrolling ? 1 : 0.985 }}
                          >
                            <button
                              onClick={handleEnrollFree}
                              disabled={isEnrolling}
                              className="relative w-full overflow-hidden rounded-xl bg-linear-to-r from-hero-blue to-hero-blue-dark py-4 font-bold text-white shadow-lg shadow-hero-blue/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {!shouldReduceMotion && (
                                <motion.span
                                  aria-hidden
                                  className="pointer-events-none absolute inset-y-0 left-[-34%] w-[36%] bg-linear-to-r from-transparent via-white/40 to-transparent"
                                  animate={
                                    isEnrolling
                                      ? { x: ["0%", "270%"] }
                                      : undefined
                                  }
                                  transition={
                                    isEnrolling
                                      ? {
                                          duration: 1.2,
                                          repeat: Infinity,
                                          ease: "easeInOut",
                                        }
                                      : undefined
                                  }
                                />
                              )}

                              <span className="relative z-10 flex items-center justify-center gap-2">
                                {isEnrolling ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Enrolling...
                                  </>
                                ) : (
                                  "Enroll for Free"
                                )}
                              </span>
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div
                            whileHover={{ scale: 1.015 }}
                            whileTap={{ scale: 0.985 }}
                          >
                            <button
                              onClick={handleEnrollFree}
                              disabled={isEnrolling}
                              className="group relative w-full overflow-hidden rounded-xl bg-slate-900 px-6 py-4 font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-900"
                            >
                              {!shouldReduceMotion && (
                                <motion.span
                                  aria-hidden
                                  className="pointer-events-none absolute inset-y-0 left-[-38%] w-[38%] bg-linear-to-r from-transparent via-white/25 to-transparent"
                                  animate={
                                    isEnrolling
                                      ? { x: ["0%", "280%"] }
                                      : undefined
                                  }
                                  transition={
                                    isEnrolling
                                      ? {
                                          duration: 1.25,
                                          repeat: Infinity,
                                          ease: "easeInOut",
                                        }
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
                                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </span>
                              </span>
                            </button>
                          </motion.div>
                        )}

                        <AnimatePresence>
                          {isEnrolling && (
                            <motion.div
                              initial={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, y: 8 }
                              }
                              animate={{ opacity: 1, y: 0 }}
                              exit={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, y: -4 }
                              }
                              transition={{
                                duration: shouldReduceMotion ? 0.16 : 0.25,
                              }}
                              className="mt-3 space-y-2"
                            >
                              <div className="overflow-hidden rounded-full bg-slate-100/90 p-1 dark:bg-slate-800/80">
                                <motion.div
                                  className="h-1.5 rounded-full bg-linear-to-r from-cyan-500 via-hero-blue to-orange-400"
                                  animate={
                                    shouldReduceMotion
                                      ? { width: "66%" }
                                      : {
                                          width: ["24%", "76%", "42%", "85%"],
                                        }
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

                              <motion.p
                                key={processingStep}
                                initial={
                                  shouldReduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, y: 5 }
                                }
                                animate={{ opacity: 1, y: 0 }}
                                exit={
                                  shouldReduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, y: -5 }
                                }
                                transition={{
                                  duration: shouldReduceMotion ? 0.12 : 0.22,
                                }}
                                className="text-center text-[12px] font-medium text-slate-600 dark:text-slate-300"
                              >
                                {processingSteps[processingStep]}
                              </motion.p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <p className="text-center text-xs text-slate-500 mt-4 px-4 flex justify-center items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          Secure enrollment. Cancel anytime within 30 days.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success-view"
                    initial={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.95, y: 12 }
                    }
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={keynoteTransition}
                    className="p-8"
                  >
                    <EnrollmentSuccess
                      course={course}
                      onClose={() => {
                        closeModal();
                        onDismiss?.();
                        // Reset state after closing animation
                        setTimeout(() => setLifecycle("idle"), 300);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}

      {/* Priority Enrollment Window Modal */}
      <PriorityEnrollmentWindow
        course={course}
        isOpen={showPriorityWindow && isEnrolling}
        processingStep={processingStep}
        processingSteps={processingSteps}
        onClose={() => {
          // Don't close while processing
          if (!isEnrolling) {
            setShowPriorityWindow(false);
            closeModal();
            onDismiss?.();
          }
        }}
      />
    </>
  );
}
