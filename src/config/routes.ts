/**
 * Standardized routes for the Courses section.
 * Using a single source of truth for routing prevents broken links
 * and makes it easy to change paths in the future.
 *
 * NOTE: Auth routes (login, signup, etc.) are owned by the auth team.
 */
export const ROUTES = {
  HOME: "/",
  COURSES: "/courses",
  COURSE_DETAIL: (slug: string) => `/courses/${slug}` as const,
  COURSE_LESSON: (slug: string, lessonId: string) =>
    `/courses/${slug}/lessons/${lessonId}` as const,
  MY_COURSES: "/my-courses",
  CERTIFICATES: "/certificates",
  SEARCH: "/search",
} as const;
