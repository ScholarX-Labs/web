import { create } from "zustand";
import { Course } from "@/types/course.types";

export type CourseSurfaceIntent = "details" | "enroll";

interface CourseSheetState {
  isOpen: boolean;
  course: Course | null;
  intent: CourseSurfaceIntent;
  originRect: DOMRect | null;
  openCourseSheet: (
    course: Course,
    intent: CourseSurfaceIntent,
    originRect?: DOMRect | null,
  ) => void;
  setIntent: (intent: CourseSurfaceIntent) => void;
  closeCourseSheet: () => void;
}

export const useCourseSheetStore = create<CourseSheetState>((set) => ({
  isOpen: false,
  course: null,
  intent: "details",
  originRect: null,

  openCourseSheet: (course, intent, originRect = null) =>
    set({ isOpen: true, course, intent, originRect }),
  setIntent: (intent) => set({ intent }),
  closeCourseSheet: () =>
    set({ isOpen: false, course: null, intent: "details", originRect: null }),
}));
