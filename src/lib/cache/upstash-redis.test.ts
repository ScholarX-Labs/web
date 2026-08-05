import assert from "node:assert/strict";
import test from "node:test";
import {
  getUpstashRedis,
  isUpstashRedisConfigured,
  resetUpstashRedisForTests,
} from "./upstash-redis";

test("upstash redis returns null when not configured", () => {
  resetUpstashRedisForTests();

  if (isUpstashRedisConfigured()) {
    assert.ok(getUpstashRedis());
  } else {
    assert.equal(getUpstashRedis(), null);
  }
});

test("upstash redis reset clears the cached client", () => {
  resetUpstashRedisForTests();

  if (isUpstashRedisConfigured()) {
    const first = getUpstashRedis();
    resetUpstashRedisForTests();
    const second = getUpstashRedis();
    assert.notEqual(first, second);
  }
});
