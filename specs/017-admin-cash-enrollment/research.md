# Research: Admin Cash Enrollment

**Feature**: `017-admin-cash-enrollment`
**Date**: 2026-07-19

---

## Decision 1: Password Generation Strategy

**Decision**: Use Better Auth's built-in password hashing with a system-generated random password.

**Rationale**:
- Better Auth handles password hashing (bcrypt/argon2) internally.
- `auth.api.signUpEmail()` accepts a `password` parameter — we generate a random password and pass it.
- The password hash is stored in the auth schema, never in plaintext.
- No need to implement custom password hashing.

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Crypto.randomBytes(16) | Works but needs manual bcrypt hashing — Better Auth does this automatically |
| Passlib-style generate | External dependency not needed — Node.js crypto is sufficient |
| UUID-based password | Unfriendly for manual relay — too long and complex |

**Implementation**:
```typescript
import { randomBytes } from "crypto";

function generateTemporaryPassword(): string {
  // 12 bytes = 24 hex chars, uppercase + digits for readability
  return randomBytes(12)
    .toString("base64url")
    .toUpperCase()
    .slice(0, 16)
    .replace(/[0O]/g, "X"); // Replace ambiguous chars
}
```

---

## Decision 2: Forced Password Change on First Login

**Decision**: Add a `mustChangePassword` flag to the user record and check it in the auth middleware.

**Rationale**:
- Better Auth doesn't have built-in forced password change.
- We need a custom field to track this state.
- The auth middleware or a hook can redirect users with `mustChangePassword: true` to a change-password page.

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Password expiry policy | Too complex — time-based expiry is overkill for this use case |
| First-login token | Changes the auth flow significantly |
| Separate "password reset" flow | Better Auth has `forgotPassword` but it's for self-service reset, not admin-initiated |

**Implementation**:
- Add `mustChangePassword` boolean column to the `user` table (auth schema).
- Set it to `true` when creating a user via admin.
- Check in a middleware or Better Auth hook — if `mustChangePassword === true` and the user is not on the change-password page, redirect.
- After successful password change, set `mustChangePassword = false`.

---

## Decision 3: Enrollment Idempotency

**Decision**: Add a unique constraint on `(user_id, course_id)` in the subscriptions table.

**Rationale**:
- Database-level guarantee against duplicates.
- `INSERT ... ON CONFLICT DO NOTHING` or catch the error and return 409.
- No application-level locks needed.

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Application-level check-then-insert | Race condition window between check and insert |
| Redis lock | Overkill — database constraint is simpler and more reliable |
| Optimistic locking with version column | Not needed — subscriptions don't have concurrent updates |

---

## Decision 4: Operations Section Navigation

**Decision**: Add a new top-level "Operations" section to the admin sidebar.

**Rationale**:
- Multi-step admin workflows (cash enrollment, future bulk operations) need their own space.
- Keeps course-specific and user-specific pages clean.
- Matches the existing mobile nav "Operations" overlay.

**Implementation**:
- Add to `SIDEBAR_NAV` in `admin-constants.ts`.
- Add to `ADMIN_ROUTES` with route `/admin/operations`.
- Create the page at `src/app/admin/operations/cash-enrollment/page.tsx`.

---

## Decision 5: Enrollments Tab Placement

**Decision**: Add an "Enrollments" tab to the existing admin course detail page.

**Rationale**:
- Course-contextual — you're already viewing the course.
- Consistent with existing tab pattern (Curriculum, General, Pricing, Media, Management).
- Keeps all course-related admin operations in one place.

**Implementation**:
- Add a new tab to the `TABS` array in `admin/courses/[courseId]/page.tsx`.
- Create `EnrollmentsTab` component with enrolled users list + "Enroll User" modal.
- Reuse existing `enrollUser` API endpoint.
