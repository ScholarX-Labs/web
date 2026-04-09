"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { Course } from "@/types/course.types";
import { useEnrollmentStore } from "@/stores/enrollment.store";
import { useCourseSheetStore } from "@/stores/course-sheet.store";
import {
  EnrollmentContext,
  EnrollmentSourceSurface,
} from "@/lib/enrollment/types";
import { emitEnrollmentEvent } from "@/lib/telemetry/enrollment-events";

interface OpenFromCtaInput {
  course: Course;
  source: EnrollmentSourceSurface;
}

interface OpenFromCardInput extends OpenFromCtaInput {
  originRect: DOMRect;
}

const createCorrelationId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useEnrollIntentController() {
  const prefersReducedMotion = useReducedMotion();
  const markPrecheck = useEnrollmentStore((state) => state.markPrecheck);
  const openModal = useEnrollmentStore((state) => state.openModal);
  const setIntent = useCourseSheetStore((state) => state.setIntent);
  const openCourseSheet = useCourseSheetStore((state) => state.openCourseSheet);

  const makeContext = useMemo(
    () =>
      (course: Course, source: EnrollmentSourceSurface): EnrollmentContext => ({
        command: {
          courseId: course.id,
          source,
          correlationId: createCorrelationId(),
          timestamp: Date.now(),
          viewport:
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? "desktop"
              : "mobile",
          reducedMotion: Boolean(prefersReducedMotion),
        },
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          requiresForm: course.requiresForm,
          price: course.price,
        },
      }),
    [prefersReducedMotion],
  );

  return {
    openFromCta: ({ course, source }: OpenFromCtaInput) => {
      const context = makeContext(course, source);
      emitEnrollmentEvent({
        event: "enroll_click",
        timestamp: context.command.timestamp,
        courseId: context.command.courseId,
        sourceSurface: context.command.source,
        correlationId: context.command.correlationId,
      });
      markPrecheck(context);
      openModal(context);
    },

    openFromCard: ({ course, source, originRect }: OpenFromCardInput) => {
      const context = makeContext(course, source);
      emitEnrollmentEvent({
        event: "enroll_click",
        timestamp: context.command.timestamp,
        courseId: context.command.courseId,
        sourceSurface: context.command.source,
        correlationId: context.command.correlationId,
      });
      markPrecheck(context);
      setIntent("enroll");
      openCourseSheet(course, "enroll", originRect);
    },
  };
}
