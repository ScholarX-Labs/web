import assert from "node:assert/strict";
import test from "node:test";
import { ANALYTICS_EVENTS } from "../constants";
import {
  ANALYTICS_EVENT_REGISTRY,
  getAnalyticsEventContract,
} from "../event-registry";

test("analytics event registry covers all declared analytics events exactly once", () => {
  const constantEvents = Object.values(ANALYTICS_EVENTS);
  const registryEvents = ANALYTICS_EVENT_REGISTRY.map((entry) => entry.event);

  assert.equal(new Set(registryEvents).size, registryEvents.length);

  for (const event of constantEvents) {
    assert.equal(
      registryEvents.includes(event),
      true,
      `Missing registry entry for event: ${event}`,
    );
  }
});

test("getAnalyticsEventContract resolves configured event", () => {
  const contract = getAnalyticsEventContract(ANALYTICS_EVENTS.CTA_CLICK);
  assert.equal(contract?.event, ANALYTICS_EVENTS.CTA_CLICK);
  assert.equal(contract?.owner, "growth");
});
