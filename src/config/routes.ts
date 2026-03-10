/**
 * Standardized routes for the Courses section.
 * Extends the base application routes with a COURSE_LESSON alias
 * that uses explicit parameter names for clarity.
 *
 * NOTE: Auth routes (login, signup, etc.) are owned by the auth team.
 */
import { ROUTES as BASE_ROUTES } from "@/lib/routes";

export const ROUTES = {
  ...BASE_ROUTES,
  COURSE_DETAIL: (slug: string) => `/courses/${slug}` as const,
  COURSE_LESSON: (slug: string, lessonId: string) =>
    `/courses/${slug}/lessons/${lessonId}` as const,
} as const;
