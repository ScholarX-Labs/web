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

test("activity heatmap buckets progress events by UTC day and hour", () => {
  const service = new ExecutiveDashboardService();
  const buckets = service.bucketActivityHeatmap([
    { occurredAt: "2026-05-03T09:15:00.000Z" },
    { occurredAt: "2026-05-03T09:45:00.000Z" },
    { occurredAt: "2026-05-04T22:00:00.000Z" },
  ]);

  assert.equal(buckets.length, 168);
  assert.equal(
    buckets.find((bucket) => bucket.dayOfWeek === 0 && bucket.hour === 9)?.value,
    2,
  );
  assert.equal(
    buckets.find((bucket) => bucket.dayOfWeek === 1 && bucket.hour === 22)?.value,
    1,
  );
});

test("users read model computes peaks, role rates, and kpi deltas", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildUsersReadModel({
    query,
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    current: {
      newUsers: 30,
      totalUsers: 100,
      activeUsers: 22,
      verifiedUsers: 80,
      bannedUsers: 2,
    },
    previous: {
      newUsers: 20,
      totalUsers: 90,
      activeUsers: 11,
      verifiedUsers: 63,
      bannedUsers: 3,
    },
    registrationTrend: [
      { date: "2026-05-01", newUsers: 10 },
      { date: "2026-05-02", newUsers: 20 },
    ],
    roleDistribution: [
      { role: "admin", value: 5 },
      { role: "user", value: 95 },
    ],
    activityEvents: [
      { occurredAt: "2026-05-03T09:15:00.000Z" },
      { occurredAt: "2026-05-03T09:45:00.000Z" },
      { occurredAt: "2026-05-04T22:00:00.000Z" },
    ],
    monthlyActivity: [{ month: "2026-05", value: 3 }],
  });

  assert.equal(model.pageId, "users");
  assert.equal(model.sections.kpis[0].deltaPercent, 0.5);
  assert.equal(model.sections.kpis[2].value, 0.8);
  assert.equal(model.sections.roleDistribution.points[0].rate, 0.05);
  assert.equal(model.sections.peakActivity.peakDayOfWeek, 0);
  assert.equal(model.sections.peakActivity.peakHour, 9);
  assert.equal(model.sections.activityHeatmap.chartType, "heatmap");
});
