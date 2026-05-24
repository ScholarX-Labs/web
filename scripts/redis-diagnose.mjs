import { lookup } from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";
import Redis, { Cluster } from "ioredis";

function readEnv(key) {
  const value = process.env[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readPositiveInt(key, fallback) {
  const value = readEnv(key);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function targetFromEnv() {
  const redisUrl = readEnv("REDIS_URL");
  if (redisUrl) {
    const parsed = new URL(redisUrl);
    const tlsEnabled = parsed.protocol === "rediss:";
    return {
      host: parsed.hostname,
      port: Number(parsed.port || (tlsEnabled ? "6380" : "6379")),
      password: parsed.password || undefined,
      tls: tlsEnabled,
      cluster: readEnv("AZURE_REDIS_CLUSTER") === "true",
      prefix: readEnv("REDIS_KEY_PREFIX") ?? "scholarx:v2:web",
      connectTimeoutMs: readPositiveInt("REDIS_CONNECT_TIMEOUT_MS", 10_000),
      commandTimeoutMs: readPositiveInt("REDIS_COMMAND_TIMEOUT_MS", 5_000),
    };
  }

  const host = readEnv("AZURE_REDIS_HOST") ?? readEnv("REDIS_HOST");
  if (!host) throw new Error("No Redis host configured.");

  const port = Number(readEnv("AZURE_REDIS_PORT") ?? readEnv("REDIS_PORT") ?? "6379");
  return {
    host,
    port,
    password: readEnv("AZURE_REDIS_KEY") ?? readEnv("REDIS_PASSWORD"),
    tls: readEnv("AZURE_REDIS_TLS") === "true" || Boolean(readEnv("AZURE_REDIS_HOST")) || port === 6380,
    cluster: readEnv("AZURE_REDIS_CLUSTER") === "true",
    prefix: readEnv("REDIS_KEY_PREFIX") ?? "scholarx:v2:web",
    connectTimeoutMs: readPositiveInt("REDIS_CONNECT_TIMEOUT_MS", 10_000),
    commandTimeoutMs: readPositiveInt("REDIS_COMMAND_TIMEOUT_MS", 5_000),
  };
}

async function runCheck(name, check) {
  const startedAt = Date.now();
  try {
    const detail = await check();
    return { name, ok: true, durationMs: Date.now() - startedAt, detail };
  } catch (error) {
    return {
      name,
      ok: false,
      durationMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkDns(target) {
  const records = await lookup(target.host, { all: true });
  return records.map((record) => `${record.address}/ipv${record.family}`).join(", ");
}

async function checkTcp(target) {
  await new Promise((resolve, reject) => {
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

async function checkTls(target) {
  if (!target.tls) return "skipped; TLS disabled";

  const certificate = await new Promise((resolve, reject) => {
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

function redisOptions(target) {
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

async function createRedisClient(target) {
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

async function checkRedisCommands(target) {
  const client = await createRedisClient(target);
  const key = `${target.prefix}:diagnose:${Date.now()}:${Math.random().toString(16).slice(2)}`;

  try {
    const ping = await client.ping();
    if (ping !== "PONG") throw new Error(`Unexpected PING response: ${ping}`);

    await client.set(key, "ok", "EX", 30);
    const value = await client.get(key);
    if (value !== "ok") throw new Error(`Unexpected GET response for diagnostic key: ${value}`);

    await client.del(key);
    return `PING/SET/GET/DEL passed; diagnostic key=${key}`;
  } finally {
    client.disconnect();
  }
}

async function main() {
  const target = targetFromEnv();
  console.log("[redis-diagnose] sanitized config", {
    nodeEnv: process.env.NODE_ENV ?? "unset",
    cacheEnabled: readEnv("CACHE_ENABLED") !== "false",
    distributedRateLimitsEnabled: readEnv("DISTRIBUTED_RATE_LIMITS_ENABLED") !== "false",
    host: target.host,
    port: target.port,
    tls: target.tls,
    cluster: target.cluster,
    prefix: target.prefix,
    password: target.password ? "set" : "missing",
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
    console.log(
      `[redis-diagnose] ${check.ok ? "PASS" : "FAIL"} ${check.name} ${check.durationMs}ms${
        check.detail ? ` - ${check.detail}` : ""
      }`,
    );
  }

  if (checks.some((check) => !check.ok)) process.exitCode = 1;
}

main().catch((error) => {
  console.error("[redis-diagnose] fatal", error instanceof Error ? error.message : error);
  process.exit(1);
});
