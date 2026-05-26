import assert from "node:assert/strict";
import test from "node:test";
import { ExecutiveDashboardService } from "../application/executive-dashboard.service";
import { createOverviewFixture, executiveBaseQuery } from "./fixtures/executive-fixtures";

const query = executiveBaseQuery;

test("overview read model calculates KPI deltas, rates, funnel, and chart summaries", () => {
  const service = new ExecutiveDashboardService();
  const generatedAt = new Date("2026-05-25T12:00:00.000Z");
  const fixture = createOverviewFixture();

  const model = service.buildOverviewReadModel({
    query,
    generatedAt,
    current: fixture.current,
    previous: fixture.previous,
    trends: fixture.trends,
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
