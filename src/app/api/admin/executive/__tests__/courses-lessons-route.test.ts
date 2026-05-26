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

function makeCoursesDomain(): ExecutiveDomain {
  const service = new ExecutiveDashboardService();

  return {
    repositories: {
      read: {
        getOverview: async () => {
          throw new Error("not used");
        },
        getUsers: async () => {
          throw new Error("not used");
        },
        getCoursesLessons: async (query) =>
          service.buildCoursesLessonsReadModel({
            query,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            current: {
              totalCourses: 1,
              activeCourses: 1,
              totalLessons: 2,
              totalEnrollments: 20,
              totalCompletions: 8,
            },
            previous: {
              totalCourses: 1,
              activeCourses: 1,
              totalLessons: 2,
              totalEnrollments: 10,
              totalCompletions: 4,
            },
            leaderboard: [
              {
                courseId: "11111111-1111-1111-1111-111111111111",
                title: "Data Science",
                category: "STEM",
                status: "active",
                enrollments: 20,
                completions: 8,
                completionRate: 0.4,
                revenue: 1200,
              },
            ],
            categoryDistribution: [{ category: "STEM", value: 1 }],
          }),
        getLessonDrilldown: async (query, courseId) =>
          service.buildLessonDrilldownReadModel({
            query,
            courseId,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            lessons: [
              {
                lessonId: "lesson-1",
                title: "Intro",
                sortIndex: 1,
                viewers: 10,
                completions: 9,
                averageWatchedPercentage: 90,
              },
              {
                lessonId: "lesson-2",
                title: "Project",
                sortIndex: 2,
                viewers: 10,
                completions: 5,
                averageWatchedPercentage: 60,
              },
            ],
          }),
        getLearnerProgress: async () => {
          throw new Error("not used");
        },
        getOpportunitiesAi: async () => {
          throw new Error("not used");
        },
        getTechnicalHealth: async () => {
          throw new Error("not used");
        },
        getPublicGrowth: async () => {
          throw new Error("not used");
        },
        getTeamOperations: async () => {
          throw new Error("not used");
        },
        getFinance: async () => {
          throw new Error("not used");
        },
      },
      actionCenter: {
        listOpenItems: async () => [],
        findBySourceKey: async () => null,
        upsertDerivedItem: async (item) => item,
        updateWorkflowState: async () => {
          throw new Error("not used");
        },
      },
      analyticsEvents: {
        record: async () => "event-1",
      },
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

test("GET courses and lessons returns leaderboard and category distribution", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeCoursesDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/courses-lessons?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["courses-lessons"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.pageId, "courses_lessons");
  assert.equal(body.data.sections.courseLeaderboard.rows.length, 1);
  assert.equal(body.data.sections.categoryDistribution.chartType, "bar");
});

test("GET courses lesson drilldown returns lesson table and critical drops", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeCoursesDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/courses-lessons/11111111-1111-1111-1111-111111111111/lessons?from=2026-05-01&to=2026-05-25"),
    {
      params: Promise.resolve({
        path: ["courses-lessons", "11111111-1111-1111-1111-111111111111", "lessons"],
      }),
    },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.sections.lessonTable.rows.length, 2);
  assert.equal(body.data.sections.criticalDropFlags.length, 1);
});
