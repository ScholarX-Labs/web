import assert from "node:assert/strict";
import test from "node:test";
import {
  emitCacheMetricEvent,
  getCacheMetricsSnapshot,
  resetCacheMetricsForTests,
} from "./cache-metrics";

test("cache metrics track counts by source operation and outcome", () => {
  resetCacheMetricsForTests();

  emitCacheMetricEvent({
    source: "cache",
    operation: "get",
    outcome: "hit",
    context: "courses:list",
  });
  emitCacheMetricEvent({
    source: "cache",
    operation: "get",
    outcome: "hit",
    context: "courses:list",
  });
  emitCacheMetricEvent({
    source: "rate-limit",
    operation: "check",
    outcome: "fallback",
    context: "admin.api",
  });

  const snapshot = getCacheMetricsSnapshot();

  assert.equal(snapshot.counts["cache:get:hit"], 2);
  assert.equal(snapshot.counts["rate-limit:check:fallback"], 1);
  assert.equal(snapshot.recentEvents.length, 3);
});

test("cache metrics keep only the most recent 200 events", () => {
  resetCacheMetricsForTests();

  for (let index = 0; index < 205; index += 1) {
    emitCacheMetricEvent({
      source: "cache",
      operation: "get",
      outcome: "miss",
      metadata: { index },
    });
  }

  const snapshot = getCacheMetricsSnapshot();

  assert.equal(snapshot.recentEvents.length, 200);
  assert.equal(snapshot.recentEvents[0]?.metadata?.index, 5);
  assert.equal(snapshot.recentEvents.at(-1)?.metadata?.index, 204);
});
