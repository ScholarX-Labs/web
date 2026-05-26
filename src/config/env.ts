import { z } from "zod";

function normalizeOptionalString(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const optionalString = z.preprocess(
  normalizeOptionalString,
  z.string().min(1).optional(),
);
const optionalUrl = z.preprocess(
  normalizeOptionalString,
  z.string().url().optional(),
);
const optionalDigits = z.preprocess(
  normalizeOptionalString,
  z.string().regex(/^\d+$/).optional(),
);
const optionalBooleanString = z.preprocess(
  normalizeOptionalString,
  z.enum(["true", "false"]).optional(),
);

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1).default("/api"),
  NEXT_PUBLIC_API_BASE_URL: z.string().min(1).default("/api"),

  R2_ENDPOINT: optionalUrl,
  R2_ACCESS_KEY: optionalString,
  R2_SECRET_KEY: optionalString,
  R2_BUCKET_NAME: optionalString,
  R2_PUBLIC_URL: optionalUrl,

  AZURE_REDIS_HOST: optionalString,
  AZURE_REDIS_PORT: optionalDigits,
  AZURE_REDIS_KEY: optionalString,
  AZURE_REDIS_CLUSTER: optionalBooleanString,
  AZURE_REDIS_TLS: optionalBooleanString,
  REDIS_URL: optionalUrl,
  REDIS_HOST: optionalString,
  REDIS_PORT: optionalDigits,
  REDIS_PASSWORD: optionalString,
  REDIS_CONNECT_TIMEOUT_MS: optionalDigits,
  REDIS_COMMAND_TIMEOUT_MS: optionalDigits,
  REDIS_MAX_RETRIES_PER_REQUEST: optionalDigits,
  REDIS_KEY_PREFIX: optionalString,
  CACHE_ENABLED: optionalBooleanString,
  DISTRIBUTED_RATE_LIMITS_ENABLED: optionalBooleanString,

  AVATAR_UPLOAD_ENABLED: optionalBooleanString,

  SCHOLARX_EXECUTIVE_DASHBOARD_ENABLED: optionalBooleanString,
  SCHOLARX_EXECUTIVE_TEAM_OPS_ENABLED: optionalBooleanString,
  SCHOLARX_EXECUTIVE_FINANCE_ENABLED: optionalBooleanString,
  SCHOLARX_EXECUTIVE_GOVERNANCE_ENABLED: optionalBooleanString,
  SCHOLARX_EXECUTIVE_AI_HEATMAP_ENABLED: optionalBooleanString,

  BETTER_AUTH_URL: optionalUrl,
  BETTER_AUTH_SECRET: z.preprocess(
    normalizeOptionalString,
    z.string().min(32).optional(),
  ),
});

type EnvInput = Record<string, string | undefined>;

function readEnv(input: EnvInput, key: string): string | undefined {
  return normalizeOptionalString(input[key]) as string | undefined;
}

function formatPath(path: PropertyKey[]): string {
  return path.length > 0 ? path.join(".") : "ENV";
}

function validateRedisEnv(input: EnvInput): string[] {
  const issues: string[] = [];
  const cacheEnabled = readEnv(input, "CACHE_ENABLED") === "true";
  const distributedRateLimitsEnabled =
    readEnv(input, "DISTRIBUTED_RATE_LIMITS_ENABLED") === "true";
  const redisRequired = cacheEnabled || distributedRateLimitsEnabled;

  const redisUrl = readEnv(input, "REDIS_URL");
  const azureHost = readEnv(input, "AZURE_REDIS_HOST");
  const redisHost = readEnv(input, "REDIS_HOST");
  const redisPrefix = readEnv(input, "REDIS_KEY_PREFIX");

  if (!redisRequired) return issues;

  if (!redisUrl && !azureHost && !redisHost) {
    issues.push(
      "Set one Redis connection mode when CACHE_ENABLED=true or DISTRIBUTED_RATE_LIMITS_ENABLED=true: REDIS_URL, AZURE_REDIS_HOST, or REDIS_HOST.",
    );
  }

  if (!redisPrefix) {
    issues.push(
      "Set REDIS_KEY_PREFIX when Redis-backed cache or rate limits are enabled.",
    );
  }

  if (
    process.env.NODE_ENV === "development" &&
    redisPrefix &&
    !/(^|:)(dev|local)($|:)/i.test(redisPrefix)
  ) {
    issues.push(
      "In development, REDIS_KEY_PREFIX must include ':dev' or ':local' to avoid mixing with shared/prod keys.",
    );
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

    if (!readEnv(input, "AZURE_REDIS_PORT")) {
      issues.push("Set AZURE_REDIS_PORT when AZURE_REDIS_HOST is set.");
    }

    if (!readEnv(input, "AZURE_REDIS_KEY")) {
      issues.push("Set AZURE_REDIS_KEY when AZURE_REDIS_HOST is set.");
    }

    if (readEnv(input, "AZURE_REDIS_TLS") !== "true") {
      issues.push("Set AZURE_REDIS_TLS=true for Azure Cache for Redis.");
    }

    if (readEnv(input, "AZURE_REDIS_PORT") !== "6380") {
      issues.push(
        "Use AZURE_REDIS_PORT=6380 for TLS connections to Azure Cache for Redis.",
      );
    }
  }

  if (redisHost && !readEnv(input, "REDIS_PORT")) {
    issues.push("Set REDIS_PORT when REDIS_HOST is set.");
  }

  return issues;
}

export function validateEnv(input: EnvInput = process.env) {
  const parsed = envSchema.safeParse(input);
  const issues = parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${formatPath(issue.path)}: ${issue.message}`,
      );

  issues.push(...validateRedisEnv(input));

  if (issues.length > 0) {
    throw new Error(
      "[ENV] Invalid environment configuration:\n" +
        issues.map((issue) => `- ${issue}`).join("\n") +
        "\nCheck your .env.local file or Azure App Settings.",
    );
  }

  if (!parsed.success) {
    throw new Error("[ENV] Invalid environment configuration.");
  }

  return parsed.data;
}

export const env = validateEnv();

if (typeof window !== "undefined") {
  console.log("[ENV] NEXT_PUBLIC_API_BASE_URL:", env.NEXT_PUBLIC_API_BASE_URL);
}

export type Env = z.infer<typeof envSchema>;
