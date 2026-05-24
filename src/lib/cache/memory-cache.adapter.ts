import type { CachePort } from "./cache.port";

type CacheEntry = {
  value: string;
  expiresAt: number;
};

export class MemoryCacheAdapter implements CachePort {
  private readonly store = new Map<string, CacheEntry>();

  async getJson<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return JSON.parse(entry.value) as T;
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
