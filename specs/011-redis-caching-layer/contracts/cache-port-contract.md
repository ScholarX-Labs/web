# Contract: Server-Only Cache Port

This is an internal application contract for shared cache usage. Route handlers, pages, and Client
Components must not import the Redis adapter directly. All imports of this module must cross the
`server-only` boundary.

---

## CachePort

```ts
export interface CachePort {
  get<T>(input: CacheGetInput<T>): Promise<CacheGetResult<T>>;
  set<T>(input: CacheSetInput<T>): Promise<CacheSetResult>;
  getOrSet<T>(input: CacheGetOrSetInput<T>): Promise<CacheGetOrSetResult<T>>;
  delete(input: CacheDeleteInput): Promise<CacheDeleteResult>;
  invalidateTags(input: CacheInvalidateTagsInput): Promise<CacheInvalidateTagsResult>;
  getStatus(): CachePortStatus;
}
```

---

## Inputs

```ts
export interface CachePolicy {
  surfaceId: string;
  freshTtlSeconds: number;
  /**
   * Total lifetime = freshTtlSeconds + staleTtlSeconds.
   * Must be >= freshTtlSeconds.
   */
  staleTtlSeconds: number;
  /**
   * TTL for a "not found" sentinel entry.
   * REQUIRED when fallbackMode is "source" or "safe-stale" to prevent
   * stampede on non-existent entities (e.g. unknown username, invalid cert number).
   * Recommended minimum: 30 seconds.
   */
  negativeTtlSeconds: number;
  /**
   * Random jitter added to freshTtlSeconds at write time to stagger mass expiry.
   * Actual stored fresh TTL = freshTtlSeconds + Math.floor(Math.random() * ttlJitterSeconds).
   * Prevents the thundering-herd problem when many entries of the same surface expire simultaneously
   * (e.g., after a cold deploy or a full-surface cache flush).
   * Recommended: 10–20% of freshTtlSeconds.
   * Default: 0 (no jitter — only safe for surfaces with very few concurrent entries).
   */
  ttlJitterSeconds?: number;
  fallbackMode: "source" | "safe-stale" | "strict-deny" | "bypass";
  /**
   * When true, the adapter activates stampede protection for this surface.
   * See §Stampede Protection for the concrete mechanism.
   */
  stampedeProtection?: boolean;
  /**
   * Maximum serialized payload size in bytes. If the encoded envelope exceeds this limit,
   * the adapter skips caching (returns { status: "bypassed" }) and emits cache.set.bypass metric.
   * Prevents single large entries from consuming disproportionate Redis memory.
   * Default: 524_288 (512 KB). Set lower for surfaces with many small entries.
   */
  maxPayloadBytes?: number;
}

export interface CacheGetInput<T> {
  key: string;
  policy: CachePolicy;
  decode: (payload: unknown) => T;
}

export interface CacheSetInput<T> {
  key: string;
  policy: CachePolicy;
  tags: string[];
  value: T;
}

export interface CacheGetOrSetInput<T> {
  key: string;
  policy: CachePolicy;
  tags: string[];
  decode: (payload: unknown) => T;
  load: () => Promise<T>;
}

export interface CacheDeleteInput {
  key: string;
}

export interface CacheInvalidateTagsInput {
  tags: string[];
}
```

---

## Results

```ts
export type CacheGetResult<T> =
  | { status: "hit"; value: T }
  | { status: "stale"; value: T }
  | { status: "miss" }
  | { status: "error"; errorCategory: string };

export type CacheGetOrSetResult<T> =
  | { status: "hit"; value: T }
  | { status: "stale"; value: T }
  | { status: "loaded"; value: T }
  | { status: "bypassed"; value: T }
  | { status: "error"; errorCategory: string; fallbackValue?: T };

export interface CacheSetResult {
  ok: boolean;
  errorCategory?: string;
}

export interface CacheDeleteResult {
  ok: boolean;
  errorCategory?: string;
}

export interface CacheInvalidateTagsResult {
  ok: boolean;
  invalidatedKeys: number;
  failedKeys: number;
  errorCategory?: string;
}
```

---

## Circuit Breaker

The adapter must implement a circuit breaker to prevent cascading failures when Redis is degraded.

```ts
export interface CircuitBreakerPolicy {
  /**
   * Number of consecutive Redis errors before the circuit opens.
   * Recommended default: 5.
   */
  failureThreshold: number;
  /**
   * Seconds the circuit stays open before entering half-open (probing) state.
   * Recommended default: 30.
   */
  recoveryWindowSeconds: number;
  /**
   * In half-open state, one probe request is allowed per this interval.
   * If the probe succeeds, the circuit closes. If it fails, it re-opens.
   * Recommended default: 5.
   */
  probeIntervalSeconds: number;
}

export type CircuitState = "closed" | "open" | "half-open";

export interface CachePortStatus {
  circuitState: CircuitState;
  consecutiveFailures: number;
  lastFailureAt?: Date;
  lastProbeAt?: Date;
}
```

**State Transitions**:
```
closed   → open       : consecutiveFailures >= failureThreshold
open     → half-open  : recoveryWindowSeconds elapsed since last failure
half-open → closed    : probe request succeeds
half-open → open      : probe request fails
```

When the circuit is `open`, `getOrSet` behavior follows `policy.fallbackMode`:
- `source` → bypass cache, call `load()` directly
- `safe-stale` → serve the last known stale value if available, else call `load()`
- `strict-deny` → return `{ status: "error", errorCategory: "circuit_open" }` without calling `load()`
- `bypass` → call `load()` directly (same as `source` for circuit-open path)

---

## Stampede Protection

When `policy.stampedeProtection` is `true`, the adapter must prevent simultaneous recomputation
of the same expired key by multiple callers.

### Mechanism: Probabilistic Early Recomputation (XFetch) — Default

Used for read-heavy surfaces where serving microscopically stale data is acceptable.

```
delta   = time elapsed since entry was created (seconds)
beta    = recomputation cost factor (default 1.0; higher = recompute earlier)
ttl_remaining = staleUntil - now (seconds)

recompute_now = (now - delta * beta * ln(random())) >= freshUntil
```

If `recompute_now` is true, the current caller recomputes and writes while others continue
receiving the stale (but valid) cached value. No lock is needed.

**Applicable surfaces**: `courses.*`, `opportunities.*`, `profiles.public`, `admin.*`, `config.*`

### Mechanism: Distributed Mutex (Single-Writer Lock) — For Privacy-Sensitive Surfaces

Used for surfaces where serving a stale value while recomputing is not safe (e.g., after a
revocation or privacy-toggle invalidation).

```
lockKey  = "{key}:__lock"
lockTtlMs = max(freshTtlSeconds * 1000, 5000)   # at least 5 s

On cache miss:
1. Attempt SET lockKey "1" NX PX {lockTtlMs}
2. If acquired → call load(), SET value, DEL lockKey
3. If not acquired → serve stale if available, else short-sleep (50–100 ms) and retry GET (max 3 attempts)
4. If all retries exhausted → call load() directly (fail-safe)
```

If the lock holder crashes before releasing, the PX TTL ensures automatic release.

**Applicable surfaces**: `certificates.public.verification`, `certificates.public.artifact-status`

The concrete mechanism is chosen per surface in the policy catalog. The `stampedeProtection`
flag enables the default mechanism for that surface type; overrides may be specified in the
adapter factory when constructing per-surface policies.

---

## Tag Invalidation Atomicity

Tag-based invalidation requires maintaining a tag → key index. Upstash Redis does not provide
native cache tag support, so the adapter maintains `SADD`-based index sets.

**The Problem**: A naive `SET key` followed by `SADD tag-set key` across two round-trips creates a
race window: an invalidation (`SMEMBERS tag-set → DEL ...`) that lands between the two operations
leaves the key orphaned in storage with no tag pointer.

**Required Implementation**: The adapter must use one of the following atomic strategies:

### Strategy A — Lua Script (Recommended for Upstash)

```lua
-- KEYS[1] = cache key
-- KEYS[2..N] = tag set keys
-- ARGV[1] = serialized envelope (JSON string)
-- ARGV[2] = total TTL in seconds (freshTtlSeconds + staleTtlSeconds)
-- ARGV[3..N] = tag index keys (same as KEYS[2..N])

local result = redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
for i = 2, #KEYS do
  redis.call('SADD', KEYS[i], KEYS[1])
  redis.call('EXPIRE', KEYS[i], tonumber(ARGV[2]) + 86400) -- index lives longer than entries
end
return result
```

This executes atomically on the Redis server. No interleaving is possible.

### Strategy B — MULTI/EXEC Pipeline

If Lua is unavailable (e.g., read-replica or proxy restrictions):

```ts
const pipeline = redis.pipeline();
pipeline.set(key, envelope, { ex: totalTtlSeconds });
for (const tag of tags) {
  pipeline.sadd(tagIndexKey(tag), key);
  pipeline.expire(tagIndexKey(tag), totalTtlSeconds + 86400);
}
await pipeline.exec();
```

MULTI/EXEC is atomic on a single Redis node. On Redis Cluster, it is only safe if all keys
share the same hash slot (use `{namespace}` hash tags on key names to enforce this).

### Orphaned Key Recovery (Bounded Worst Case)

Because every entry has a bounded `staleUntil` TTL set on the key itself, orphaned entries
(tag index misses after a race) will expire automatically within `freshTtlSeconds + staleTtlSeconds`
seconds. This bounds the worst-case staleness for any missed invalidation.

Tag index entries must have their own `EXPIRE` set to `max(entry TTL) + 86400` to prevent
unbounded index growth.

---

## Behavioral Requirements

1. The adapter module must import `server-only` to prevent accidental client-side use.
2. Unsupported schema versions in a stored envelope must return `{ status: "miss" }`.
3. Decode failures must return `{ status: "miss" }` or `{ status: "error" }`; unvalidated payloads must never be returned.
4. `getOrSet` must not cache a value if `load()` throws. Errors from `load()` must propagate or trigger `fallbackMode` but must not be stored as cache entries.
5. `invalidateTags` must tolerate missing keys (keys already expired or never set) without returning an error.
6. `set` must use the atomic Lua strategy (Strategy A) or pipeline strategy (Strategy B) described in §Tag Invalidation Atomicity.
7. Metrics must be emitted for: `hit`, `miss`, `stale_hit`, `loaded`, `set_failure`, `invalidation_failure`, `bypass`, `circuit_open`, `circuit_probe`, `stampede_deferred`, and Redis round-trip latency.
8. Cache keys and tag index keys must not contain raw tokens, raw email addresses, full IP addresses, session IDs, or raw request bodies.
9. The circuit breaker must be initialized with configurable thresholds (see `CircuitBreakerPolicy`); default values must be documented.
10. When `stampedeProtection` is `true`, the adapter selects the appropriate mechanism (XFetch or distributed mutex) based on the surface type registered in the factory.
11. **`invalidateTags` must be idempotent**: calling it multiple times with the same tag list produces the same end state (all affected keys deleted). Deleting a key that no longer exists in Redis is a no-op, not an error. Callers must not treat a second call as an anomaly.
12. **Invalidation must be called after the mutation is committed to the source of truth**, not before or during. Calling `invalidateTags` before the database transaction commits creates a race where the cache refills with the pre-mutation value while the write is in-flight. The cache port does not enforce this ordering — it is the responsibility of the calling mutation service.
13. **Payload size check**: If `policy.maxPayloadBytes` is set and the serialized envelope exceeds this limit, `set` and `getOrSet` must skip the cache write, return `{ status: "bypassed" }`, and emit `cache.set.bypass` metric. The value from `load()` must still be returned to the caller.
14. **TTL jitter application**: If `policy.ttlJitterSeconds` is set (> 0), the adapter must compute the actual fresh TTL as `policy.freshTtlSeconds + Math.floor(Math.random() * policy.ttlJitterSeconds)` at write time. The `freshUntil` timestamp in the envelope reflects this jittered value. The total Redis key TTL (EX) remains `actualFreshTtl + staleTtlSeconds` to preserve the stale window.

---

## Trust Boundary Note

Redis is treated as trusted infrastructure. Envelope integrity is not verified on read by default.
If Redis is considered potentially hostile (e.g., shared multi-tenant Redis), implement HMAC
verification over `schemaVersion + surfaceId + JSON.stringify(payload)` using a server-side secret.
This is not required for ScholarX's current single-tenant Upstash deployment but should be
reconsidered if the Redis instance is ever shared across tenants.
