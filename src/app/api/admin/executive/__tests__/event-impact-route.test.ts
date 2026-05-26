import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createExecutiveRouteHandlers } from "../route-handlers";
import { ExecutiveDashboardService } from "@/domain/executive/application/executive-dashboard.service";
import type { ExecutiveDomain } from "@/domain/executive";
import type { ExecutiveFeatureFlags } from "@/lib/executive/feature-flags";

const enabledFlags: ExecutiveFeatureFlags = {
  EXECUTIVE_DASHBOARD_ENABLED: true,
  EXECUTIVE_TEAM_OPERATIONS_ENABLED: false,
  EXECUTIVE_FINANCE_ENABLED: false,
  PUBLIC_IMPACT_GOVERNANCE_ENABLED: true,
  EXECUTIVE_AI_HEATMAP_ENABLED: false,
};

// ---------------------------------------------------------------------------
// Domain factory with registered events seeded
// ---------------------------------------------------------------------------

function makeEventImpactDomain(): ExecutiveDomain {
  const service = new ExecutiveDashboardService();

  return {
    repositories: {
      read: {
        getOverview: async () => {
          throw new Error("not used");
        },
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
        getOpportunitiesAi: async (query) =>
          service.buildOpportunitiesAiReadModel({
            query,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            opportunities: [],
            registeredEvents: [
              {
                eventId: "evt-1",
                title: "ScholarX Mentorship Kickoff",
                registrations: 120,
                attendanceTracked: false,
                attendees: null,
                postEventSignups: null,
                postEventEnrollments: null,
              },
              {
                eventId: "evt-2",
                title: "AI for Students Workshop",
                registrations: 45,
                attendanceTracked: true,
                attendees: 30,
                postEventSignups: 8,
                postEventEnrollments: 3,
              },
            ],
          }),
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

// ---------------------------------------------------------------------------
// Domain factory with NO events (data-gap path)
// ---------------------------------------------------------------------------

function makeEventImpactNoDataDomain(): ExecutiveDomain {
  const service = new ExecutiveDashboardService();

  return {
    repositories: {
      read: {
        getOverview: async () => {
          throw new Error("not used");
        },
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
        getOpportunitiesAi: async (query) =>
          service.buildOpportunitiesAiReadModel({
            query,
            generatedAt: new Date("2026-05-25T12:00:00.000Z"),
            opportunities: [],
            // No registeredEvents → data_gap
          }),
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("GET opportunities-ai returns registered events section with totals", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeEventImpactDomain,
  });

  const response = await handlers.GET(
    new NextRequest(
      "http://localhost/api/admin/executive/opportunities-ai?from=2026-05-01&to=2026-05-25",
    ),
    { params: Promise.resolve({ path: ["opportunities-ai"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.pageId, "opportunities_ai");

  // Registered events summary section
  const summary = body.data.sections.registeredEventsSummary;
  assert.equal(summary.totalRegistrations, 165);
  assert.equal(summary.uniqueEventsWithRegistrations, 2);
  assert.equal(summary.state.status, "ready");

  // Registered events table — top event is evt-1
  const table = body.data.sections.registeredEventsTable;
  assert.equal(table.rows[0].eventId, "evt-1");
  assert.equal(table.rows[0].registrations, 120);
  assert.equal(table.rows[0].attendanceState, "data_gap");

  // Second event has attendance data
  assert.equal(table.rows[1].eventId, "evt-2");
  assert.equal(table.rows[1].attendanceState, "ready");
  assert.equal(table.rows[1].attendees, 30);
});

test("GET opportunities-ai returns data-gap state for registered events when none present", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeEventImpactNoDataDomain,
  });

  const response = await handlers.GET(
    new NextRequest(
      "http://localhost/api/admin/executive/opportunities-ai?from=2026-05-01&to=2026-05-25",
    ),
    { params: Promise.resolve({ path: ["opportunities-ai"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();

  const summary = body.data.sections.registeredEventsSummary;
  assert.equal(summary.state.status, "data_gap");

  const table = body.data.sections.registeredEventsTable;
  assert.equal(table.state.status, "data_gap");
  assert.equal(table.rows.length, 0);
});

test("GET opportunities-ai returns 401 when session is missing", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => null,
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeEventImpactDomain,
  });

  const response = await handlers.GET(
    new NextRequest(
      "http://localhost/api/admin/executive/opportunities-ai?from=2026-05-01&to=2026-05-25",
    ),
    { params: Promise.resolve({ path: ["opportunities-ai"] }) },
  );

  assert.equal(response.status, 401);
});

test("GET opportunities-ai returns 404 when feature flag is disabled", async () => {
  const disabledFlags: ExecutiveFeatureFlags = {
    ...enabledFlags,
    EXECUTIVE_DASHBOARD_ENABLED: false,
  };

  const handlers = createExecutiveRouteHandlers({
    getFlags: () => disabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeEventImpactDomain,
  });

  const response = await handlers.GET(
    new NextRequest(
      "http://localhost/api/admin/executive/opportunities-ai?from=2026-05-01&to=2026-05-25",
    ),
    { params: Promise.resolve({ path: ["opportunities-ai"] }) },
  );

  assert.equal(response.status, 404);
});

test("GET opportunities-ai returns 429 when rate limit is exceeded", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    }),
    createDomain: makeEventImpactDomain,
  });

  const response = await handlers.GET(
    new NextRequest(
      "http://localhost/api/admin/executive/opportunities-ai?from=2026-05-01&to=2026-05-25",
    ),
    { params: Promise.resolve({ path: ["opportunities-ai"] }) },
  );

  assert.equal(response.status, 429);
});
