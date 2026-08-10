import { randomUUID } from "crypto";
import {
  CourseEnrollmentRequest,
  CourseEnrollmentResponse,
} from "@/domain/courses/contracts";
import { NextCoursesRepository } from "@/domain/courses/infrastructure/db/next-courses.repository";
import { NextCourseError } from "@/domain/courses/application/next-course.errors";
import {
  courseApplicationInputSchema,
  CourseApplicationInput,
} from "@/domain/courses/application/course-application.schemas";
import { ZodError } from "zod";
import {
  invalidatePublicCourseDetailCache,
  invalidatePublicCourseListCache,
  invalidateCourseMetricsCache,
} from "@/domain/courses/application/course-cache";

interface EnrollmentContext {
  requestId?: string;
}

export class NextCourseEnrollmentService {
  constructor(private readonly repository: NextCoursesRepository) {}

  private ensureRequestId(context?: EnrollmentContext): string {
    return context?.requestId ?? randomUUID();
  }

  private buildValidationDetails(error: ZodError) {
    return {
      fieldErrors: error.flatten().fieldErrors,
    };
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

    if (course.requiresForm) {
      const application = await this.repository.findActiveApplication(
        userId,
        courseId,
      );

      if (!application || application.status !== "approved") {
        throw new NextCourseError(
          "COURSE_REQUIRES_APPLICATION",
          409,
          "This course requires an approved application before enrollment.",
          9006,
          {
            courseId,
            applicationStatus: application?.status ?? "none",
          },
        );
      }
    }

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
    await invalidatePublicCourseListCache();
    await invalidatePublicCourseDetailCache({ courseId, slug: course.slug });
    await invalidateCourseMetricsCache(courseId);

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

  async submitInquiry(
    courseId: string,
    userId: string,
    params: {
      name: string;
      email: string;
      phone?: string;
      message?: string;
      sourceSurface?: string;
      idempotencyKey?: string;
    },
  ) {
    const course = await this.repository.findByIdActive(courseId);

    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        `Course (ID: ${courseId}) not found for inquiry submission.`,
        1001,
      );
    }

    await this.assertUserActive(userId);

    const result = await this.repository.createInquiry({
      courseId,
      userId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      message: params.message,
      sourceSurface: params.sourceSurface,
      idempotencyKey: params.idempotencyKey,
    });

    return result;
  }

  async submitApplication(
    courseId: string,
    userId: string,
    params: CourseApplicationInput,
  ) {
    const course = await this.repository.findByIdActive(courseId);

    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        `Course (ID: ${courseId}) not found for application submission.`,
        1001,
      );
    }

    await this.assertUserActive(userId);

    if (!course.requiresForm) {
      throw new NextCourseError(
        "APPLICATION_NOT_REQUIRED",
        409,
        "This course does not require an application",
        9005,
      );
    }

    let parsed: CourseApplicationInput;
    try {
      parsed = courseApplicationInputSchema.parse(params);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new NextCourseError(
          "VALIDATION_FAILED",
          400,
          "Please correct the highlighted fields.",
          9005,
          this.buildValidationDetails(error),
        );
      }

      throw error;
    }

    if (parsed.idempotencyKey) {
      const existingByKey = await this.repository.findApplicationByIdempotencyKey(
        userId,
        courseId,
        parsed.idempotencyKey,
      );

      if (existingByKey) {
        return {
          ...existingByKey,
          enrolledImmediately: false,
        };
      }
    }

    const existingActive = await this.repository.findActiveApplication(
      userId,
      courseId,
    );

    if (existingActive) {
      throw new NextCourseError(
        "DUPLICATE_APPLICATION",
        409,
        "You already have an active application for this course.",
        9007,
        {
          applicationId: existingActive.id,
          status: existingActive.status,
        },
      );
    }

    try {
      const shouldAutoApprove = Boolean(course.autoApproveApplications);
      const isFreeCourse = (course.currentPrice ?? 0) <= 0;
      const shouldEnrollImmediately = shouldAutoApprove && isFreeCourse;
      const reviewTimestamp = shouldAutoApprove ? new Date() : null;

      const application = await this.repository.createCourseApplication({
        courseId,
        userId,
        fullName: parsed.name,
        age: parsed.age,
        email: parsed.email,
        phone: parsed.phone,
        learnerStatus: parsed.learnerStatus,
        highSchoolName: parsed.highSchoolName,
        university: parsed.university,
        faculty: parsed.faculty,
        graduationYear: parsed.graduationYear,
        workField: parsed.workField,
        yearsOfExperience: parsed.yearsOfExperience,
        personalStatement: parsed.personalStatement,
        learningGoals: parsed.learningGoals,
        background: parsed.background,
        sourceSurface: parsed.sourceSurface,
        idempotencyKey: parsed.idempotencyKey,
        status: shouldAutoApprove ? "approved" : "pending",
        reviewedAt: reviewTimestamp,
      });

      if (shouldEnrollImmediately) {
        const existingSub = await this.repository.findActiveSubscription(
          userId,
          courseId,
        );

        if (!existingSub) {
          const updatedCourse = await this.repository.incrementStudents(courseId);
          await this.repository.createFreeSubscription({
            userId,
            courseId,
            idempotencyKey: parsed.idempotencyKey,
          });
          await invalidatePublicCourseListCache();
          await invalidatePublicCourseDetailCache({ courseId, slug: course.slug });
          await invalidateCourseMetricsCache(courseId);

          return {
            ...application,
            enrolledImmediately: true,
            studentsCount:
              updatedCourse?.studentsCount ?? (course.studentsCount ?? 0) + 1,
          };
        }

        return {
          ...application,
          enrolledImmediately: true,
          studentsCount: course.studentsCount ?? 0,
        };
      }

      return {
        ...application,
        enrolledImmediately: false,
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505"
      ) {
        const existing = parsed.idempotencyKey
          ? await this.repository.findApplicationByIdempotencyKey(
              userId,
              courseId,
              parsed.idempotencyKey,
            )
          : await this.repository.findActiveApplication(userId, courseId);

        if (existing) {
          if (parsed.idempotencyKey) {
            return { ...existing, enrolledImmediately: false };
          }

          throw new NextCourseError(
            "DUPLICATE_APPLICATION",
            409,
            "You already have an active application for this course.",
            9007,
            {
              applicationId: existing.id,
              status: existing.status,
            },
          );
        }
      }

      throw error;
    }
  }

  async getApplicationStatus(courseId: string, userId: string) {
    const course = await this.repository.findByIdActive(courseId);

    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        `Course (ID: ${courseId}) not found for application status lookup.`,
        1001,
      );
    }

    await this.assertUserActive(userId);

    const application = await this.repository.findLatestApplication(userId, courseId);

    return {
      courseId,
      requiresApplication: Boolean(course.requiresForm),
      application: application
        ? {
            id: application.id,
            status: application.status,
            submittedAt: application.submittedAt.toISOString(),
          }
        : null,
    };
  }
}
