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

function makeUsersDomain(): ExecutiveDomain {
  const service = new ExecutiveDashboardService();

  return {
    repositories: {
      read: {
        getOverview: async () => {
          throw new Error("not used");
        },
        getUsers: async (query) =>
          service.buildUsersReadModel({
            query,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            current: {
              newUsers: 12,
              totalUsers: 80,
              activeUsers: 20,
              verifiedUsers: 60,
              bannedUsers: 1,
            },
            previous: {
              newUsers: 8,
              totalUsers: 68,
              activeUsers: 10,
              verifiedUsers: 45,
              bannedUsers: 2,
            },
            registrationTrend: [{ date: "2026-05-01", newUsers: 4 }],
            roleDistribution: [
              { role: "admin", value: 5 },
              { role: "user", value: 75 },
            ],
            activityEvents: [
              { occurredAt: "2026-05-03T09:00:00.000Z" },
              { occurredAt: "2026-05-03T09:15:00.000Z" },
            ],
            monthlyActivity: [{ month: "2026-05", value: 2 }],
          }),
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

test("GET users returns counters, distribution, heatmap, and peak activity", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeUsersDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/users?from=2026-05-01&to=2026-05-25&userRole=user"),
    { params: Promise.resolve({ path: ["users"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "success");
  assert.equal(body.data.pageId, "users");
  assert.equal(body.data.query.userRole, "user");
  assert.equal(body.data.sections.kpis.length, 4);
  assert.equal(body.data.sections.activityHeatmap.points.length, 168);
  assert.equal(body.data.sections.peakActivity.peakHour, 9);
});
