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

function makeAiSearchDomain(): ExecutiveDomain {
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
        getCoursesLessons: async () => {
          throw new Error("not used");
        },
        getLessonDrilldown: async () => {
          throw new Error("not used");
        },
        getLearnerProgress: async () => {
          throw new Error("not used");
        },
        getOpportunitiesAi: async (query) =>
          service.buildOpportunitiesAiReadModel({
            query,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            opportunities: [],
            aiSearch: {
              totalSearches: 10,
              zeroResultSearches: 2,
              errorSearches: 1,
              feedbackCount: 3,
              estimatedCost: 1.2,
              averageLatencyMs: 1200,
              trend: [{ date: "2026-05-25", searches: 10, zeroResultSearches: 2, errorSearches: 1 }],
              usageByUser: [{ userId: "user-1", searches: 10, zeroResultSearches: 2, errorSearches: 1, estimatedCost: 1.2, averageLatencyMs: 1200 }],
            },
          }),
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

test("GET opportunities and AI returns AI search quality sections", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeAiSearchDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/opportunities-ai?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["opportunities-ai"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.pageId, "opportunities_ai");
  assert.equal(body.data.sections.aiQualitySummary.totalSearches, 10);
  assert.equal(body.data.sections.aiQualitySummary.zeroResultRate, 0.2);
  assert.equal(body.data.sections.aiUsageByUser.rows[0].userId, "user-1");
});
