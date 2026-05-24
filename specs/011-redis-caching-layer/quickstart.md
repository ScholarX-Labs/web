# Quickstart: Shared Redis Caching Layer

## Environment Variables

### Required (Production Cache Behavior)

```text
UPSTASH_REDIS_URL=https://your-instance.upstash.io
UPSTASH_REDIS_TOKEN=your-token-here
```

> **Tier requirement**: Upstash **Pro** or **Pay-As-You-Go** tier is required for production.
> The free tier is limited to ~100 requests/second and will return rate-limit errors under
> normal production traffic. Using the free tier in production will cause circuit-breaker
> trips and cascading fallbacks.

> **Eviction policy**: The Upstash instance must be configured with `maxmemory-policy = volatile-lru`.
> `noeviction` (the Upstash default) is **prohibited** in production — it converts memory exhaustion
> into Redis errors that trigger the circuit breaker and cascade into DB reads or user-facing failures.
> Set this in the Upstash console under "Database Settings → Eviction Policy" before enabling any surface.

### Estimated Redis Memory Footprint

| Surface | Key Count (est.) | Avg Payload | Memory |
|---|---|---|---|
| Courses list/detail (all filter combos) | ~500 | 8 KB | ~4 MB |
| Opportunity detail (all lang × id) | ~2,000 | 12 KB | ~24 MB |
| Public profiles | ~10,000 | 3 KB | ~30 MB |
| Certificates | ~5,000 | 2 KB | ~10 MB |
| Admin stats/reports | ~200 | 20 KB | ~4 MB |
| Tag indices | ~50,000 entries | 200 B | ~10 MB |
| Rate limit counters | ~100,000 | 50 B | ~5 MB |
| **Total estimate** | | | **~87 MB** |

Recommended minimum Upstash allocation: **256 MB**. Alert at 70% utilization (~179 MB).
Monitor via Upstash dashboard → Memory Usage or emit `redis.memory.used_bytes` via the adapter.

### Internal / Worker Requests
INTERNAL_REQUEST_SECRET=<32-byte-random-hex>   # NEVER expose in client bundles or logs

# Global Cache Kill Switch
CACHE_ENABLED=true                # set to false to disable all shared caching globally

Setting `CACHE_ENABLED=false` bypasses all cache reads and writes for every surface.
Rate limiters remain active (they use a separate path). Use this for emergency incident response.

### Per-Surface Feature Flags

All surfaces ship disabled by default. Enable one at a time during rollout.

```text
# Rate Limits (enable before any cache surfaces)
DISTRIBUTED_RATE_LIMITS_ENABLED=true

# Runtime Config Cache
CACHE_SURFACE_CONFIG_ENABLED=true

# Opportunity Surfaces
CACHE_SURFACE_OPPORTUNITIES_DETAIL_ENABLED=true
CACHE_SURFACE_OPPORTUNITIES_SEARCH_ENABLED=true

# Course Surfaces
CACHE_SURFACE_COURSES_LIST_ENABLED=true
CACHE_SURFACE_COURSES_CATEGORIES_ENABLED=true
CACHE_SURFACE_COURSES_DETAIL_ENABLED=true
CACHE_SURFACE_COURSES_LESSONS_ENABLED=true

# Profile Surface
CACHE_SURFACE_PROFILES_PUBLIC_ENABLED=true

# Certificate Surfaces
CACHE_SURFACE_CERTIFICATES_VERIFICATION_ENABLED=true
CACHE_SURFACE_CERTIFICATES_ARTIFACT_STATUS_ENABLED=true

# Admin Surfaces (enable only after role-revocation invalidation is verified)
CACHE_SURFACE_ADMIN_STATS_ENABLED=true
CACHE_SURFACE_ADMIN_REPORTS_ENABLED=true
CACHE_SURFACE_ADMIN_LISTS_ENABLED=true
```

### Connection Tuning (optional overrides)

```text
CACHE_REDIS_READ_TIMEOUT_MS=1500     # default: 1500ms
CACHE_REDIS_CONNECT_TIMEOUT_MS=500   # default: 500ms
```

### Circuit Breaker Tuning (optional overrides)

```text
CACHE_CIRCUIT_FAILURE_THRESHOLD=5          # default: 5 consecutive errors before opening
CACHE_CIRCUIT_RECOVERY_WINDOW_SECONDS=30   # default: 30s open before half-open
CACHE_CIRCUIT_PROBE_INTERVAL_SECONDS=5     # default: 5s between half-open probes
```

---

## Local Development

1. Install dependencies from the existing lockfile: `pnpm install`.
2. Configure `DATABASE_URL` as usual.
3. Leave `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` unset — the factory will use the
   in-memory adapter automatically when Redis credentials are absent.
4. Leave all surface flags disabled (`CACHE_ENABLED=false` or simply absent).
5. Run baseline checks: `pnpm run typecheck && pnpm run test`.
6. To test a specific surface with the real adapter, configure Upstash credentials and
   set only the relevant surface flag.

---

## Commands

```powershell
pnpm run typecheck
pnpm run test
```

### Focused Tests After Implementation

```powershell
# Cache infrastructure (key builder, codec, circuit, stampede, adapters)
node --import tsx --test src/lib/cache/*.test.ts

# Rate limit infrastructure
node --import tsx --test src/lib/rate-limit/*.test.ts

# Domain decorator tests
node --import tsx --test src/domain/courses/**/*.test.ts
node --import tsx --test src/domain/certificates/**/*.test.ts
node --import tsx --test src/domain/admin/**/*.test.ts

# Route handler tests (rate limit headers, stale/fallback behavior)
node --import tsx --test src/app/api/**/*.test.ts
```

---

## Manual Smoke Tests

### 1. Public Course Cache

1. Request `/courses` or the public courses API twice in quick succession.
2. Confirm the second request records a `cache.get.hit` metric (check logs or telemetry).
3. Update or archive a course in admin.
4. Confirm the public course list/detail updates within the configured freshness target (≤ 60 seconds for standard edits).
5. Confirm no enrollment or subscription state appears in anonymous cache payloads (inspect the raw cached envelope).

### 2. Opportunity Cache

1. Request the same opportunity detail with `lang=en` twice.
2. Confirm the second request records a cache hit.
3. Simulate upstream failure (e.g., temporarily set an invalid Upstash URL for the opportunity provider).
4. Confirm a previously cached opportunity is served as safe stale and `cache.get.stale_hit` is emitted.

### 3. Public Profile Cache

1. Request `/scholar/{username}` twice for a public profile.
2. Toggle profile privacy to "private."
3. Confirm the public profile URL immediately returns a 404 or "profile not found" response
   (privacy invalidation is synchronous — should reflect within one request, not up to the TTL).
4. Confirm the cached public response contains only public fields (no email, no private settings).

### 4. Certificate Cache

1. Request a public certificate verification page twice.
2. Mark the certificate as revoked in admin.
3. Confirm the revocation is reflected within the strict freshness target (≤ 10 seconds, since
   revocation invalidation is synchronous).

### 5. Admin Role Revocation

1. Log in as an admin user.
2. Request an admin stats or reports page. Confirm cache is populated.
3. Revoke the admin role from another session or via a script.
4. Request the same admin stats page with the revoked user's session.
5. Confirm the request is rejected at the authorization layer (403) and does not serve cached data.
6. Confirm the user-scoped admin cache tags are invalidated (check `cache.invalidate.ok` metric for those tags).

### 6. Distributed Rate Limits

1. Run two app instances against the same Redis credentials (or use two terminal sessions with the same env).
2. Submit repeated admin API, avatar upload, and course application requests interleaved across both instances.
3. Confirm both instances observe the same `remaining` count and consistent `Retry-After` header when limits are reached.

---

## Monitoring Baseline

Collect the following metrics from day one. These serve as the baseline for alerting.

### Alert Thresholds (Starter — Tune After 72h of Production Data)

| Metric | Condition | Severity | Action |
|---|---|---|---|
| `cache.get.error` rate | > 5% of requests sustained > 2 min | **P1** | Check Redis connectivity; circuit may be opening |
| `cache.circuit.open` | Any occurrence | **P1** | Circuit opened; fallback active; investigate Redis |
| `cache.set.failure` rate | > 10% of writes sustained > 5 min | **P2** | Cache writes failing; TTL will degrade hit rate |
| `cache.invalidate.failure` rate | > 5% of invalidations | **P2** | Stale data risk; investigate Redis and tag index |
| `cache.get.miss` rate | > 90% sustained > 5 min after warm-up | **P3** | Possible key mismatch or eviction; check cardinality |
| `cache.get.stale_hit` rate | > 30% sustained > 15 min | **P3** | High stale rate; investigate invalidation correctness |
| Redis GET p99 latency | > 500ms sustained > 2 min | **P2** | Check Redis region/network; may cascade to users |
| `ratelimit.unavailable` | Any `fail-closed` rule | **P1** | Requests blocked due to Redis down; investigate immediately |
| Opportunity search key count | > 10,000 distinct keys | **P3** | Cardinality exceeded; review query normalization |

### Hit Rate Targets

After warm-up (first 30 minutes after enable), these are the expected steady-state hit rates:

| Surface | Expected Hit Rate |
|---|---|
| Courses list/detail | ≥ 70% |
| Opportunity detail | ≥ 85% |
| Opportunity search | ≥ 30% (high query variability expected) |
| Public profiles | ≥ 60% |
| Certificate verification | ≥ 80% |
| Admin stats/reports | ≥ 50% |
| Config | ≥ 90% |

Hit rates significantly below these targets indicate key normalization issues, excessive
cardinality, or incorrectly scoped invalidation (invalidating too broadly).

---

## Canary Deployment Guidance

For surfaces with a significant traffic share (course list, opportunity detail), use canary
deployment before full enablement:

1. **Deploy with flag disabled** — ship the cache infrastructure code with the surface flag `false`.
2. **Enable for 5–10% of traffic** — use your deployment platform's environment variable
   percentage rollout, or use a runtime config entry with a percentage rule.
3. **Observe for 30 minutes**: watch hit rate, stale-hit rate, invalidation failure rate,
   Redis latency p99, and user-facing latency p95/p99. Compare against baseline.
4. **Ramp to 25% → 50% → 100%** if no anomalies are detected at each step.
5. **If anomalies appear**: immediately set the surface flag to `false` (rollback, see below).
   Do not ramp further until the root cause is identified.

If your deployment infrastructure does not support percentage rollouts on environment variables,
implement the canary check in the surface-specific cache helper:

```ts
// In opportunity-cache.ts
const CANARY_PERCENT = parseInt(process.env.CACHE_CANARY_PERCENT ?? "0", 10);
const isCacheEnabled =
  process.env.CACHE_SURFACE_OPPORTUNITIES_DETAIL_ENABLED === "true" &&
  (CANARY_PERCENT >= 100 || Math.random() * 100 < CANARY_PERCENT);
```

---

## Rollback Procedure

### Immediate Rollback (Single Surface)

```powershell
# Disable the affected surface
# Example: rolling back opportunity detail caching
# Set in your deployment environment:
CACHE_SURFACE_OPPORTUNITIES_DETAIL_ENABLED=false
```

This takes effect immediately on the next request without a code deploy.
The app falls back to source-of-truth reads for that surface.

### Full Cache Rollback (All Surfaces)

```powershell
# Disable all shared caching globally
CACHE_ENABLED=false
```

Rate limiters remain active after this — they are not affected by `CACHE_ENABLED`.
To also disable distributed rate limits:

```powershell
DISTRIBUTED_RATE_LIMITS_ENABLED=false
```

> **Warning**: Disabling distributed rate limits restores process-local limits (memory adapter).
> This means multi-instance rate limit consistency is lost. Use only in an emergency.

### Clearing Stale Redis Keys

If stale data persists after a flag disable (e.g., a surface was re-enabled with bad keys),
clear the affected namespace from Redis:

```powershell
# Using Upstash console or redis-cli
SCAN 0 MATCH "sx:v1:opportunities:*" COUNT 100   # find affected keys
# Then DEL each matching key, or use FLUSHDB only in non-production
```

In production, prefer targeted `invalidateTags` calls over `FLUSHDB`. Use `FLUSHDB` only as a
last resort and only after ensuring no other surfaces share the same Redis instance.

### Post-Rollback Verification

After rollback:

1. Confirm the application responds to public requests without cache (`cache.get.miss` for the surface, no `cache.get.hit`).
2. Confirm DB query rate returns to pre-cache baseline.
3. Confirm no 5xx errors related to cache operations remain.
4. Re-run smoke tests for the affected surface.

---

## Verification Checklist

Before moving each surface from canary to 100%:

- [ ] Hit rate meets target (see §Monitoring Baseline)
- [ ] No `cache.invalidate.failure` events in the last 30 minutes
- [ ] Privacy-sensitive invalidations are synchronous and confirmed by smoke test
- [ ] Admin role revocation invalidation verified (admin surfaces only)
- [ ] No private fields (email, session, enrollment state) found in cached envelopes
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run test` passes (all cache/domain/route tests)
- [ ] Redis memory growth is within expected bounds (monitor via Upstash dashboard)
