import Redis, { Cluster, type RedisOptions } from "ioredis";
import { env } from "@/config/env";
import {
  emitCacheMetricEvent,
  getCacheMetricsSnapshot,
} from "./cache-metrics";
import type { RedisClient } from "./redis-cache.adapter";
import { isUpstashRedisConfigured } from "./upstash-redis";

const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;

let redis: RedisClient | null = null;
let redisDown = false;
let redisDownSince = 0;
let consecutiveFailures = 0;
let lastFailureContext: string | null = null;
let lastFailureAt: string | null = null;

export interface SharedRedisStatus {
  enabled: boolean;
  cacheEnabled: boolean;
  configured: boolean;
  /** "upstash" = Upstash REST; "azure" = Azure Cache for Redis; "generic" = REDIS_URL/REDIS_HOST; "unconfigured" = no Redis vars set */
  provider: "upstash" | "azure" | "generic" | "unconfigured";
  host: string | null;
  port: number | null;
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

function closeRedisClient(client: RedisClient | null): void {
  if (!client) return;
  try {
    client.disconnect();
  } catch {
    // Best-effort cleanup. The caller already moved the process to fallback.
  }
}

function isRedisClientReady(client: RedisClient): boolean {
  return client.status === "ready";
}

export function isSharedRedisEnabled(): boolean {
  return isSharedRedisConfigured();
}

export function isSharedCacheEnabled(): boolean {
  return env.CACHE_ENABLED !== "false";
}

/**
 * Returns true when any supported Redis backend is configured.
 * Provider priority (for selection, not just detection):
 *   1. Upstash REST  (UPSTASH_REDIS_KV_REST_API_URL + UPSTASH_REDIS_KV_REST_API_TOKEN)
 *   2. ioredis URL   (REDIS_URL)
 *   3. ioredis Azure (AZURE_REDIS_HOST)
 *   4. ioredis host  (REDIS_HOST)
 */
export function isSharedRedisConfigured(): boolean {
  return (
    isUpstashRedisConfigured() ||
    Boolean(env.REDIS_URL || env.AZURE_REDIS_HOST || env.REDIS_HOST)
  );
}

/** Returns true when the Upstash REST client is the active provider. */
export function isUpstashPrimary(): boolean {
  return isUpstashRedisConfigured();
}

function getRedisProvider(): SharedRedisStatus["provider"] {
  if (isUpstashRedisConfigured()) return "upstash";
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

function numberFromEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
    connectTimeout: numberFromEnv(env.REDIS_CONNECT_TIMEOUT_MS, 10_000),
    commandTimeout: numberFromEnv(env.REDIS_COMMAND_TIMEOUT_MS, 5_000),
    keepAlive: 30_000,
    maxRetriesPerRequest: numberFromEnv(env.REDIS_MAX_RETRIES_PER_REQUEST, 2),
    enableReadyCheck: true,
    enableOfflineQueue: true,
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
  const failedClient = redis;
  redisDown = true;
  redisDownSince = Date.now();
  redis = null;
  closeRedisClient(failedClient);
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

  if (!isRedisClientReady(redis)) {
    emitCacheMetricEvent({
      source: "redis",
      operation: "availability",
      outcome: "fallback",
      context: "redis-not-ready",
      metadata: { status: redis.status },
    });
    return null;
  }

  return redis;
}

function createSharedRedisClient(): RedisClient {
  const registerClient = (client: RedisClient): RedisClient => {
    client.on("ready", () => {
      markSharedRedisHealthy("redis:ready");
    });
    client.on("error", (error) => {
      markSharedRedisUnavailable("redis:error", error);
    });
    client.on("end", () => {
      if (redis === client) {
        redis = null;
      }
    });
    return client;
  };

  if (env.AZURE_REDIS_CLUSTER === "true") {
    const host = getRedisHost();
    const port = getRedisPort();
    return registerClient(
      new Cluster(
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
      ),
    );
  }

  if (env.REDIS_URL) {
    const parsed = new URL(env.REDIS_URL);
    return registerClient(
      new Redis(
        env.REDIS_URL,
        createRedisOptions(parsed.hostname, Number(parsed.port || "6379")),
      ),
    );
  }

  const host = getRedisHost();
  const port = getRedisPort();
  return registerClient(new Redis(createRedisOptions(host, port)));
}

export function getSharedRedisStatus(): SharedRedisStatus {
  const provider = getRedisProvider();
  // Upstash REST has no TCP host/port to expose — surface a stable sentinel.
  const host =
    provider === "upstash"
      ? (env.UPSTASH_REDIS_KV_REST_API_URL?.replace(/\/+$/, "") ?? "upstash-rest-api")
      : isSharedRedisConfigured()
        ? getRedisHost()
        : null;
  const port = provider === "upstash" ? null : isSharedRedisConfigured() ? getRedisPort() : null;

  return {
    enabled: isSharedRedisEnabled(),
    cacheEnabled: isSharedCacheEnabled(),
    configured: isSharedRedisConfigured(),
    provider,
    host,
    port,
    circuitOpen: redisDown && isCircuitOpen(),
    circuitCooldownMs: CIRCUIT_BREAKER_COOLDOWN_MS,
    consecutiveFailures,
    lastFailureContext,
    lastFailureAt,
    metrics: getCacheMetricsSnapshot(),
  };
}

export function resetSharedRedisStateForTests(): void {
  closeRedisClient(redis);
  redis = null;
  redisDown = false;
  redisDownSince = 0;
  consecutiveFailures = 0;
  lastFailureContext = null;
  lastFailureAt = null;
}
