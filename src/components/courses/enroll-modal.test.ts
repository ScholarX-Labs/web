import test from "node:test";
import assert from "node:assert/strict";
import { buildEnrollmentExecutionContext } from "@/components/courses/enroll-modal";
import { Course } from "@/types/course.types";
import { EnrollmentContext } from "@/lib/enrollment/types";

const course = {
  id: "course-1",
  slug: "course-1",
  title: "Course 1",
  description: "Desc",
  thumbnail: "",
  price: 0,
  currentPrice: 0,
  isPublished: true,
  isSubscribed: false,
  requiresForm: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} satisfies Course;

test("buildEnrollmentExecutionContext reuses provided context", () => {
  const existing: EnrollmentContext = {
    command: {
      courseId: course.id,
      source: "course_hero",
      correlationId: "corr-existing",
      timestamp: Date.now(),
      viewport: "desktop",
      reducedMotion: false,
    },
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      requiresForm: false,
      price: course.price,
    },
  };

  const result = buildEnrollmentExecutionContext(course, existing);
  assert.equal(result, existing);
});

test("buildEnrollmentExecutionContext creates deep-link fallback context", () => {
  const result = buildEnrollmentExecutionContext(course, null);

  assert.equal(result.command.courseId, course.id);
  assert.equal(result.command.source, "deep_link");
  assert.equal(result.course.id, course.id);
  assert.equal(result.course.title, course.title);
});
