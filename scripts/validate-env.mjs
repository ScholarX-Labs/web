function readEnv(key) {
  const value = process.env[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isBooleanString(value) {
  return value === undefined || value === "true" || value === "false";
}

function isDigits(value) {
  return value === undefined || /^\d+$/.test(value);
}

function isUrl(value) {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validateEnv() {
  const issues = [];

  for (const key of [
    "AZURE_REDIS_PORT",
    "REDIS_PORT",
    "REDIS_CONNECT_TIMEOUT_MS",
    "REDIS_COMMAND_TIMEOUT_MS",
    "REDIS_MAX_RETRIES_PER_REQUEST",
  ]) {
    if (!isDigits(readEnv(key))) {
      issues.push(`${key} must contain digits only.`);
    }
  }

  for (const key of [
    "AZURE_REDIS_CLUSTER",
    "AZURE_REDIS_TLS",
    "CACHE_ENABLED",
    "DISTRIBUTED_RATE_LIMITS_ENABLED",
    "AVATAR_UPLOAD_ENABLED",
  ]) {
    if (!isBooleanString(readEnv(key))) {
      issues.push(`${key} must be "true" or "false".`);
    }
  }

  for (const key of ["REDIS_URL", "R2_ENDPOINT", "R2_PUBLIC_URL", "BETTER_AUTH_URL"]) {
    if (!isUrl(readEnv(key))) {
      issues.push(`${key} must be a valid URL.`);
    }
  }

  const upstashUrl = readEnv("UPSTASH_REDIS_KV_REST_API_URL");
  if (upstashUrl && !isUrl(upstashUrl)) {
    issues.push("UPSTASH_REDIS_KV_REST_API_URL must be a valid URL.");
  } else if (upstashUrl && !/^https:\/\//i.test(upstashUrl)) {
    issues.push("UPSTASH_REDIS_KV_REST_API_URL must use the https:// scheme.");
  }

  const cacheEnabled = readEnv("CACHE_ENABLED") === "true";
  const distributedRateLimitsEnabled =
    readEnv("DISTRIBUTED_RATE_LIMITS_ENABLED") === "true";
  const redisRequired = cacheEnabled || distributedRateLimitsEnabled;
  const upstashToken = readEnv("UPSTASH_REDIS_KV_REST_API_TOKEN");
  const upstashConfigured = Boolean(upstashUrl && upstashToken);
  const redisUrl = readEnv("REDIS_URL");
  const azureHost = readEnv("AZURE_REDIS_HOST");
  const redisHost = readEnv("REDIS_HOST");
  const redisPrefix = readEnv("REDIS_KEY_PREFIX");

  if (redisRequired) {
    if (!upstashConfigured && !redisUrl && !azureHost && !redisHost) {
      issues.push(
        "Set one Redis connection mode when CACHE_ENABLED=true or DISTRIBUTED_RATE_LIMITS_ENABLED=true: " +
        "UPSTASH_REDIS_KV_REST_API_URL + UPSTASH_REDIS_KV_REST_API_TOKEN (recommended for Vercel), " +
        "REDIS_URL, AZURE_REDIS_HOST, or REDIS_HOST.",
      );
    }

    if (!redisPrefix) {
      issues.push("Set REDIS_KEY_PREFIX when Redis-backed cache or rate limits are enabled.");
    }

    if (process.env.NODE_ENV === "development" && redisPrefix && !/(^|:)(dev|local)($|:)/i.test(redisPrefix)) {
      issues.push(
        "In development, REDIS_KEY_PREFIX must include ':dev' or ':local' to avoid mixing with shared/prod keys.",
      );
    }
  }

  if (upstashUrl && !upstashToken) {
    issues.push("Set UPSTASH_REDIS_KV_REST_API_TOKEN when UPSTASH_REDIS_KV_REST_API_URL is set.");
  }

  if (upstashToken && !upstashUrl) {
    issues.push("Set UPSTASH_REDIS_KV_REST_API_URL when UPSTASH_REDIS_KV_REST_API_TOKEN is set.");
  }

  if (redisUrl && !/^rediss?:\/\//i.test(redisUrl)) {
    issues.push("REDIS_URL must use redis:// or rediss://.");
  }

  if (azureHost) {
    if (/^https?:\/\//i.test(azureHost) || /[:/]/.test(azureHost)) {
      issues.push(
        "AZURE_REDIS_HOST must be a hostname only, without protocol, slash, or port. Put the port in AZURE_REDIS_PORT.",
      );
    }

    if (!readEnv("AZURE_REDIS_PORT")) {
      issues.push("Set AZURE_REDIS_PORT when AZURE_REDIS_HOST is set.");
    }

    if (process.env.NODE_ENV === "production") {
      if (!readEnv("AZURE_REDIS_KEY")) {
        issues.push("Set AZURE_REDIS_KEY when AZURE_REDIS_HOST is set.");
      }

      if (readEnv("AZURE_REDIS_TLS") !== "true") {
        issues.push("Set AZURE_REDIS_TLS=true for Azure Cache for Redis.");
      }

      if (readEnv("AZURE_REDIS_PORT") !== "6380") {
        issues.push("Use AZURE_REDIS_PORT=6380 for TLS connections to Azure Cache for Redis.");
      }
    }
  }

  if (redisHost && !readEnv("REDIS_PORT")) {
    issues.push("Set REDIS_PORT when REDIS_HOST is set.");
  }

  if (issues.length > 0) {
    throw new Error(
      "[ENV] Invalid environment configuration:\n" +
        issues.map((issue) => `- ${issue}`).join("\n") +
        "\nCheck your Vercel env vars or Doppler prod config.",
    );
  }
}

try {
  validateEnv();
  console.log("[ENV] Environment validation passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
