import assert from "node:assert/strict";
import test from "node:test";
import { ExecutiveDashboardService } from "../application/executive-dashboard.service";
import { createExecutiveExportService } from "../application/executive-export.service";
import { renderExecutiveCsv } from "@/lib/executive/csv-export";
import { renderExecutiveSnapshot } from "@/lib/executive/snapshot-export";
import type { ExecutiveDomain } from "@/domain/executive";

function makeDomain(): ExecutiveDomain {
  const service = new ExecutiveDashboardService();

  return {
    repositories: {
      read: {
        getOverview: async (query) =>
          service.buildOverviewReadModel({
            query,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            current: {
              grossRevenue: 12_000,
              subscriptions: 40,
              activeSubscriptions: 30,
              cancelledSubscriptions: 3,
              users: 120,
              courseCompletions: 18,
              activeCourses: 6,
            },
            previous: {
              grossRevenue: 10_000,
              subscriptions: 35,
              activeSubscriptions: 28,
              cancelledSubscriptions: 2,
              users: 100,
              courseCompletions: 15,
              activeCourses: 5,
            },
            trends: [
              { date: "2026-05-24", revenue: 500, completions: 2 },
            ],
          }),
        getUsers: async () => {
          throw new Error("not used");
        },
        getCoursesLessons: async () => {
          throw new Error("not used");
        },
        getLessonDrilldown: async () => {
          throw new Error("not used");
        },
        getLearnerProgress: async () => {
          throw new Error("not used");
        },
        getOpportunitiesAi: async () => {
          throw new Error("not used");
        },
        getTechnicalHealth: async () => {
          throw new Error("not used");
        },
        getPublicGrowth: async () => {
          throw new Error("not used");
        },
        getTeamOperations: async () => {
          throw new Error("not used");
        },
        getFinance: async () => {
          throw new Error("not used");
        },
      },
      actionCenter: {
        listOpenItems: async () => [],
        findBySourceKey: async () => null,
        upsertDerivedItem: async (item) => item,
        updateWorkflowState: async () => {
          throw new Error("not used");
        },
      },
      analyticsEvents: {
        record: async () => "event-1",
      },
    },
    policies: {
      calculations: {} as ExecutiveDomain["policies"]["calculations"],
      redaction: {} as ExecutiveDomain["policies"]["redaction"],
    },
    services: {
      freshness: {} as ExecutiveDomain["services"]["freshness"],
    },
    mappers: {
      charts: {} as ExecutiveDomain["mappers"]["charts"],
    },
    registries: {
      metrics: {} as ExecutiveDomain["registries"]["metrics"],
    },
  };
}

test("executive export service renders CSV payload with metadata and audit id", async () => {
  const exportService = createExecutiveExportService({
    domain: makeDomain(),
    renderer: {
      renderCsv: renderExecutiveCsv,
      renderSnapshot: renderExecutiveSnapshot,
    },
    writeAudit: async () => "audit-1",
  });

  const result = await exportService.generate(
    { userId: "admin-1", role: "admin" },
    {
      pageId: "overview",
      format: "csv",
      query: {
        from: "2026-05-01",
        to: "2026-05-25",
        page: 1,
        pageSize: 25,
        direction: "desc",
      },
      sectionIds: ["kpis"],
    },
  );

  assert.equal(result.auditId, "audit-1");
  assert.equal(result.contentType, "text/csv");
  assert.match(result.fileName, /^overview-2026-05-01-to-2026-05-25\.csv$/);
  assert.match(result.body, /export\.metadata/);
  assert.match(result.body, /overview/);
  assert.match(result.body, /kpis/);
});

test("executive export service rejects oversized date ranges", async () => {
  const exportService = createExecutiveExportService({
    domain: makeDomain(),
    renderer: {
      renderCsv: renderExecutiveCsv,
      renderSnapshot: renderExecutiveSnapshot,
    },
    writeAudit: async () => "audit-1",
  });

  await assert.rejects(
    exportService.generate(
      { userId: "admin-1", role: "admin" },
      {
        pageId: "overview",
        format: "snapshot",
        query: {
          from: "2025-01-01",
          to: "2026-05-25",
          page: 1,
          pageSize: 25,
          direction: "desc",
        },
      },
    ),
    (error: unknown) =>
      error instanceof Error
      && "code" in error
      && error.code === "PAYLOAD_TOO_LARGE",
  );
});
