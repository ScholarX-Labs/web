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

function makeOverviewDomain(): ExecutiveDomain {
  const service = new ExecutiveDashboardService();
  const overview = service.buildOverviewReadModel({
    query: {
      from: "2026-05-01",
      to: "2026-05-25",
      page: 1,
      pageSize: 25,
      direction: "desc",
    },
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    current: {
      grossRevenue: 12_000,
      subscriptions: 100,
      activeSubscriptions: 86,
      cancelledSubscriptions: 4,
      users: 40,
      courseCompletions: 25,
      activeCourses: 8,
    },
    previous: {
      grossRevenue: 9_000,
      subscriptions: 75,
      activeSubscriptions: 70,
      cancelledSubscriptions: 2,
      users: 30,
      courseCompletions: 18,
      activeCourses: 7,
    },
    trends: [{ date: "2026-05-01", revenue: 600, completions: 2 }],
  });

  return {
    repositories: {
      read: {
        getOverview: async (query) => ({ ...overview, query }),
        getUsers: async () => {
          throw new Error("not used");
        },
        getCoursesLessons: async () => {
          throw new Error("not used");
        },
        getLessonDrilldown: async () => {
          throw new Error("not used");
        },
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

test("GET overview returns business-health sections for admins", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeOverviewDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/overview?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["overview"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "success");
  assert.equal(body.data.pageId, "overview");
  assert.equal(body.data.sections.kpis.length, 4);
  assert.equal(body.data.sections.revenueTrend.chartType, "area");
  assert.equal(body.data.sections.subscriptionFunnel.chartType, "funnel");
});
