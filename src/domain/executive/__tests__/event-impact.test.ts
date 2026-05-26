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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const twoRegisteredEvents = [
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
] as const;

// ---------------------------------------------------------------------------
// Test: read model builds registered events summary correctly
// ---------------------------------------------------------------------------

test("event impact read model aggregates registration totals and top events", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildOpportunitiesAiReadModel({
    query,
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    opportunities: [],
    registeredEvents: twoRegisteredEvents,
  });

  assert.equal(model.pageId, "opportunities_ai");

  const { registeredEventsSummary, registeredEventsTable } = model.sections;

  // Total registrations = 120 + 45 = 165
  assert.equal(registeredEventsSummary.totalRegistrations, 165);
  // Two events have at least one registration
  assert.equal(registeredEventsSummary.uniqueEventsWithRegistrations, 2);
  // Top event is evt-1 with 120 registrations
  assert.equal(registeredEventsTable.rows[0]?.eventId, "evt-1");
  assert.equal(registeredEventsTable.rows[0]?.registrations, 120);
});

// ---------------------------------------------------------------------------
// Test: attendance data-gap — no attendance tracking → not zero, data_gap
// ---------------------------------------------------------------------------

test("event impact marks attendance as data-gap when tracking is not active", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildOpportunitiesAiReadModel({
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
    ],
  });

  const row = model.sections.registeredEventsTable.rows[0];
  assert.ok(row, "Expected at least one event row");
  // US12 AC2: when attendance tracking is unavailable the row must expose
  // attendanceState as data_gap rather than showing zero as a value.
  assert.equal(row.attendanceState, "data_gap");
  assert.equal(row.attendees, null);
  assert.equal(row.noShowRate, null);
});

// ---------------------------------------------------------------------------
// Test: attendance is available — no-show rate and post-event conversions
// ---------------------------------------------------------------------------

test("event impact calculates no-show rate when attendance data is present", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildOpportunitiesAiReadModel({
    query,
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    opportunities: [],
    registeredEvents: [
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
  });

  const row = model.sections.registeredEventsTable.rows[0];
  assert.ok(row, "Expected at least one event row");

  // noShowRate = (registrations - attendees) / registrations = 15 / 45 ≈ 0.333
  assert.equal(row.attendanceState, "ready");
  assert.equal(row.attendees, 30);
  assert.ok(
    row.noShowRate !== null && Math.abs(row.noShowRate - (15 / 45)) < 0.001,
    `Expected noShowRate ≈ 0.333, got ${row.noShowRate}`,
  );
  // postEventSignupConversionRate = postEventSignups / registrations = 8 / 45
  assert.ok(
    row.postEventSignupConversionRate !== null &&
      Math.abs(row.postEventSignupConversionRate - (8 / 45)) < 0.001,
    `Expected conversion ≈ 0.178, got ${row.postEventSignupConversionRate}`,
  );
});

// ---------------------------------------------------------------------------
// Test: missing instrumentation → registeredEvents data_gap
// ---------------------------------------------------------------------------

test("event impact read model marks section as data-gap when no events are present", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildOpportunitiesAiReadModel({
    query,
    opportunities: [],
    // no registeredEvents supplied at all
  });

  assert.equal(
    model.sections.registeredEventsSummary.state.status,
    "data_gap",
  );
  assert.equal(
    model.sections.registeredEventsTable.state.status,
    "data_gap",
  );
});

// ---------------------------------------------------------------------------
// Test: freshness summary accounts for event sections
// ---------------------------------------------------------------------------

test("event impact read model increments unavailable count when events are absent", () => {
  const service = new ExecutiveDashboardService();
  const withEvents = service.buildOpportunitiesAiReadModel({
    query,
    opportunities: [],
    registeredEvents: twoRegisteredEvents,
  });
  const withoutEvents = service.buildOpportunitiesAiReadModel({
    query,
    opportunities: [],
  });

  assert.ok(
    withoutEvents.freshnessSummary.unavailable >
      withEvents.freshnessSummary.unavailable,
    "Missing event data should increase the unavailable freshness count",
  );
});
