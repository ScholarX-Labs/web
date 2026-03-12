/**
 * Centralized routing definitions for the application
 */
export const ROUTES = {
  HOME: "/",
  COURSES: "/courses",
  COURSE_DETAIL: (slug: string) => `/courses/${slug}`,
  LESSON: (courseSlug: string, lessonId: string) =>
    `/courses/${courseSlug}/lessons/${lessonId}`,
  MY_COURSES: "/my-courses",
  CERTIFICATES: "/certificates",
  SEARCH: "/search",
  LOGIN: "/login",
  REGISTER: "/register",
};
