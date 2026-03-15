/**
 * Centralized routing definitions for the application
 */
export const ROUTES = {
  HOME: "/",
  SIGNUP: "/auth/signup",
  SIGNIN: "/auth/signin",
  VERIFY_EMAIL: "/auth/verify-email",
  PHONE_COLLECTION: "/auth/collect-phone",
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

export const API_ROUTES = {
  COLLECT_PHONE: "/api/collect-phone",
};
