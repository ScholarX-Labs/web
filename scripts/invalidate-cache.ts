import { Redis } from "ioredis";

async function main() {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  if (!url) {
    throw new Error("Missing REDIS_URL or UPSTASH_REDIS_REST_URL");
  }

  // Use fetch for Upstash if REDIS_URL is not standard, or ioredis if it's standard
  if (url.startsWith("http")) {
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!token) {
      throw new Error("Missing UPSTASH_REDIS_REST_TOKEN");
    }
    const res = await fetch(`${url}/KEYS/courses:*`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch keys: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const keys = data.result;
    
    if (keys && keys.length > 0) {
      console.log("Invalidating all course caches...");
      const delRes = await fetch(`${url}/DEL/${keys.join('/')}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!delRes.ok) {
        throw new Error(`Failed to delete keys: ${delRes.status} ${delRes.statusText}`);
      }
      const delData = await delRes.json();
      console.log(`Deleted ${delData.result} keys.`);
    } else {
      console.log("No cache keys found.");
    }
  } else {
    const redis = new Redis(url);
    try {
      console.log("Invalidating all course caches...");
      const keys = await redis.keys("courses:*");
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Deleted ${keys.length} keys.`);
      } else {
        console.log("No cache keys found.");
      }
    } finally {
      redis.disconnect();
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
