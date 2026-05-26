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
        getUsers: async (query) => service.buildUsersReadModel({
          query,
          current: { newUsers: 1, totalUsers: 2, activeUsers: 1, verifiedUsers: 2, bannedUsers: 0 },
          previous: { newUsers: 1, totalUsers: 1, activeUsers: 1, verifiedUsers: 1, bannedUsers: 0 },
          registrationTrend: [{ date: "2026-05-01", newUsers: 1 }],
          roleDistribution: [{ role: "user", value: 2 }],
          activityEvents: [{ occurredAt: "2026-05-01T10:00:00.000Z" }],
          monthlyActivity: [{ month: "2026-05", value: 1 }],
          managementRows: [{
            userId: "user-1",
            email: "u1@example.com",
            name: "User One",
            role: "user",
            createdAt: "2026-05-01T10:00:00.000Z",
            isEmailVerified: true,
            isBanned: false,
          }],
        }),
        getCoursesLessons: async (query) => service.buildCoursesLessonsReadModel({
          query,
          current: { totalCourses: 1, activeCourses: 1, totalLessons: 2, totalEnrollments: 10, totalCompletions: 5 },
          previous: { totalCourses: 1, activeCourses: 1, totalLessons: 2, totalEnrollments: 8, totalCompletions: 4 },
          leaderboard: [{
            courseId: "course-1",
            title: "Data Science",
            category: "STEM",
            status: "active",
            enrollments: 10,
            completions: 5,
            completionRate: 0.5,
            revenue: 500,
            qualityFlags: [],
          }],
          categoryDistribution: [{ category: "STEM", value: 1 }],
          managementRows: [{
            courseId: "course-1",
            title: "Data Science",
            category: "STEM",
            status: "active",
            ownerId: "owner-1",
            createdAt: "2026-05-01T00:00:00.000Z",
            updatedAt: "2026-05-10T00:00:00.000Z",
            lessons: 2,
            enrollments: 10,
            completions: 5,
          }],
        }),
        getLessonDrilldown: async () => { throw new Error("not used"); },
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
    policies: { calculations: {} as ExecutiveDomain["policies"]["calculations"], redaction: {} as ExecutiveDomain["policies"]["redaction"] },
    services: { freshness: {} as ExecutiveDomain["services"]["freshness"] },
    mappers: { charts: {} as ExecutiveDomain["mappers"]["charts"] },
    registries: { metrics: {} as ExecutiveDomain["registries"]["metrics"] },
  };
}

test("users route includes management table section", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 10, resetAt: Date.now() }),
    createDomain: makeDomain,
  });
  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/users?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["users"] }) },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.sections.managementTable.rows[0].adminHref, "/admin/users/user-1");
});

test("courses route includes management table section", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 10, resetAt: Date.now() }),
    createDomain: makeDomain,
  });
  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/courses-lessons?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["courses-lessons"] }) },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.sections.managementTable.rows[0].adminHref, "/admin/courses/course-1");
});
