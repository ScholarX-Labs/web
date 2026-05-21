import { Course } from "@/types/course.types";
import { EnrollmentContext } from "@/lib/enrollment/types";

export function createEnrollmentExecutionContext(
  course: Course,
  context: EnrollmentContext | null,
  reducedMotion: boolean,
): EnrollmentContext {
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
      reducedMotion,
    },
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      requiresForm: course.requiresForm,
      salesInquiry: course.salesInquiry,
      price: course.price,
    },
  };
}
