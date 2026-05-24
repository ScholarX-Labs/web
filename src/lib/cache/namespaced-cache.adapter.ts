import type { CachePort } from "./cache.port";
import { namespaceRedisKey } from "./redis-key-namespace";

export class NamespacedCacheAdapter implements CachePort {
  constructor(private readonly inner: CachePort) {}

  getJson<T>(key: string): Promise<T | null> {
    return this.inner.getJson<T>(namespaceRedisKey(key));
  }

  setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    return this.inner.setJson(namespaceRedisKey(key), value, ttlSeconds);
  }

  delete(key: string): Promise<void> {
    return this.inner.delete(namespaceRedisKey(key));
  }
}
