import { env } from "@/config/env";

const DEFAULT_REDIS_KEY_PREFIX = "scholarx:v2:web";

function normalizePrefix(value: string | undefined): string {
  const normalized = value
    ?.trim()
    .replace(/^:+|:+$/g, "")
    .replace(/:{2,}/g, ":");

  return normalized || DEFAULT_REDIS_KEY_PREFIX;
}

export function getRedisKeyPrefix(): string {
  return normalizePrefix(env.REDIS_KEY_PREFIX);
}

export function namespaceRedisKey(key: string): string {
  const normalizedKey = key.trim().replace(/^:+/g, "");
  return `${getRedisKeyPrefix()}:${normalizedKey}`;
}
