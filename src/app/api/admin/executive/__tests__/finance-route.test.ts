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
  EXECUTIVE_FINANCE_ENABLED: true,
  PUBLIC_IMPACT_GOVERNANCE_ENABLED: true,
  EXECUTIVE_AI_HEATMAP_ENABLED: false,
};

function makeFinanceDomain(): ExecutiveDomain {
  const service = new ExecutiveDashboardService();
  return {
    repositories: {
      read: {
        getOverview: async () => { throw new Error("not used"); },
        getUsers: async () => { throw new Error("not used"); },
        getCoursesLessons: async () => { throw new Error("not used"); },
        getLessonDrilldown: async () => { throw new Error("not used"); },
        getLearnerProgress: async () => { throw new Error("not used"); },
        getOpportunitiesAi: async () => { throw new Error("not used"); },
        getTechnicalHealth: async () => { throw new Error("not used"); },
        getPublicGrowth: async () => { throw new Error("not used"); },
        getTeamOperations: async () => { throw new Error("not used"); },
        getFinance: async (query) =>
          service.buildFinanceReadModel({
            query,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            current: {
              grossRevenue: 12_000,
              refundedRevenue: 1_000,
              enrollments: 40,
              paidEnrollments: 30,
              manualEnrollments: 10,
              activeLearners: 20,
              completions: 18,
              supportInquiries: 8,
            },
            previous: {
              grossRevenue: 10_000,
              refundedRevenue: 500,
              enrollments: 30,
              paidEnrollments: 22,
              manualEnrollments: 8,
              activeLearners: 16,
              completions: 12,
              supportInquiries: 5,
            },
            courses: [
              {
                courseId: "course-1",
                title: "Data Science",
                category: "STEM",
                grossRevenue: 9_000,
                refundedRevenue: 900,
                enrollments: 30,
                completions: 12,
                supportInquiryCount: 6,
              },
              {
                courseId: "course-2",
                title: "Cloud Basics",
                category: "Ops",
                grossRevenue: 3_000,
                refundedRevenue: 100,
                enrollments: 10,
                completions: 6,
                supportInquiryCount: 2,
              },
            ],
            selectedCourse: {
              courseId: "course-1",
              title: "Data Science",
              category: "STEM",
              grossRevenue: 9_000,
              refundedRevenue: 900,
              enrollments: 30,
              completions: 12,
              supportInquiryCount: 6,
            },
          }),
      },
      actionCenter: {
        listOpenItems: async () => [],
        findBySourceKey: async () => null,
        upsertDerivedItem: async (item) => item,
        updateWorkflowState: async () => { throw new Error("not used"); },
      },
      analyticsEvents: { record: async () => "event-1" },
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

test("GET finance returns the finance read model for admins", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeFinanceDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/finance?from=2026-05-01&to=2026-05-25&courseId=course-1"),
    { params: Promise.resolve({ path: ["finance"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.pageId, "finance");
  assert.equal(body.data.sections.financeSummary.netRevenue, 11_000);
  assert.equal(body.data.sections.selectedCourseDetail.courseId, "course-1");
});

test("GET finance returns 404 when the phase 2 flag is disabled", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => ({ ...enabledFlags, EXECUTIVE_FINANCE_ENABLED: false }),
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeFinanceDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/finance?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["finance"] }) },
  );

  assert.equal(response.status, 404);
});
