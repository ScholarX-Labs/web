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

test("AI search read model calculates quality rates and flags", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildOpportunitiesAiReadModel({
    query,
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    opportunities: [],
    aiSearch: {
      totalSearches: 100,
      zeroResultSearches: 30,
      errorSearches: 12,
      feedbackCount: 8,
      estimatedCost: 14.5,
      averageLatencyMs: 3500,
      trend: [
        {
          date: "2026-05-25",
          searches: 100,
          zeroResultSearches: 30,
          errorSearches: 12,
        },
      ],
      usageByUser: [
        {
          userId: "user-1",
          searches: 40,
          zeroResultSearches: 10,
          errorSearches: 2,
          estimatedCost: 4.25,
          averageLatencyMs: 2500,
        },
      ],
    },
  });

  assert.equal(model.pageId, "opportunities_ai");
  assert.equal(model.sections.aiQualitySummary.totalSearches, 100);
  assert.equal(model.sections.aiQualitySummary.zeroResultRate, 0.3);
  assert.equal(model.sections.aiQualitySummary.errorRate, 0.12);
  assert.equal(model.sections.aiQualitySignals.length, 3);
  assert.equal(model.sections.aiUsageByUser.rows[0]?.userId, "user-1");
});

test("AI search read model marks absent instrumentation as data gap", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildOpportunitiesAiReadModel({
    query,
    opportunities: [],
  });

  assert.equal(model.sections.aiQualitySummary.state.status, "data_gap");
  assert.equal(model.sections.aiSearchTrend.state.status, "data_gap");
  assert.equal(model.sections.aiUsageByUser.state.status, "data_gap");
  assert.equal(model.freshnessSummary.unavailable, 7);
});
