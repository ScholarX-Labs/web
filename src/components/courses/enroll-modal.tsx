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
import { executeEnrollment } from "@/lib/enrollment/enrollment-executor";
import { EnrollmentContext } from "@/lib/enrollment/types";
import { emitEnrollmentEvent } from "@/lib/telemetry/enrollment-events";
import { EnrollModalContent } from "./enroll-modal-content";
import { agentLog } from "@/lib/debug/agent-log";

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
  const modalCloseDuration = shouldReduceMotion ? 100 : 450;
  const modalHandoffGap = shouldReduceMotion ? 0 : 40;

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
          location: "src/components/courses/enroll-modal.tsx:autoOpenEffectTimer",
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
            // #region agent log
            agentLog({
              runId: "pre",
              hypothesisId: "H2",
              location:
                "src/components/courses/enroll-modal.tsx:DialogOnOpenChange",
              message: "Enroll Dialog onOpenChange",
              data: {
                open,
                isEnrolling,
                lifecycle: useEnrollmentStore.getState().lifecycle,
              },
              timestamp: Date.now(),
            });
            // #endregion agent log

            if (!open && !isEnrolling) {
              closeModal();
              onDismiss?.();
            }
          }}
        >
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
