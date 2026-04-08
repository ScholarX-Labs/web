"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { EnrollModal } from "./enroll-modal";
import { CourseDetailSheet } from "./course-detail-sheet";
import { useCourseSheetStore } from "@/stores/course-sheet.store";

export function CourseDetailSurfacePortal() {
  const [mounted, setMounted] = useState(false);
  const isOpen = useCourseSheetStore((state) => state.isOpen);
  const course = useCourseSheetStore((state) => state.course);
  const intent = useCourseSheetStore((state) => state.intent);
  const originRect = useCourseSheetStore((state) => state.originRect);
  const closeCourseSheet = useCourseSheetStore((state) => state.closeCourseSheet);
  const setIntent = useCourseSheetStore((state) => state.setIntent);

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

  return createPortal(
    <>
      <AnimatePresence>
        <CourseDetailSheet
          course={course}
          intent={intent}
          originRect={originRect}
          onClose={closeCourseSheet}
          onEnrollIntent={() => setIntent("enroll")}
        />
      </AnimatePresence>

      <EnrollModal course={course} autoOpen={intent === "enroll"} />
    </>,
    document.body,
  );
}
