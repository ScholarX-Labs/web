import assert from "node:assert/strict";
import test from "node:test";
import { ExecutiveDashboardService } from "../application/executive-dashboard.service";
import type { ExecutivePageQuery } from "../contracts/executive-query.schemas";

const query: ExecutivePageQuery = {
  from: "2026-05-01",
  to: "2026-05-25",
  page: 1,
  pageSize: 25,
  direction: "desc",
};

test("public growth read model calculates funnel rates and drop-offs", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildPublicGrowthReadModel({
    query,
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    current: {
      websiteVisits: 1000,
      signupStarts: 300,
      signups: 200,
      enrollments: 80,
      completions: 40,
      opportunityActions: 25,
    },
    cohortRetention: [{ cohort: "2026-05", users: 200, retainedUsers: 120, retentionRate: 0.6 }],
    publicImpactMetrics: [{ metricId: "students_served", label: "Students served", value: 1200, status: "approved" }],
  });

  assert.equal(model.pageId, "public_growth");
  assert.equal(model.sections.websiteFunnel.points[1].rate, 0.3);
  assert.equal(model.sections.growthFunnel.points[1].rate, 0.4);
  assert.equal(model.sections.studentReadiness[0].value, 0.2);
  assert.equal(model.sections.cohortRetention.points[0].retentionRate, 0.6);
  assert.equal(model.freshnessSummary.unavailable, 0);
});

test("public growth read model marks missing website instrumentation as data gap", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildPublicGrowthReadModel({
    query,
    current: {
      websiteVisits: null,
      signupStarts: null,
      signups: 12,
      enrollments: 4,
      completions: 1,
      opportunityActions: null,
    },
  });

  assert.equal(model.sections.websiteFunnel.state.status, "data_gap");
  assert.equal(model.sections.websiteFunnel.points[0].state.status, "data_gap");
  assert.equal(model.sections.studentReadiness[0].state.status, "data_gap");
  assert.equal(model.freshnessSummary.unavailable, 5);
});
