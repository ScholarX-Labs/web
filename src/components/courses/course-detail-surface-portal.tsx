"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { EnrollModal } from "./enroll-modal";
import { CourseDetailSheet } from "./course-detail-sheet";
import { useCourseSheetStore } from "@/stores/course-sheet.store";
import { useEnrollmentStore } from "@/stores/enrollment.store";
import { agentLog } from "@/lib/debug/agent-log";

export function CourseDetailSurfacePortal() {
  const [mounted, setMounted] = useState(false);
  const isOpen = useCourseSheetStore((state) => state.isOpen);
  const course = useCourseSheetStore((state) => state.course);
  const intent = useCourseSheetStore((state) => state.intent);
  const originRect = useCourseSheetStore((state) => state.originRect);
  const closeCourseSheet = useCourseSheetStore(
    (state) => state.closeCourseSheet,
  );
  const setIntent = useCourseSheetStore((state) => state.setIntent);
  const isEnrollmentModalOpen = useEnrollmentStore(
    (state) => state.isModalOpen,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const originalOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, mounted]);

  if (!mounted || !course || !isOpen) return null;

  // #region agent log
  agentLog({
    runId: "pre",
    hypothesisId: "H1",
    location: "src/components/courses/course-detail-surface-portal.tsx:render",
    message: "CourseDetailSurfacePortal render gate",
    data: {
      isOpen,
      hasCourse: Boolean(course),
      intent,
      isEnrollmentModalOpen,
      hasOriginRect: Boolean(originRect),
    },
    timestamp: Date.now(),
  });
  // #endregion agent log

  return createPortal(
    <>
      <AnimatePresence>
        <CourseDetailSheet
          course={course}
          intent={intent}
          isStacked={isEnrollmentModalOpen}
          originRect={originRect}
          onClose={closeCourseSheet}
          onEnrollIntent={() => {
            setIntent("enroll");
            useEnrollmentStore.getState().openModal();
          }}
        />
      </AnimatePresence>

      <EnrollModal
        course={course}
        autoOpen={intent === "enroll"}
        onDismiss={() => {
          // If the user dismisses the enroll modal, we want the underlying main modal to become 
          // fully interactive again, so we switch its intent back to "details".
          if (intent === "enroll") {
            setIntent("details");
          }
        }}
      />
    </>,
    document.body,
  );
}
