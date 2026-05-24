# Contract: Distributed Rate Limit Port

This contract replaces process-local rate-limit Maps and centralizes Redis-backed request controls.

---

## DistributedRateLimiter

```ts
export interface DistributedRateLimiter {
  check(input: RateLimitCheckInput): Promise<RateLimitDecision>;
}
```

---

## Inputs

```ts
export interface RateLimitRule {
  id: string;
  windowSeconds: number;
  maxRequests: number;
  failureMode: "fail-open" | "fail-closed";
  /**
   * Sliding window is preferred for abuse-prevention rules because it prevents
   * 2× burst at fixed-window boundaries. Fixed window is acceptable for
   * lower-risk quota limits where burst tolerance is intentional.
   */
  algorithm: "slidingWindow" | "fixedWindow" | "tokenBucket";
}

export interface RateLimitCheckInput {
  rule: RateLimitRule;
  /**
   * Normalized, hashed actor identifier (user id hash, IP hash, or composite).
   * Must never contain raw email addresses, full IP addresses, or tokens.
   */
  actorKey: string;
  resourceKey?: string;
  now?: Date;
}
```

---

## Results

```ts
export type RateLimitDecision =
  | {
      allowed: true;
      remaining: number;
      resetAt: Date;
      source: "redis" | "fallback";
    }
  | {
      allowed: false;
      remaining: 0;
      resetAt: Date;
      retryAfterSeconds: number;
      source: "redis" | "fallback";
      reason: "limit_exceeded" | "limiter_unavailable";
    };
```

---

## Initial Rules

| Rule ID | Actor | Window | Max | Algorithm | Failure Mode | Rationale |
|---|---|---|---|---|---|---|
| `avatar.upload.user.hour` | user id | 1h | 3 | slidingWindow | **fail-closed** | Prevents storage abuse; must be consistent across instances |
| `avatar.upload.user.day` | user id | 24h | 5 | slidingWindow | **fail-closed** | Daily hard cap |
| `avatar.upload.user.week` | user id | 7d | 7 | slidingWindow | **fail-closed** | Weekly hard cap |
| `avatar.upload.user.month` | user id | 30d | 10 | slidingWindow | **fail-closed** | Monthly hard cap |
| `admin.api.user.minute` | admin user id + path hash | 1m | route-specific | slidingWindow | **fail-closed** | Prevents admin API abuse; route-specific max defined in factory |
| `course.application.user-resource.10m` | user id + course id + IP hash | 10m | 5 | slidingWindow | **fail-closed** | Prevents duplicate application spam; composite actor key |
| `contact.submit.ip.hour` | IP hash | 1h | 5 | slidingWindow | **fail-closed** | Contact form abuse prevention |
| `public.profile.ip.minute` | IP hash | 1m | 60 | fixedWindow | **fail-open** | Low-risk read scraping throttle; blocking legitimate visitors is worse |
| `opportunities.search.ip.minute` | IP hash | 1m | 30 | fixedWindow | **fail-open** | Low-risk search scraping throttle |

### Algorithm Selection Rationale

- **`slidingWindow`**: Chosen for all abuse-prevention rules (`fail-closed`). Upstash
  `@upstash/ratelimit` implements this via two sorted sets (previous + current window), which
  provides smooth rate limiting without burst doubling at window boundaries. ~2× Redis operations
  vs fixed window, which is acceptable for low-frequency sensitive operations.

- **`fixedWindow`**: Chosen for low-risk public read throttles (`fail-open`). The 2× burst
  at window boundaries is acceptable because the rules are fail-open and the surfaces are
  low-risk. Single Redis operation per check.

- **`tokenBucket`**: Reserved for future use if a surface needs controlled burst allowance
  (e.g., a bulk import workflow that should allow short bursts but sustain a lower average rate).
  Not used in initial rules.

---

## Actor Key Construction

Actor keys must be constructed as follows:

```ts
// User-only actor
actorKey = sha256(userId).slice(0, 24);

// IP-only actor
actorKey = sha256(normalizeIp(ip)).slice(0, 24);

// Composite actor (user + resource + IP)
actorKey = sha256(`${userId}:${resourceId}:${normalizeIp(ip)}`).slice(0, 24);
```

`normalizeIp` strips port number and normalizes IPv6 to compressed form.
The 24-character hex prefix is sufficient for uniqueness across expected actor populations
while keeping key size manageable.

---

## Behavioral Requirements

1. Actor keys must be normalized and hashed before use in rate-limit store keys. Raw emails,
   full IPs, and session IDs must not appear in Redis key names.
2. Route handlers must receive a user-safe retry response with `Retry-After` header when denied.
   The `retryAfterSeconds` field from `RateLimitDecision` maps directly to this header value.
3. Limiter failures (Redis unavailable, timeout, parse error) must emit a metric with the rule ID
   and then follow each rule's `failureMode`:
   - `fail-closed`: return `{ allowed: false, reason: "limiter_unavailable", source: "fallback" }`
   - `fail-open`: return `{ allowed: true, source: "fallback" }` with the maximum remaining estimate
4. Existing avatar upload behavior must remain compatible with the current response shape.
   The new port wraps the existing Upstash ratelimit call; the outer API contract must not change.
5. Admin and course application rate limiters must not use process-local Maps in any environment,
   including local development. The memory adapter for the `DistributedRateLimiter` port must be
   used instead when Redis credentials are absent.
6. The factory must accept the circuit breaker configuration from the shared cache factory to reuse
   the same Redis connection health state.

---

## Internal Service Exemption

Background workers, scheduled jobs, and internal service-to-service calls must not consume
user-facing rate limit quota. Examples of internal callers that would otherwise be blocked:

- Certificate generation worker polling `getArtifactStatus` repeatedly.
- Bulk admin course-archive operation triggering dozens of mutation events rapidly.
- Opportunity data sync job calling the search API for warming or validation.

### Exemption Mechanism

Internal requests include a server-side-only HMAC header before reaching rate limit middleware:

```
X-ScholarX-Internal: {hmac}
```

Where `hmac = HMAC-SHA256(INTERNAL_REQUEST_SECRET, timestamp_seconds_floor_to_30s)`.  
The 30-second floor prevents replay attacks while allowing clock skew tolerance.

The rate limiter middleware must:
1. Check for the `X-ScholarX-Internal` header before applying user/IP limits.
2. Verify the HMAC against `INTERNAL_REQUEST_SECRET` (server-only env var, never exposed to clients).
3. If valid: skip user/IP rate limits; apply the internal rule instead (see below).
4. If invalid or missing: treat as a normal external request.

`INTERNAL_REQUEST_SECRET` must never appear in client bundles, Next.js public env vars, or logs.

### Internal Rate Limit Rule

| Rule ID | Actor | Window | Max | Algorithm | Failure Mode |
|---|---|---|---|---|---|
| `internal.api.worker.minute` | worker name (static string) | 1m | 1000 | fixedWindow | fail-open |

This cap prevents runaway workers from accidentally DDoS-ing the application while remaining
high enough that normal background operations are never throttled.

### Rate-Limit Counter Retention on Account Deletion (GDPR)

Rate-limit counters are keyed to hashed user IDs or hashed IP addresses. Because the hash
cannot be reverse-mapped to a real user, natural window expiry is the default retention mechanism.

Explicit early deletion is optional and may be implemented with:
```
SCAN 0 MATCH "sx:v1:ratelimit:*:{hashedUserId}*" COUNT 100
DEL {each matching key}
```

If legal review determines that rate-limit counter retention constitutes personal data processing
under GDPR, implement the early deletion as part of the `user.account_deleted` compound event.
Document the legal decision in the project's privacy register.

---

## Retry-After Response Shape

When a rate limit is exceeded, route handlers must respond:

```
HTTP 429 Too Many Requests
Retry-After: {retryAfterSeconds}
Content-Type: application/json

{
  "error": "rate_limit_exceeded",
  "retryAfter": {retryAfterSeconds},
  "resetAt": "{resetAt.toISOString()}"
}
```

This shape must be consistent across all protected surfaces so clients can handle it uniformly.
