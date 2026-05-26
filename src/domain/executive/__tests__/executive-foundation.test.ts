import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessExecutiveResource,
} from "@/domain/executive/application/executive-access.policy";
import { MetricCalculationPolicy } from "@/domain/executive/application/metric-calculation.policy";
import { ExecutiveRedactionPolicy } from "@/domain/executive/application/redaction.policy";
import { FreshnessService } from "@/domain/executive/application/freshness.service";
import { MetricDefinitionRegistry } from "@/domain/executive/application/metric-definition.registry";
import { executivePageQuerySchema } from "@/domain/executive/contracts/executive-query.schemas";

test("executive page query schema validates date order and defaults pagination", () => {
  const parsed = executivePageQuerySchema.parse({
    from: "2026-05-01",
    to: "2026-05-25",
  });

  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 25);
  assert.equal(parsed.direction, "desc");

  const invalid = executivePageQuerySchema.safeParse({
    from: "2026-05-25",
    to: "2026-05-01",
  });
  assert.equal(invalid.success, false);
});

test("executive access policy is admin-only before Phase 2 roles are enabled", () => {
  assert.equal(
    canAccessExecutiveResource({
      role: "admin",
      resource: "overview",
      action: "read",
    }),
    true,
  );
  assert.equal(
    canAccessExecutiveResource({
      role: "executive",
      resource: "overview",
      action: "read",
    }),
    false,
  );
  assert.equal(
    canAccessExecutiveResource({
      role: "executive",
      resource: "overview",
      action: "read",
      phaseTwoRolesEnabled: true,
    }),
    true,
  );
});

test("metric calculation policy resolves time buckets, prior period, rates, and deltas", () => {
  const policy = new MetricCalculationPolicy();
  const from = new Date("2026-05-01T00:00:00.000Z");
  const to = new Date("2026-05-30T00:00:00.000Z");

  assert.equal(policy.getInclusiveDayCount({ from, to }), 30);
  assert.equal(policy.getTimeAxisResolution({ from, to }), "daily");
  assert.equal(policy.calculateRate(25, 100), 0.25);
  assert.equal(policy.calculateRate(1, 0), null);
  assert.deepEqual(policy.calculateDelta(120, 100), {
    deltaValue: 20,
    deltaPercent: 0.2,
  });

  const prior = policy.getPriorPeriod({ from, to });
  assert.equal(prior.to.toISOString(), "2026-04-30T00:00:00.000Z");
});

test("redaction policy removes PII without mutating safe fields", () => {
  const policy = new ExecutiveRedactionPolicy();
  const redacted = policy.redactRecord(
    {
      id: "user-1",
      email: "learner@example.com",
      nested: { phoneNumber: "+15555555555", count: 3 },
    },
    false,
  );

  assert.equal(redacted.id, "user-1");
  assert.equal(redacted.email, null);
  assert.deepEqual(redacted.nested, { phoneNumber: null, count: 3 });
});

test("freshness service classifies current, stale, very stale, and unavailable states", () => {
  const service = new FreshnessService();
  const now = new Date("2026-05-25T12:00:00.000Z");

  assert.equal(
    service.classify(new Date("2026-05-25T11:56:00.000Z"), now),
    "current",
  );
  assert.equal(
    service.classify(new Date("2026-05-25T11:00:00.000Z"), now),
    "stale",
  );
  assert.equal(
    service.classify(new Date("2026-05-25T10:59:59.000Z"), now),
    "very_stale",
  );
  assert.equal(service.classify(null, now), "unavailable");
});

test("metric definition registry returns known definitions and rejects unknown ids", () => {
  const registry = new MetricDefinitionRegistry();

  assert.equal(registry.getRequired("overview.gross_revenue").format, "currency");
  assert.equal(registry.find("missing.metric"), null);
  assert.throws(() => registry.getRequired("missing.metric"));
});
