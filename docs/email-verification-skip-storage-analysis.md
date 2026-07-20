# Email Verification Skip — Storage Analysis

**Feature**: `017-admin-cash-enrollment`  
**Date**: 2026-07-20  
**Status**: Analysis only — no implementation changes

---

## Problem Statement

When a user clicks "Continue without verifying" on the email verification page, we need to store a flag (`emailVerificationSkipped`) that:

1. Allows the user to access the site without a verified email
2. Shows a persistent banner reminding them to verify
3. Auto-expires after 24 hours to force re-prompt
4. Is checked on every authenticated request

The question: **Where should this flag be stored?**

---

## Current Architecture: JWT Sessions

Better Auth uses JWT-based session management. The actual flow is:

```
Sign-in
  → JWT cookie issued (valid ~15 min)
  → User data embedded in JWT

Each request
  → JWT verified locally (NO database call)
  → User data extracted from JWT

JWT expires (~15 min)
  → Better Auth refreshes session
  → Database hit for fresh user data
  → New JWT issued with updated data
```

### Key Insight

The database is **not** hit on every request. It's hit **every ~15 minutes per session** on JWT refresh. Between refreshes, the JWT is the source of truth.

This means any flag stored in the database is only propagated to the client **every ~15 minutes** — up to 15 minutes stale.

---

## Option A: PostgreSQL Database Column

### Implementation

```sql
ALTER TABLE auth."user"
  ADD COLUMN email_verification_skipped boolean DEFAULT false NOT NULL;
```

```typescript
// auth-schema.ts
emailVerificationSkipped: boolean("email_verification_skipped").default(false).notNull()

// skip-email-verification/route.ts
await db.update(user).set({ emailVerificationSkipped: true }).where(eq(user.id, session.user.id));

// dal.ts — requireSession()
if (!session.user.emailVerified && !user.emailVerificationSkipped) {
  redirect(ROUTES.VERIFY_EMAIL);
}
```

### Re-prompt Mechanism

Requires a `session.create.before` hook in Better Auth config:

```typescript
databaseHooks: {
  session: {
    create: {
      before: async (sessionData) => {
        await db.update(schema.user)
          .set({ emailVerificationSkipped: false })
          .where(eq(schema.user.id, sessionData.userId));
      },
    },
  },
},
```

This clears the flag on every sign-in, forcing re-prompt on the next login.

### Pros

- Zero additional network calls (row already fetched by `getSession()`)
- Source of truth lives in the database
- Survives server restarts
- Simple mental model

### Cons

| Issue | Detail |
|-------|--------|
| **Staleness** | Flag is only read on JWT refresh (~every 15 min). If user verifies at 2:00 PM, the skip flag persists in the JWT until 2:15 PM. |
| **Manual cleanup** | Re-prompt requires a `session.create.before` hook. Verification doesn't auto-clear the flag. |
| **Schema change** | Requires DB migration (`ALTER TABLE`). |
| **Conceptual mismatch** | This is a temporary, session-level override — not permanent user profile data. |
| **No auto-expiry** | If the hook fails or is bypassed, the flag persists forever in the DB. |

### Staleness Diagram

```
2:00 PM  User clicks "Continue without verifying"
         → DB: email_verification_skipped = true
         → JWT: still has emailVerificationSkipped = false (stale)

2:05 PM  JWT refreshes
         → DB read: emailVerificationSkipped = true
         → New JWT: emailVerificationSkipped = true
         → User can now access site

2:10 PM  User verifies email
         → DB: email_verified = true, email_verification_skipped = true (still!)
         → JWT: emailVerificationSkipped = true (stale)
         → User still sees "Verify email" banner for ~5 min

2:15 PM  JWT refreshes
         → DB read: email_verified = true
         → New JWT: correct data
         → Banner disappears

Next sign-in
         → session.create.before hook fires
         → DB: email_verification_skipped = false
         → Clean
```

---

## Option B: Redis with 24-Hour TTL

### Implementation

```typescript
// Skip email verification
await redis.set(
  `emailVerificationSkipped:${userId}`,
  "1",
  "EX",
  86400  // 24 hours
);

// Check in requireSession() or middleware
const skipped = await redis.get(`emailVerificationSkipped:${userId}`);
if (!session.user.emailVerified && skipped !== "1") {
  redirect(ROUTES.VERIFY_EMAIL);
}

// Clear on explicit verification
await redis.del(`emailVerificationSkipped:${userId}`);
```

### Re-prompt Mechanism

Automatic via TTL:

```
2:00 PM  User clicks "Continue without verifying"
         → Redis: SET emailVerificationSkipped:{userId} EX 86400

24 hours later (next day 2:00 PM)
         → TTL expires
         → Key vanishes from Redis
         → User redirected to verify-email page
```

No hooks. No manual cleanup. TTL does the work.

### Pros

| Benefit | Detail |
|---------|--------|
| **Auto-expiry** | 24h TTL is the re-prompt mechanism. No hooks needed. |
| **No staleness** | Read on every check (or as needed). No waiting for JWT refresh. |
| **No schema change** | No `ALTER TABLE`. No migration. |
| **Fast reads** | ~0.5ms per Redis read vs ~5-15ms per DB query. |
| **Ephemeral by design** | Flag lives for max 24h, then vanishes. Matches the data's lifecycle. |
| **Clean verification** | `DEL` the key on verify → instant cleanup. |

### Cons

| Issue | Detail |
|-------|--------|
| **Extra network call** | Redis read on every check (~0.5ms). |
| **Redis dependency** | If Redis is down, need fail-open behavior. |
| **No persistence** | Flag is lost on Redis restart (but acceptable for ephemeral data). |
| **Dual source of truth** | DB has `email_verified`, Redis has `emailVerificationSkipped`. Two systems to reason about. |

### TTL Diagram

```
2:00 PM  User clicks "Continue without verifying"
         → Redis: SET emailVerificationSkipped:{userId} EX 86400
         → TTL: expires tomorrow 2:00 PM

2:05 PM  User verifies email
         → Redis: DEL emailVerificationSkipped:{userId}
         → Clean. No banner. No stale data.

Next day 2:00 PM (if not verified)
         → TTL expires
         → Key vanishes
         → User redirected to verify-email
```

---

## Comparison Matrix

| Factor | DB Column | Redis + 24h TTL |
|--------|-----------|-----------------|
| **Check frequency** | Every ~15 min (JWT refresh) | Every request (or as needed) |
| **Staleness** | Up to 15 min | None |
| **Re-prompt mechanism** | Manual `session.create.before` hook | Automatic TTL expiry |
| **Cleanup on verify** | Manual `UPDATE` or hook | Manual `DEL` or TTL |
| **Schema change** | Yes (`ALTER TABLE`) | No |
| **Extra network call** | No | Yes (~0.5ms) |
| **Survives restart** | Always | Only with Redis persistence |
| **Conceptual fit** | Permanent user data | Ephemeral session override |
| **Failure mode** | Flag persists forever if hook fails | Flag vanishes on Redis restart |
| **Complexity** | Low | Medium |

---

## Recommendation

**Redis with 24h TTL is the correct choice.** Here's why:

### 1. The data IS ephemeral

This flag is not user profile data. It's a temporary session-level override that:
- Lives for max 24 hours
- Vanishes on expiry
- Is never queried, joined, or reported on
- Has zero value after verification

That's the textbook Redis use case.

### 2. TTL IS the re-prompt mechanism

The DB approach requires:
1. A `session.create.before` hook to clear the flag on sign-in
2. Manual cleanup on email verification
3. A schema migration

Redis requires:
1. `SET key EX 86400`

That's it. TTL handles everything.

### 3. No staleness

The DB approach has a 15-minute staleness window (JWT lifetime). If a user verifies their email, they still see the banner for up to 15 minutes. Redis checks happen on every request — no stale data.

### 4. The extra network call is negligible

Redis read: ~0.5ms  
DB query: ~5-15ms  

And the DB query for the session **doesn't happen on every request**. It happens on JWT refresh. If you want the skip check to be tighter than "every 15 minutes," Redis is the only option.

### 5. When Redis approach struggles

- **Redis is unavailable**: Need fail-open (allow through, show banner as degraded experience)
- **Redis restart**: Flag is lost — user gets re-prompted. Acceptable for ephemeral data.
- **Dual source of truth**: DB has `email_verified`, Redis has `emailVerificationSkipped`. Need clear mental model.

---

## Architectural Decision Record

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | Redis | Ephemeral, TTL-driven, frequently-checked flag |
| TTL | 24 hours | Matches product requirement for daily re-prompt |
| Fail-open | Yes | Don't block users if Redis is down |
| Cleanup on verify | Explicit `DEL` + TTL fallback | Belt and suspenders |
| DB column | Not needed | Redis is the source of truth for this flag |

---

## Open Questions

1. **What if Redis is down when the user skips?** Fail-open: skip the check, show banner as degraded experience.
2. **What if Redis is down on the next request?** Same fail-open. User gets through but banner shows.
3. **Should we also clear on sign-in?** Optional belt-and-suspenders. TTL handles it, but an explicit `DEL` on sign-in is cleaner.
4. **Redis key namespace**: Use existing `emailVerificationSkipped:{userId}` pattern consistent with other cache keys.
