import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { env } = await import("../src/config/env");
  const { NamespacedCacheAdapter } = await import(
    "../src/lib/cache/namespaced-cache.adapter"
  );
  const { RedisCacheAdapter } = await import("../src/lib/cache/redis-cache.adapter");
  const {
    getSharedRedisClient,
    getSharedRedisStatus,
    resetSharedRedisStateForTests,
  } = await import("../src/lib/cache/shared-redis");
  const { namespaceRedisKey } = await import("../src/lib/cache/redis-key-namespace");
  const { checkDistributedRateLimit } = await import(
    "../src/lib/rate-limit/rate-limit.factory"
  );
  const { buildRateLimitPrefix, buildRateLimitSubject } = await import(
    "../src/lib/rate-limit/rate-limit.utils"
  );

  const redis = await waitForRedisClient(getSharedRedisClient, getSharedRedisStatus);
  const cache = new NamespacedCacheAdapter(new RedisCacheAdapter(redis));
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const cacheKey = `smoke:cache:${runId}`;
  const redisCacheKey = namespaceRedisKey(cacheKey);
  const rateLimitRule = {
    id: "smoke.redis.minute",
    windowSeconds: 60,
    maxRequests: 2,
    failureMode: "fail-closed" as const,
  };
  const rateLimitSubject = buildRateLimitSubject(["redis-smoke", runId]);
  const rateLimitKey = `${buildRateLimitPrefix(rateLimitRule.id)}:${rateLimitSubject}`;

  try {
    console.log("[redis-smoke] prefix", env.REDIS_KEY_PREFIX ?? "scholarx:v2:web");
    console.log("[redis-smoke] cache enabled", env.CACHE_ENABLED !== "false");
    console.log(
      "[redis-smoke] distributed limits enabled",
      env.DISTRIBUTED_RATE_LIMITS_ENABLED !== "false",
    );

    const miss = await cache.getJson(cacheKey);
    assert(miss === null, "Expected initial cache miss.");
    console.log("[redis-smoke] GET miss passed");

    await cache.setJson(cacheKey, { ok: true, runId }, 60);
    const hit = await cache.getJson<{ ok: boolean; runId: string }>(cacheKey);
    assert(hit?.ok === true && hit.runId === runId, "Expected cache hit payload.");
    console.log("[redis-smoke] SET + GET hit passed");

    const ttl = await redis.ttl(redisCacheKey);
    assert(ttl > 0 && ttl <= 60, `Expected positive TTL, got ${ttl}.`);
    console.log("[redis-smoke] TTL passed", ttl);

    await cache.delete(cacheKey);
    const deleted = await cache.getJson(cacheKey);
    assert(deleted === null, "Expected deleted cache key to miss.");
    console.log("[redis-smoke] DELETE passed");

    const firstLimit = await checkDistributedRateLimit(rateLimitRule, rateLimitSubject);
    const secondLimit = await checkDistributedRateLimit(rateLimitRule, rateLimitSubject);
    const thirdLimit = await checkDistributedRateLimit(rateLimitRule, rateLimitSubject);

    assert(firstLimit.source === "redis" && firstLimit.allowed, "Expected first limit check to pass via Redis.");
    assert(secondLimit.source === "redis" && secondLimit.allowed, "Expected second limit check to pass via Redis.");
    assert(
      thirdLimit.source === "redis" && !thirdLimit.allowed,
      "Expected third limit check to be denied via Redis.",
    );
    console.log("[redis-smoke] rate-limit EVAL/ZSET path passed");

    console.log("[redis-smoke] all checks passed");
  } finally {
    await redis.del(redisCacheKey, rateLimitKey);
    resetSharedRedisStateForTests();
  }
}

async function waitForRedisClient(
  getSharedRedisClient: typeof import("../src/lib/cache/shared-redis").getSharedRedisClient,
  getSharedRedisStatus: typeof import("../src/lib/cache/shared-redis").getSharedRedisStatus,
) {
  const startedAt = Date.now();
  const timeoutMs = 10_000;

  while (Date.now() - startedAt < timeoutMs) {
    const redis = getSharedRedisClient();
    if (redis) return redis;

    const status = getSharedRedisStatus();
    if (status.circuitOpen) {
      throw new Error(
        `[redis-smoke] Redis circuit is open. Last failure: ${status.lastFailureContext ?? "unknown"}`,
      );
    }

    await sleep(100);
  }

  throw new Error("[redis-smoke] Redis client was not ready within 10 seconds.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
