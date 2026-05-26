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

test("overview read model calculates KPI deltas, rates, funnel, and chart summaries", () => {
  const service = new ExecutiveDashboardService();
  const generatedAt = new Date("2026-05-25T12:00:00.000Z");

  const model = service.buildOverviewReadModel({
    query,
    generatedAt,
    current: {
      grossRevenue: 12_000,
      subscriptions: 100,
      activeSubscriptions: 82,
      cancelledSubscriptions: 8,
      users: 140,
      courseCompletions: 35,
      activeCourses: 12,
    },
    previous: {
      grossRevenue: 10_000,
      subscriptions: 80,
      activeSubscriptions: 72,
      cancelledSubscriptions: 4,
      users: 120,
      courseCompletions: 20,
      activeCourses: 10,
    },
    trends: [
      { date: "2026-05-01", revenue: 500, completions: 2 },
      { date: "2026-05-02", revenue: 700, completions: 4 },
    ],
  });

  assert.equal(model.pageId, "overview");
  assert.equal(model.sections.kpis.length, 4);
  assert.equal(model.sections.kpis[0].definitionId, "overview.gross_revenue");
  assert.equal(model.sections.kpis[0].deltaPercent, 0.2);
  assert.equal(model.sections.kpis[3].value, 0.35);
  assert.equal(model.sections.subscriptionFunnel.points[1].rate, 0.82);
  assert.equal(model.sections.revenueTrend.points.length, 2);
  assert.equal(model.sections.completionTrend.a11ySummary.includes("35"), true);
  assert.deepEqual(model.sections.riskIndicators, []);
});

test("overview read model raises business-health risk indicators", () => {
  const service = new ExecutiveDashboardService();

  const model = service.buildOverviewReadModel({
    query,
    current: {
      grossRevenue: 0,
      subscriptions: 50,
      activeSubscriptions: 10,
      cancelledSubscriptions: 20,
      users: 10,
      courseCompletions: 2,
      activeCourses: 4,
    },
    previous: {
      grossRevenue: 1_000,
      subscriptions: 40,
      activeSubscriptions: 30,
      cancelledSubscriptions: 2,
      users: 8,
      courseCompletions: 12,
      activeCourses: 4,
    },
    trends: [],
  });

  assert.deepEqual(
    model.sections.riskIndicators.map((risk) => risk.id),
    [
      "overview.no_revenue",
      "overview.low_completion_rate",
      "overview.subscription_churn",
    ],
  );
});
