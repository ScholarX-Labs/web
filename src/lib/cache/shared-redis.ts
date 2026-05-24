import Redis, { Cluster, type RedisOptions } from "ioredis";
import { env } from "@/config/env";
import {
  emitCacheMetricEvent,
  getCacheMetricsSnapshot,
} from "./cache-metrics";
import type { RedisClient } from "./redis-cache.adapter";

const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;

let redis: RedisClient | null = null;
let redisDown = false;
let redisDownSince = 0;
let consecutiveFailures = 0;
let lastFailureContext: string | null = null;
let lastFailureAt: string | null = null;

export interface SharedRedisStatus {
  enabled: boolean;
  configured: boolean;
  provider: "azure" | "generic" | "unconfigured";
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
  return env.CACHE_ENABLED !== "false" && isSharedRedisConfigured();
}

export function isSharedRedisConfigured(): boolean {
  return Boolean(env.REDIS_URL || env.AZURE_REDIS_HOST || env.REDIS_HOST);
}

function getRedisProvider(): SharedRedisStatus["provider"] {
  if (env.AZURE_REDIS_HOST) return "azure";
  if (env.REDIS_URL || env.REDIS_HOST) return "generic";
  return "unconfigured";
}

function getRedisHost(): string {
  return env.AZURE_REDIS_HOST ?? env.REDIS_HOST ?? "localhost";
}

function getRedisPort(): number {
  return Number(env.AZURE_REDIS_PORT ?? env.REDIS_PORT ?? "6379");
}

function getRedisPassword(): string | undefined {
  return env.AZURE_REDIS_KEY ?? env.REDIS_PASSWORD;
}

function shouldUseTls(host: string, port: number): boolean {
  if (env.AZURE_REDIS_TLS === "true") return true;
  if (env.AZURE_REDIS_TLS === "false") return false;
  return (
    Boolean(env.AZURE_REDIS_HOST) ||
    port === 6380 ||
    Boolean(env.REDIS_URL?.startsWith("rediss://"))
  );
}

function createRedisOptions(host: string, port: number): RedisOptions {
  const useTls = shouldUseTls(host, port);

  return {
    host,
    port,
    password: getRedisPassword(),
    tls: useTls
      ? {
          servername: host,
          minVersion: "TLSv1.2",
        }
      : undefined,
    connectionName: `scholarx-v2-web-${process.env.NODE_ENV ?? "development"}`,
    connectTimeout: 10_000,
    commandTimeout: 5_000,
    keepAlive: 30_000,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 100, 2_000);
    },
    reconnectOnError(error) {
      const message = error.message.toLowerCase();
      return message.includes("readonly") || message.includes("connection");
    },
  };
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

export function getSharedRedisClient(): RedisClient | null {
  if (!isSharedRedisEnabled() || isCircuitOpen()) {
    return null;
  }

  if (!redis) {
    redis = createSharedRedisClient();
  }

  return redis;
}

function createSharedRedisClient(): RedisClient {
  if (env.AZURE_REDIS_CLUSTER === "true") {
    const host = getRedisHost();
    const port = getRedisPort();
    return new Cluster(
      [{ host, port }],
      {
        redisOptions: createRedisOptions(host, port),
        enableReadyCheck: true,
        maxRedirections: 16,
        retryDelayOnFailover: 100,
        retryDelayOnClusterDown: 300,
        clusterRetryStrategy(times) {
          if (times > 5) return null;
          return Math.min(times * 100, 2_000);
        },
      },
    );
  }

  if (env.REDIS_URL) {
    const parsed = new URL(env.REDIS_URL);
    return new Redis(env.REDIS_URL, createRedisOptions(parsed.hostname, Number(parsed.port || "6379")));
  }

  const host = getRedisHost();
  const port = getRedisPort();
  return new Redis(createRedisOptions(host, port));
}

export function getSharedRedisStatus(): SharedRedisStatus {
  return {
    enabled: isSharedRedisEnabled(),
    configured: isSharedRedisConfigured(),
    provider: getRedisProvider(),
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
