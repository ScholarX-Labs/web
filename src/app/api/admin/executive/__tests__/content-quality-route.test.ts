import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createExecutiveRouteHandlers } from "../route-handlers";
import { ExecutiveDashboardService } from "@/domain/executive/application/executive-dashboard.service";
import type { ExecutiveDomain } from "@/domain/executive";
import type { ExecutiveFeatureFlags } from "@/lib/executive/feature-flags";

const enabledFlags: ExecutiveFeatureFlags = {
  EXECUTIVE_DASHBOARD_ENABLED: true,
  EXECUTIVE_TEAM_OPERATIONS_ENABLED: false,
  EXECUTIVE_FINANCE_ENABLED: false,
  PUBLIC_IMPACT_GOVERNANCE_ENABLED: true,
  EXECUTIVE_AI_HEATMAP_ENABLED: false,
};

function makeDomain(): ExecutiveDomain {
  const service = new ExecutiveDashboardService();
  return {
    repositories: {
      read: {
        getOverview: async () => { throw new Error("not used"); },
        getUsers: async () => { throw new Error("not used"); },
        getCoursesLessons: async (query) => service.buildCoursesLessonsReadModel({
          query,
          current: { totalCourses: 1, activeCourses: 1, totalLessons: 4, totalEnrollments: 40, totalCompletions: 4 },
          previous: { totalCourses: 1, activeCourses: 1, totalLessons: 4, totalEnrollments: 20, totalCompletions: 6 },
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
        }),
        getLessonDrilldown: async (query, courseId) => service.buildLessonDrilldownReadModel({
          query,
          courseId,
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
        }),
        getLearnerProgress: async () => { throw new Error("not used"); },
        getOpportunitiesAi: async () => { throw new Error("not used"); },
        getTechnicalHealth: async () => { throw new Error("not used"); },
        getPublicGrowth: async () => { throw new Error("not used"); },
        getTeamOperations: async () => { throw new Error("not used"); },
        getFinance: async () => { throw new Error("not used"); },
      },
      actionCenter: {
        listOpenItems: async () => [],
        findBySourceKey: async () => null,
        upsertDerivedItem: async (item) => item,
        updateWorkflowState: async () => { throw new Error("not used"); },
      },
      analyticsEvents: { record: async () => "event-1" },
    },
    policies: {
      calculations: {} as ExecutiveDomain["policies"]["calculations"],
      redaction: {} as ExecutiveDomain["policies"]["redaction"],
    },
    services: {
      freshness: {} as ExecutiveDomain["services"]["freshness"],
    },
    mappers: {
      charts: {} as ExecutiveDomain["mappers"]["charts"],
    },
    registries: {
      metrics: {} as ExecutiveDomain["registries"]["metrics"],
    },
  };
}

test("GET courses-lessons returns course flags and drilldown checklist", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/courses-lessons/course-1/lessons?from=2026-05-01&to=2026-05-25&courseId=course-1"),
    { params: Promise.resolve({ path: ["courses-lessons", "course-1", "lessons"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.pageId, "courses_lessons");
  assert.equal(body.data.sections.lessonTable.rows.length, 2);
  assert.equal(body.data.sections.contentQualityChecklist.rows.length, 2);
  assert.equal(body.data.sections.contentQualityChecklist.rows[1].dropOffLabel, "50% drop");
});
