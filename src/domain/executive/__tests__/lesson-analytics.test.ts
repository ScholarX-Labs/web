import assert from "node:assert/strict";
import test from "node:test";
import { ExecutiveDashboardService } from "../application/executive-dashboard.service";
import type { ExecutivePageQuery } from "../contracts/executive-query.schemas";

const query: ExecutivePageQuery = {
  from: "2026-05-01",
  to: "2026-05-25",
  page: 1,
  pageSize: 25,
  direction: "desc",
};

test("lesson drilldown calculates completion rates and critical drops", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildLessonDrilldownReadModel({
    query,
    courseId: "course-1",
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
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
        title: "Core concept",
        sortIndex: 2,
        viewers: 100,
        completions: 60,
        averageWatchedPercentage: 70,
      },
      {
        lessonId: "lesson-3",
        title: "Project",
        sortIndex: 3,
        viewers: 60,
        completions: 15,
        averageWatchedPercentage: 55,
      },
    ],
  });

  assert.equal(model.sections.lessonTable.rows[0].completionRate, 0.9);
  assert.equal(model.sections.completionFunnel.points[1].rate, 0.6);
  assert.deepEqual(
    model.sections.criticalDropFlags.map((flag) => flag.lessonId),
    ["lesson-2", "lesson-3"],
  );
  assert.equal(model.sections.criticalDropFlags[0].dropPercentagePoints, 0.30000000000000004);
});

test("courses read model builds leaderboard, category chart, links, and course signals", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildCoursesLessonsReadModel({
    query,
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    current: {
      totalCourses: 2,
      activeCourses: 1,
      totalLessons: 6,
      totalEnrollments: 20,
      totalCompletions: 3,
    },
    previous: {
      totalCourses: 1,
      activeCourses: 1,
      totalLessons: 4,
      totalEnrollments: 10,
      totalCompletions: 5,
    },
    leaderboard: [
      {
        courseId: "course-1",
        title: "Data Science",
        category: "STEM",
        status: "active",
        enrollments: 20,
        completions: 3,
        completionRate: 0.15,
        revenue: 1000,
        qualityFlags: [],
      },
    ],
    categoryDistribution: [{ category: "STEM", value: 2 }],
  });

  assert.equal(model.pageId, "courses_lessons");
  assert.equal(model.sections.kpis[3].value, 0.15);
  assert.equal(model.sections.courseLeaderboard.rows[0].title, "Data Science");
  assert.equal(model.sections.categoryDistribution.points[0].rate, 1);
  assert.equal(model.sections.problemCourseSignals[0].severity, "high");
  assert.equal(model.sections.courseManagementLinks[0].href, "/admin/courses/course-1");
});
