import type {
  CourseLessonRecord,
  CourseProgressCourseRecord,
  SubscriptionRecord,
} from "@/domain/courses/contracts/course-progress.types";
import { NextCourseError } from "@/domain/courses/application/next-course.errors";
import { isPublicLessonStatus } from "@/domain/courses/application/public-lesson-status";

export class CourseWritableSpecification {
  assertSatisfiedBy(course: CourseProgressCourseRecord | null): asserts course is CourseProgressCourseRecord {
    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        "Course was not found.",
        1001,
      );
    }

    if (course.status !== "active" || course.isArchived === true) {
      throw new NextCourseError(
        "COURSE_NOT_ACTIVE",
        409,
        "This course is not currently available for progress updates.",
        9101,
        { courseId: course.id, status: course.status },
      );
    }
  }
}

export class LessonBelongsToCourseSpecification {
  assertSatisfiedBy(lesson: CourseLessonRecord | null): asserts lesson is CourseLessonRecord {
    if (!lesson) {
      throw new NextCourseError(
        "LESSON_NOT_FOUND",
        404,
        "Lesson was not found in this course.",
        1003,
      );
    }

    if (
      !isPublicLessonStatus(lesson.status) ||
      lesson.isArchived === true
    ) {
      throw new NextCourseError(
        "LESSON_NOT_ACTIVE",
        409,
        "This lesson is not currently available for progress updates.",
        9102,
        { lessonId: lesson.id, status: lesson.status },
      );
    }
  }
}

export class ActiveEnrollmentSpecification {
  assertSatisfiedBy(
    subscription: SubscriptionRecord | null,
    details: { userId: string; courseId: string },
  ): asserts subscription is SubscriptionRecord {
    if (!subscription) {
      throw new NextCourseError(
        "ENROLLMENT_REQUIRED",
        403,
        "You must be enrolled in this course to update progress.",
        9103,
        details,
      );
    }
  }
}
