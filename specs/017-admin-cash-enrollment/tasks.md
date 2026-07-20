# Tasks: Admin Cash Enrollment

**Feature**: `017-admin-cash-enrollment`
**Input**: Design documents from `specs/017-admin-cash-enrollment/`
**Prerequisites**: spec.md ✅ | plan.md ✅ | data-model.md ✅ | research.md ✅ | quickstart.md ✅
**Generated**: 2026-07-19

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependency conflict)
- **[Story]**: User story this task belongs to (US1–US3)
- Exact file paths follow the project structure defined in `plan.md`

---

## Phase 1: Database Schema Changes

**Purpose**: Add `paymentMethod` to subscriptions, `mustChangePassword` to users, and unique constraint on `(user_id, course_id)`.

- [ ] T001 Add `paymentMethod: varchar("payment_method", { length: 50 })` column to `dbSubscriptions` table definition in `src/db/schema/courses-db.schema.ts:89-102`
- [ ] T002 Add unique index `uniqueIndex("subscriptions_user_course_uq").on(table.userId, table.courseId)` to `dbSubscriptions` table in `src/db/schema/courses-db.schema.ts:89-102`
- [ ] T003 Add `mustChangePassword: boolean("must_change_password").default(false).notNull()` column to `user` table in `src/db/schema/auth-schema.ts:17-60`
- [ ] T004 Register `mustChangePassword` in Better Auth `user.additionalFields` in `src/lib/auth.ts:300-389` — add `{ type: "boolean", required: false, defaultValue: false }`
- [ ] T005 Add `CHANGE_PASSWORD: "/auth/change-password"` route to `ROUTES` object in `src/lib/routes.ts`
- [ ] T006 Add `mustChangePassword` redirect check to `requireSession()` in `src/lib/dal.ts:65-81` — if `session.user.mustChangePassword === true` then `redirect(ROUTES.CHANGE_PASSWORD)`

**Checkpoint**: Database schema updated. Auth integration complete. No user story work begins until T006 is complete.

---

## Phase 2: Domain Contracts & Validation

**Purpose**: Define payment methods constant, input/output types, Zod validation schemas, and extend the repository contract.

- [ ] T007 [P] Add `PAYMENT_METHODS = ["cash", "bank_transfer", "other"] as const`, `PaymentMethod` type, `CreateUserInput`, `EnrollWithPaymentInput`, `EnrollUserByEmailInput`, `CashEnrollmentInput`, `AdminUserModel`, `CreatedUserResult`, `AdminSubscriptionModel`, `AdminEnrollmentRecord`, `AdminEnrollmentQuery`, `CashEnrollmentResult`, `AdminCourseModel` types to `src/domain/admin/contracts/admin-types.ts`
- [ ] T008 [P] Add `CreateUserSchema`, `EnrollWithPaymentSchema`, `EnrollUserByEmailSchema`, `CashEnrollmentSchema` Zod schemas to `src/domain/admin/contracts/admin-validation.schemas.ts` — all amounts use `z.number().int().positive()`, payment methods use `z.enum(PAYMENT_METHODS)`
- [ ] T009 [P] Add `getUserByEmail(email: string): Promise<AdminUserModel | null>`, `enrollUserWithPayment(courseId, userId, data): Promise<AdminSubscriptionModel>`, `listEnrollmentsByCourse(courseId, query): Promise<PaginatedData<AdminEnrollmentRecord>>`, `setMustChangePassword(userId, value): Promise<void>` method signatures to `AdminRepository` interface in `src/domain/admin/contracts/admin-repository.contract.ts`

**Checkpoint**: Types and schemas defined. Services can now implement business logic.

---

## Phase 3: Infrastructure — Password Generator & Repository Methods

**Purpose**: Implement the temporary password generator utility and new repository data-access methods.

- [ ] T010 Create `TemporaryPasswordGenerator` class with `generate(): string` method in `src/lib/admin/temporary-password.ts` — 16-char from 32-char alphabet (exclude 0/O/1/I), bias-free via `256 % ALPHABET.length === 0`, injectable interface `ITemporaryPasswordGenerator` for testing
- [ ] T011 Implement `getUserByEmail(email: string)` in `src/domain/admin/infrastructure/db/admin.repository.ts` — select from `dbUsers` where `email` matches, return typed `AdminUserModel | null`
- [ ] T012 Implement `enrollUserWithPayment(courseId, userId, data)` in `src/domain/admin/infrastructure/db/admin.repository.ts` — insert into `dbSubscriptions` with `paymentMethod`, `amount`, `status: "active"`, `isActive: true`, use `onConflictDoNothing()` on the new unique constraint, throw `AdminErrors.conflict("User is already enrolled in this course")` if result is empty
- [ ] T013 Implement `listEnrollmentsByCourse(courseId, query)` in `src/domain/admin/infrastructure/db/admin.repository.ts` — join `dbSubscriptions` with `dbUsers` to return `AdminEnrollmentRecord` with user email/name + payment details, paginated
- [ ] T014 Implement `setMustChangePassword(userId, value)` in `src/domain/admin/infrastructure/db/admin.repository.ts` — update `dbUsers` set `mustChangePassword` to value

**Checkpoint**: Data persistence layer complete. Can now create users and enroll via service calls.

---

## Phase 4: Application Services

**Purpose**: Implement user creation (US1), enrollment with payment (US2), and combined saga (US3) business logic.

- [ ] T015 [US1] Add `createUser(session, data)` method to `createAdminUsersService` in `src/domain/admin/application/admin-users.service.ts` — parse with `CreateUserSchema`, generate temp password via `TemporaryPasswordGenerator`, call `auth.api.admin.createUser()` with `mustChangePassword: true`, `emailVerified: true`, log audit event `user.create`, return `CreatedUserResult`
- [ ] T016 [US2] Add `enrollUserWithPayment(session, courseId, data)` method to `createAdminCoursesService` in `src/domain/admin/application/admin-courses.service.ts` — parse with `EnrollUserByEmailSchema`, resolve user by email via `repo.getUserByEmail()`, call `repo.enrollUserWithPayment()`, invalidate public course list + detail cache, log audit event `course.enroll_user_with_payment`
- [ ] T017 [US2] Add `listEnrollmentsByCourse(session, courseId, query)` method to `createAdminCoursesService` in `src/domain/admin/application/admin-courses.service.ts` — validate course exists, call `repo.listEnrollmentsByCourse()`, return paginated result
- [ ] T018 [US3] Create `createAdminCashEnrollmentService(usersService, coursesService)` in `src/domain/admin/application/admin-cash-enrollment.service.ts` — `createAndEnroll(session, data)` saga: Step 1 calls `usersService.createUser()`, Step 2 calls `coursesService.enrollUserWithPayment()` in try/catch preserving user on enrollment failure per US3-AC3, returns `CashEnrollmentResult`
- [ ] T019 Wire `cashEnrollment: createAdminCashEnrollmentService(users, courses)` into `createAdminDomain()` return object in `src/domain/admin/factory/admin-domain.factory.ts`
- [ ] T020 Add `admin.enrollment` cache key functions and 30s TTL to `cachePolicy.admin` in `src/lib/cache/cache-policy.ts`
- [ ] T021 Add `invalidateAdminEnrollmentCache(courseId)` function to `src/domain/admin/application/admin-cache.ts` — delete enrollment list cache key for the course

**Checkpoint**: Business logic implemented. Can now wire to API routes.

---

## Phase 5: API Routes & Client

**Purpose**: Add thin route handlers and client-side API methods for all three user stories.

- [ ] T022 [US1] Add `POST /api/admin/users` branch in `src/app/api/admin/[[...path]]/route.ts` POST handler — match `path.length === 1 && path[0] === "users"`, call `domain.users.createUser(admin, body)`, return 201 with `{ status: "success", data: result }`
- [ ] T023 [US2] Update existing `POST /api/admin/courses/:courseId/enroll` branch in `src/app/api/admin/[[...path]]/route.ts` POST handler — change to call `domain.courses.enrollUserWithPayment(admin, path[1], body)` instead of current `enrollUser`, return 201 with subscription data
- [ ] T024 [US2] Add `GET /api/admin/courses/:courseId/enrollments` branch in `src/app/api/admin/[[...path]]/route.ts` GET handler — match `path.length === 3 && path[0] === "courses" && path[2] === "enrollments"`, parse pagination, call `domain.courses.listEnrollmentsByCourse(admin, path[1], pagination)`
- [ ] T025 [US3] Add `POST /api/admin/operations/cash-enrollment` branch in `src/app/api/admin/[[...path]]/route.ts` POST handler — match `path.length === 2 && path[0] === "operations" && path[1] === "cash-enrollment"`, call `domain.cashEnrollment.createAndEnroll(admin, body)`, return 201 on full success or 207 on partial success (enrollmentError !== null)
- [ ] T026 [US1] Add `adminApi.users.create(data)` method to `src/lib/admin/admin-api-client.ts` — `request<unknown>("/users", { method: "POST", body: data })`
- [ ] T027 [US2] Update `adminApi.courses.enrollUser(id, data)` in `src/lib/admin/admin-api-client.ts` — change return type to `request<unknown>` (was `request<void>`) to return subscription data
- [ ] T028 [US2] Add `adminApi.courses.listEnrollments(courseId, params)` method to `src/lib/admin/admin-api-client.ts` — `request<{ items: unknown[]; pagination: unknown }>(\`/courses/${courseId}/enrollments\`, { params })`
- [ ] T029 [US3] Add `adminApi.operations.cashEnrollment(data)` method to `src/lib/admin/admin-api-client.ts` — `request<unknown>("/operations/cash-enrollment", { method: "POST", body: data })`
- [ ] T030 [P] Add `admin.enrollments` query key group to `src/config/query-keys.ts` — `all`, `listByCourse(courseId, query)`

**Checkpoint**: API endpoints functional. Can now test with curl/Postman.

---

## Phase 6: React Query Hooks

**Purpose**: Create client-side data-fetching hooks for all three user stories.

- [ ] T031 [US1] Create `useCreateUser()` mutation hook in `src/hooks/admin/use-admin-enrollments.ts` — call `adminApi.users.create(data)`, invalidate `queryKeys.admin.users.lists()` on success
- [ ] T032 [US2] Create `useEnrollUserWithPayment()` mutation hook in `src/hooks/admin/use-admin-enrollments.ts` — call `adminApi.courses.enrollUser(courseId, data)`, invalidate `queryKeys.admin.courses.lists()` + `queryKeys.admin.enrollments.listByCourse(courseId)` on success
- [ ] T033 [US2] Create `useListEnrollments(courseId, query)` query hook in `src/hooks/admin/use-admin-enrollments.ts` — call `adminApi.courses.listEnrollments(courseId, query)`, keyed by `queryKeys.admin.enrollments.listByCourse(courseId, query)`
- [ ] T034 [US3] Create `useCashEnrollment()` mutation hook in `src/hooks/admin/use-admin-enrollments.ts` — call `adminApi.operations.cashEnrollment(data)`, invalidate `queryKeys.admin.users.lists()` + `queryKeys.admin.courses.lists()` on success

**Checkpoint**: Client data layer complete. Can now build UI components.

---

## Phase 7: Admin UI — User Creation (US1)

**Purpose**: Add "Create User" button and modal to the admin users page with temporary password display.

- [ ] T035 [US1] Create `PasswordDisplay` client component in `src/components/admin/password-display.tsx` — accepts `password: string` prop, displays in monospace font with copy-to-clipboard button using `navigator.clipboard.writeText()`, show "Copied!" feedback toast via `sonner`
- [ ] T036 [US1] Create `CreateUserModal` client component in `src/components/admin/create-user-modal.tsx` — Dialog with form fields: email (required, validated), firstName (required, 1-100 chars), lastName (required, 1-100 chars), phoneNumber (optional), submit button calls `useCreateUser()` hook, on success show `PasswordDisplay` with generated password, handle 409 error (email exists) with clear message
- [ ] T037 [US1] Add "Create User" Button + `CreateUserModal` trigger to `src/app/admin/users/page.tsx` — place button in header area next to page title, wire modal open/close state

**Checkpoint ✅ US1**: Admin can create user from users page. Temporary password is displayed for relay. Test: Navigate to `/admin/users`, click "Create User", fill form, submit, verify password shown.

---

## Phase 8: Admin UI — Enrollments Tab (US2)

**Purpose**: Add Enrollments tab to admin course detail page with enrolled users list and enroll modal.

- [ ] T038 [US2] Create `EnrollUserModal` client component in `src/components/admin/enroll-user-modal.tsx` — Dialog with form fields: email search input (debounced), paymentMethod select (cash/bank_transfer/other), amount input in dollars (converts to integer cents on submit: `Math.round(value * 100)`), optional notes textarea, submit calls `useEnrollUserWithPayment()` hook, handle 409 (already enrolled) and 404 (user not found) errors
- [ ] T039 [US2] Create `EnrollmentsTab` client component in `src/app/admin/courses/[courseId]/_components/enrollments-tab.tsx` — fetch enrollments via `useListEnrollments(courseId)`, render table with columns: Student Name, Email, Payment Method, Amount (formatted as `$X.XX` from cents), Enrolled Date, include "Enroll User" button that opens `EnrollUserModal`, show empty state when no enrollments
- [ ] T040 [US2] Add `{ id: "enrollments", label: "Enrollments", icon: Users }` to `TABS` array in `src/app/admin/courses/[courseId]/page.tsx:78-84` and add `{activeTab === "enrollments" && <EnrollmentsTab courseId={courseId} />}` to the tab content render block

**Checkpoint ✅ US2**: Admin can enroll existing users from course detail page. Enrolled users list visible. Test: Navigate to `/admin/courses/[id]`, click "Enrollments" tab, click "Enroll User", search email, select payment, enter amount, submit.

---

## Phase 9: Admin UI — Operations Cash Enrollment (US3)

**Purpose**: Create dedicated Cash Enrollment page under Operations section with multi-step form.

- [ ] T041 [US3] Create `CashEnrollmentForm` client component in `src/components/admin/cash-enrollment-form.tsx` — multi-step wizard: Step 1 (user details: email, firstName, lastName, phoneNumber), Step 2 (course select: searchable dropdown from `/api/admin/courses`), Step 3 (payment: paymentMethod select + amount input in dollars), Step 4 (confirmation summary: show all details, submit button), navigation between steps with Back/Next buttons, final submit calls `useCashEnrollment()` hook
- [ ] T042 [US3] Create Cash Enrollment page in `src/app/admin/operations/cash-enrollment/page.tsx` — page wrapper with heading "Cash Enrollment", subtitle "Create user and enroll in course", render `CashEnrollmentForm`, on success show `PasswordDisplay` + enrollment confirmation, handle partial success (207: user created but enrollment failed) with error alert + retry link
- [ ] T043 [US3] Add `CASH_ENROLLMENT: "/admin/operations/cash-enrollment"` to `ADMIN_ROUTES` in `src/lib/admin/admin-constants.ts`
- [ ] T044 [US3] Add `{ label: "Cash Enrollment", href: ADMIN_ROUTES.CASH_ENROLLMENT, icon: "CreditCard" }` to `SIDEBAR_NAV` in `src/lib/admin/admin-constants.ts` and add `"Cash Enrollment"` to the `sectionGroups` array under a new `"Operations"` section label in `src/app/admin/_components/admin-sidebar.tsx:46-53`

**Checkpoint ✅ US3**: Admin can create user + enroll in course from Operations section. Combined flow works end-to-end. Test: Navigate to `/admin/operations/cash-enrollment`, fill user details, select course, enter payment info, submit, verify user created + enrolled + password displayed.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, loading states, edge cases, and cache invalidation.

- [ ] T045 [P] Add 409 error handling to `CreateUserModal` — display "A user with this email already exists" message, keep form populated for correction, in `src/components/admin/create-user-modal.tsx`
- [ ] T046 [P] Add 409 error handling to `EnrollUserModal` — display "This user is already enrolled in this course" message, in `src/components/admin/enroll-user-modal.tsx`
- [ ] T047 [P] Add loading states to all three forms — disable submit button and show `Loader2` spinner during API calls, in `src/components/admin/create-user-modal.tsx`, `src/components/admin/enroll-user-modal.tsx`, `src/components/admin/cash-enrollment-form.tsx`
- [ ] T048 [P] Add form validation feedback — inline error messages for required fields, email format, amount > 0 using Zod schema error messages, in all three form components
- [ ] T049 [P] Invalidate enrollment list cache after successful enrollment in `src/domain/admin/application/admin-courses.service.ts` — call `invalidateAdminEnrollmentCache(courseId)` in `enrollUserWithPayment` method
- [ ] T050 [P] Verify `stripSensitive()` in `src/domain/admin/infrastructure/audit/audit-logger.ts` strips `password` key from audit `after` payload — no temp password leaks to audit log

**Checkpoint**: All user stories complete. Error handling polished. Ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (DB Schema + Auth)
    │
    ▼
Phase 2 (Contracts & Validation)
    │
    ▼
Phase 3 (Infrastructure: Password Gen + Repository)
    │
    ▼
Phase 4 (Application Services + Factory + Cache)
    │
    ▼
Phase 5 (API Routes + Client + Query Keys)
    │
    ▼
Phase 6 (React Query Hooks)
    │
    ├──────────────────────────────────────────────────────┐
    ▼                                                      ▼
Phase 7 (US1: User Creation UI)         Phase 8 (US2: Enrollments Tab UI)
    │                                                      │
    └──────────────────┬───────────────────────────────────┘
                       ▼
              Phase 9 (US3: Operations UI)
                       │
                       ▼
              Phase 10 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Be Parallel With |
|-------|-----------|---------------------|
| US1 (Create User) | Phase 1–6 complete | US2 |
| US2 (Enroll Existing) | Phase 1–6 complete | US1 |
| US3 (Combined) | US1 + US2 complete | — |

### Within Each Phase: Task Order

1. **Contracts/types first** — nothing compiles without them
2. **Infrastructure** (password gen, repository) before **application services**
3. **Services** before **API route handlers**
4. **Route handlers** before **UI components** that call them
5. **UI components** can be built in parallel if they don't share state

---

## Parallel Execution Examples

### Phase 2 — All Parallelisable

```
T007 (types)      ─┐
T008 (schemas)    ─┤─── All in parallel (different files)
T009 (contract)   ─┘
```

### Phase 5 — API Routes + Client

```
T022 (POST /users)                    ─┐
T023 (POST /enroll — update)          ─┤
T024 (GET /enrollments)               ─┤─── All in parallel (different branches)
T025 (POST /operations/cash-enrollment)─┤
T026-T029 (client methods)            ─┤─── All in parallel (same file, additive)
T030 (query keys)                      ─┘
```

### Phase 7+8 — UI Components (after Phase 6)

```
T035 (password-display)       ─┐
T036 (create-user-modal)      ─┤─── All in parallel (different files)
T038 (enroll-user-modal)      ─┘
```

---

## Summary

| Phase | Tasks | Story | Parallelisable |
|-------|-------|-------|---------------|
| Phase 1 — DB Schema + Auth | T001–T006 | — | — |
| Phase 2 — Contracts | T007–T009 | — | T007–T009 |
| Phase 3 — Infrastructure | T010–T014 | — | T010 vs T011-T014 |
| Phase 4 — Services | T015–T021 | US1/US2/US3 | T015 vs T016-T017 |
| Phase 5 — API Routes + Client | T022–T030 | US1/US2/US3 | T022–T030 |
| Phase 6 — React Query Hooks | T031–T034 | US1/US2/US3 | T031–T034 |
| Phase 7 — US1 UI | T035–T037 | US1 | T035–T036 |
| Phase 8 — US2 UI | T038–T040 | US2 | T038–T039 |
| Phase 9 — US3 UI | T041–T044 | US3 | — |
| Phase 10 — Polish | T045–T050 | — | T045–T050 |
| **Total** | **50 tasks** | 3 stories | ~20 tasks parallelisable |

**Suggested MVP scope**: Phases 1–8 (Tasks T001–T040) — 40 tasks, delivers user creation + enrollment from course page.

## Implementation Strategy

1. **Bottom-up delivery**: Schema → Contracts → Infra → Services → API → Hooks → UI
2. **Each phase produces a testable increment**: After Phase 5, all endpoints work via curl. After Phase 7, US1 works end-to-end in browser.
3. **No cross-story coupling in Phase 1–6**: US1 and US2 can be implemented and merged independently.
4. **US3 is purely additive**: It composes US1 + US2 services — no new data access needed.
5. **Cache invalidation is the only cross-cutting concern**: Handled in Phase 4 (service layer) and verified in Phase 10 (polish).
