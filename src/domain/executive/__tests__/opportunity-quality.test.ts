import assert from "node:assert/strict";
import test from "node:test";
import { ActionCenterRules } from "../application/action-center-rules";
import { ExecutiveDashboardService } from "../application/executive-dashboard.service";
import type { ExecutivePageQuery } from "../contracts/executive-query.schemas";

const query: ExecutivePageQuery = {
  from: "2026-05-01",
  to: "2026-05-25",
  page: 1,
  pageSize: 25,
  direction: "desc",
};

test("opportunity quality read model builds cleanup queue signals", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildOpportunitiesAiReadModel({
    query,
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    opportunities: [
      {
        opportunityId: "opp-1",
        title: "Global Fellowship",
        brokenLink: true,
        expired: true,
        missingMetadataFields: ["deadline"],
        savedCount: 24,
        applyClicks: 1,
        lastCheckedAt: "2026-05-24T08:00:00.000Z",
      },
    ],
  });

  assert.equal(model.pageId, "opportunities_ai");
  assert.equal(model.sections.opportunityCleanupQueue.rows.length, 4);
  assert.equal(model.sections.opportunityQualitySummary.expired, 1);
  assert.equal(model.sections.opportunityQualitySummary.brokenLinks, 1);
  assert.equal(model.sections.opportunityQualitySummary.missingMetadata, 1);
  assert.equal(model.sections.opportunityQualitySummary.highSaveLowApply, 1);
  assert.equal(model.sections.opportunityCleanupQueue.rows[0]?.severity, "high");
});

test("opportunity quality read model marks missing instrumentation as data gap", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildOpportunitiesAiReadModel({
    query,
    opportunities: [],
  });

  assert.equal(model.sections.opportunityCleanupQueue.state.status, "data_gap");
  assert.equal(model.freshnessSummary.unavailable, 9);
});

test("opportunity quality action-center rule creates durable source key", () => {
  const rules = new ActionCenterRules();
  const signal = rules.opportunityQuality({
    opportunityId: "opp-1",
    title: "Global Fellowship",
    issueType: "broken_link",
  });

  assert.equal(signal.ruleId, "opportunity-quality");
  assert.equal(signal.entityType, "opportunity");
  assert.equal(signal.sourcePage, "opportunities_ai");
  assert.equal(signal.sourceSection, "opportunityCleanupQueue");
  assert.equal(signal.severity, "high");
  assert.equal(signal.version, "broken_link");
});
