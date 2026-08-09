import { Redis } from "@upstash/redis";
import { env } from "@/config/env";

let client: Redis | null = null;

export function isUpstashRedisConfigured(): boolean {
  return Boolean(env.UPSTASH_REDIS_KV_REST_API_URL && env.UPSTASH_REDIS_KV_REST_API_TOKEN);
}

export function getUpstashRedis(): Redis | null {
  if (!isUpstashRedisConfigured()) {
    return null;
  }

  if (!client) {
    const config: any = {
      url: env.UPSTASH_REDIS_KV_REST_API_URL!,
      token: env.UPSTASH_REDIS_KV_REST_API_TOKEN!,
      fetch: (url: any, init: any) => fetch(url, { ...init, cache: "no-store" }),
    };
    client = new Redis(config);
  }

  return client;
}

export function resetUpstashRedisForTests(): void {
  client = null;
}
