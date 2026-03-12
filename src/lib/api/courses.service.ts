import { apiClient } from "./client";
import { Course, Enrollment, Lesson } from "@/types/course.types";
import { JSendResponse } from "@/types/api.types";

const parseJSend = <T>(
  payload: JSendResponse<T>,
  fallbackMessage: string,
): T => {
  if (payload.status === "success") {
    return payload.data;
  }
  throw new Error(payload.message || fallbackMessage);
};

export const coursesService = {
  getAll: async (): Promise<Course[]> => {
    const { data } =
      await apiClient.get<JSendResponse<{ courses: Course[] }>>("/courses");
    // Assuming backend returns { courses: [...] } based on standard patterns
    return parseJSend(data, "Failed to fetch courses").courses;
  },

  getBySlug: async (slug: string): Promise<Course> => {
    const { data } = await apiClient.get<JSendResponse<{ course: Course }>>(
      `/courses/slug/${slug}`,
    );
    return parseJSend(data, "Failed to fetch course details").course;
  },

  getEnrollmentStatus: async (courseId: string): Promise<Enrollment | null> => {
    try {
      const { data } = await apiClient.get<
        JSendResponse<{ enrollment?: Enrollment }>
      >(`/courses/${courseId}/enrollment-status`);
      return data.status === "success" ? data.data.enrollment || null : null;
    } catch {
      return null;
    }
  },

  enrollFree: async (courseId: string): Promise<Enrollment> => {
    const { data } = await apiClient.post<
      JSendResponse<{ enrollment: Enrollment }>
    >(`/courses/${courseId}/enroll`);
    return parseJSend(data, "Failed to enroll").enrollment;
  },

  // Stub for paid enrollment - would typically integrate with payment gateway
  enrollPaid: async (
    courseId: string,
    paymentMethod: string,
  ): Promise<{ clientSecret: string }> => {
    const { data } = await apiClient.post<
      JSendResponse<{ clientSecret: string }>
    >(`/payments/create/${courseId}`, { paymentMethod });
    return parseJSend(data, "Failed to initialize payment");
  },
};
