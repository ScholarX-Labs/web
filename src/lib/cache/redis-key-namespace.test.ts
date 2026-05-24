import assert from "node:assert/strict";
import test from "node:test";
import { NamespacedCacheAdapter } from "./namespaced-cache.adapter";
import { getRedisKeyPrefix, namespaceRedisKey } from "./redis-key-namespace";
import type { CachePort } from "./cache.port";

test("getRedisKeyPrefix uses the V2 web namespace by default", () => {
  assert.equal(getRedisKeyPrefix(), "scholarx:v2:web");
});

test("namespaceRedisKey prefixes domain cache keys", () => {
  assert.equal(
    namespaceRedisKey("courses:public:list:version"),
    "scholarx:v2:web:courses:public:list:version",
  );
});

test("NamespacedCacheAdapter scopes every cache operation", async () => {
  const operations: string[] = [];
  const inner: CachePort = {
    getJson: async (key) => {
      operations.push(`get:${key}`);
      return null;
    },
    setJson: async (key) => {
      operations.push(`set:${key}`);
    },
    delete: async (key) => {
      operations.push(`delete:${key}`);
    },
  };

  const cache = new NamespacedCacheAdapter(inner);

  await cache.getJson("profile:john");
  await cache.setJson("profile:john", { ok: true }, 60);
  await cache.delete("profile:john");

  assert.deepEqual(operations, [
    "get:scholarx:v2:web:profile:john",
    "set:scholarx:v2:web:profile:john",
    "delete:scholarx:v2:web:profile:john",
  ]);
});
