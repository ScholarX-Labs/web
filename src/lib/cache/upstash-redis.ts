import { Redis } from "@upstash/redis";
import { env } from "@/config/env";

let client: Redis | null = null;

export function isUpstashRedisConfigured(): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

export function getUpstashRedis(): Redis | null {
  if (!isUpstashRedisConfigured()) {
    return null;
  }

  if (!client) {
    client = Redis.fromEnv();
  }

  return client;
}

export function resetUpstashRedisForTests(): void {
  client = null;
}
