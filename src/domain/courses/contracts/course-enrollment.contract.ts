import { EnrollmentSourceSurface } from "@/lib/enrollment/types";

export interface CourseEnrollmentRequest {
  idempotencyKey?: string;
  sourceSurface?: EnrollmentSourceSurface;
  returnUrl?: string;
}

export interface CourseEnrollmentResponse {
  requestId: string;
  success: boolean;
  code: string;
  message: string;
  data: {
    courseId?: string;
    course?: {
      id: string;
      studentsCount: number;
    };
    userId?: string;
    nextAction?: string;
    checkoutUrl?: string;
    applicationUrl?: string;
  };
}

export interface CourseEnrollmentGateway {
  enrollFree(
    courseId: string,
    body?: CourseEnrollmentRequest,
    token?: string,
  ): Promise<CourseEnrollmentResponse>;
  initPaidEnrollment(
    courseId: string,
    body?: CourseEnrollmentRequest,
    token?: string,
  ): Promise<CourseEnrollmentResponse>;
  initApplicationEnrollment(
    courseId: string,
    body?: CourseEnrollmentRequest,
    token?: string,
  ): Promise<CourseEnrollmentResponse>;
}
