import { createServerCache } from "@/lib/cache/cache.factory";
import { cachePolicy } from "@/lib/cache/cache-policy";
import {
  isTimestampedValueFresh,
  isTimestampedValueWithinStaleWindow,
  type TimestampedCachedValue,
} from "@/lib/cache/cache-semantics";
import { markSharedRedisUnavailable } from "@/lib/cache/shared-redis";
import type { SearchResult } from "./types";

type CachedValue<T> = TimestampedCachedValue<T>;

const cache = createServerCache();

export function getOpportunityDetailCacheKey(id: string, lang: "en" | "ar"): string {
  return cachePolicy.opportunities.detail.key(id, lang);
}

export function getOpportunitySearchCacheKey(query: string): string {
  return cachePolicy.opportunities.search.key(query);
}

async function getCachedValue<T>(key: string): Promise<CachedValue<T> | null> {
  try {
    return await cache.getJson<CachedValue<T>>(key);
  } catch (error) {
    markSharedRedisUnavailable(`opportunity-cache-get:${key}`, error);
    return null;
  }
}

async function setCachedValue<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  try {
    await cache.setJson<CachedValue<T>>(key, { value, fetchedAt: Date.now() }, ttlSeconds);
  } catch (error) {
    markSharedRedisUnavailable(`opportunity-cache-set:${key}`, error);
  }
}

export async function getFreshOpportunityDetail(
  id: string,
  lang: "en" | "ar",
): Promise<SearchResult | null | undefined> {
  const cached = await getCachedValue<SearchResult | null>(
    getOpportunityDetailCacheKey(id, lang),
  );

  if (!cached) return undefined;

  if (cached.value === null) {
    return isTimestampedValueFresh(cached, cachePolicy.opportunities.notFound.freshTtlMs)
      ? null
      : undefined;
  }

  return isTimestampedValueFresh(cached, cachePolicy.opportunities.detail.freshTtlMs)
    ? cached.value
    : undefined;
}

export async function getStaleOpportunityDetail(
  id: string,
  lang: "en" | "ar",
): Promise<SearchResult | null> {
  const cached = await getCachedValue<SearchResult | null>(
    getOpportunityDetailCacheKey(id, lang),
  );

  if (!cached) return null;

  if (cached.value === null) {
    return isTimestampedValueWithinStaleWindow(
      cached,
      cachePolicy.opportunities.notFound.staleTtlMs,
    )
      ? null
      : null;
  }

  return isTimestampedValueWithinStaleWindow(
    cached,
    cachePolicy.opportunities.detail.staleTtlMs,
  )
    ? cached.value
    : null;
}

export async function setOpportunityDetail(
  id: string,
  lang: "en" | "ar",
  value: SearchResult | null,
): Promise<void> {
  await setCachedValue(
    getOpportunityDetailCacheKey(id, lang),
    value,
    value === null
      ? cachePolicy.opportunities.notFound.cacheTtlSeconds
      : cachePolicy.opportunities.detail.cacheTtlSeconds,
  );
}

export async function getFreshOpportunitySearch(
  query: string,
): Promise<SearchResult[] | undefined> {
  const cached = await getCachedValue<SearchResult[]>(
    getOpportunitySearchCacheKey(query),
  );

  if (!cached) return undefined;
  return isTimestampedValueFresh(cached, cachePolicy.opportunities.search.freshTtlMs)
    ? cached.value
    : undefined;
}

export async function getStaleOpportunitySearch(
  query: string,
): Promise<SearchResult[] | null> {
  const cached = await getCachedValue<SearchResult[]>(
    getOpportunitySearchCacheKey(query),
  );

  if (!cached) return null;
  return isTimestampedValueWithinStaleWindow(
    cached,
    cachePolicy.opportunities.search.staleTtlMs,
  )
    ? cached.value
    : null;
}

export async function setOpportunitySearch(
  query: string,
  value: SearchResult[],
): Promise<void> {
  await setCachedValue(
    getOpportunitySearchCacheKey(query),
    value,
    cachePolicy.opportunities.search.cacheTtlSeconds,
  );
}
