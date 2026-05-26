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

function makeTechnicalHealthDomain(): ExecutiveDomain {
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
        getOpportunitiesAi: async () => {
          throw new Error("not used");
        },
        getTechnicalHealth: async (query) =>
          service.buildTechnicalHealthReadModel({
            query,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            freshness: [
              {
                sectionId: "overview",
                sourceKey: "courses",
                status: "current",
                lastSuccessfulAt: "2026-05-25T12:00:00.000Z",
                lastAttemptedAt: "2026-05-25T12:00:00.000Z",
                lastErrorCode: null,
                lastQueryDurationMs: 120,
                rollingP95DurationMs: 180,
              },
            ],
            auditLog: [],
            health: {
              progressEvents: 10,
              emailQueued: 1,
              emailAccepted: 4,
              emailFailed: 0,
              openActionItems: 0,
              activeSessions: 2,
              activeUsers: 3,
              bannedUsers: 0,
              unverifiedUsers: 5,
              emailProviders: [],
            },
          }),
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

test("GET technical health returns freshness, audit, and pipeline sections", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeTechnicalHealthDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/technical-health?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["technical-health"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "success");
  assert.equal(body.data.pageId, "technical_health");
  assert.equal(body.data.sections.freshnessGrid.rows.length, 1);
  assert.equal(body.data.sections.pipelineHealth.progressEvents, 10);
  assert.equal(body.data.sections.queryLatency.chartType, "bar");
});
