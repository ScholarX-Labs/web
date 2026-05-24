import assert from "node:assert/strict";
import test from "node:test";
import {
  getSharedRedisStatus,
  markSharedRedisHealthy,
  markSharedRedisUnavailable,
  resetSharedRedisStateForTests,
} from "./shared-redis";
import { resetCacheMetricsForTests } from "./cache-metrics";

test("shared redis status tracks failure context and open circuit state", () => {
  resetSharedRedisStateForTests();
  resetCacheMetricsForTests();

  markSharedRedisUnavailable("cache:get:courses", new Error("boom"));

  const status = getSharedRedisStatus();
  assert.equal(status.circuitOpen, true);
  assert.equal(status.consecutiveFailures, 1);
  assert.equal(status.lastFailureContext, "cache:get:courses");
  assert.equal(status.metrics.counts["redis:circuit:circuit_open"], 1);
});

test("shared redis status closes the circuit after a healthy signal", () => {
  resetSharedRedisStateForTests();
  resetCacheMetricsForTests();

  markSharedRedisUnavailable("cache:get:profiles", new Error("boom"));
  markSharedRedisHealthy("cache:set:profiles");

  const status = getSharedRedisStatus();
  assert.equal(status.circuitOpen, false);
  assert.equal(status.consecutiveFailures, 0);
  assert.equal(status.metrics.counts["redis:circuit:circuit_closed"], 1);
});
