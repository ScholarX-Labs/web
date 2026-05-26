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

function makeWebsiteAnalyticsDomain(): ExecutiveDomain {
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
        getTechnicalHealth: async () => {
          throw new Error("not used");
        },
        getPublicGrowth: async (query) =>
          service.buildPublicGrowthReadModel({
            query,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            current: {
              websiteVisits: 100,
              signupStarts: 30,
              signups: 20,
              enrollments: 8,
              completions: 4,
              opportunityActions: 5,
            },
            websiteAnalytics: {
              trafficSources: [{ label: "google", visits: 60 }],
              deviceBreakdown: [{ label: "mobile", visits: 70 }],
              campaignPerformance: [{ label: "spring", visits: 40 }],
              ctaPerformance: [{ ctaId: "hero-start", label: "Hero start", clicks: 25 }],
              ctaClicks: 25,
            },
          }),
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

test("GET public growth returns website analytics sections", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeWebsiteAnalyticsDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/public-growth?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["public-growth"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.pageId, "public_growth");
  assert.equal(body.data.sections.websiteAnalyticsSummary.ctaClicks, 25);
  assert.equal(body.data.sections.trafficSources.points[0].label, "google");
  assert.equal(body.data.sections.ctaPerformance.points[0].clickRate, 0.25);
});
