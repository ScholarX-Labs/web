"use client";

import { motion, Transition } from "framer-motion";
import { Course } from "@/types/course.types";
import { EnrollmentSuccess } from "./enrollment-success";
import { EnrollmentLifecycle } from "@/lib/enrollment/types";

interface EnrollModalSuccessViewProps {
  course: Course;
  shouldReduceMotion: boolean;
  keynoteTransition: Transition;
  closeModal: () => void;
  onDismiss?: () => void;
  setLifecycle: (lifecycle: EnrollmentLifecycle) => void;
}

export function EnrollModalSuccessView({
  course,
  shouldReduceMotion,
  keynoteTransition,
  closeModal,
  onDismiss,
  setLifecycle,
}: EnrollModalSuccessViewProps) {
  return (
    <motion.div
      key="success-view"
      initial={
        shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }
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
          setTimeout(() => setLifecycle("idle"), 300);
        }}
      />
    </motion.div>
  );
}
