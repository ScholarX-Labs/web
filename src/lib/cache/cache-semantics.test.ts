import assert from "node:assert/strict";
import test from "node:test";
import {
  bumpVersionCacheKeys,
  invalidateCacheKeys,
  isTimestampedValueFresh,
  isTimestampedValueWithinStaleWindow,
  resolvePresenceCacheTtl,
} from "./cache-semantics";

test("resolvePresenceCacheTtl uses the negative ttl for negative entries", () => {
  assert.equal(
    resolvePresenceCacheTtl({
      found: false,
      ttlSeconds: 60,
      negativeTtlSeconds: 30,
    }),
    30,
  );
});

test("resolvePresenceCacheTtl uses the positive ttl for positive entries", () => {
  assert.equal(
    resolvePresenceCacheTtl({
      found: true,
      ttlSeconds: 60,
      negativeTtlSeconds: 30,
    }),
    60,
  );
});

test("invalidateCacheKeys deletes only truthy keys", async () => {
  const deleted: string[] = [];

  await invalidateCacheKeys(
    {
      delete: async (key: string) => {
        deleted.push(key);
      },
      getJson: async () => null,
      setJson: async () => undefined,
    },
    {
      keys: ["alpha", undefined, null, "beta"],
      context: "test-cache",
    },
  );

  assert.deepEqual(deleted, ["alpha", "beta"]);
});

test("isTimestampedValueFresh returns true when inside ttl", () => {
  assert.equal(
    isTimestampedValueFresh(
      { value: "x", fetchedAt: Date.now() - 1000 },
      5_000,
    ),
    true,
  );
});

test("isTimestampedValueWithinStaleWindow returns false when expired", () => {
  assert.equal(
    isTimestampedValueWithinStaleWindow(
      { value: "x", fetchedAt: Date.now() - 10_000 },
      5_000,
    ),
    false,
  );
});

test("bumpVersionCacheKeys writes version values only for truthy keys", async () => {
  const writes: Array<{ key: string; ttlSeconds: number }> = [];

  await bumpVersionCacheKeys(
    {
      delete: async () => undefined,
      getJson: async () => null,
      setJson: async <T>(key: string, _value: T, ttlSeconds: number) => {
        writes.push({ key, ttlSeconds });
      },
    },
    {
      keys: ["alpha", undefined, "beta"],
      ttlSeconds: 42,
      context: "test-version-bump",
    },
  );

  assert.deepEqual(writes, [
    { key: "alpha", ttlSeconds: 42 },
    { key: "beta", ttlSeconds: 42 },
  ]);
});
