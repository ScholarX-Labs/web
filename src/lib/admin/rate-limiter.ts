interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

const cleanup = () => {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
};

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = { windowMs: 60_000, maxRequests: 100 };
const ROUTE_LIMITS = new Map<string, RateLimitConfig>([
  ["/api/admin/stats", { windowMs: 60_000, maxRequests: 30 }],
  ["/api/admin/reports", { windowMs: 60_000, maxRequests: 20 }],
  ["/api/admin/*/enroll", { windowMs: 60_000, maxRequests: 10 }],
]);

const getRouteConfig = (path: string): RateLimitConfig => {
  for (const [pattern, config] of ROUTE_LIMITS) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, "[^/]+") + "$");
    if (regex.test(path)) return config;
  }
  return DEFAULT_CONFIG;
};

export const checkRateLimit = (
  identifier: string,
  path: string,
): { allowed: boolean; remaining: number; resetAt: number } => {
  cleanup();
  const now = Date.now();
  const config = getRouteConfig(path);
  const key = `${identifier}:${path}`;
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
};
