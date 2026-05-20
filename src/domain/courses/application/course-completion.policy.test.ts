import assert from "node:assert/strict";
import test from "node:test";
import {
  CourseCompletionPolicy,
  LessonCompletionPolicy,
} from "@/domain/courses/application/course-completion.policy";
import type { CourseProgressSnapshot } from "@/domain/courses/contracts";

const baseProgress: CourseProgressSnapshot = {
  id: "progress-1",
  userId: "user-1",
  courseId: "course-1",
  status: "in_progress",
  completedLessons: 1,
  requiredLessons: 2,
  progressPercentage: 50,
  completedAt: null,
  certificateEligibleAt: null,
  lastLessonId: null,
  lastPosition: 0,
  version: 1,
  curriculumVersion: 1,
  ruleVersion: "v1",
  completedByBackfill: false,
};

test("LessonCompletionPolicy completes video lessons at 90 percent", () => {
  const policy = new LessonCompletionPolicy();

  assert.equal(
    policy.isLessonComplete({
      eventType: "heartbeat",
      watchedPercentage: 89,
    }),
    false,
  );
  assert.equal(
    policy.isLessonComplete({
      eventType: "heartbeat",
      watchedPercentage: 90,
    }),
    true,
  );
});

test("CourseCompletionPolicy preserves first completion timestamp", () => {
  const policy = new CourseCompletionPolicy();
  const existingCompletedAt = "2026-05-19T10:00:00.000Z";
  const decision = policy.evaluate({
    current: {
      ...baseProgress,
      completedAt: existingCompletedAt,
      certificateEligibleAt: existingCompletedAt,
    },
    completedLessonCount: 2,
    requiredLessonCount: 2,
    now: new Date("2026-05-20T10:00:00.000Z"),
  });

  assert.equal(decision.status, "completed");
  assert.equal(decision.completedAt?.toISOString(), existingCompletedAt);
  assert.equal(
    decision.certificateEligibleAt?.toISOString(),
    existingCompletedAt,
  );
});

test("CourseCompletionPolicy does not complete zero-lesson courses", () => {
  const policy = new CourseCompletionPolicy();
  const decision = policy.evaluate({
    current: baseProgress,
    completedLessonCount: 0,
    requiredLessonCount: 0,
    now: new Date("2026-05-20T10:00:00.000Z"),
  });

  assert.equal(decision.status, "not_started");
  assert.equal(decision.progressPercentage, 0);
  assert.equal(decision.completedAt, null);
});
