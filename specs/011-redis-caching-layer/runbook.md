# Runbook: Redis Caching Layer Incidents

**Scope**: On-call reference for ScholarX cache/rate-limit production incidents.  
**Quick links**: [quickstart.md](./quickstart.md) — environment variables and rollback commands.  
**Escalation path**: Cache Layer → Platform Lead → Redis Provider (Upstash support).

---

## Severity Reference

| Severity | Definition |
|---|---|
| **P1** | Users cannot complete core journeys (sign up, view courses, submit applications) OR private data may be exposed |
| **P2** | Admin functionality degraded, stale data visible to end users, rate limits inconsistent |
| **P3** | Metrics anomaly, hit-rate degradation, operational warning with no immediate user impact |

---

## Incident 1 — Circuit Breaker Open (`cache.circuit.open` alert)

**What's happening**: Redis errors exceeded `CACHE_CIRCUIT_FAILURE_THRESHOLD` (default: 5).
The circuit is open. All cache reads are bypassing Redis and hitting source-of-truth (DB or upstream API).
Users are not blocked, but DB load has increased and latency may be elevated.

**Severity**: P1 if DB cannot absorb the additional load; P2 if DB is stable.

**Diagnosis steps**:
1. Check Upstash dashboard for Redis availability, error rate, and memory usage.
2. Verify `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` are correct and not rotated.
3. Check if Redis memory usage exceeds 90% (memory exhaustion causes errors even if Redis is "up").
4. Check network latency between the app's region and the Upstash instance region.
5. Look for `redis_connection`, `redis_timeout`, or `decode_failure` in error category logs.

**Actions**:
- **If Redis is down**: Fallback is already active. Monitor user error rate. If DB error rate rises,
  set `CACHE_ENABLED=false` to eliminate Redis connection noise. Notify Upstash support.
- **If token expired or rotated**: Update `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` in the
  deployment environment and trigger a redeployment. Circuit will close automatically after `CACHE_CIRCUIT_RECOVERY_WINDOW_SECONDS`.
- **If memory exhausted** (usage > 90%): Run targeted cleanup on low-priority namespaces first:
  ```
  SCAN 0 MATCH "sx:v1:opportunities:search:*" COUNT 100  → DEL
  SCAN 0 MATCH "sx:v1:admin:*" COUNT 100  → DEL
  ```
  Then check eviction policy is set to `volatile-lru` (not `noeviction`).
- **If cross-region latency**: Migrate the Upstash instance to the same region as the app (or
  increase `CACHE_REDIS_READ_TIMEOUT_MS` temporarily as a bridge).

**Recovery verification**: Watch for `cache.circuit.closed` metric to confirm Redis is healthy
and the circuit has closed. Confirm cache hit rate is recovering.

---

## Incident 2 — `ratelimit.unavailable` on a Fail-Closed Rule

**What's happening**: The distributed rate limiter cannot reach Redis for a fail-closed rule
(avatar upload, admin API, course application, or contact submission). Requests are being
blocked with reason `limiter_unavailable`.

**Severity**: P1 — users cannot complete protected actions.

**Diagnosis steps**:
1. Distinguish from Incident 1: is the main cache circuit also open, or just the rate limiter?
2. Check if rate limiter is using the same Redis instance as the cache (it should be via the shared factory).
3. Check for `redis_timeout` errors specifically on `ratelimit.*` operations — this is often caused
   by high-latency Redis (not down) that exceeds the rate-limit check timeout.

**Actions**:
- **If Redis is down**: Set `DISTRIBUTED_RATE_LIMITS_ENABLED=false`. This falls back to in-memory
  (process-local) limits, losing cross-instance consistency but restoring user access.
  > ⚠️ **Warning**: Process-local limits mean rate limits are now per-instance, not global.
  > Re-enable distributed limits as soon as Redis recovers.
- **If Redis is slow (timeout)**: Temporarily increase `CACHE_REDIS_READ_TIMEOUT_MS=3000` to
  give the limiter more time. Monitor user latency — this trades user-facing latency for availability.
- **If it is a specific rule only**: Review if a recent deployment changed the rule ID or actor key
  format. A renamed rule creates a "miss" that falls through to fail-closed behavior incorrectly.

---

## Incident 3 — High `cache.invalidate.failure` Rate (> 5%)

**What's happening**: Tag invalidation is partially or fully failing. Cache entries are not being
purged after mutations. Stale data may be served.

**Severity**: P2 — stale data risk. Escalate to P1 if privacy-sensitive surfaces are affected
(profile privacy, certificate revocation, admin role revocation).

**Diagnosis steps**:
1. Check `failedKeys` count in `cache.invalidate.failure` events. Partial failures (some keys deleted,
   some not) indicate tag index inconsistency. Full failures indicate Redis connectivity issues.
2. Check if the Lua script eval is being rejected (some Redis proxy configurations disable EVAL).
   If so, fall back to MULTI/EXEC pipeline mode (update `upstash-cache.adapter.ts` config).
3. Check if affected tag index keys have expired (index TTL too short relative to entry TTL).

**Actions**:
- **Emergency stale-data mitigation**: Reduce TTLs for affected surfaces via environment config
  (shorter TTL = faster natural staleness recovery without invalidation):
  ```
  # No per-surface TTL override env vars yet — reduce via runtime config setConfig()
  ```
- **Manual cache clear for affected entity**:
  ```
  SMEMBERS sx:v1:tag:{tag-name}     → get all keys for the tag
  DEL {each key}                     → purge entries
  DEL sx:v1:tag:{tag-name}           → clear the index itself
  ```
- **If privacy-sensitive**: Treat as P1. Clear the affected namespace immediately. Set surface
  flag to `false` until invalidation is verified fixed.

---

## Incident 4 — Private Data Suspected in Cache (Security Incident)

**What's happening**: A user or automated check reports seeing another user's data, or a
security scan detects PII in a cached response.

**Severity**: P1 immediately. Treat as a security incident.

**Immediate actions** (first 5 minutes):
1. Set `CACHE_ENABLED=false` immediately. This is the emergency global kill switch.
2. Notify the security team and platform lead.
3. Do NOT delete or overwrite Redis keys yet — preserve evidence.

**Investigation** (within 30 minutes):
1. Identify the affected surface (which route/API returned the suspected data).
2. In Upstash console, inspect the raw cache entry for that surface:
   - Check `surfaceId` in the envelope — does it match the route?
   - Check `payload` for private fields (email, session data, enrollment state).
3. Trace back to the DTO normalization function used at cache write time.
   - Was a `findAll` call accidentally cached instead of the public-only projection?
   - Was a user-scoped query accidentally stored in a public (username-keyed) cache entry?

**Remediation**:
1. Fix the normalization bug in the domain service or cache decorator.
2. Add a unit test that asserts: given the raw DB record, the cached payload contains
   only the declared public fields and no private fields.
3. Clear the affected namespace:
   ```
   SCAN 0 MATCH "sx:v1:{affected-surface}:*" COUNT 100 → DEL all keys
   ```
4. Re-enable the surface only after the normalization fix is deployed and tested.
5. File a post-mortem documenting the root cause and remediation.

---

## Incident 5 — High Miss Rate After Warm-Up (> 90% miss sustained > 5 min)

**What's happening**: The cache is enabled and traffic is flowing, but nearly every request is
a miss. This indicates the key being read does not match the key being written.

**Severity**: P3 — no data correctness risk, but cache is providing no value (DB load not reduced).

**Diagnosis steps**:
1. Enable debug logging in the cache adapter to print the actual key being computed for a
   known request (use a fixed test request with known params).
2. Compare the logged key against the expected pattern in `plan.md §Cache Key Design`.
3. Common causes:
   - **Parameter ordering**: filter object key order is not being canonicalized. Check that
     `sortObjectKeys` is applied before hashing.
   - **Undefined params included**: an undefined value in the filter is changing the hash.
     Check for optional params that may be `undefined` vs. omitted.
   - **Locale/region prefix**: the key includes an unexpected locale or A/B test bucket ID.
   - **Wrong policy applied**: the surface decorator is using a different policy object than
     the one specified in `cache-policy.ts`.

**Actions**:
- Fix the key normalization issue.
- Add a unit test for the specific request shape that was causing the miss.
- After the fix is deployed, monitor hit rate recovery within 5 minutes.

---

## Incident 6 — Redis Memory Alert (> 70% utilization)

**What's happening**: Redis memory is approaching the configured alert threshold.

**Severity**: P3 initially; escalates to P2 if > 85%, P1 if > 95% (errors imminent).

**Diagnosis steps**:
1. Identify the largest key namespace via Upstash dashboard or SCAN analysis.
2. Check if opportunity search cardinality has exceeded the 10,000-key warning threshold.
3. Check if any surface has abnormally large payloads (admin reports > 512 KB?).

**Actions (P3 — 70–85%)**:
- Review opportunity search key cardinality. If > 10,000 keys, tighten the query normalization
  or reduce the query length limit from 100 chars to 60 chars.
- Confirm gzip compression is active in the codec (payloads should be 60–80% smaller than raw JSON).
- Confirm `maxPayloadBytes` is enforced per surface (large entries should bypass caching).

**Actions (P2 — 85–95%)**:
- Temporarily disable the highest-cardinality surfaces:
  ```
  CACHE_SURFACE_OPPORTUNITIES_SEARCH_ENABLED=false
  CACHE_SURFACE_ADMIN_REPORTS_ENABLED=false
  ```
- Review whether TTLs are too long and should be reduced.

**Actions (P1 — > 95%, errors imminent)**:
- Verify Upstash eviction policy is `volatile-lru`. If set to `noeviction`, change it immediately.
- If `volatile-lru` is set and memory is still critically high, purge the lowest-priority namespaces:
  ```
  SCAN 0 MATCH "sx:v1:opportunities:search:*" COUNT 500 → DEL (search is lowest-priority)
  SCAN 0 MATCH "sx:v1:admin:reports:*" COUNT 500 → DEL
  ```
- Consider upgrading Upstash plan to a higher memory tier.

---

## Quick Reference: Emergency Commands

```bash
# Disable all caching globally (keep rate limits active)
# → Set in deployment env: CACHE_ENABLED=false → trigger redeployment

# Disable distributed rate limits (fallback to in-memory)
# → Set in deployment env: DISTRIBUTED_RATE_LIMITS_ENABLED=false → trigger redeployment

# Clear a specific surface namespace (Redis CLI or Upstash console)
SCAN 0 MATCH "sx:v1:profiles:public:*" COUNT 100
# → DEL each returned key manually, or use UNLINK for async deletion

# Clear a specific tag index and all its associated keys
SMEMBERS sx:v1:tag:profile:{username}
# → DEL each key, then DEL sx:v1:tag:profile:{username}

# Check circuit breaker state (from application logs)
# → Look for cache.circuit.* metric events in your telemetry tool
# → Or call getStatus() from the cache factory if a debug endpoint is available

# Check Redis memory usage
INFO memory   # via redis-cli or Upstash REST API
```

---

## Post-Incident Checklist

After any P1 or P2 cache incident is resolved:

- [ ] Root cause documented in post-mortem
- [ ] Regression test added for the specific failure mode
- [ ] Alert threshold reviewed — was this detectable earlier?
- [ ] Runbook updated if diagnosis steps were missing or incorrect
- [ ] Privacy register updated if any PII was exposed (even briefly)
- [ ] `CACHE_ENABLED` and surface flags restored to intended state
- [ ] Hit rate, error rate, and invalidation failure rate confirmed normal for 30 minutes post-recovery
