import assert from "node:assert/strict";
import test from "node:test";
import {
  ActionCenterRules,
  createActionCenterItem,
  sourceKeyFor,
} from "../application/action-center-rules";
import { ActionCenterService } from "../application/action-center.service";
import type {
  ActionCenterItem,
  ActionCenterRepository,
} from "../contracts/action-center-repository.contract";

const now = new Date("2026-05-25T12:00:00.000Z");

function item(overrides: Partial<ActionCenterItem>): ActionCenterItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    ruleId: overrides.ruleId ?? "rule",
    sourceKey: overrides.sourceKey ?? "rule:course:course-1:v1",
    severity: overrides.severity ?? "medium",
    sourcePage: overrides.sourcePage ?? "technical_health",
    sourceSection: overrides.sourceSection ?? "section",
    entityType: overrides.entityType ?? "course",
    entityId: overrides.entityId ?? "course-1",
    title: overrides.title ?? "Item",
    recommendedAction: overrides.recommendedAction ?? "Do the next action.",
    assignedOwnerId: overrides.assignedOwnerId ?? null,
    dueAt: overrides.dueAt ?? null,
    status: overrides.status ?? "open",
    firstSeenAt: overrides.firstSeenAt ?? now.toISOString(),
    lastSeenAt: overrides.lastSeenAt ?? now.toISOString(),
    dismissedAt: overrides.dismissedAt ?? null,
    resolvedAt: overrides.resolvedAt ?? null,
    reopenedCount: overrides.reopenedCount ?? 0,
    updatedAt: overrides.updatedAt ?? now.toISOString(),
    state: overrides.state ?? {
      status: "ready",
      freshness: "current",
      lastSuccessfulAt: now.toISOString(),
    },
  };
}

test("Action Center rules generate stable source keys and severity upgrades", () => {
  const rules = new ActionCenterRules();
  const stalled = rules.stalledLearner({
    learnerId: "learner-1",
    learnerLabel: "Learner 1",
    daysInactive: 31,
  });

  assert.ok(stalled);
  assert.equal(stalled.severity, "high");
  assert.equal(sourceKeyFor(stalled), "stalled-learner:learner:learner-1:v1");

  const derived = createActionCenterItem(stalled, now);
  assert.equal(derived.status, "open");
  assert.equal(derived.sourceKey, "stalled-learner:learner:learner-1:v1");
});

test("Action Center service sorts by severity, assignment, due date, and recency", async () => {
  const items = [
    item({ id: "low", severity: "low" }),
    item({ id: "critical-assigned", severity: "critical", assignedOwnerId: "owner-1" }),
    item({ id: "critical-unassigned", severity: "critical" }),
    item({ id: "high-due", severity: "high", dueAt: "2026-05-26T00:00:00.000Z" }),
    item({ id: "high-earlier", severity: "high", dueAt: "2026-05-25T00:00:00.000Z" }),
  ];
  const repository: ActionCenterRepository = {
    listOpenItems: async () => items,
    findBySourceKey: async () => null,
    upsertDerivedItem: async (candidate) => candidate,
    updateWorkflowState: async () => {
      throw new Error("not used");
    },
  };
  const service = new ActionCenterService(repository);
  const model = await service.getActionCenter({
    from: "2026-05-01",
    to: "2026-05-25",
    page: 1,
    pageSize: 25,
    direction: "desc",
  });

  assert.deepEqual(
    model.sections.actionItems.map((candidate) => candidate.id),
    ["critical-unassigned", "critical-assigned", "high-earlier", "high-due", "low"],
  );
  assert.equal(model.sections.severitySummary.critical, 2);
  assert.equal(model.sections.workloadByOwner[0].openItems, 4);
});
