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

function makePublicImpactDomain(): ExecutiveDomain {
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
            publicImpactMetrics: [
              {
                metricId: "students_served",
                label: "Students served",
                value: 1250,
                computedValue: 1200,
                manualOverrideValue: 1250,
                sourceDescription: "Count of active learner accounts",
                ownerId: "owner-1",
                approvalStatus: "manual_override",
                proposedBy: "admin-1",
                auditTrail: [
                  {
                    action: "manual_override",
                    actorId: "admin-1",
                    at: "2026-05-25T12:00:00.000Z",
                    fromStatus: "approved",
                    toStatus: "manual_override",
                    reason: "Partner attendance correction",
                    originalComputedValue: 1200,
                    manualOverrideValue: 1250,
                  },
                ],
                freshnessAt: "2026-05-25T12:00:00.000Z",
                updatedAt: "2026-05-25T12:00:00.000Z",
              },
            ],
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

test("GET public growth returns public impact governance fields", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makePublicImpactDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/public-growth?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["public-growth"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  const metric = body.data.sections.publicImpactMetrics[0];
  assert.equal(metric.metricId, "students_served");
  assert.equal(metric.value, 1250);
  assert.equal(metric.computedValue, 1200);
  assert.equal(metric.approvalStatus, "manual_override");
  assert.equal(metric.auditTrail.length, 1);
});
