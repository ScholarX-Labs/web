import { Redis } from "@upstash/redis";
import { env } from "@/config/env";
import {
  emitCacheMetricEvent,
  getCacheMetricsSnapshot,
} from "./cache-metrics";

const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;

let redis: Redis | null = null;
let redisDown = false;
let redisDownSince = 0;
let consecutiveFailures = 0;
let lastFailureContext: string | null = null;
let lastFailureAt: string | null = null;

export interface SharedRedisStatus {
  enabled: boolean;
  circuitOpen: boolean;
  circuitCooldownMs: number;
  consecutiveFailures: number;
  lastFailureContext: string | null;
  lastFailureAt: string | null;
  metrics: ReturnType<typeof getCacheMetricsSnapshot>;
}

function isCircuitOpen(): boolean {
  if (!redisDown) return false;
  if (Date.now() - redisDownSince >= CIRCUIT_BREAKER_COOLDOWN_MS) {
    redisDown = false;
    emitCacheMetricEvent({
      source: "redis",
      operation: "circuit",
      outcome: "circuit_closed",
      metadata: {
        cooldownMs: CIRCUIT_BREAKER_COOLDOWN_MS,
      },
    });
    return false;
  }
  return true;
}

export function isSharedRedisEnabled(): boolean {
  return (
    env.CACHE_ENABLED !== "false" &&
    !!env.UPSTASH_REDIS_URL &&
    !!env.UPSTASH_REDIS_TOKEN
  );
}

export function markSharedRedisUnavailable(context: string, error?: unknown): void {
  const wasOpen = redisDown;
  redisDown = true;
  redisDownSince = Date.now();
  redis = null;
  consecutiveFailures += 1;
  lastFailureContext = context;
  lastFailureAt = new Date(redisDownSince).toISOString();

  emitCacheMetricEvent({
    source: "redis",
    operation: "availability",
    outcome: "error",
    context,
    metadata: {
      consecutiveFailures,
      hadError: Boolean(error),
    },
  });

  if (!wasOpen) {
    emitCacheMetricEvent({
      source: "redis",
      operation: "circuit",
      outcome: "circuit_open",
      context,
      metadata: {
        cooldownMs: CIRCUIT_BREAKER_COOLDOWN_MS,
      },
    });
  }

  console.error(`[redis] unavailable during ${context}; circuit open for 30s`, error);
}

export function markSharedRedisHealthy(context: string): void {
  if (consecutiveFailures > 0 || redisDown) {
    emitCacheMetricEvent({
      source: "redis",
      operation: "availability",
      outcome: "hit",
      context,
    });
  }

  consecutiveFailures = 0;
  if (!redisDown) {
    return;
  }

  redisDown = false;
  redisDownSince = 0;
  emitCacheMetricEvent({
    source: "redis",
    operation: "circuit",
    outcome: "circuit_closed",
    context,
  });
}

export function getSharedRedisClient(): Redis | null {
  if (!isSharedRedisEnabled() || isCircuitOpen()) {
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_URL!,
      token: env.UPSTASH_REDIS_TOKEN!,
    });
  }

  return redis;
}

export function getSharedRedisStatus(): SharedRedisStatus {
  return {
    enabled: isSharedRedisEnabled(),
    circuitOpen: redisDown && isCircuitOpen(),
    circuitCooldownMs: CIRCUIT_BREAKER_COOLDOWN_MS,
    consecutiveFailures,
    lastFailureContext,
    lastFailureAt,
    metrics: getCacheMetricsSnapshot(),
  };
}

export function resetSharedRedisStateForTests(): void {
  redis = null;
  redisDown = false;
  redisDownSince = 0;
  consecutiveFailures = 0;
  lastFailureContext = null;
  lastFailureAt = null;
}
