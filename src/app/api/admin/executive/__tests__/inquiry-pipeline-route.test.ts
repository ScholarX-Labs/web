import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createExecutiveRouteHandlers } from "../route-handlers";
import { ExecutiveDashboardService } from "@/domain/executive/application/executive-dashboard.service";
import type { ExecutiveDomain } from "@/domain/executive";
import type { ExecutiveFeatureFlags } from "@/lib/executive/feature-flags";

const enabledFlags: ExecutiveFeatureFlags = {
  EXECUTIVE_DASHBOARD_ENABLED: true,
  EXECUTIVE_TEAM_OPERATIONS_ENABLED: true,
  EXECUTIVE_FINANCE_ENABLED: false,
  PUBLIC_IMPACT_GOVERNANCE_ENABLED: true,
  EXECUTIVE_AI_HEATMAP_ENABLED: false,
};

function makeInquiryDomain(): ExecutiveDomain {
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
        getPublicGrowth: async () => {
          throw new Error("not used");
        },
        getTeamOperations: async (query) =>
          service.buildTeamOperationsReadModel({
            query,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            inquiries: [
              {
                inquiryId: "inq-1",
                courseId: "course-1",
                courseTitle: "Scholarship Strategy",
                status: "pending",
                assignedOwnerId: null,
                sourceChannel: "course_modal",
                submittedAt: "2026-05-22T10:00:00.000Z",
                updatedAt: "2026-05-22T10:00:00.000Z",
              },
            ],
          }),
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

test("GET team operations returns inquiry pipeline SLA sections", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeInquiryDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/team-operations?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["team-operations"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.pageId, "team_operations");
  assert.equal(body.data.sections.inquiryPipelineSummary.slaBreaches, 1);
  assert.equal(body.data.sections.inquiryPipeline.rows[0].isSlaBreached, true);
});
