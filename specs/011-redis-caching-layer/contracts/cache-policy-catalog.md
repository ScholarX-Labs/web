# Contract: Cache Policy Catalog

This catalog defines the required initial cache policy for each ScholarX surface.
Every surface must have `negativeTtlSeconds` set when `fallbackMode` is `"source"` or
`"safe-stale"` to prevent cache stampede against non-existent entities.

## Surface Policies

| Surface ID | Owner | Audience | Fresh TTL | Stale TTL | Negative TTL | Jitter | Max Payload | Stampede | Tags | Failure Behavior |
|---|---|---|---|---|---|---|---|---|---|---|
| `courses.public.list` | courses | public | 60s | 10m | 30s | +10s | 256 KB | XFetch | `courses`, `courses:list`, category tags | source → safe-stale on source failure |
| `courses.public.categories` | courses | public | 60s | 10m | 30s | +10s | 64 KB | XFetch | `courses`, `courses:categories` | source → safe-stale on source failure |
| `courses.public.detail` | courses | public | 60s | 10m | 30s | +10s | 128 KB | XFetch | `courses`, `course:{id}`, `course:{slug}` | source → safe-stale on source failure |
| `courses.public.lessons` | courses | public/authenticated | 60s | 10m | 30s | +10s | 128 KB | XFetch | `course:{id}`, `course:{id}:lessons` | source → safe-stale on source failure |
| `opportunities.detail` | opportunities | public | 6h | 24h | 60s | +30m | 256 KB | XFetch | `opportunities`, `opportunity:{id}`, `lang:{lang}` | safe-stale on upstream failure |
| `opportunities.search` | opportunities | public | 5m | 30m | 30s | +30s | 128 KB | XFetch | `opportunities:search` | safe-stale on upstream failure |
| `profiles.public` | profiles | public | 60s | 10m | 30s | +10s | 32 KB | XFetch | `profile:{username}`, `profile-user:{userId}` | source; short negative cache |
| `certificates.public.verification` | certificates | public | 30s | 5m | 30s | +5s | 32 KB | Mutex | `certificate:{number}` | source; invalidate on revoke |
| `certificates.public.artifact-status` | certificates | public | 5s | 30s | 10s | +1s | 8 KB | Mutex | `certificate:{number}`, `certificate:{number}:artifact` | source |
| `admin.stats.overview` | admin | admin-scoped | 30s | 2m | N/A | +5s | 64 KB | XFetch | `admin:stats`, `admin:user:{userId}:stats` | source |
| `admin.reports.*` | admin | admin-scoped | 60s | 5m | N/A | +10s | 512 KB | XFetch | `admin:reports`, `admin:user:{userId}:reports`, report range hash | source |
| `admin.lists.*` | admin | admin-scoped | 30s | 2m | N/A | +5s | 128 KB | XFetch | `admin:list:{entity}`, `admin:user:{userId}:lists` | source |
| `config.runtime` | config | system | 60s | 5m | 30s | +10s | 16 KB | XFetch | `config:{key}` | source |
| _rate limits_ | rate-limit | system | window-specific | N/A | N/A | N/A | N/A | N/A | distributed Redis limiter keys per rule | fail-closed or fail-open per rule |

> **Admin Cache Scoping**: Admin surface tags include both a global tag (`admin:stats`) and a
> user-scoped tag (`admin:user:{userId}:stats`). Cache entries for admin surfaces must be keyed
> with a per-user scope to prevent cross-admin data leakage, and must be invalidated on role
> revocation (see §Required Invalidation Events).

---

## Explicit Non-Cacheable Shared Surfaces

- Better Auth sessions and authorization decisions
- Raw user account records (email, password hash, verification internals)
- Enrollment status and learner progress in any public cache entries
- Course application form submissions and write responses
- Certificate download signed URL generation and private storage keys
- Raw email delivery bodies, provider payloads, and secrets
- Admin mutation responses where immediate consistency is required
- Per-request admin authorization results (`resolveAdmin`, session checks, role lookups)

---

## Required Invalidation Events

| Event | Tags Invalidated | Priority |
|---|---|---|
| `course.created` | `courses`, `courses:list`, `courses:categories` | standard |
| `course.updated` | `courses`, `course:{id}`, `course:{slug}`, `courses:list` | standard |
| `course.status_changed` | `courses`, `course:{id}`, `course:{slug}`, `courses:list`, `courses:categories` | **immediate** |
| `course.archived` | `courses`, `course:{id}`, `course:{slug}`, `courses:list`, `courses:categories` | **immediate** |
| `lesson.created` | `course:{id}`, `course:{id}:lessons` | standard |
| `lesson.updated` | `course:{id}`, `course:{id}:lessons` | standard |
| `lesson.archived` | `course:{id}`, `course:{id}:lessons` | **immediate** |
| `lesson.reordered` | `course:{id}`, `course:{id}:lessons` | standard |
| `profile.updated` | `profile:{username}`, `profile-user:{userId}` | standard |
| `profile.privacy_changed` | `profile:{username}`, `profile-user:{userId}` | **immediate** |
| `profile.avatar_changed` | `profile:{username}`, `profile-user:{userId}` | standard |
| `profile.deleted` | `profile:{username}`, `profile-user:{userId}` | **immediate** |
| `certificate.issued` | `certificate:{number}` | standard |
| `certificate.revoked` | `certificate:{number}`, `certificate:{number}:artifact` | **immediate** |
| `certificate.artifact_ready` | `certificate:{number}`, `certificate:{number}:artifact` | standard |
| `certificate.artifact_failed` | `certificate:{number}`, `certificate:{number}:artifact` | standard |
| `config.updated` | `config:{key}` | standard |
| **`admin.role_revoked`** | `admin:stats`, `admin:user:{userId}:stats`, `admin:reports`, `admin:user:{userId}:reports`, `admin:list:*`, `admin:user:{userId}:lists` | **immediate** |
| **`admin.role_granted`** | _(no invalidation required; new role gets fresh misses)_ | N/A |
| **`admin.account_deleted`** | `admin:user:{userId}:stats`, `admin:user:{userId}:reports`, `admin:user:{userId}:lists` | **immediate** |
| **`user.account_deleted`** (GDPR) | `profile:{username}`, `profile-user:{userId}`, `admin:user:{userId}:stats`, `admin:user:{userId}:reports`, `admin:user:{userId}:lists` | **immediate** |

> **Immediate** invalidation events must call `invalidateTags` **synchronously before returning success**
> to the mutation caller. Standard events may emit invalidation synchronously or enqueue it as a
> best-effort background call, relying on TTL for bounded recovery if the call is missed.

---

## Negative TTL Policy

`negativeTtlSeconds` is **required** for any surface where `fallbackMode` is `"source"` or
`"safe-stale"`. It must be set to a value greater than zero. Omitting it for these surfaces
creates a cache-stampede risk: every request for a non-existent entity bypasses the cache
and hits the authoritative source simultaneously.

Recommended minimums:

| Surface | Recommended Negative TTL |
|---|---|
| Profiles (unknown username) | 30s |
| Certificates (invalid number) | 30s |
| Courses (unknown slug/id) | 30s |
| Opportunities (unknown id) | 60s |
| Config (unknown key) | 30s |

Admin surfaces (`admin.*`) do not need negative TTL because they are scoped per user and
only populated after authorization succeeds; a miss is expected and acceptable.

---

## Opportunity Search Cache Cardinality Controls

The `opportunities.search` surface caches by normalized query text. Without cardinality controls,
this creates unbounded Redis memory growth and low hit rates for unique or long-tail queries.

**Required controls**:

1. **Query length limit**: Only cache search queries of 100 characters or fewer after normalization.
   Queries exceeding this limit must bypass the cache (`fallbackMode: "bypass"` applied at runtime).
2. **Character filtering**: Queries containing special characters beyond basic punctuation (e.g.,
   SQL injection patterns, base64-like strings, repeated symbols) must bypass caching.
3. **Normalization**: Before hashing, apply: lowercase → trim → collapse multiple spaces → sort
   individual filter/tag components alphabetically.
4. **Max cached query count**: The adapter should track total key count for `opportunities:search`
   tag and emit a warning metric when it exceeds 10,000 distinct cached queries.

These controls are enforced in the `opportunity-cache.ts` boundary, not in the generic cache port.
