import { lookup } from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";
import Redis, { Cluster, type RedisOptions } from "ioredis";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

type CheckResult = {
  name: string;
  ok: boolean;
  durationMs: number;
  detail?: string;
};

type RedisTarget = {
  host: string;
  port: number;
  password?: string;
  tls: boolean;
  cluster: boolean;
  prefix: string;
  connectTimeoutMs: number;
  commandTimeoutMs: number;
};

function now(): number {
  return Date.now();
}

function duration(startedAt: number): number {
  return Date.now() - startedAt;
}

function maskBoolean(value: unknown): string {
  return value ? "set" : "missing";
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function targetFromEnv(env: typeof import("../src/config/env").env): RedisTarget {
  if (env.REDIS_URL) {
    const parsed = new URL(env.REDIS_URL);
    const tlsEnabled = parsed.protocol === "rediss:";
    return {
      host: parsed.hostname,
      port: Number(parsed.port || (tlsEnabled ? "6380" : "6379")),
      password: parsed.password || undefined,
      tls: tlsEnabled,
      cluster: env.AZURE_REDIS_CLUSTER === "true",
      prefix: env.REDIS_KEY_PREFIX ?? "scholarx:v2:web",
      connectTimeoutMs: readPositiveInt(env.REDIS_CONNECT_TIMEOUT_MS, 10_000),
      commandTimeoutMs: readPositiveInt(env.REDIS_COMMAND_TIMEOUT_MS, 5_000),
    };
  }

  const host = env.AZURE_REDIS_HOST ?? env.REDIS_HOST;
  if (!host) {
    throw new Error("No Redis host configured.");
  }

  const port = Number(env.AZURE_REDIS_PORT ?? env.REDIS_PORT ?? "6379");
  const tlsEnabled =
    env.AZURE_REDIS_TLS === "true" ||
    Boolean(env.AZURE_REDIS_HOST) ||
    port === 6380;

  return {
    host,
    port,
    password: env.AZURE_REDIS_KEY ?? env.REDIS_PASSWORD,
    tls: tlsEnabled,
    cluster: env.AZURE_REDIS_CLUSTER === "true",
    prefix: env.REDIS_KEY_PREFIX ?? "scholarx:v2:web",
    connectTimeoutMs: readPositiveInt(env.REDIS_CONNECT_TIMEOUT_MS, 10_000),
    commandTimeoutMs: readPositiveInt(env.REDIS_COMMAND_TIMEOUT_MS, 5_000),
  };
}

async function runCheck(
  name: string,
  check: () => Promise<string | undefined>,
): Promise<CheckResult> {
  const startedAt = now();
  try {
    const detail = await check();
    return { name, ok: true, durationMs: duration(startedAt), detail };
  } catch (error) {
    return {
      name,
      ok: false,
      durationMs: duration(startedAt),
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkDns(target: RedisTarget): Promise<string> {
  const records = await lookup(target.host, { all: true });
  return records.map((record) => `${record.address}/ipv${record.family}`).join(", ");
}

async function checkTcp(target: RedisTarget): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host: target.host, port: target.port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`TCP connect timed out after ${target.connectTimeoutMs}ms`));
    }, target.connectTimeoutMs);

    socket.once("connect", () => {
      clearTimeout(timer);
      socket.end();
      resolve();
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });

  return `${target.host}:${target.port}`;
}

async function checkTls(target: RedisTarget): Promise<string | undefined> {
  if (!target.tls) return "skipped; TLS disabled";

  const certificate = await new Promise<tls.PeerCertificate>((resolve, reject) => {
    const socket = tls.connect({
      host: target.host,
      port: target.port,
      servername: target.host,
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`TLS handshake timed out after ${target.connectTimeoutMs}ms`));
    }, target.connectTimeoutMs);

    socket.once("secureConnect", () => {
      clearTimeout(timer);
      const peerCertificate = socket.getPeerCertificate();
      socket.end();
      resolve(peerCertificate);
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });

  return `authorized; subject=${certificate.subject?.CN ?? "unknown"}`;
}

function redisOptions(target: RedisTarget): RedisOptions {
  return {
    host: target.host,
    port: target.port,
    password: target.password,
    tls: target.tls
      ? {
          servername: target.host,
          minVersion: "TLSv1.2",
        }
      : undefined,
    lazyConnect: true,
    enableOfflineQueue: false,
    enableReadyCheck: true,
    connectTimeout: target.connectTimeoutMs,
    commandTimeout: target.commandTimeoutMs,
    maxRetriesPerRequest: 0,
    retryStrategy() {
      return null;
    },
  };
}

async function createDiagnosticRedisClient(target: RedisTarget): Promise<Redis | Cluster> {
  if (target.cluster) {
    const cluster = new Cluster([{ host: target.host, port: target.port }], {
      lazyConnect: true,
      redisOptions: redisOptions(target),
      enableReadyCheck: true,
      maxRedirections: 4,
      clusterRetryStrategy() {
        return null;
      },
    });
    cluster.on("error", () => undefined);
    await cluster.connect();
    return cluster;
  }

  const redis = new Redis(redisOptions(target));
  redis.on("error", () => undefined);
  await redis.connect();
  return redis;
}

async function checkRedisCommands(target: RedisTarget): Promise<string> {
  const client = await createDiagnosticRedisClient(target);
  const key = `${target.prefix}:diagnose:${Date.now()}:${Math.random()
    .toString(16)
    .slice(2)}`;

  try {
    const ping = await client.ping();
    if (ping !== "PONG") {
      throw new Error(`Unexpected PING response: ${ping}`);
    }

    await client.set(key, "ok", "EX", 30);
    const value = await client.get(key);
    if (value !== "ok") {
      throw new Error(`Unexpected GET response for diagnostic key: ${value}`);
    }

    await client.del(key);
    return `PING/SET/GET/DEL passed; diagnostic key=${key}`;
  } finally {
    client.disconnect();
  }
}

async function main() {
  const { env } = await import("../src/config/env");
  const target = targetFromEnv(env);

  console.log("[redis-diagnose] sanitized config", {
    nodeEnv: process.env.NODE_ENV ?? "unset",
    cacheEnabled: env.CACHE_ENABLED !== "false",
    distributedRateLimitsEnabled: env.DISTRIBUTED_RATE_LIMITS_ENABLED !== "false",
    host: target.host,
    port: target.port,
    tls: target.tls,
    cluster: target.cluster,
    prefix: target.prefix,
    password: maskBoolean(target.password),
    connectTimeoutMs: target.connectTimeoutMs,
    commandTimeoutMs: target.commandTimeoutMs,
  });

  const checks = [
    await runCheck("dns", () => checkDns(target)),
    await runCheck("tcp", () => checkTcp(target)),
    await runCheck("tls", () => checkTls(target)),
    await runCheck("redis-commands", () => checkRedisCommands(target)),
  ];

  for (const check of checks) {
    const status = check.ok ? "PASS" : "FAIL";
    console.log(
      `[redis-diagnose] ${status} ${check.name} ${check.durationMs}ms${
        check.detail ? ` - ${check.detail}` : ""
      }`,
    );
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[redis-diagnose] fatal", error instanceof Error ? error.message : error);
  process.exit(1);
});
