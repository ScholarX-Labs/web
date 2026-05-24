import assert from "node:assert/strict";
import test from "node:test";
import type { RedisClient } from "./redis-cache.adapter";
import { RedisCacheAdapter } from "./redis-cache.adapter";

test("RedisCacheAdapter does not send get commands when client is not ready", async () => {
  let calls = 0;
  const redis = {
    status: "connecting",
    get: async () => {
      calls += 1;
      return null;
    },
  } as unknown as RedisClient;

  const cache = new RedisCacheAdapter(redis);

  assert.equal(await cache.getJson("cache:key"), null);
  assert.equal(calls, 0);
});

test("RedisCacheAdapter does not send write commands when client is not ready", async () => {
  const calls: string[] = [];
  const redis = {
    status: "reconnecting",
    set: async () => {
      calls.push("set");
    },
    del: async () => {
      calls.push("del");
    },
  } as unknown as RedisClient;

  const cache = new RedisCacheAdapter(redis);

  await cache.setJson("cache:key", { ok: true }, 60);
  await cache.delete("cache:key");

  assert.deepEqual(calls, []);
});
