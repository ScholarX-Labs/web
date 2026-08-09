/**
 * upstash-diagnose.mjs
 *
 * HTTP-based connectivity diagnostic for Upstash Redis REST.
 * No TCP/TLS sockets needed — safe to run on Vercel and other
 * serverless environments.
 *
 * Usage:
 *   node scripts/upstash-diagnose.mjs
 *   pnpm upstash:diagnose
 *
 * Required env vars:
 *   UPSTASH_REDIS_KV_REST_API_URL   — https://... endpoint from Upstash console
 *   UPSTASH_REDIS_KV_REST_API_TOKEN — read-write token
 *
 * Optional env vars (inherited from the main Redis env namespace):
 *   REDIS_KEY_PREFIX         — key prefix (default: "scholarx:v2:web")
 *   NODE_ENV
 */

function readEnv(key) {
  const value = process.env[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function targetFromEnv() {
  const url = readEnv("UPSTASH_REDIS_KV_REST_API_URL");
  const token = readEnv("UPSTASH_REDIS_KV_REST_API_TOKEN");

  if (!url) throw new Error("UPSTASH_REDIS_KV_REST_API_URL is not set.");
  if (!token) throw new Error("UPSTASH_REDIS_KV_REST_API_TOKEN is not set.");
  if (!/^https:\/\//i.test(url)) throw new Error("UPSTASH_REDIS_KV_REST_API_URL must start with https://.");

  return {
    url: url.replace(/\/+$/, ""),
    token,
    prefix: readEnv("REDIS_KEY_PREFIX") ?? "scholarx:v2:web",
  };
}

/**
 * Execute a single Redis command via the Upstash REST API.
 * The REST API accepts commands as JSON arrays and returns:
 *   { result: <value> } on success
 *   { error: "<message>" } on Redis-level error
 */
async function execCommand(target, command) {
  const res = await fetch(target.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${target.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(unreadable)");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  const json = await res.json();
  if (json.error) throw new Error(`Redis error: ${json.error}`);
  return json.result;
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

async function checkPing(target) {
  const result = await execCommand(target, ["PING"]);
  if (result !== "PONG") throw new Error(`Unexpected PING response: ${JSON.stringify(result)}`);
  return "PONG";
}

async function checkSetGetDel(target) {
  const key = `${target.prefix}:diagnose:${Date.now()}:${Math.random().toString(16).slice(2)}`;

  // SET with 30 s TTL
  const setResult = await execCommand(target, ["SET", key, "upstash-ok", "EX", 30]);
  if (setResult !== "OK") throw new Error(`SET returned: ${JSON.stringify(setResult)}`);

  // GET
  const getResult = await execCommand(target, ["GET", key]);
  if (getResult !== "upstash-ok") {
    throw new Error(`GET returned unexpected value: ${JSON.stringify(getResult)}`);
  }

  // TTL
  const ttl = await execCommand(target, ["TTL", key]);
  if (typeof ttl !== "number" || ttl <= 0 || ttl > 30) {
    throw new Error(`TTL out of expected range: ${ttl}`);
  }

  // DEL
  const delResult = await execCommand(target, ["DEL", key]);
  if (delResult !== 1) throw new Error(`DEL returned: ${JSON.stringify(delResult)}`);

  return `SET/GET/TTL/DEL passed; key=${key}, ttl=${ttl}s`;
}

async function checkTokenScope(target) {
  // INFO server confirms the token has at minimum read access.
  const info = await execCommand(target, ["INFO", "server"]);
  if (typeof info !== "string" || !info.includes("redis_version")) {
    throw new Error(`INFO response did not contain expected fields: ${String(info).slice(0, 120)}`);
  }
  const versionMatch = info.match(/redis_version:(\S+)/);
  return `authorized; redis_version=${versionMatch?.[1] ?? "unknown"}`;
}

async function main() {
  const target = targetFromEnv();

  console.log("[upstash-diagnose] config", {
    nodeEnv: process.env.NODE_ENV ?? "unset",
    url: target.url,
    token: target.token ? `${target.token.slice(0, 8)}...` : "missing",
    prefix: target.prefix,
  });

  const checks = [
    await runCheck("ping", () => checkPing(target)),
    await runCheck("set-get-del", () => checkSetGetDel(target)),
    await runCheck("token-scope", () => checkTokenScope(target)),
  ];

  for (const check of checks) {
    console.log(
      `[upstash-diagnose] ${check.ok ? "PASS" : "FAIL"} ${check.name} ${check.durationMs}ms${
        check.detail ? ` - ${check.detail}` : ""
      }`,
    );
  }

  if (checks.some((check) => !check.ok)) process.exitCode = 1;
}

main().catch((error) => {
  console.error("[upstash-diagnose] fatal", error instanceof Error ? error.message : error);
  process.exit(1);
});
