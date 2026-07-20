# Email Verification Skip — Storage Analysis

**Feature**: `017-admin-cash-enrollment`  
**Date**: 2026-07-20  
**Status**: Implemented (Database-backed)

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

## Implemented Decision: Database-Backed Flow

Despite the initial Redis recommendation, the final implementation uses a persistent **database column** (`email_verification_skipped` on the user table).

### Rationale for DB-backed implementation

1. **Simplicity over TTL mechanisms**: While Redis TTL automatically handles the 24-hour expiration, relying on the database keeps the authentication and session state unified in Better Auth.
2. **Persistence across sessions**: A database column ensures that the "skipped" state doesn't disappear simply because the Redis cache is flushed or restarted.
3. **Lack of automatic 24-hour expiry**: The database implementation opts out of the strict 24-hour auto-reprompt. Instead, the flag persists until explicitly cleared (e.g., upon successful email verification or specific re-prompt workflows), providing a simpler lifecycle without the need for periodic re-prompting timers.
4. **Integration with existing DB schema**: Using Drizzle ORM and Better Auth, adding a boolean column is a straightforward schema addition that flows natively through the existing user objects.

---

## Architectural Decision Record

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | Database | Unified state with user data; avoids dual source of truth with Redis |
| Expiry/TTL | Persistent (No automatic 24h TTL) | Simplifies lifecycle; persists until explicitly cleared or verified |
| Fail-open | N/A | Database is the primary source of truth, no secondary cache to fail |
| Cleanup on verify | Manual DB Update | `email_verification_skipped` is set to `false` when email is verified |
| Schema change | Yes (`ALTER TABLE`) | Required to store the flag permanently alongside the user/session record |
