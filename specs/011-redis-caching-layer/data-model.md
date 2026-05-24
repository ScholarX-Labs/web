# Data Model: Shared Redis Caching Layer

## CacheableSurface

Represents a ScholarX product surface that may use shared cache or distributed control state.

**Fields**:

- `id`: stable identifier such as `courses.public.list`
- `owner`: owning area such as `courses`, `opportunities`, `profiles`, `certificates`, `admin`, `config`, or `rate-limit`
- `audience`: `public`, `authenticated`, `admin`, `system`
- `dataSensitivity`: `public`, `personalized`, `private`, `secret`, `operational`
- `cacheMode`: `read-through`, `write-through`, `counter`, `bypass`
- `sourceOfTruth`: authoritative source, normally PostgreSQL or external opportunity service
- `allowedInSharedCache`: boolean gate
- `invalidationRequired`: boolean gate for non-TTL-only surfaces

**Validation Rules**:

- `secret` and `private` data cannot be stored in shared cache.
- `personalized` data cannot be stored in public cache keys.
- `admin` surfaces can cache data only after authorization has succeeded.
- `admin` surfaces must include a user-scoped tag component in their cache key to prevent
  cross-admin data leakage (e.g., `admin:user:{userId}:stats`).

---

## CachePolicy

Defines freshness, stale behavior, tags, and fallback for one cacheable surface.

**Fields**:

- `surfaceId`: references `CacheableSurface.id`
- `namespaceVersion`: version string such as `sx:v1`
- `freshTtlSeconds`: time entry is considered fresh
- `staleTtlSeconds`: extra time a stale entry may be served when policy allows it
- `negativeTtlSeconds`: TTL for safe not-found sentinel entries. **Required** when `fallbackMode`
  is `"source"` or `"safe-stale"` to prevent stampede against non-existent entities.
  Must be greater than zero. Omitting it for these fallback modes is a policy validation error.
- `ttlJitterSeconds`: random seconds added to `freshTtlSeconds` at write time. Staggers mass expiry
  across the population of cached entries for the same surface. Recommended: 10–20% of
  `freshTtlSeconds`. Defaults to `0` (no jitter) when omitted. See policy catalog for per-surface values.
- `maxPayloadBytes`: maximum allowed serialized envelope size. If the encoded payload exceeds this
  limit, the adapter bypasses caching for that entry and emits `cache.set.bypass`. Defaults to
  `524_288` (512 KB). Admin report surfaces may require a higher limit; all other surfaces should
  stay under 256 KB to prevent memory hotspots.
- `tags`: deterministic tag list or tag builder
- `fallbackMode`: `source`, `safe-stale`, `strict-deny`, `bypass`
- `stampedeProtection`: whether to apply stampede protection (XFetch or distributed mutex per surface)
- `stampedeAlgorithm`: `"xfetch"` (default for most surfaces) or `"mutex"` (for privacy-sensitive surfaces)
- `enabledByDefault`: initial rollout state, defaults to `false`

**Validation Rules**:

- `staleTtlSeconds` must be greater than or equal to `freshTtlSeconds`.
- Privacy, archive, revocation, and authorization-sensitive surfaces require explicit invalidation
  and short TTLs.
- Arbitrary unbounded queries require either no cache or short TTL with key cardinality controls.
- `negativeTtlSeconds` is required (must be > 0) when `fallbackMode` is `"source"` or `"safe-stale"`.
- `ttlJitterSeconds`, when set, must be less than or equal to `freshTtlSeconds` to prevent the
  jittered fresh TTL from growing disproportionately large.
- `maxPayloadBytes` must not exceed `10_000_000` (10 MB, Upstash practical per-request limit).
---

## CacheEntryEnvelope

Stored value format for JSON cache entries.

**Fields**:

- `schemaVersion`: integer cache payload schema version. Current version: **`1`**.
- `surfaceId`: owning cache surface
- `key`: full normalized cache key
- `createdAt`: ISO timestamp (set by application server at write time)
- `freshUntil`: ISO timestamp (set by application server at write time)
- `staleUntil`: ISO timestamp (set by application server at write time)
- `tags`: string array
- `payload`: normalized DTO safe for the declared audience

**Validation Rules**:

- Entries with unsupported schema versions are treated as misses and should be deleted asynchronously.
- Entries past `staleUntil` are treated as misses and should be deleted asynchronously when practical.
- `payload` must be validated or mapped before returning to domain callers.

### Schema Version Policy

The current schema version is `1`. Version bumps are required when:

- Any field in `CacheEntryEnvelope.payload` is **removed** or **renamed**
- The `CacheEntryEnvelope` envelope structure itself changes (field removed/renamed)

Version bumps are **not required** for additive payload changes (adding new optional fields),
because old readers will simply ignore unknown fields.

**Bump procedure**:

1. Increment `schemaVersion` in the shared codec constants.
2. Update the codec's `SUPPORTED_SCHEMA_VERSIONS` array to include the new version.
3. During rolling deployments, old instances write `v1` entries and new instances write `v2` entries.
   Old `v1` entries return as miss to new readers (handled by schema version check). This is the
   intended degraded behavior during the deployment window — no data loss, just temporary increased miss rate.
4. After full rollout, remove old version from `SUPPORTED_SCHEMA_VERSIONS` once the deployment
   window has elapsed. Old entries will TTL-expire naturally.

### Clock Skew Policy

`freshUntil` and `staleUntil` are set using the application server's clock at write time.
In multi-instance deployments, clock skew between instances can cause the same entry to be
treated as fresh by one instance and stale by another simultaneously.

**Accepted tolerance**: Application clock skew of ±1 second is acceptable given the short TTLs
(minimum 5 seconds for artifact-status, maximum 6 hours for opportunity detail). No additional
synchronization is required.

**When not acceptable**: If clock skew exceeds 5 seconds (detectable via NTP monitoring), the
platform's deployment infrastructure must be fixed rather than compensating in the cache layer.
Optionally, the adapter may use the Redis `TIME` command to retrieve canonical server time for
freshness calculations — this adds one round-trip but eliminates the skew concern entirely.
Document which approach is chosen during implementation.

---

## InvalidationEvent

Business event that expires or refreshes cache entries.

**Fields**:

- `eventType`: stable event name such as `course.updated`, `profile.privacy_changed`, or `certificate.revoked`
- `entityType`: affected entity category
- `entityId`: affected entity identifier where available
- `tags`: tags to invalidate
- `occurredAt`: ISO timestamp
- `initiator`: safe actor label or system identifier (must not contain PII)
- `priority`: `"immediate"` or `"standard"` — see policy catalog for which events require each

**Relationships**:

- One invalidation event targets one or more cache tags.
- One cache tag may point to many cache entry keys (maintained as Redis `SADD` index sets).

**Validation Rules**:

- Mutation paths that affect privacy, archive, or revocation must emit invalidation **before**
  returning success to the caller (synchronous invalidation). These are marked `priority: "immediate"`.
- Standard-priority events may use best-effort async invalidation, with TTL as the bounded recovery.
- Invalidation failure must be logged with `eventType`, `tags`, and `errorCategory`. It must also
  increment the `cache.invalidation.failure` counter metric.
- `initiator` must be a safe actor label (e.g., `"admin:user:abc123-hash"` or `"system:worker"`);
  it must not contain raw email addresses, tokens, or session identifiers.

---

## DistributedLimitRule

Defines a shared request limit.

**Fields**:

- `id`: stable identifier such as `avatar.upload.user.hour`
- `surface`: protected workflow
- `actorScope`: `user`, `ip-hash`, `user-and-resource`, `system`
- `algorithm`: `"slidingWindow"` | `"fixedWindow"` | `"tokenBucket"`
- `windowSeconds`: time window
- `maxRequests`: allowed count
- `failureMode`: `fail-open` or `fail-closed`
- `retryMessage`: user-safe retry behavior description

**Validation Rules**:

- Risky writes must use `fail-closed` and `slidingWindow` to prevent burst doubling.
- Public low-risk reads may use `fail-open` with `fixedWindow` and mandatory metrics emission.
- Actor keys must hash sensitive identifiers using SHA-256 before storage in Redis keys.

---

## CacheHealthSignal

Operational signal emitted by cache and limiter adapters.

**Fields**:

- `metric`: stable metric name (see §Metric Names below)
- `surfaceId`: optional surface identifier
- `operation`: `get`, `set`, `delete`, `invalidate`, `limit`
- `outcome`: `hit`, `miss`, `stale_hit`, `loaded`, `error`, `bypass`, `circuit_open`, `circuit_probe`, `stampede_deferred`, `denied`, `allowed`
- `latencyMs`: operation latency in milliseconds
- `timestamp`: observation time (ISO string)
- `errorCategory`: optional, present when `outcome` is `error`; must not contain raw payloads or secrets

### Metric Names

| Metric | Description |
|---|---|
| `cache.get.hit` | Cache hit on fresh entry |
| `cache.get.stale_hit` | Cache hit on stale entry (served stale) |
| `cache.get.miss` | Cache miss (key absent or expired) |
| `cache.get.error` | Redis error during GET |
| `cache.set.ok` | Successful cache write |
| `cache.set.failure` | Failed cache write (Redis error or pipeline error) |
| `cache.invalidate.ok` | Tag invalidation succeeded |
| `cache.invalidate.failure` | Tag invalidation partially or fully failed |
| `cache.circuit.open` | Circuit breaker opened |
| `cache.circuit.probe` | Half-open probe attempt |
| `cache.circuit.closed` | Circuit breaker recovered |
| `cache.stampede.deferred` | Request served stale while another caller recomputes |
| `ratelimit.allowed` | Rate limit check passed |
| `ratelimit.denied` | Rate limit check denied (limit exceeded) |
| `ratelimit.unavailable` | Rate limiter Redis error; failureMode applied |

**Validation Rules**:

- Metrics must not include raw PII, tokens, or full cache payloads in any field.
- Errors must be categorized (`"redis_timeout"`, `"redis_connection"`, `"decode_failure"`,
  `"schema_mismatch"`, `"invalidation_race"`) without logging secrets.

---

## State Transitions

### Cache Entry

```text
missing → fresh      (on load and SET)
fresh   → stale      (freshUntil elapsed; Redis TTL still active)
stale   → expired    (staleUntil elapsed; Redis key deleted by TTL)
stale   → refreshed  (XFetch or mutex recompute; entry becomes fresh again)
fresh   → invalidated (invalidateTags called; key deleted from Redis and index)
invalidated → missing
```

### Cache Health Circuit

```text
closed    → open       (consecutiveFailures >= failureThreshold)
open      → half-open  (recoveryWindowSeconds elapsed since last failure)
half-open → closed     (probe request succeeds — circuit fully recovered)
half-open → open       (probe request fails — reset recovery window)
```

### Distributed Limit Decision

```text
not_present → allowed   (counter not yet set; first request in window)
allowed     → denied    (counter reaches maxRequests within window)
denied      → not_present (window expires; automatic Redis TTL cleanup)
error       → fail-open  (allowed with fallback source, metric emitted)
error       → fail-closed (denied with limiter_unavailable reason, metric emitted)
```
