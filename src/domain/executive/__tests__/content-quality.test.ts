import assert from "node:assert/strict";
import test from "node:test";
import { ExecutiveDashboardService } from "../application/executive-dashboard.service";
import { createActionCenterRules } from "../application/action-center-rules";
import type { ExecutivePageQuery } from "../contracts/executive-query.schemas";

const query: ExecutivePageQuery = {
  from: "2026-05-01",
  to: "2026-05-25",
  page: 1,
  pageSize: 25,
  direction: "desc",
};

test("course leaderboard flags missing thumbnail, ownership, and problem course states", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildCoursesLessonsReadModel({
    query,
    current: {
      totalCourses: 1,
      activeCourses: 1,
      totalLessons: 4,
      totalEnrollments: 40,
      totalCompletions: 4,
    },
    previous: {
      totalCourses: 1,
      activeCourses: 1,
      totalLessons: 4,
      totalEnrollments: 20,
      totalCompletions: 6,
    },
    leaderboard: [{
      courseId: "course-1",
      title: "Data Science",
      category: "STEM",
      status: "active",
      enrollments: 40,
      completions: 4,
      completionRate: 0.1,
      revenue: 1000,
      qualityFlags: [],
    }],
    categoryDistribution: [{ category: "STEM", value: 1 }],
    contentQualityRows: [{
      courseId: "course-1",
      hasThumbnail: false,
      ownerId: null,
      updatedAt: "2026-04-01T00:00:00.000Z",
      lessonCount: 4,
      draftLessonCount: 1,
      staleLessonCount: 1,
      brokenMediaCount: 1,
    }],
  });

  assert.deepEqual(
    [...model.sections.courseLeaderboard.rows[0].qualityFlags].sort(),
    [...["broken_media", "draft_lessons", "missing_thumbnail", "no_owner", "problem_course", "stale_lessons"]].sort(),
  );
  assert.ok(
    model.sections.problemCourseSignals.some((signal) => signal.message.includes("thumbnail")),
  );
});

test("lesson drilldown builds content quality checklist with video, draft, and drop-off flags", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildLessonDrilldownReadModel({
    query,
    courseId: "course-1",
    lessons: [
      {
        lessonId: "lesson-1",
        title: "Intro",
        sortIndex: 1,
        viewers: 100,
        completions: 90,
        averageWatchedPercentage: 95,
      },
      {
        lessonId: "lesson-2",
        title: "Project",
        sortIndex: 2,
        viewers: 100,
        completions: 40,
        averageWatchedPercentage: 55,
      },
    ],
    contentQualityLessons: [
      {
        lessonId: "lesson-1",
        title: "Intro",
        status: "published",
        videoUrl: "https://cdn.example.com/intro.mp4",
        updatedAt: "2026-05-20T00:00:00.000Z",
        isArchived: false,
      },
      {
        lessonId: "lesson-2",
        title: "Project",
        status: "draft",
        videoUrl: null,
        updatedAt: "2026-03-01T00:00:00.000Z",
        isArchived: false,
      },
    ],
  });

  assert.equal(model.sections.criticalDropFlags[0]?.lessonId, "lesson-2");
  assert.deepEqual(
    [...model.sections.contentQualityChecklist.rows[1].issueFlags].sort(),
    [...["critical_drop", "draft", "missing_video", "stale"]].sort(),
  );
  assert.equal(model.sections.contentQualityChecklist.rows[1].dropOffLabel, "50% drop");
});

test("action center exposes course-health rule for content review signals", () => {
  const rules = createActionCenterRules();
  const signal = rules.courseHealth({
    courseId: "course-1",
    title: "Data Science",
    issueType: "missing_thumbnail",
  });

  assert.equal(signal.ruleId, "course-health");
  assert.equal(signal.sourcePage, "courses_lessons");
  assert.equal(signal.sourceSection, "contentQualityChecklist");
  assert.equal(signal.title, "Data Science is missing a thumbnail");
});
