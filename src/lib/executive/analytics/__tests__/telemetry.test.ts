import assert from "node:assert/strict";
import test from "node:test";
import {
  getDeliveryCountersSnapshot,
  incrementDeliveryCounter,
  resetDeliveryCounters,
} from "../telemetry";

test("delivery telemetry counters increment by context and outcome", () => {
  resetDeliveryCounters();
  incrementDeliveryCounter("posthog_capture", "success");
  incrementDeliveryCounter("posthog_capture", "success");
  incrementDeliveryCounter("posthog_capture", "failure");
  incrementDeliveryCounter("internal_mirror_fetch", "success");

  const snapshot = getDeliveryCountersSnapshot();
  assert.equal(snapshot["posthog_capture:success"], 2);
  assert.equal(snapshot["posthog_capture:failure"], 1);
  assert.equal(snapshot["internal_mirror_fetch:success"], 1);
});
