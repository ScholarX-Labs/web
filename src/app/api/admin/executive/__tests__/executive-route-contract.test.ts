import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createExecutiveRouteHandlers } from "../route-handlers";
import { ExecutiveDashboardService } from "@/domain/executive/application/executive-dashboard.service";
import type { ExecutiveDomain } from "@/domain/executive";
import type { ExecutivePageId } from "@/domain/executive/contracts/executive-types";
import type { ExecutiveFeatureFlags } from "@/lib/executive/feature-flags";
import type { ExecutivePageQuery } from "@/domain/executive/contracts/executive-query.schemas";

const enabledFlags: ExecutiveFeatureFlags = {
  EXECUTIVE_DASHBOARD_ENABLED: true,
  EXECUTIVE_TEAM_OPERATIONS_ENABLED: false,
  EXECUTIVE_FINANCE_ENABLED: false,
  PUBLIC_IMPACT_GOVERNANCE_ENABLED: true,
  EXECUTIVE_AI_HEATMAP_ENABLED: false,
};

function makeDomain(): ExecutiveDomain {
  const overviewService = new ExecutiveDashboardService();
  const usersService = new ExecutiveDashboardService();
  const technicalService = new ExecutiveDashboardService();
  const coursesService = new ExecutiveDashboardService();
  const financeService = new ExecutiveDashboardService();
  const publicGrowthService = new ExecutiveDashboardService();
  const opportunitiesService = new ExecutiveDashboardService();
  const teamOperationsService = new ExecutiveDashboardService();
  const page = (pageId: ExecutivePageId, query: ExecutivePageQuery) =>
    Promise.resolve({
      pageId,
      query,
      generatedAt: "2026-05-25T12:00:00.000Z",
      sections: {},
      freshnessSummary: {
        current: 0,
        stale: 0,
        very_stale: 0,
        unavailable: 0,
      },
      redactionNotes: [],
    });

  return {
    repositories: {
      read: {
        getOverview: (query) =>
          Promise.resolve(
            overviewService.buildOverviewReadModel({
              query,
              generatedAt: new Date("2026-05-25T12:00:00.000Z"),
              current: {
                grossRevenue: 0,
                subscriptions: 0,
                activeSubscriptions: 0,
                cancelledSubscriptions: 0,
                users: 0,
                courseCompletions: 0,
                activeCourses: 0,
              },
              previous: {
                grossRevenue: 0,
                subscriptions: 0,
                activeSubscriptions: 0,
                cancelledSubscriptions: 0,
                users: 0,
                courseCompletions: 0,
                activeCourses: 0,
              },
              trends: [],
            }),
          ),
        getUsers: (query) =>
          Promise.resolve(
            usersService.buildUsersReadModel({
              query,
              generatedAt: new Date("2026-05-25T12:00:00.000Z"),
              current: {
                newUsers: 0,
                totalUsers: 0,
                activeUsers: 0,
                verifiedUsers: 0,
                bannedUsers: 0,
              },
              previous: {
                newUsers: 0,
                totalUsers: 0,
                activeUsers: 0,
                verifiedUsers: 0,
                bannedUsers: 0,
              },
              registrationTrend: [],
              roleDistribution: [],
              activityEvents: [],
              monthlyActivity: [],
            }),
          ),
        getCoursesLessons: (query) =>
          Promise.resolve(
            coursesService.buildCoursesLessonsReadModel({
              query,
              generatedAt: new Date("2026-05-25T12:00:00.000Z"),
              current: {
                totalCourses: 0,
                activeCourses: 0,
                totalLessons: 0,
                totalEnrollments: 0,
                totalCompletions: 0,
              },
              previous: {
                totalCourses: 0,
                activeCourses: 0,
                totalLessons: 0,
                totalEnrollments: 0,
                totalCompletions: 0,
              },
              leaderboard: [],
              categoryDistribution: [],
            }),
          ),
        getLessonDrilldown: (query) =>
          Promise.resolve(
            coursesService.buildLessonDrilldownReadModel({
              query,
              courseId: "course-1",
              generatedAt: new Date("2026-05-25T12:00:00.000Z"),
              lessons: [],
            }),
          ),
        getLearnerProgress: (query) => page("learner_progress", query),
        getOpportunitiesAi: (query) =>
          Promise.resolve(
            opportunitiesService.buildOpportunitiesAiReadModel({
              query,
              generatedAt: new Date("2026-05-25T12:00:00.000Z"),
              opportunities: [],
            }),
          ),
        getTechnicalHealth: (query) =>
          Promise.resolve(
            technicalService.buildTechnicalHealthReadModel({
              query,
              generatedAt: new Date("2026-05-25T12:00:00.000Z"),
              freshness: [],
              auditLog: [],
              health: {
                progressEvents: 0,
                emailQueued: 0,
                emailAccepted: 0,
                emailFailed: 0,
                openActionItems: 0,
                activeSessions: 0,
                activeUsers: 0,
                bannedUsers: 0,
                unverifiedUsers: 0,
                emailProviders: [],
              },
            }),
          ),
        getPublicGrowth: (query) =>
          Promise.resolve(
            publicGrowthService.buildPublicGrowthReadModel({
              query,
              generatedAt: new Date("2026-05-25T12:00:00.000Z"),
              current: {
                websiteVisits: null,
                signupStarts: null,
                signups: 0,
                enrollments: 0,
                completions: 0,
                opportunityActions: null,
              },
            }),
          ),
        getTeamOperations: (query) =>
          Promise.resolve(
            teamOperationsService.buildTeamOperationsReadModel({
              query,
              generatedAt: new Date("2026-05-25T12:00:00.000Z"),
              inquiries: [],
            }),
          ),
        getFinance: (query) =>
          Promise.resolve(
            financeService.buildFinanceReadModel({
              query,
              generatedAt: new Date("2026-05-25T12:00:00.000Z"),
              current: {
                grossRevenue: 0,
                refundedRevenue: 0,
                enrollments: 0,
                paidEnrollments: 0,
                manualEnrollments: 0,
                activeLearners: 0,
                completions: 0,
                supportInquiries: 0,
              },
              previous: {
                grossRevenue: 0,
                refundedRevenue: 0,
                enrollments: 0,
                paidEnrollments: 0,
                manualEnrollments: 0,
                activeLearners: 0,
                completions: 0,
                supportInquiries: 0,
              },
              courses: [],
            }),
          ),
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

function makeContext(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

test("GET executive route returns 404 before session when dashboard is disabled", async () => {
  let sessionCalled = false;
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => ({ ...enabledFlags, EXECUTIVE_DASHBOARD_ENABLED: false }),
    getSession: async () => {
      sessionCalled = true;
      return null;
    },
    checkRateLimit: async () => ({ allowed: true, remaining: 1, resetAt: Date.now() }),
    createDomain: makeDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/overview?from=2026-05-01&to=2026-05-25"),
    makeContext(["overview"]),
  );

  assert.equal(response.status, 404);
  assert.equal(sessionCalled, false);
});

test("GET executive route requires authentication", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => null,
    checkRateLimit: async () => ({ allowed: true, remaining: 1, resetAt: Date.now() }),
    createDomain: makeDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/overview?from=2026-05-01&to=2026-05-25"),
    makeContext(["overview"]),
  );

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.code, "ADMIN_SESSION_EXPIRED");
});

test("GET executive route rejects non-admin users", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "user-1", role: "user" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 1, resetAt: Date.now() }),
    createDomain: makeDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/overview?from=2026-05-01&to=2026-05-25"),
    makeContext(["overview"]),
  );

  assert.equal(response.status, 403);
});

test("GET executive route validates query parameters", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 1, resetAt: Date.now() }),
    createDomain: makeDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/overview?from=2026-05-25&to=2026-05-01"),
    makeContext(["overview"]),
  );

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.code, "VALIDATION_ERROR");
});

test("GET executive route returns 429 when rate limited", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 }),
    createDomain: makeDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/overview?from=2026-05-01&to=2026-05-25"),
    makeContext(["overview"]),
  );

  assert.equal(response.status, 429);
});

test("GET executive route returns typed success envelope for admins", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 1, resetAt: Date.now() }),
    createDomain: makeDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/overview?from=2026-05-01&to=2026-05-25"),
    makeContext(["overview"]),
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "success");
  assert.equal(body.data.pageId, "overview");
});
