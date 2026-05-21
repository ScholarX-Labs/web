"use client";

import { useEffect, useMemo, useState } from "react";
import { Course } from "@/types/course.types";
import { useEnrollmentStore } from "@/stores/enrollment.store";
import { toast } from "sonner";
import { PriorityEnrollmentWindow } from "./priority-enrollment-window";
import { Dialog } from "@/components/ui/dialog";
import { useReducedMotion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { executeEnrollment, deriveEnrollmentMode } from "@/lib/enrollment/enrollment-executor";
import { EnrollmentContext, EnrollmentMode } from "@/lib/enrollment/types";
import { emitEnrollmentEvent } from "@/lib/telemetry/enrollment-events";
import { EnrollModalContent } from "./enroll-modal-content";
import { SalesInquiryForm } from "./sales-inquiry-form";
import { CourseApplicationForm } from "./course-application-form";
import { CourseApplicationStatus } from "./course-application-status";
import { agentLog } from "@/lib/debug/agent-log";
import { coursesService } from "@/lib/api/courses.service";
import { createEnrollmentExecutionContext } from "@/lib/enrollment/create-enrollment-execution-context";

interface EnrollModalProps {
  course: Course;
  autoOpen?: boolean;
  onDismiss?: () => void;
}

export const buildEnrollmentExecutionContext = (
  course: Course,
  context: EnrollmentContext | null,
  reducedMotion = false,
): EnrollmentContext => {
  return createEnrollmentExecutionContext(course, context, reducedMotion);
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
  const [isInquirySubmitted, setIsInquirySubmitted] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<{
    id: string;
    status: "pending" | "reviewing" | "approved" | "rejected" | "waitlisted" | "withdrawn";
    submittedAt: string;
  } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const executionContext = useMemo(
    () =>
      buildEnrollmentExecutionContext(
        course,
        context,
        Boolean(shouldReduceMotion),
      ),
    [course, context, shouldReduceMotion],
  );

  const enrollmentMode: EnrollmentMode = useMemo(
    () => deriveEnrollmentMode(executionContext),
    [executionContext],
  );

  const isInquiry = enrollmentMode === "inquiry" && !isInquirySubmitted;
  const isApplication = enrollmentMode === "application";
  const courseLessonsRoute = ROUTES.COURSE_LESSONS(course.slug ?? course.id);

  const processingSteps = useMemo(
    () => [
      "Validating enrollment",
      "Preparing your learning space",
      "Securing access",
    ],
    [],
  );
  const modalCloseDuration = shouldReduceMotion ? 100 : 450;
  const modalHandoffGap = shouldReduceMotion ? 0 : 40;

  // Handle transition from main modal to priority enrollment window
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const CINEMATIC_DEBOUNCE_MS = 700;

    if (isEnrolling && !showPriorityWindow && !isAnimatingOut) {
      console.log(
        "[ANIMATION-DEBUG] Intent to transition detected, starting debounce timer",
      );

      // Debounce the cinematic sequence to avoid flicker on fast failures
      timer = setTimeout(() => {
        // Double-check we are still in the processing phase before starting animation
        const currentLifecycle = useEnrollmentStore.getState().lifecycle;
        if (currentLifecycle === "processing") {
          console.log(
            "[ANIMATION-DEBUG] Debounce complete, starting exit animation",
          );
          setIsAnimatingOut(true);

          // Hand off to priority window after exit animation duration
          setTimeout(() => {
            if (useEnrollmentStore.getState().isEnrolling) {
              console.log(
                "[ANIMATION-DEBUG] Animation complete, showing priority window",
              );
              setShowPriorityWindow(true);
            } else {
              setIsAnimatingOut(false);
            }
          }, modalCloseDuration);
        } else {
          console.log(
            "[ANIMATION-DEBUG] Enrollment finished before debounce, skipping cinematic",
          );
        }
      }, CINEMATIC_DEBOUNCE_MS);
    } else if (!isEnrolling && (showPriorityWindow || isAnimatingOut)) {
      console.log(
        "[ANIMATION-DEBUG] Resetting animation state (isEnrolling false)",
      );
      setShowPriorityWindow(false);
      setIsAnimatingOut(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isEnrolling, showPriorityWindow, isAnimatingOut, modalCloseDuration]);

  useEffect(() => {
    // Implement auto-open logic with a slight delay so page transitions nicely first
    if (autoOpen && !hasAutoOpened) {
      // #region agent log
      agentLog({
        runId: "pre",
        hypothesisId: "H1",
        location: "src/components/courses/enroll-modal.tsx:autoOpenEffect",
        message: "autoOpen scheduled openModal",
        data: {
          autoOpen,
          hasAutoOpened,
          enrollmentLifecycle: useEnrollmentStore.getState().lifecycle,
        },
        timestamp: Date.now(),
      });
      // #endregion agent log

      const timer = setTimeout(() => {
        openModal();
        setHasAutoOpened(true);

        // #region agent log
        agentLog({
          runId: "pre",
          hypothesisId: "H1",
          location:
            "src/components/courses/enroll-modal.tsx:autoOpenEffectTimer",
          message: "autoOpen timer fired: openModal called",
          data: {
            enrollmentLifecycle: useEnrollmentStore.getState().lifecycle,
          },
          timestamp: Date.now(),
        });
        // #endregion agent log
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
  const keynoteTransition = shouldReduceMotion
    ? { duration: 0.15 }
    : {
        type: "spring" as const,
        stiffness: 280,
        damping: 32,
        mass: 1,
      };

  const overlayClassName =
    visualPhase === "processing"
      ? "z-85 bg-slate-950/55 backdrop-blur-[12px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      : visualPhase === "success"
        ? "z-85 bg-slate-950/48 backdrop-blur-[8px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        : "z-85 bg-slate-950/45 backdrop-blur-[6px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";

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

  useEffect(() => {
    let cancelled = false;

    if (!isApplication || !isModalOpen) {
      setApplicationStatus(null);
      return;
    }

    coursesService
      .getApplicationStatus(course.id)
      .then((result) => {
        if (!cancelled) {
          setApplicationStatus(result.application);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApplicationStatus(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [course.id, isApplication, isModalOpen]);

  const handleInquirySuccess = () => {
    setIsInquirySubmitted(true);
    setLifecycle("success");
    toast.success("Your inquiry has been submitted. Our team will contact you shortly.");
  };

  const handleInquiryError = (message: string) => {
    setError();
    toast.error(message);
  };

  const handleApplicationSuccess = (result: {
    nextAction: "resume_learning" | "checkout" | "application" | "inquiry" | "none";
    message?: string;
  }) => {
    setLifecycle("success");
    toast.success(result.message ?? "Your application has been submitted for review.");
    if (result.nextAction === "resume_learning") {
      closeModal();
      onDismiss?.();
      router.push(courseLessonsRoute);
      return;
    }
    router.refresh();
  };

  const handleApplicationError = (message: string) => {
    setError();
    toast.error(message);
  };

  const handleEnrollFree = async () => {
    console.log("[ENROLL] handleEnrollFree clicked - courseId:", course.id);
    if (course.isSubscribed) {
      toast.info("You are already enrolled in this course.");
      router.push(courseLessonsRoute);
      return;
    }
    console.log(
      "[ANIMATION-DEBUG] Starting enrollment - will trigger exit animation",
    );
    const hadContext = Boolean(context);
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

      if (result.nextAction === "inquiry") {
        toast.success("Please fill in your contact details below.");
        return;
      }

      // Keep processing visible long enough for a premium two-step transition
      const minProcessingDuration = shouldReduceMotion
        ? 220
        : modalCloseDuration + modalHandoffGap + 320;
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
        if (result.nextAction === "resume_learning") {
          closeModal();
          onDismiss?.();
          router.push(courseLessonsRoute);
          return;
        }
        router.refresh();
      }, animationDelay);

      isSuccessful = true;
    } catch (error) {
      console.error("[ENROLL] handleEnrollFree fatal error:", error);
      setError();
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      const currentLifecycle = useEnrollmentStore.getState().lifecycle;
      if (
        !isSuccessful &&
        currentLifecycle !== "error" &&
        currentLifecycle !== "auth_redirect"
      ) {
        setLifecycle("modal_open");
      }
    }
  };

  return (
    <>
      {/* Main Enrollment Modal: close animation is driven by Dialog open state */}
      {isModalOpen && (
        <div style={{ display: showPriorityWindow ? "none" : "block" }}>
          <Dialog
            open={!isAnimatingOut && !showPriorityWindow}
            onOpenChange={(open) => {
              if (!open && !isEnrolling && !isInquiry) {
                closeModal();
                onDismiss?.();
              }
            }}
          >
            {isApplication ? (
              applicationStatus ? (
                <CourseApplicationStatus
                  courseTitle={course.title}
                  status={applicationStatus.status}
                  submittedAt={applicationStatus.submittedAt}
                  overlayClassName={overlayClassName}
                  onContinueEnrollment={
                    applicationStatus.status === "approved"
                      ? handleEnrollFree
                      : undefined
                  }
                />
              ) : (
                <CourseApplicationForm
                  course={course}
                  context={context}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                  overlayClassName={overlayClassName}
                  onSuccess={handleApplicationSuccess}
                  onError={handleApplicationError}
                />
              )
            ) : isInquiry && !isInquirySubmitted ? (
              <div className="z-90 sm:max-w-md p-0 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-[0_32px_95px_rgba(2,6,23,0.28)] ring-1 ring-slate-100/80 backdrop-blur-xl gap-0 dark:border-slate-800 dark:bg-card/95 dark:ring-slate-800/80">
                <div className="p-6 pb-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Interested in {course.title}?
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Share your details and our team will reach out to you.
                  </p>
                </div>
                <SalesInquiryForm
                  course={course}
                  context={context}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                  onSuccess={handleInquirySuccess}
                  onError={handleInquiryError}
                />
              </div>
            ) : (
              <EnrollModalContent
                course={course}
                isEnrolling={isEnrolling}
                isSuccess={isSuccess}
                isPaid={isPaid}
                shouldReduceMotion={Boolean(shouldReduceMotion)}
                visualPhase={visualPhase}
                keynoteTransition={keynoteTransition}
                processingStep={processingStep}
                processingSteps={processingSteps}
                handleEnrollFree={handleEnrollFree}
                closeModal={closeModal}
                onDismiss={onDismiss}
                setLifecycle={setLifecycle}
                overlayClassName={overlayClassName}
              />
            )}
          </Dialog>
        </div>
      )}

      {/* Priority Enrollment Window Modal */}
      <PriorityEnrollmentWindow
        course={course}
        isOpen={showPriorityWindow && isEnrolling}
        processingStep={processingStep}
        processingSteps={processingSteps}
        onClose={() => {
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
