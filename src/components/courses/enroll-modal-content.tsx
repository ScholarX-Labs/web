"use client";

import { motion, AnimatePresence, Transition } from "framer-motion";
import { Course } from "@/types/course.types";
import { DialogContent } from "@/components/ui/dialog";
import { EnrollmentLifecycle } from "@/lib/enrollment/types";
import { EnrollModalAmbient } from "./enroll-modal-ambient";
import { EnrollModalTitleMedia } from "./enroll-modal-title-media";
import { EnrollModalBenefits } from "./enroll-modal-benefits";
import { EnrollModalActions } from "./enroll-modal-actions";
import { EnrollModalSuccessView } from "./enroll-modal-success-view";

interface EnrollModalContentProps {
  course: Course;
  isEnrolling: boolean;
  isSuccess: boolean;
  isPaid: boolean;
  shouldReduceMotion: boolean;
  visualPhase: "open" | "processing" | "success";
  keynoteTransition: Transition;
  processingStep: number;
  processingSteps: string[];
  handleEnrollFree: () => void;
  closeModal: () => void;
  onDismiss?: () => void;
  setLifecycle: (lifecycle: EnrollmentLifecycle) => void;
  overlayClassName: string;
}

export function EnrollModalContent({
  course,
  isEnrolling,
  isSuccess,
  isPaid,
  shouldReduceMotion,
  visualPhase,
  keynoteTransition,
  processingStep,
  processingSteps,
  handleEnrollFree,
  closeModal,
  onDismiss,
  setLifecycle,
  overlayClassName,
}: EnrollModalContentProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: 8,
      transition: { duration: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12, scale: 0.985 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: keynoteTransition,
    },
  };

  return (
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
      <EnrollModalAmbient shouldReduceMotion={shouldReduceMotion} />

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
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div variants={itemVariants}>
                <EnrollModalTitleMedia
                  course={course}
                  shouldReduceMotion={shouldReduceMotion}
                />
              </motion.div>

              <div className="p-6 space-y-6">
                <motion.div variants={itemVariants}>
                  <EnrollModalBenefits
                    shouldReduceMotion={shouldReduceMotion}
                    durationLabel={course.duration}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <EnrollModalActions
                    course={course}
                    isPaid={isPaid}
                    isEnrolling={isEnrolling}
                    shouldReduceMotion={shouldReduceMotion}
                    processingStep={processingStep}
                    processingSteps={processingSteps}
                    onSubmit={handleEnrollFree}
                  />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <EnrollModalSuccessView
              course={course}
              shouldReduceMotion={shouldReduceMotion}
              keynoteTransition={keynoteTransition}
              closeModal={closeModal}
              onDismiss={onDismiss}
              setLifecycle={setLifecycle}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </DialogContent>
  );
}
