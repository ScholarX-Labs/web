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

test("website analytics read model calculates source, device, campaign, and CTA rates", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildPublicGrowthReadModel({
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
  });

  assert.equal(model.sections.websiteAnalyticsSummary.visits, 100);
  assert.equal(model.sections.websiteAnalyticsSummary.ctaClicks, 25);
  assert.equal(model.sections.websiteAnalyticsSummary.signupConversionRate, 0.2);
  assert.equal(model.sections.trafficSources.points[0]?.rate, 0.6);
  assert.equal(model.sections.deviceBreakdown.points[0]?.rate, 0.7);
  assert.equal(model.sections.campaignPerformance.points[0]?.rate, 0.4);
  assert.equal(model.sections.ctaPerformance.points[0]?.clickRate, 0.25);
  assert.equal(model.freshnessSummary.unavailable, 0);
});

test("website analytics marks missing instrumentation as data gap", () => {
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

  assert.equal(model.sections.websiteAnalyticsSummary.state.status, "data_gap");
  assert.equal(model.sections.trafficSources.state.status, "data_gap");
  assert.equal(model.sections.ctaPerformance.state.status, "data_gap");
  assert.equal(model.freshnessSummary.unavailable, 5);
});

test("website analytics treats true zero values as ready, not data gap", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildPublicGrowthReadModel({
    query,
    current: {
      websiteVisits: 0,
      signupStarts: 0,
      signups: 0,
      enrollments: 0,
      completions: 0,
      opportunityActions: 0,
    },
    websiteAnalytics: {
      trafficSources: [],
      deviceBreakdown: [],
      campaignPerformance: [],
      ctaPerformance: [],
      ctaClicks: 0,
    },
  });

  assert.equal(model.sections.websiteAnalyticsSummary.state.status, "ready");
  assert.equal(model.sections.websiteFunnel.state.status, "ready");
});
