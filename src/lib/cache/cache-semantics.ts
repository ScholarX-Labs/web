import { randomUUID } from "node:crypto";
import type { CachePort } from "./cache.port";
import { markSharedRedisUnavailable } from "./shared-redis";

type EmptyObject = Record<never, never>;

export type PresenceCachedValue<TValue, TExtra extends object = EmptyObject> =
  | ({ found: true } & TExtra & { value: TValue })
  | { found: false };

export interface TimestampedCachedValue<TValue> {
  value: TValue;
  fetchedAt: number;
}

export function resolvePresenceCacheTtl(input: {
  found: boolean;
  ttlSeconds: number;
  negativeTtlSeconds: number;
}): number {
  return input.found ? input.ttlSeconds : input.negativeTtlSeconds;
}

export function isTimestampedValueFresh(
  entry: TimestampedCachedValue<unknown>,
  ttlMs: number,
): boolean {
  return Date.now() - entry.fetchedAt < ttlMs;
}

export function isTimestampedValueWithinStaleWindow(
  entry: TimestampedCachedValue<unknown>,
  staleTtlMs: number,
): boolean {
  return Date.now() - entry.fetchedAt < staleTtlMs;
}

export async function invalidateCacheKeys(
  cache: CachePort,
  input: {
    keys: Array<string | null | undefined>;
    context: string;
  },
): Promise<void> {
  const keys = input.keys.filter((key): key is string => Boolean(key));
  if (keys.length === 0) return;

  const results = await Promise.allSettled(keys.map((key) => cache.delete(key)));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      markSharedRedisUnavailable(
        `${input.context}:${keys[index]}`,
        result.reason,
      );
    }
  });
}

export async function bumpVersionCacheKeys(
  cache: CachePort,
  input: {
    keys: Array<string | null | undefined>;
    ttlSeconds: number;
    context: string;
  },
): Promise<void> {
  const keys = input.keys.filter((key): key is string => Boolean(key));
  if (keys.length === 0) return;

  const results = await Promise.allSettled(
    keys.map((key) => cache.setJson(key, randomUUID(), input.ttlSeconds)),
  );
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      markSharedRedisUnavailable(
        `${input.context}:${keys[index]}`,
        result.reason,
      );
    }
  });
}
