import assert from "node:assert/strict";
import test from "node:test";
import { analyticsEventsRouteInputSchema } from "../schemas";
import { shouldMirrorEvent } from "../mirror-routing";
import { ANALYTICS_EVENT_REGISTRY } from "../event-registry";

test("analytics contract metadata is complete and non-empty", () => {
  for (const entry of ANALYTICS_EVENT_REGISTRY) {
    assert.equal(typeof entry.event, "string");
    assert.equal(entry.event.length > 0, true);
    assert.equal(typeof entry.description, "string");
    assert.equal(entry.description.trim().length > 0, true);
    assert.equal(entry.schemaVersion >= 1, true);
  }
});

test("client-route events are accepted by analytics route schema", () => {
  for (const entry of ANALYTICS_EVENT_REGISTRY) {
    if (entry.ingestion !== "client_route") continue;
    const parsed = analyticsEventsRouteInputSchema.safeParse({
      event: entry.event,
      properties: {},
    });
    assert.equal(
      parsed.success,
      true,
      `Route schema must include client_route event: ${entry.event}`,
    );
  }
});

test("mirror-eligible contract flags match mirror routing policy", () => {
  for (const entry of ANALYTICS_EVENT_REGISTRY) {
    assert.equal(
      shouldMirrorEvent(entry.event),
      entry.mirrorEligible,
      `Mirror policy mismatch for ${entry.event}`,
    );
  }
});
