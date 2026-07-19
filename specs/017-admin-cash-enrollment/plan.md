# Implementation Plan: Admin Cash Enrollment

**Branch**: `017-admin-cash-enrollment` | **Date**: 2026-07-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/017-admin-cash-enrollment/spec.md`
**Constitution Version**: 1.0.0
**Plan Revision**: 3 — OOP + Production Hardening (Principal SWE)

---

## Summary

Implement an admin cash enrollment workflow enabling administrators to create user accounts for cash-paying customers and enroll them in paid courses. Three entry points: (1) user creation from the Users page, (2) enrollment of existing users from the Enrollments tab on the course detail page, and (3) a combined create+enroll flow under the new Operations section. System-generated temporary passwords are displayed to the admin for relay, with forced password change on first login. All mutations are audit-logged and idempotent.

---

## Critical Research Findings (Revision 3 Additions)

These are concrete facts discovered by reading the actual codebase — each one changes the implementation plan:

### Finding 1: Better Auth `admin()` Plugin Is Already Installed

**File**: `src/lib/auth.ts`, line 423 — `plugins: [..., admin(), ...]`

**Impact**: Better Auth's `admin` plugin exposes `auth.api.admin.createUser({ email, password, name, ... })` server-side. This returns a typed object with `{ user: { id, email, name, ... } }`. We do **not** need to call `signUpEmail()` or do a two-step create-then-update. The `admin.createUser()` API call is the correct approach and already passes additional fields defined in `user.additionalFields`.

**Concern from review resolved**: "Better Auth `signUpEmail` return type" — moot. We use `auth.api.admin.createUser()` instead, which is purpose-built for server-side user provisioning and returns the user ID reliably.

---

### Finding 2: `dbSubscriptions` Has No Unique Constraint — Duplicates May Exist

**File**: `src/db/schema/courses-db.schema.ts`, lines 89–102 — `dbSubscriptions` has no `uniqueIndex` on `(userId, courseId)`.

**Impact**: The migration adding the unique constraint **will fail** if duplicate `(userId, courseId)` rows already exist in the database. A pre-migration cleanup query is mandatory.

**Required pre-migration SQL**:
```sql
-- Step 1: Identify duplicates — keep the oldest enrollment, delete the rest
DELETE FROM courses.subscriptions s
USING (
  SELECT user_id, course_id, MIN(enrolled_at) AS keep_at
  FROM courses.subscriptions
  GROUP BY user_id, course_id
  HAVING COUNT(*) > 1
) dups
WHERE s.user_id = dups.user_id
  AND s.course_id = dups.course_id
  AND s.enrolled_at > dups.keep_at;

-- Step 2: Only then add the constraint
ALTER TABLE courses.subscriptions
  ADD CONSTRAINT subscriptions_user_course_uq UNIQUE (user_id, course_id);
```

This becomes **Task T001-pre** before T001 in the task list.

---

### Finding 3: `mustChangePassword` Must Be Added as a Better Auth `additionalField`

**File**: `src/lib/auth.ts`, lines 299–390 — `user.additionalFields` is the extension mechanism for custom user fields.
**File**: `src/db/schema/auth-schema.ts` — `mustChangePassword` column does NOT exist yet.

**Impact**: Adding `mustChangePassword` requires:
1. Adding the column to `auth-schema.ts` (the Drizzle schema file).
2. Declaring it in `auth.ts` under `user.additionalFields` so Better Auth recognizes it.
3. Passing `mustChangePassword: true` in `auth.api.admin.createUser()` call.

Better Auth's `additionalFields` mechanism passes through all extra fields to the `databaseHooks.user.create.before` hook and ultimately to the DB insert.

**Enforcement location for forced change**: `src/lib/dal.ts` — the `requireSession()` function already enforces `emailVerified` and `phoneNumber` redirects. Adding `mustChangePassword` check here is the idiomatic location for this project. The check is: if `session.user.mustChangePassword === true`, redirect to `/change-password`.

---

### Finding 4: `amount` in `dbSubscriptions` Is Already `integer` (Cents)

**File**: `src/db/schema/courses-db.schema.ts`, line 97 — `amount: integer("amount")`.

**Impact**: The existing schema already uses integer cents for `amount`. No ambiguity — the plan is confirmed. UI must display `amount / 100`.

---

### Finding 5: Route Handler Is a Pure Factory of Plain Objects — Not OOP

**File**: `src/app/api/admin/[[...path]]/route.ts`, line 103 — `createAdminRouteHandlers` returns a plain object `{ GET, POST, PUT, PATCH, DELETE }`. All domain services are factory functions returning plain objects (`createAdminCoursesService` → `{ list, getById, ... }`).

**Impact**: The user explicitly requires OOP with classes and design patterns to reduce complexity from excessive procedural/functional code. The transition plan: domain **services** become **classes** with interface contracts. The repository becomes an **abstract class** (or interface + concrete class). This matches the user's requirement without changing the route handler (which can remain a factory — it's infrastructure glue, not domain logic).

---

## Technical Context

| Attribute | Value |
|-----------|-------|
| **Language** | TypeScript 5.x (strict mode, no `any`) |
| **Runtime** | Next.js 15 App Router, Node.js 20 |
| **Styling** | Tailwind CSS + existing design system tokens |
| **Auth** | Better Auth 1.5.4 with `admin()` plugin — use `auth.api.admin.createUser()` for server-side user provisioning |
| **ORM / DB** | Drizzle ORM, PostgreSQL |
| **Testing** | Vitest + React Testing Library |
| **Scale** | Low — admin-only operations, single-digit concurrent admins |

---

## Constitution Check (Revision 3)

### Principle I — SOLID Architecture

| SOLID Principle | Application in Revision 3 |
|-----------------|--------------------------|
| **S** | `AdminUsersService` (class): user CRUD only. `AdminCoursesService` (class): course + enrollment only. `AdminCashEnrollmentService` (class): saga coordination only — no DB access, no audit logging beyond delegating to services. `TemporaryPasswordGenerator` (class): password generation only. |
| **O** | `PAYMENT_METHODS` const drives `PaymentMethod` type and Zod `z.enum(PAYMENT_METHODS)` — adding a payment method is a config change, not a logic change. `IAdminRepository` interface is the extension point: swap Drizzle for any DB without touching services. |
| **L** | `DrizzleAdminRepository implements IAdminRepository` — any other concrete repository satisfies the same contract. All service constructors accept the abstract `IAdminRepository`, not the concrete class. |
| **I** | `IAdminRepository` defines **per-aggregate method groups** with JSDoc section headers. Callers import only the interface, not the concrete repository. The saga orchestrator uses only `IAdminUsersService` and `IAdminCoursesService` interfaces — never the raw repository. |
| **D** | All classes receive dependencies via **constructor injection**. The `AdminDomainFactory` is the single composition root — it wires the concrete implementations to the interface-typed service parameters. |

### Principle II — Type Safety (Strict)

- All repository methods return named model types — zero `any`.
- Input types derived via `z.infer<typeof Schema>` — schema drives type, never the reverse.
- `PaymentMethod` is a `const` + `typeof` union — not a string.
- `amount` is always integer cents — `z.number().int().positive()` enforces at boundary.
- `mustChangePassword` is a `boolean` additional field in Better Auth — typed in the session object.

### Principle III — Testing

- `TemporaryPasswordGenerator` — pure unit tests: no ambiguous chars, length, distribution check.
- `AdminUsersService` — unit tests with `MockAdminRepository` and `MockAuditLogger` injected via constructor.
- `AdminCoursesService.enrollUserWithPayment()` — tests for duplicate detection (mock throws conflict), cache invalidation, audit log.
- `AdminCashEnrollmentService` — saga tests for all three outcomes: full success, step-1 failure, step-2 failure.
- UI — React Testing Library for form states, submit, and error display.

---

## Architecture Decision Records

### ADR-001: Use `auth.api.admin.createUser()` Over `signUpEmail()`

**Status**: Accepted (Revised in Rev 3)

**Context**: Better Auth's `admin` plugin (already installed at `src/lib/auth.ts` line 423) exposes `auth.api.admin.createUser()` for server-side user provisioning. Rev 1/2 referenced `signUpEmail()` which is the client-facing signup endpoint.

**Decision**: Use `auth.api.admin.createUser({ email, password, name, data: { firstName, lastName, mustChangePassword: true, ... } })`.

**Why better**:
- Returns `{ user: { id, email, ... } }` — reliable ID access, no two-step needed.
- Designed for admin-side provisioning — bypasses email verification flow.
- Passes additional fields through the existing `additionalFields` mechanism.
- Does not trigger the `/sign-up/email` before-hook that checks for duplicate emails via the existing custom middleware (uses admin-specific endpoint).

**Consequence**: `AdminUsersService.createUser()` uses `auth.api.admin.createUser()` directly. The repository does **not** need a `createUser()` method for the Better Auth call — that's an external API call, not a DB operation. The repository `createUser()` method is replaced by a call to `auth.api.admin.createUser()` in the service, followed by a DB update to set `mustChangePassword = true` if Better Auth doesn't set it via additionalFields.

---

### ADR-002: `mustChangePassword` as Better Auth `additionalField` + `dal.ts` Enforcement

**Status**: Accepted (New in Rev 3)

**Context**: `mustChangePassword` does not exist in the current schema. Better Auth has an `additionalFields` mechanism that is already used for `firstName`, `lastName`, `role`, etc.

**Decision**:
1. Add `mustChangePassword` to `auth-schema.ts` as `boolean("must_change_password").notNull().default(false)`.
2. Declare it in `auth.ts` → `user.additionalFields` as `{ type: "boolean", required: false, defaultValue: false }`.
3. Pass `mustChangePassword: true` in the `auth.api.admin.createUser()` call's `data` field.
4. Enforce in `src/lib/dal.ts` → `requireSession()` — add redirect to `/change-password` if `session.user.mustChangePassword === true`.

**Why `dal.ts` not `middleware.ts`**: `requireSession()` already handles `emailVerified` and `phoneNumber` redirects at the application layer. Adding `mustChangePassword` here is consistent, avoids middleware complexity, and is evaluated only on authenticated routes that call `requireSession()`. Admin routes use `auth.api.getSession()` directly and guard themselves — they already won't redirect, which is correct (admin users are never provisioned via this flow).

**Reset**: The `/change-password` page calls a PATCH handler that sets `mustChangePassword = false` via a direct Drizzle update (not through Better Auth's reset password flow, which is for self-service).

---

### ADR-003: Pre-Migration Deduplication Before Unique Constraint

**Status**: Accepted (New in Rev 3)

**Context**: `dbSubscriptions` has no unique constraint on `(userId, courseId)`. Duplicate rows may exist in production.

**Decision**: The migration file generated by Drizzle will be manually edited to include a deduplication DELETE before the constraint DDL. The approach: keep the oldest enrollment per `(userId, courseId)` and delete the rest.

**Consequence**: Migration is non-destructive for legitimate data. The oldest enrollment is canonical — subsequent duplicates are artifacts of the missing constraint. This is a one-time cleanup; the constraint prevents future duplicates.

---

### ADR-004: Orchestration Saga Pattern for Combined Create+Enroll

**Status**: Accepted (Carried from Rev 2)

**Context**: `auth.api.admin.createUser()` is an external API call. DB enrollment is a separate write. These cannot share a database transaction.

**Decision**: `AdminCashEnrollmentService` is a saga coordinator with two sequential steps and defined compensation: if Step 1 (user creation) fails → throw; if Step 2 (enrollment) fails → user is preserved per spec US3-AC3, return partial-success `CashEnrollmentResult` with `enrollmentError` set and `subscription: null`. Route handler maps `null` subscription to HTTP 207.

---

### ADR-005: `enrollUserWithPayment` as New Repository Method (ISP)

**Status**: Accepted (Carried from Rev 2)

**Context**: Existing `enrollUser(courseId, email)` is used by revoke/simple paths. Adding payment fields breaks it.

**Decision**: New method `enrollUserWithPayment(courseId, userId, data): Promise<AdminSubscriptionModel>` alongside the existing method. New method takes `userId` (not `email`) — service resolves the user first.

---

### ADR-006: New API Endpoints as Branches Inside Existing Catch-All Router

**Status**: Accepted (Carried from Rev 2)

**Decision**: No new route files. New endpoints `POST /api/admin/users`, `GET /api/admin/courses/[courseId]/enrollments`, `POST /api/admin/courses/[courseId]/enroll` (updated), and `POST /api/admin/operations/cash-enrollment` are added as case branches in the existing `[[...path]]/route.ts` file.

---

### ADR-007: `amount` is Integer Cents — Already Confirmed by Existing Schema

**Status**: Accepted (Confirmed in Rev 3)

**Context**: `dbSubscriptions.amount` is already `integer` in the schema. No migration needed for the column type.

**Decision**: Zod validates `z.number().int().positive()`. UI displays `(amount / 100).toLocaleString()` with currency symbol.

---

### ADR-008: Domain Services Become Classes — OOP Migration Scope

**Status**: Accepted (New in Rev 3)

**Context**: User requires OOP with design patterns to replace the current procedural factory-function style.

**Decision**: New service files for this feature use the **Class + Interface** pattern. Existing services are **not** refactored in this PR (that would be scope creep). The three new service files (`AdminUsersService`, extending pattern; `AdminCoursesService`, extending pattern; `AdminCashEnrollmentService`, new) are written as classes. The repository contract becomes `IAdminRepository` (interface) + `DrizzleAdminRepository` (class).

**Rationale for scope boundary**: Refactoring all 8 existing service files in this PR would be a broad, risky change unrelated to cash enrollment. The new code demonstrates the OOP pattern; migration of existing services is a separate, dedicated refactor task.

---

## Design Patterns Applied (OOP)

### 1. Abstract Interface + Concrete Class — Repository Pattern

```typescript
// contracts/i-admin-repository.ts
export interface IAdminRepository {
  // ─── User operations ─────────────────────────────────────────────────────
  listUsers(query: AdminUserQuery): Promise<PaginatedData<AdminUserModel>>;
  getUser(id: string): Promise<AdminUserModel | null>;
  getUserByEmail(email: string): Promise<AdminUserModel | null>;
  updateUser(id: string, data: UpdateUserInput): Promise<AdminUserModel>;
  setUserRole(id: string, role: string): Promise<AdminUserModel>;
  blockUser(id: string, reason: string): Promise<AdminUserModel>;
  unblockUser(id: string): Promise<AdminUserModel>;
  suspendUser(id: string): Promise<void>;
  setMustChangePassword(userId: string, value: boolean): Promise<void>;   // NEW

  // ─── Course operations ────────────────────────────────────────────────────
  listCourses(query: AdminCourseQuery): Promise<PaginatedData<AdminCourseModel>>;
  getCourse(id: string): Promise<AdminCourseModel | null>;
  createCourse(data: CreateCourseInput): Promise<AdminCourseModel>;
  updateCourse(id: string, data: UpdateCourseInput, expectedVersion: Date): Promise<AdminCourseModel>;
  updateCourseStatus(id: string, status: string): Promise<AdminCourseModel>;
  archiveCourse(id: string): Promise<void>;
  enrollUser(courseId: string, email: string): Promise<void>;             // existing
  revokeUser(courseId: string, email: string): Promise<void>;             // existing
  enrollUserWithPayment(                                                   // NEW
    courseId: string,
    userId: string,
    data: EnrollWithPaymentInput,
  ): Promise<AdminSubscriptionModel>;
  listEnrollmentsByCourse(                                                 // NEW
    courseId: string,
    query: AdminEnrollmentQuery,
  ): Promise<PaginatedData<AdminEnrollmentRecord>>;

  // ... (all other existing methods with typed returns) ...
}

// infrastructure/db/drizzle-admin.repository.ts
export class DrizzleAdminRepository implements IAdminRepository {
  // Concrete implementations using Drizzle ORM
  // Methods renamed from camelCase factory-fn to class methods — same logic
  async enrollUserWithPayment(
    courseId: string,
    userId: string,
    data: EnrollWithPaymentInput,
  ): Promise<AdminSubscriptionModel> {
    const result = await db
      .insert(dbSubscriptions)
      .values({
        id: crypto.randomUUID(),
        userId,
        courseId,
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        status: "active",
        isActive: true,
        enrolledAt: new Date(),
      })
      .onConflictDoNothing()  // unique (userId, courseId) constraint
      .returning();

    if (result.length === 0) {
      throw AdminErrors.conflict("User is already enrolled in this course");
    }

    return this.mapSubscriptionRow(result[0]);
  }

  async setMustChangePassword(userId: string, value: boolean): Promise<void> {
    await db
      .update(dbUsers)
      .set({ mustChangePassword: value })
      .where(eq(dbUsers.id, userId));
  }

  private mapSubscriptionRow(row: typeof dbSubscriptions.$inferSelect): AdminSubscriptionModel {
    return {
      id: row.id,
      userId: row.userId,
      courseId: row.courseId,
      paymentMethod: row.paymentMethod as PaymentMethod | null,
      amount: row.amount ?? 0,
      status: (row.status ?? "active") as AdminSubscriptionModel["status"],
      enrolledAt: row.enrolledAt ?? new Date(),
    };
  }
}
```

---

### 2. Service Class + Constructor Injection — Dependency Inversion

```typescript
// application/admin-users.service.ts (class form — new code for createUser)
export interface IAdminUsersService {
  createUser(session: AdminSession, data: unknown): Promise<CreatedUserResult>;
  list(query: AdminUserQuery): Promise<PaginatedData<AdminUserModel>>;
  getById(id: string): Promise<AdminUserModel>;
  update(session: AdminSession, id: string, data: unknown): Promise<AdminUserModel>;
  setRole(session: AdminSession, id: string, data: unknown): Promise<AdminUserModel>;
  block(session: AdminSession, id: string, data: unknown): Promise<AdminUserModel>;
  unblock(session: AdminSession, id: string): Promise<AdminUserModel>;
  suspend(session: AdminSession, id: string): Promise<void>;
}

export class AdminUsersService implements IAdminUsersService {
  constructor(
    private readonly repo: IAdminRepository,
    private readonly audit: IAuditLogger,
    private readonly passwordGen: ITemporaryPasswordGenerator,
  ) {}

  async createUser(session: AdminSession, data: unknown): Promise<CreatedUserResult> {
    const parsed = CreateUserSchema.parse(data);
    const temporaryPassword = this.passwordGen.generate();

    // Use Better Auth admin plugin — returns { user: { id, email, name, ... } }
    const { auth } = await import("@/lib/auth");
    const result = await auth.api.admin.createUser({
      body: {
        email: parsed.email,
        password: temporaryPassword,
        name: `${parsed.firstName} ${parsed.lastName}`,
        // Additional fields passed through Better Auth additionalFields mechanism:
        data: {
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          phoneNumber: parsed.phoneNumber ?? null,
          mustChangePassword: true,   // enforced via dal.ts requireSession()
          emailVerified: true,         // admin-created accounts skip email verification
          role: "user",
        },
      },
      headers: new Headers(),
    });

    if (!result?.user?.id) {
      throw AdminErrors.internal("User creation failed — no user ID returned");
    }

    await this.audit.log({
      adminId: session.userId,
      action: "user.create",
      entityType: "user",
      entityId: result.user.id,
      after: { email: parsed.email, name: result.user.name },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return {
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      temporaryPassword,
    };
  }

  // ... (other methods — existing logic lifted from the factory function)
}
```

---

### 3. Orchestration Saga Pattern — Class-Based Coordinator

```typescript
// application/admin-cash-enrollment.service.ts
export interface IAdminCashEnrollmentService {
  createAndEnroll(session: AdminSession, data: unknown): Promise<CashEnrollmentResult>;
}

export class AdminCashEnrollmentService implements IAdminCashEnrollmentService {
  constructor(
    private readonly usersService: IAdminUsersService,
    private readonly coursesService: IAdminCoursesService,
  ) {}

  async createAndEnroll(
    session: AdminSession,
    data: unknown,
  ): Promise<CashEnrollmentResult> {
    const parsed = CashEnrollmentSchema.parse(data);

    // Saga Step 1: Create user — propagates any error upward (total failure)
    const { user, temporaryPassword } = await this.usersService.createUser(
      session,
      parsed.user,
    );

    // Saga Step 2: Enroll — catch failure, preserve user (spec US3-AC3)
    try {
      const subscription = await this.coursesService.enrollUserWithPayment(session, parsed.courseId, {
        userId: user.id,
        paymentMethod: parsed.paymentMethod,
        amount: parsed.amount,
        notes: parsed.notes,
      });
      return { user, temporaryPassword, subscription, enrollmentError: null };
    } catch (err) {
      const enrollmentError = err instanceof AdminError
        ? { code: err.code, message: err.message }
        : { code: "ENROLLMENT_FAILED", message: "Enrollment failed. Retry from the Enrollments tab." };

      return { user, temporaryPassword, subscription: null, enrollmentError };
    }
  }
}
```

---

### 4. Value Object with Strategy — `TemporaryPasswordGenerator`

```typescript
// lib/admin/temporary-password.ts
export interface ITemporaryPasswordGenerator {
  generate(): string;
}

export class TemporaryPasswordGenerator implements ITemporaryPasswordGenerator {
  // No ambiguous characters: 0 (zero), O (oh), 1 (one), I (eye)
  private static readonly ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" as const;
  private static readonly LENGTH = 16;
  // Largest multiple of ALPHABET.length fitting in a byte — eliminates modulo bias
  // 32 divides 256 evenly, so limit = 256 (no rejection needed for this alphabet size)
  private static readonly BIAS_LIMIT = 256 - (256 % TemporaryPasswordGenerator.ALPHABET.length);

  generate(): string {
    const { ALPHABET, LENGTH, BIAS_LIMIT } = TemporaryPasswordGenerator;
    const chars: string[] = [];

    while (chars.length < LENGTH) {
      const bytes = require("node:crypto").randomBytes(LENGTH * 2) as Buffer;
      for (const byte of bytes) {
        if (byte < BIAS_LIMIT && chars.length < LENGTH) {
          chars.push(ALPHABET[byte % ALPHABET.length]);
        }
      }
    }
    return chars.join("");
  }
}
```

**Properties**: 32-char alphabet (256 ÷ 32 = 8 exactly, zero modulo bias), 16 chars, ≈ 80 bits entropy, fully injectable for testing (implement `ITemporaryPasswordGenerator` with a fixed return value in tests).

---

### 5. Factory Pattern — Composition Root (Updated)

```typescript
// factory/admin-domain.factory.ts
import { DrizzleAdminRepository } from "@/domain/admin/infrastructure/db/drizzle-admin.repository";
import { DrizzleAuditLogger } from "@/domain/admin/infrastructure/audit/drizzle-audit-logger";
import { TemporaryPasswordGenerator } from "@/lib/admin/temporary-password";
import { AdminUsersService } from "@/domain/admin/application/admin-users.service";
import { AdminCoursesService } from "@/domain/admin/application/admin-courses.service";
import { AdminCashEnrollmentService } from "@/domain/admin/application/admin-cash-enrollment.service";
// ... other service imports ...

export const createAdminDomain = () => {
  // Infrastructure (concrete classes — only instantiated here)
  const repo = new DrizzleAdminRepository();
  const audit = new DrizzleAuditLogger();
  const passwordGen = new TemporaryPasswordGenerator();

  // Application services (depend on interfaces, not concretes)
  const users = new AdminUsersService(repo, audit, passwordGen);
  const courses = new AdminCoursesService(repo, audit);

  return {
    courses,
    lessons: createAdminLessonsService(repo, audit),   // existing factory — not refactored
    users,
    subscriptions: createAdminSubscriptionsService(repo, audit),
    inquiries: createAdminInquiriesService(repo, audit),
    stats: createAdminStatsService(repo),
    reports: createAdminReportsService(repo),
    // Saga orchestrator — receives service instances (not repo) to ensure
    // business logic (cache invalidation, audit) is never bypassed
    cashEnrollment: new AdminCashEnrollmentService(users, courses),
  };
};

export type AdminDomain = ReturnType<typeof createAdminDomain>;
```

---

### 6. Command Pattern — Router Dispatch (Existing Architecture, Extended)

The route handler is already a factory that returns HTTP verb handlers. New endpoints are new `if` branches. This is not changed — it's infrastructure glue and is already well-structured.

```typescript
// In the existing POST handler — new branches added:

// POST /api/admin/users (create user)
if (path.length === 1 && path[0] === "users" && request.method === "POST") {
  const result = await domain.users.createUser(admin, body ?? {});
  return NextResponse.json({ status: "success", data: result }, { status: 201 });
}

// POST /api/admin/courses/:courseId/enroll (enroll with payment)
if (path.length === 3 && path[0] === "courses" && path[2] === "enroll") {
  const result = await domain.courses.enrollUserWithPayment(admin, path[1], body ?? {});
  return NextResponse.json({ status: "success", data: result }, { status: 201 });
}

// POST /api/admin/operations/cash-enrollment (combined saga)
if (path.length === 2 && path[0] === "operations" && path[1] === "cash-enrollment") {
  const result = await domain.cashEnrollment.createAndEnroll(admin, body ?? {});
  const status = result.enrollmentError ? 207 : 201;
  return NextResponse.json({ status: "success", data: result }, { status });
}

// GET /api/admin/courses/:courseId/enrollments (list enrolled users)
// (this branch goes in the GET handler)
if (path.length === 3 && path[0] === "courses" && path[2] === "enrollments") {
  const pagination = parsePagination(request);
  const result = await domain.courses.listEnrollmentsByCourse(admin, path[1], pagination);
  return NextResponse.json({ status: "success", ...result });
}
```

---

### 7. Observer/Hook Pattern — `mustChangePassword` Enforcement

`dal.ts → requireSession()` acts as an observer that checks user flags on every authenticated request. Adding `mustChangePassword` here is an additive hook in the existing chain:

```typescript
// src/lib/dal.ts — updated requireSession()
export async function requireSession() {
  const session = await getSession();

  if (!session) redirect(ROUTES.SIGNIN);
  if (!session.user.emailVerified) redirect(ROUTES.VERIFY_EMAIL);
  if (!session.user.phoneNumber) redirect(ROUTES.PHONE_COLLECTION);

  // NEW: force password change for admin-created accounts
  if (session.user.mustChangePassword) redirect(ROUTES.CHANGE_PASSWORD);

  return session;
}
```

`ROUTES.CHANGE_PASSWORD` is added to `src/lib/routes.ts`. The change-password page itself does NOT call `requireSession()` — it calls `getSession()` directly to avoid a redirect loop.

---

## Domain Types (`admin-types.ts` additions)

```typescript
// ─── Payment method — Strategy pattern ───────────────────────────────────────
export const PAYMENT_METHODS = ["cash", "bank_transfer", "other"] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// ─── Input types — derived from Zod schemas (schema-first) ───────────────────
export type CreateUserInput   = z.infer<typeof CreateUserSchema>;
export type EnrollWithPaymentInput = z.infer<typeof EnrollWithPaymentSchema>;
export type EnrollUserByEmailInput = z.infer<typeof EnrollUserByEmailSchema>;
export type CashEnrollmentInput    = z.infer<typeof CashEnrollmentSchema>;

// ─── Return models — no `any` ─────────────────────────────────────────────────
export interface AdminUserModel {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  phoneNumber: string | null;
  banned: boolean;
  emailVerified: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}

export interface CreatedUserResult {
  user: Pick<AdminUserModel, "id" | "email" | "name">;
  temporaryPassword: string;   // displayed to admin, never persisted
}

export interface AdminSubscriptionModel {
  id: string;
  userId: string;
  courseId: string;
  paymentMethod: PaymentMethod | null;
  amount: number;               // integer cents
  status: "active" | "cancelled" | "expired" | "refunded";
  enrolledAt: Date;
}

export interface AdminEnrollmentRecord {
  subscriptionId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  paymentMethod: PaymentMethod | null;
  amount: number;               // integer cents
  enrolledAt: Date;
}

export interface AdminEnrollmentQuery {
  page?: number;
  limit?: number;
}

export interface CashEnrollmentResult {
  user: Pick<AdminUserModel, "id" | "email" | "name">;
  temporaryPassword: string;
  subscription: AdminSubscriptionModel | null;
  enrollmentError: { code: string; message: string } | null;
}

export interface AdminCourseModel {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  category: string;
  level: string | null;
  currentPrice: number;         // integer cents
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}
```

---

## Validation Schemas (`admin-validation.schemas.ts` additions)

```typescript
export const CreateUserSchema = z.object({
  email:       z.string().email(),
  firstName:   z.string().min(1).max(100),
  lastName:    z.string().min(1).max(100),
  phoneNumber: z.string().max(30).optional(),
});

// For repository — takes resolved userId
export const EnrollWithPaymentSchema = z.object({
  userId:        z.string().uuid(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  amount:        z.number().int().positive(),   // integer cents
  notes:         z.string().max(500).optional(),
});

// For Enrollments Tab modal — admin provides email, service resolves to userId
export const EnrollUserByEmailSchema = z.object({
  email:         z.string().email(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  amount:        z.number().int().positive(),
  notes:         z.string().max(500).optional(),
});

// For combined Operations flow
export const CashEnrollmentSchema = z.object({
  user: z.object({
    email:       z.string().email(),
    firstName:   z.string().min(1).max(100),
    lastName:    z.string().min(1).max(100),
    phoneNumber: z.string().max(30).optional(),
  }),
  courseId:      z.string().uuid(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  amount:        z.number().int().positive(),
  notes:         z.string().max(500).optional(),
});
```

---

## Security Hardening

### Password Security

| Concern | Mitigation |
|---------|-----------|
| Temp password stored in DB | Never — only passed to `auth.api.admin.createUser()`, which hashes it internally |
| Temp password in audit log | `audit-logger.ts` `stripSensitive()` already removes `password` keys — confirmed at source |
| Temp password in API response | Delivered over HTTPS to admin's browser session only — session compromise risk accepted (same as any auth token) |
| Admin session compromised | Out of scope for this feature — covered by session security (expiry, HTTPS, secure cookies) |
| Ambiguous characters in password | Excluded from alphabet — 0, O, 1, I not in `ALPHABET` |

### `mustChangePassword` Enforcement

```
Admin creates user → mustChangePassword: true in DB
       ↓
User logs in with temp password (no redirect during login)
       ↓
User accesses any authenticated page → requireSession() → redirect /change-password
       ↓
User changes password → PATCH endpoint sets mustChangePassword = false
       ↓
User accesses platform normally
```

**Loop protection**: `/change-password` page calls `getSession()` not `requireSession()` — no infinite redirect.

**Admin accounts**: Admin routes use `auth.api.getSession()` + manual role check — they never call `requireSession()` — so admin users are never affected by this redirect.

---

## API Contracts (Production-Grade)

### `POST /api/admin/users` — Create User

**Auth**: Admin session (catch-all handler).

**Request**:
```typescript
{
  email: string;        // valid email
  firstName: string;    // 1–100 chars
  lastName: string;     // 1–100 chars
  phoneNumber?: string; // max 30 chars
}
```

**Response (201)**:
```typescript
{
  status: "success";
  data: {
    user: { id: string; email: string; name: string; };
    temporaryPassword: string;  // 16-char, share with user; never logged
  }
}
```

**Errors**:
- `409`: `{ code: "EMAIL_ALREADY_EXISTS" }` — Better Auth admin plugin throws when email is taken
- `422`: Zod validation error

---

### `GET /api/admin/courses/[courseId]/enrollments` — List Enrolled Users

**Auth**: Admin session.
**Query**: `page` (default 1), `limit` (default 20).

**Response (200)**:
```typescript
{
  status: "success";
  items: AdminEnrollmentRecord[];
  pagination: { page: number; limit: number; total: number; pages: number; }
}
```

---

### `POST /api/admin/courses/[courseId]/enroll` — Enroll User with Payment

**Auth**: Admin session.

**Request**:
```typescript
{
  email: string;
  paymentMethod: "cash" | "bank_transfer" | "other";
  amount: number;         // integer cents, e.g. 9900 = 99.00 EGP
  notes?: string;
}
```

**Response (201)**:
```typescript
{
  status: "success";
  data: {
    subscription: {
      id: string; userId: string; courseId: string;
      paymentMethod: string; amount: number; status: "active"; enrolledAt: string;
    }
  }
}
```

**Errors**: `404` user not found · `409` already enrolled · `422` validation

---

### `POST /api/admin/operations/cash-enrollment` — Combined Create + Enroll (Saga)

**Auth**: Admin session.

**Request**:
```typescript
{
  user: { email: string; firstName: string; lastName: string; phoneNumber?: string; };
  courseId: string;
  paymentMethod: "cash" | "bank_transfer" | "other";
  amount: number;    // integer cents
  notes?: string;
}
```

**Response (201 — Full Success)**:
```typescript
{ status: "success"; data: { user, temporaryPassword, subscription, enrollmentError: null } }
```

**Response (207 — Partial: User Created, Enrollment Failed)**:
```typescript
{ status: "success"; data: { user, temporaryPassword, subscription: null, enrollmentError: { code, message } } }
```

**UI for 207**: Show `<PasswordDisplay>` (so admin can relay credentials) AND a dismissable `<EnrollmentErrorAlert>` with a link to the course Enrollments tab to retry.

**Errors**: `409` email exists · `404` course not found · `422` validation

---

## Project Structure (Final)

```text
src/
├── app/
│   ├── admin/
│   │   ├── users/
│   │   │   └── page.tsx                             # [MODIFY] Add "Create User" button + modal
│   │   ├── courses/
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx                         # [MODIFY] Add "Enrollments" tab
│   │   │       └── _components/
│   │   │           └── enrollments-tab.tsx           # [NEW] Server Component + Client modal
│   │   └── operations/
│   │       └── cash-enrollment/
│   │           └── page.tsx                         # [NEW] Combined create+enroll page
│   └── api/
│       └── admin/
│           └── [[...path]]/
│               └── route.ts                         # [MODIFY] Add new branches (no new files)
│
├── components/
│   └── admin/
│       ├── create-user-modal.tsx                    # [NEW] Client Component
│       ├── enroll-user-modal.tsx                    # [NEW] Client Component
│       ├── cash-enrollment-form.tsx                 # [NEW] Client Component (multi-step)
│       └── password-display.tsx                     # [NEW] Client Component (copyable display)
│
├── lib/
│   ├── dal.ts                                       # [MODIFY] Add mustChangePassword redirect
│   ├── routes.ts                                    # [MODIFY] Add CHANGE_PASSWORD route
│   └── admin/
│       └── temporary-password.ts                    # [NEW] TemporaryPasswordGenerator class
│
├── domain/
│   └── admin/
│       ├── application/
│       │   ├── admin-users.service.ts               # [MODIFY] Add createUser() method to class
│       │   ├── admin-courses.service.ts             # [MODIFY] Add enrollUserWithPayment(), listEnrollmentsByCourse()
│       │   └── admin-cash-enrollment.service.ts     # [NEW] AdminCashEnrollmentService class
│       ├── contracts/
│       │   ├── admin-types.ts                       # [MODIFY] Add new models + PAYMENT_METHODS
│       │   ├── admin-validation.schemas.ts          # [MODIFY] Add new schemas
│       │   └── i-admin-repository.ts                # [NEW] IAdminRepository interface (typed)
│       ├── factory/
│       │   └── admin-domain.factory.ts              # [MODIFY] Wire new class instances
│       └── infrastructure/
│           └── db/
│               └── admin.repository.ts             # [MODIFY] Implement new methods
│                                                   #  (DrizzleAdminRepository class form for new methods)
│
├── db/
│   └── schema/
│       ├── courses-db.schema.ts                    # [MODIFY] paymentMethod col + unique constraint
│       └── auth-schema.ts                          # [MODIFY] mustChangePassword col
│
└── lib/
    └── auth.ts                                     # [MODIFY] Add mustChangePassword additionalField
```

---

## Complexity Tracking & Design Pattern Summary

No constitution violations. The new OOP pattern (class + interface + constructor injection) is applied to all three new service files. Existing services are extended with new methods — not refactored to avoid unrelated scope creep.

| Pattern | Applied To | Purpose |
|---------|-----------|---------|
| **Interface + Concrete Class** (Repository) | `IAdminRepository` + `DrizzleAdminRepository` | Typed, swappable data access — no `any` |
| **Service Class + Constructor DI** | `AdminUsersService`, `AdminCoursesService`, `AdminCashEnrollmentService` | OOP services with injected dependencies |
| **Orchestration Saga** | `AdminCashEnrollmentService.createAndEnroll()` | Two-step distributed op with defined compensation |
| **Value Object + Strategy** | `TemporaryPasswordGenerator` | Encapsulated, injectable, unbiased, testable |
| **Factory (Composition Root)** | `createAdminDomain()` | Single wiring point — only place where concrete classes are instantiated |
| **Command (Dispatch)** | `[[...path]]/route.ts` | Centralized routing, single auth guard |
| **Observer/Hook Chain** | `dal.ts → requireSession()` | Ordered redirect enforcement without middleware |

**Complexity delta**: +3 service/class files, +1 interface file, +1 utility class, +3 UI components, +2 DB columns, +1 unique constraint (with pre-migration cleanup), +4 route branches. All additive, isolated to admin bounded context.

---

## Review: All 5 Concerns Resolved

| Concern | Status | Resolution |
|---------|--------|-----------|
| Better Auth `signUpEmail` + mustChangePassword two-step risk | ✅ **Resolved** | Use `auth.api.admin.createUser()` (Better Auth `admin` plugin already installed) — returns ID reliably, passes `mustChangePassword` via `additionalFields` |
| Middleware for forced password change | ✅ **Resolved** | Added to `dal.ts → requireSession()` — consistent with existing `emailVerified` and `phoneNumber` enforcement; no middleware latency |
| Existing duplicate subscriptions | ✅ **Resolved** | Pre-migration deduplication SQL keeps oldest enrollment, then applies constraint (ADR-003) |
| 207 for partial success | ✅ **Confirmed** | Route handler maps `enrollmentError !== null` to HTTP 207; UI shows both `<PasswordDisplay>` and `<EnrollmentErrorAlert>` |
| Password display security | ✅ **Documented** | Threat model: delivery-over-HTTPS to admin session accepted; temp password never persisted, never logged (verified via `audit-logger.ts` `stripSensitive()`); `ALLOWED_CHARS` excludes ambiguous chars |
