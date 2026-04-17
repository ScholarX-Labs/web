import { Course } from "@/types/course.types";
import { PaginatedCoursesApiResponse } from "@/lib/api/courses.service";

export interface CourseListQuery {
  page?: number;
  limit?: number;
  category?: string;
  token?: string;
}

export interface CourseSearchQuery {
  title: string;
  page?: number;
  limit?: number;
  token?: string;
}

export interface CourseCatalogGateway {
  list(query?: CourseListQuery): Promise<PaginatedCoursesApiResponse>;
  getFeatured(
    query?: Omit<CourseListQuery, "category">,
  ): Promise<PaginatedCoursesApiResponse>;
  getScholarX(
    query?: Omit<CourseListQuery, "category">,
  ): Promise<PaginatedCoursesApiResponse>;
  search(query: CourseSearchQuery): Promise<PaginatedCoursesApiResponse>;
  getById(id: string, token?: string): Promise<Course>;
  getBySlug(slug: string, token?: string): Promise<Course>;
  getEnrollmentStatus(
    courseId: string,
    token?: string,
  ): Promise<CourseSubscriptionStatus | null>;
}

export interface CourseSubscriptionStatus {
  isSubscribed: boolean;
  courseId: string;
  userId: string;
}
