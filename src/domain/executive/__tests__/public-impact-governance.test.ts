import assert from "node:assert/strict";
import test from "node:test";
import {
  PublicImpactGovernanceService,
  type PublicImpactGovernanceRepository,
  type PublicImpactMetricDraft,
} from "../application/public-impact-governance.service";
import type { PublicImpactMetricGovernanceRow } from "../contracts/executive-read-repository.contract";

const now = new Date("2026-05-25T12:00:00.000Z");

function rowFromDraft(draft: PublicImpactMetricDraft): PublicImpactMetricGovernanceRow {
  return {
    ...draft,
    value: draft.manualOverrideValue ?? draft.computedValue,
    approvedAt: draft.approvedAt ? new Date(draft.approvedAt).toISOString() : null,
    rejectedAt: draft.rejectedAt ? new Date(draft.rejectedAt).toISOString() : null,
    freshnessAt: new Date(draft.freshnessAt).toISOString(),
    updatedAt: new Date(draft.updatedAt).toISOString(),
    state: {
      status: "ready",
      freshness: "current",
      lastSuccessfulAt: now.toISOString(),
    },
  };
}

function fakeRepo(seed?: PublicImpactMetricDraft): PublicImpactGovernanceRepository {
  let current = seed ?? null;
  return {
    async listMetrics() {
      return current ? [rowFromDraft(current)] : [];
    },
    async findMetric() {
      return current;
    },
    async upsertProposal(input) {
      current = input;
      return rowFromDraft(input);
    },
    async updateReview(_metricId, input) {
      if (!current) return null;
      current = { ...current, ...input };
      return rowFromDraft(current);
    },
  };
}

test("public impact proposal enters pending review with audit trail", async () => {
  const service = new PublicImpactGovernanceService(fakeRepo());
  const result = await service.proposeMetric(
    "admin-1",
    {
      metricId: "students_served",
      computedValue: 1200,
      sourceDescription: "Count of active learner accounts",
      ownerId: "owner-1",
      rationale: "Monthly leadership review",
    },
    now,
  );

  assert.equal(result.approvalStatus, "pending_review");
  assert.equal(result.value, 1200);
  assert.equal(result.auditTrail.length, 1);
  assert.equal(result.auditTrail[0]?.action, "propose");
});

test("public impact manual override records original computed value", async () => {
  const existing: PublicImpactMetricDraft = {
    metricId: "students_served",
    label: "Students Served",
    computedValue: 1000,
    manualOverrideValue: null,
    sourceDescription: "Count of active learner accounts",
    ownerId: "owner-1",
    approvalStatus: "approved",
    proposedBy: "admin-1",
    approvedBy: "admin-2",
    approvedAt: now,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    auditTrail: [],
    autoPublish: false,
    freshnessAt: now,
    updatedAt: now,
  };
  const service = new PublicImpactGovernanceService(fakeRepo(existing));
  const result = await service.proposeMetric(
    "admin-2",
    {
      metricId: "students_served",
      computedValue: 1000,
      manualOverrideValue: 1250,
      sourceDescription: "Manual verified count",
      ownerId: "owner-1",
      rationale: "Partner-provided attendance correction",
    },
    now,
  );

  assert.equal(result.approvalStatus, "manual_override");
  assert.equal(result.value, 1250);
  assert.equal(result.auditTrail[0]?.originalComputedValue, 1000);
  assert.equal(result.auditTrail[0]?.manualOverrideValue, 1250);
});

test("public impact approver cannot approve their own proposal", async () => {
  const existing: PublicImpactMetricDraft = {
    metricId: "students_served",
    label: "Students Served",
    computedValue: 1200,
    manualOverrideValue: null,
    sourceDescription: "Count of active learner accounts",
    ownerId: "owner-1",
    approvalStatus: "pending_review",
    proposedBy: "admin-1",
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    auditTrail: [],
    autoPublish: false,
    freshnessAt: now,
    updatedAt: now,
  };
  const service = new PublicImpactGovernanceService(fakeRepo(existing));

  await assert.rejects(
    () => service.reviewMetric("admin-1", "students_served", { status: "approved" }, now),
    /cannot approve/,
  );
});
