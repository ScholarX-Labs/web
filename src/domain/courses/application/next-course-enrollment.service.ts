import { randomUUID } from "crypto";
import {
  CourseEnrollmentRequest,
  CourseEnrollmentResponse,
} from "@/domain/courses/contracts";
import { NextCoursesRepository } from "@/domain/courses/infrastructure/db/next-courses.repository";
import { NextCourseError } from "@/domain/courses/application/next-course.errors";
import type { CourseCompletionEvaluatedEvent } from "@/domain/certificates/contracts";
import { CertificateIssuanceService } from "@/domain/certificates/application/certificate-issuance.service";

interface EnrollmentContext {
  requestId?: string;
}

export class NextCourseEnrollmentService {
  constructor(private readonly repository: NextCoursesRepository) {}

  private ensureRequestId(context?: EnrollmentContext): string {
    return context?.requestId ?? randomUUID();
  }

  private async assertUserActive(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new NextCourseError(
        "UNAUTHORIZED",
        401,
        "Your authentication session is not linked to an active user account.",
        9002,
        { userId },
      );
    }

    if (user.isBlocked) {
      throw new NextCourseError(
        "USER_BLOCKED",
        403,
        "Your account has been suspended. Please contact support.",
        2002,
        { userId, status: "blocked" },
      );
    }
  }

  async enrollFree(
    courseId: string,
    userId: string,
    body?: CourseEnrollmentRequest,
    context?: EnrollmentContext,
  ): Promise<CourseEnrollmentResponse> {
    const requestId = this.ensureRequestId(context);
    const course = await this.repository.findByIdActive(courseId);

    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        `The course you are trying to enroll in (ID: ${courseId}) could not be found or is no longer active.`,
        1001,
        { courseId },
      );
    }

    await this.assertUserActive(userId);

    if ((course.currentPrice ?? 0) > 0) {
      throw new NextCourseError(
        "BAD_REQUEST",
        400,
        "This course requires paid enrollment initialization",
        9005,
      );
    }

    const existingSub = await this.repository.findActiveSubscription(
      userId,
      courseId,
    );

    if (existingSub) {
      return {
        requestId,
        success: true,
        code: "already_enrolled",
        message: "You are already enrolled in this course",
        data: {
          course: {
            id: course.id,
            studentsCount: course.studentsCount ?? 0,
          },
          userId,
          nextAction: "resume_learning",
        },
      };
    }

    const updatedCourse = await this.repository.incrementStudents(courseId);
    await this.repository.createFreeSubscription({
      userId,
      courseId,
      idempotencyKey: body?.idempotencyKey,
    });

    return {
      requestId,
      success: true,
      code: "enrollment_succeeded",
      message: "Enrollment successful",
      data: {
        course: {
          id: course.id,
          studentsCount:
            updatedCourse?.studentsCount ?? (course.studentsCount ?? 0) + 1,
        },
        userId,
        nextAction: "resume_learning",
      },
    };
  }

  async initPaidEnrollment(
    courseId: string,
    userId: string,
    body?: CourseEnrollmentRequest,
    context?: EnrollmentContext,
  ): Promise<CourseEnrollmentResponse> {
    const requestId = this.ensureRequestId(context);
    const course = await this.repository.findByIdActive(courseId);

    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        `Course (ID: ${courseId}) not found for enrollment initialization.`,
        1001,
      );
    }

    await this.assertUserActive(userId);

    if ((course.currentPrice ?? 0) <= 0) {
      throw new NextCourseError(
        "BAD_REQUEST",
        400,
        "Paid enrollment is not available for this course",
        9005,
      );
    }

    const returnUrl = body?.returnUrl;
    const checkoutUrl = returnUrl
      ? `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}checkout=1&courseId=${course.id}`
      : `/checkout?courseId=${course.id}`;

    return {
      requestId,
      success: true,
      code: "paid_enrollment_initialized",
      message: "Paid enrollment initialized",
      data: {
        courseId: course.id,
        userId,
        checkoutUrl,
        nextAction: "checkout",
      },
    };
  }

  async initApplicationEnrollment(
    courseId: string,
    userId: string,
    body?: CourseEnrollmentRequest,
    context?: EnrollmentContext,
  ): Promise<CourseEnrollmentResponse> {
    const requestId = this.ensureRequestId(context);
    const course = await this.repository.findByIdActive(courseId);

    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        `Course (ID: ${courseId}) not found for application initialization.`,
        1001,
      );
    }

    await this.assertUserActive(userId);

    if (!course.requiresForm) {
      throw new NextCourseError(
        "BAD_REQUEST",
        400,
        "This course does not require an application",
        9005,
      );
    }

    return {
      requestId,
      success: true,
      code: "application_enrollment_initialized",
      message: "Application enrollment initialized",
      data: {
        courseId: course.id,
        userId,
        applicationUrl: `/courses/${course.slug ?? course.id}?intent=enroll&flow=application`,
        nextAction: "application",
      },
    };
  }

  /**
   * evaluateCompletion
   *
   * Called by the lesson-progress telemetry layer (e.g. a Server Action
   * triggered when watchedPercentage crosses the configured threshold).
   *
   * Emits a CourseCompletionEvaluatedEvent in-process to the
   * CertificateIssuanceService. No network call required.
   *
   * Design: Observer pattern — Courses domain emits an event; the
   * Certificate domain consumes it. Dependency Inversion: this method
   * accepts the event shape defined in the Certificates contracts,
   * but does NOT import anything from the certificate domain directly
   * (import above is the only coupling, kept minimal).
   */
  async evaluateCompletion(
    event: CourseCompletionEvaluatedEvent,
  ): Promise<void> {
    try {
      const issuanceService = new CertificateIssuanceService();
      await issuanceService.issue({
        userId: event.userId,
        recipientName: event.recipientName,
        recipientEmail: event.recipientEmail,
        courseId: event.courseId,
        programName: event.programName,
        seasonNumber: event.seasonNumber,
        role: event.role,
        completionDate: event.completionDate,
      });
    } catch (err) {
      // Non-blocking: log failure but do not surface to the caller.
      // The admin dashboard will surface FAILED certificate records.
      console.error("[NextCourseEnrollmentService.evaluateCompletion]", err);
    }
  }
}

