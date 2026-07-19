# Implementation Plan: Admin Cash Enrollment

**Branch**: `017-admin-cash-enrollment` | **Date**: 2026-07-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/017-admin-cash-enrollment/spec.md`
**Constitution Version**: 1.0.0

---

## Summary

Implement an admin cash enrollment workflow that enables administrators to create user accounts for cash-paying customers and enroll them in paid courses. The feature has three entry points: (1) user creation from the Users page, (2) enrollment of existing users from the Enrollments tab on the course detail page, and (3) a combined create+enroll flow under the new Operations section. System-generated temporary passwords are displayed to the admin for relay to non-technical users, with forced password change on first login. All mutations are audit-logged and idempotent (no duplicate subscriptions).

---

## Technical Context

| Attribute | Value |
|-----------|-------|
| **Language** | TypeScript 5.x (strict mode, no `any`) |
| **Runtime** | Next.js 15 App Router, Node.js 20 |
| **Styling** | Tailwind CSS + existing design system tokens |
| **Auth** | Better Auth — `auth.api.signUpEmail()` for user creation, session for admin guard |
| **ORM / DB** | Drizzle ORM, PostgreSQL |
| **Testing** | Vitest + React Testing Library |
| **Scale** | Low — admin-only operations, single-digit concurrent admins |
| **Project Type** | Next.js web application (App Router, Server + Client Components) |

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Principle I — SOLID Architecture ✅

| SOLID Principle | How This Design Applies |
|-----------------|------------------------|
| **S — Single Responsibility** | `AdminUsersService` handles user creation only. `AdminCoursesService.enrollUser()` handles enrollment only. `AdminCashEnrollmentService` orchestrates the combined flow. |
| **O — Open/Closed** | Payment methods are an enum — new methods (e.g., "card") added to the enum without modifying enrollment logic. |
| **L — Liskov Substitution** | `AdminRepository` contract allows swapping DB implementation without affecting services. |
| **I — Interface Segregation** | User creation and enrollment are separate methods on the repository contract. |
| **D — Dependency Inversion** | Services depend on `AdminRepository` interface, not concrete Drizzle implementation. |

### Principle II — Type Safety ✅

- All input types validated with Zod schemas before entering service layer.
- Drizzle schema types flow through to contract types via explicit mappers.
- No `any` types in domain or service layers.

### Principle III — Testing Standards ✅

- `AdminUsersService.createUser()` — unit tests with mock repository.
- `AdminCoursesService.enrollUser()` — unit tests for duplicate prevention.
- `AdminCashEnrollmentService` — integration test for combined flow.
- UI components — React Testing Library smoke tests.

### Principle IV — Premium UX ✅

- Multi-step form for Operations/Cash Enrollment with clear progress indication.
- Password displayed in a copyable format with clear instructions.
- Toast notifications for success/error states.
- Form validation with inline error messages.

### Principle V — Performance, Scalability & Maintainability ✅

- Operations are admin-only, low concurrency — no caching needed.
- Idempotent enrollment via unique constraint on `(user_id, course_id)`.
- Audit logs are append-only, no performance impact on write path.

---

## Architecture Decision Records (ADRs)

### ADR-001: System-Generated Password with Admin Visibility

**Status**: Accepted

**Context**: Admin-created accounts need a password flow that works for non-technical users who receive credentials via WhatsApp/phone.

**Decision**: Generate a secure random password on the server, display it to the admin after user creation, and force password change on first login.

**Consequences**:
- Admin can relay credentials to non-technical users.
- Forced password change ensures the admin's temporary visibility doesn't become a long-term risk.
- Password is never stored in plaintext — only the hash is persisted.

**Alternatives Rejected**:
| Alternative | Rejection Reason |
|-------------|-----------------|
| Admin sets password | Admin could reuse passwords across accounts; security risk |
| Magic link only | Changes auth model significantly; not compatible with existing email/password |
| No password display | Non-technical users can't self-service without admin relay |

### ADR-002: Separate Enrollments Tab vs Combined Flow

**Status**: Accepted

**Context**: Two distinct admin workflows: (1) enroll existing user in a course, (2) create user + enroll + payment in one flow.

**Decision**: US2 (enroll existing) lives in the Enrollments tab on the course detail page. US3 (combined) lives in Operations/Cash Enrollment as a dedicated page.

**Consequences**:
- US2 is course-contextual — you're already on the course page.
- US3 needs both user and course selection from scratch — dedicated page gives space for multi-step form.
- Clean separation of concerns.

### ADR-003: Idempotent Enrollment via Unique Constraint

**Status**: Accepted

**Context**: Two admins could simultaneously enroll the same user, or an admin could retry a failed enrollment.

**Decision**: Add a unique constraint on `(user_id, course_id)` in the subscriptions table. Use `INSERT ... ON CONFLICT DO NOTHING` or catch the unique violation and return a clear error.

**Consequences**:
- Zero duplicate subscriptions guaranteed at the database level.
- Retry-safe — idempotent by design.

---

## Project Structure

### Documentation (this feature)

```text
specs/017-admin-cash-enrollment/
├── spec.md               ← Approved feature specification
├── plan.md               ← This document
├── research.md           ← ADR evidence and best practices
├── data-model.md         ← Database schema changes, entity relationships
├── quickstart.md         ← Local dev setup
├── checklists/
│   └── requirements.md   ← Spec quality checklist
└── tasks.md              ← Task breakdown (generated by /speckit-tasks)
```

### Source Code Layout

```text
src/
├── app/
│   ├── admin/
│   │   ├── users/
│   │   │   └── page.tsx                    # Add "Create User" button + modal
│   │   ├── courses/
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx                # Add "Enrollments" tab
│   │   │       └── _components/
│   │   │           └── enrollments-tab.tsx # New: enrolled users list + enroll modal
│   │   └── operations/
│   │       └── cash-enrollment/
│   │           └── page.tsx                # New: combined create+enroll flow
│   └── api/
│       └── admin/
│           └── [[...path]]/
│               └── route.ts                # Extend with new endpoints
│
├── components/
│   └── admin/
│       ├── create-user-modal.tsx           # New: user creation form
│       ├── enroll-user-modal.tsx           # New: enrollment form
│       ├── cash-enrollment-form.tsx        # New: combined create+enroll multi-step form
│       └── password-display.tsx            # New: temporary password display component
│
├── domain/
│   └── admin/
│       ├── application/
│       │   ├── admin-users.service.ts      # Extend: add createUser()
│       │   ├── admin-courses.service.ts    # Extend: add enrollUser() with paymentMethod/amount
│       │   └── admin-cash-enrollment.service.ts  # New: combined flow orchestrator
│       ├── contracts/
│       │   ├── admin-types.ts              # Extend: add CreateUserInput, EnrollUserInput
│       │   ├── admin-validation.schemas.ts # Extend: add CreateUserSchema, EnrollUserSchema
│       │   └── admin-repository.contract.ts # Extend: add createUser()
│       └── infrastructure/
│           └── db/
│               └── admin.repository.ts     # Extend: implement createUser(), update enrollUser()
│
└── db/
    └── schema/
        └── courses-db.schema.ts            # Extend: add paymentMethod to dbSubscriptions
```

---

## API Contracts

### `POST /api/admin/users` — Create User

**Auth**: Admin session required.
**Request Body**:

```typescript
{
  email: string;        // required, valid email
  firstName: string;    // required, 1-100 chars
  lastName: string;     // required, 1-100 chars
  phoneNumber?: string; // optional
}
```

**Response** (201):

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
  };
  temporaryPassword: string;  // displayed to admin for relay
}
```

**Errors**:
- 409: Email already exists
- 400: Validation error

---

### `POST /api/admin/courses/[courseId]/enroll` — Enroll User

**Auth**: Admin session required.
**Request Body**:

```typescript
{
  email: string;                    // required, must exist
  paymentMethod: "cash" | "bank_transfer" | "other";  // required
  amount: number;                   // required, > 0
}
```

**Response** (201):

```typescript
{
  subscription: {
    id: string;
    userId: string;
    courseId: string;
    paymentMethod: string;
    amount: number;
    status: "active";
  };
}
```

**Errors**:
- 404: User not found
- 409: User already enrolled in this course
- 400: Validation error

---

### `POST /api/admin/operations/cash-enrollment` — Combined Create + Enroll

**Auth**: Admin session required.
**Request Body**:

```typescript
{
  user: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  };
  courseId: string;
  paymentMethod: "cash" | "bank_transfer" | "other";
  amount: number;
}
```

**Response** (201):

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
  };
  temporaryPassword: string;
  subscription: {
    id: string;
    courseId: string;
    paymentMethod: string;
    amount: number;
    status: "active";
  };
}
```

**Errors**:
- 409: Email already exists
- 404: Course not found
- 400: Validation error

---

## Complexity Tracking

No constitution violations. All patterns (domain service layer, repository interfaces, factory wiring) are established in the existing `src/domain/admin` bounded context and are being extended consistently.
