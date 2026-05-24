import assert from "node:assert/strict";
import test from "node:test";
import type { RedisClient } from "@/lib/cache/redis-cache.adapter";
import { RedisSlidingWindowRateLimiterAdapter } from "./redis-sliding-window-rate-limiter.adapter";

test("RedisSlidingWindowRateLimiterAdapter uses a namespaced Redis key", async () => {
  const calls: unknown[][] = [];
  const redis = {
    eval: async (...args: unknown[]) => {
      calls.push(args);
      return [1, 4, Date.now() + 60_000];
    },
  } as unknown as RedisClient;

  const adapter = new RedisSlidingWindowRateLimiterAdapter(redis);
  const result = await adapter.check(
    {
      id: "public.profile.ip.minute",
      windowSeconds: 60,
      maxRequests: 5,
      failureMode: "fail-open",
    },
    "subject-hash",
  );

  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 4);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.[2], "scholarx:v2:web:ratelimit:public.profile.ip.minute:subject-hash");
});
