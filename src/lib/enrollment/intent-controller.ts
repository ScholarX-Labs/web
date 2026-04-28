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
import { agentLog } from "@/lib/debug/agent-log";
import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";

interface OpenFromCtaInput {
  course: Course;
  source: EnrollmentSourceSurface;
}

interface OpenFromCardInput extends OpenFromCtaInput {
  originRect: DOMRect;
}

const createCorrelationId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useEnrollIntentController() {
  const prefersReducedMotion = useReducedMotion();
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

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

  const checkAuth = (course?: Course) => {
    if (isSessionPending) return false;
    if (!session) {
      // If we have a course, we want to land on the course detail page with the intent
      // Otherwise, we land back where we were
      let targetPath = pathname || "/";
      
      if (course) {
        targetPath = ROUTES.COURSE_DETAIL(course.slug || course.id);
      }
      
      const separator = targetPath.includes("?") ? "&" : "?";
      targetPath = `${targetPath}${separator}intent=enroll`;
      
      const redirectUrl = `${ROUTES.SIGNIN}?callbackUrl=${encodeURIComponent(targetPath)}`;
      router.push(redirectUrl);
      return false;
    }
    return true;
  };

  return {
    openFromCta: ({ course, source }: OpenFromCtaInput) => {
      if (!checkAuth(course)) return;

      const context = makeContext(course, source);
      emitEnrollmentEvent({
        event: "enroll_click",
        timestamp: context.command.timestamp,
        courseId: context.command.courseId,
        sourceSurface: context.command.source,
        correlationId: context.command.correlationId,
      });
      // Skip markPrecheck for direct modal opens - go straight to openModal
      openModal(context);
    },

    openFromCard: ({ course, source, originRect }: OpenFromCardInput) => {
      if (!checkAuth(course)) return;

      const context = makeContext(course, source);
      emitEnrollmentEvent({
        event: "enroll_click",
        timestamp: context.command.timestamp,
        courseId: context.command.courseId,
        sourceSurface: context.command.source,
        correlationId: context.command.correlationId,
      });

      // #region agent log
      agentLog({
        runId: "pre",
        hypothesisId: "H1",
        location: "src/lib/enrollment/intent-controller.ts:openFromCard",
        message: "openFromCard invoked",
        data: {
          courseId: course.id,
          source,
          hasOriginRect: Boolean(originRect),
        },
        timestamp: Date.now(),
      });
      // #endregion agent log

      markPrecheck(context);
      setIntent("enroll");
      openCourseSheet(course, "enroll", originRect);

      // #region agent log
      agentLog({
        runId: "pre",
        hypothesisId: "H1",
        location: "src/lib/enrollment/intent-controller.ts:openFromCard",
        message:
          "openFromCard dispatched markPrecheck + setIntent(enroll) + openCourseSheet",
        data: {
          courseId: course.id,
          intent: "enroll",
        },
        timestamp: Date.now(),
      });
      // #endregion agent log
    },
  };
}
