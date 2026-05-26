import assert from "node:assert/strict";
import test from "node:test";
import { ExecutiveDashboardService } from "../application/executive-dashboard.service";
import { FreshnessService } from "../application/freshness.service";
import type { ExecutivePageQuery } from "../contracts/executive-query.schemas";

const query: ExecutivePageQuery = {
  from: "2026-05-01",
  to: "2026-05-25",
  page: 1,
  pageSize: 25,
  direction: "desc",
};

test("freshness service summarizes records and classifies slow latency", () => {
  const service = new FreshnessService();
  const now = new Date("2026-05-25T12:00:00.000Z");

  const records = [
    {
      sectionId: "overview",
      sourceKey: "courses",
      lastSuccessfulAt: now,
      lastAttemptedAt: now,
      status: "current" as const,
      lastQueryDurationMs: 120,
      rollingP95DurationMs: 180,
    },
    {
      sectionId: "email",
      sourceKey: "email",
      lastSuccessfulAt: now,
      lastAttemptedAt: now,
      status: "stale" as const,
      lastQueryDurationMs: 4_200,
      rollingP95DurationMs: 2_200,
    },
  ];

  assert.deepEqual(service.summarize(records), {
    current: 1,
    stale: 1,
    very_stale: 0,
    unavailable: 0,
  });
  assert.equal(service.latencyStatus(records[0]), "ready");
  assert.equal(service.latencyStatus(records[1]), "stale");
  assert.equal(
    service.latencyStatus({ lastQueryDurationMs: 9_000, rollingP95DurationMs: 4_500 }),
    "error",
  );
});

test("technical health read model distinguishes freshness, latency, and operational degradation", () => {
  const dashboard = new ExecutiveDashboardService();
  const model = dashboard.buildTechnicalHealthReadModel({
    query,
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    freshness: [
      {
        sectionId: "overview",
        sourceKey: "courses",
        status: "current",
        lastSuccessfulAt: "2026-05-25T12:00:00.000Z",
        lastAttemptedAt: "2026-05-25T12:00:00.000Z",
        lastErrorCode: null,
        lastQueryDurationMs: 180,
        rollingP95DurationMs: 250,
      },
      {
        sectionId: "email",
        sourceKey: "email",
        status: "very_stale",
        lastSuccessfulAt: "2026-05-25T10:00:00.000Z",
        lastAttemptedAt: "2026-05-25T12:00:00.000Z",
        lastErrorCode: "PROVIDER_TIMEOUT",
        lastQueryDurationMs: 8_500,
        rollingP95DurationMs: 4_200,
      },
    ],
    auditLog: [
      {
        id: "audit-1",
        adminId: "admin-1",
        action: "executive.action_center.update",
        entityType: "action_item",
        entityId: "item-1",
        createdAt: "2026-05-25T11:00:00.000Z",
      },
    ],
    health: {
      progressEvents: 50,
      emailQueued: 3,
      emailAccepted: 12,
      emailFailed: 1,
      openActionItems: 2,
      activeSessions: 7,
      activeUsers: 5,
      bannedUsers: 1,
      unverifiedUsers: 10,
      emailProviders: [
        {
          provider: "resend",
          state: "open",
          failureCount: 4,
          successCount: 20,
          cooldownUntil: "2026-05-25T12:30:00.000Z",
          updatedAt: "2026-05-25T12:00:00.000Z",
        },
      ],
    },
  });

  assert.equal(model.pageId, "technical_health");
  assert.equal(model.freshnessSummary.current, 1);
  assert.equal(model.freshnessSummary.very_stale, 1);
  assert.equal(model.sections.freshnessGrid.rows[1].state.status, "error");
  assert.equal(model.sections.pipelineHealth.state.status, "partial");
  assert.equal(model.sections.emailPipelineHealth.state.status, "partial");
  assert.equal(model.sections.adminAuditLog.rows.length, 1);
});
