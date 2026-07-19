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

**Purpose**: Add `paymentMethod` to subscriptions and `mustChangePassword` to users.

- [ ] T001 Add `paymentMethod` column to `dbSubscriptions` in `src/db/schema/courses-db.schema.ts`
- [ ] T002 Add `mustChangePassword` column to `dbUsers` in `src/db/schema/auth-schema.ts`
- [ ] T003 Run `pnpm db:generate` to produce migration
- [ ] T004 Run `pnpm db:push` to apply migration
- [ ] T005 Verify columns exist in database

**Checkpoint**: Database schema updated. No user story work begins until T005 is complete.

---

## Phase 2: Domain Layer (Contracts & Validation)

**Purpose**: Define input types, validation schemas, and repository contract extensions.

- [ ] T006 [P] Add `CreateUserInput`, `EnrollUserInput`, `CashEnrollmentInput` types to `src/domain/admin/contracts/admin-types.ts`
- [ ] T007 [P] Add `CreateUserSchema`, `EnrollUserSchema`, `CashEnrollmentSchema` Zod schemas to `src/domain/admin/contracts/admin-validation.schemas.ts`
- [ ] T008 [P] Add `createUser(userId, data)` method signature to `AdminRepository` contract in `src/domain/admin/contracts/admin-repository.contract.ts`

**Checkpoint**: Types and schemas defined. Services can now implement business logic.

---

## Phase 3: Domain Layer (Services)

**Purpose**: Implement user creation, enrollment with payment, and combined flow services.

- [ ] T009 Implement `createUser()` in `src/domain/admin/application/admin-users.service.ts` — generate temp password, call `auth.api.signUpEmail()`, set `mustChangePassword: true`, log audit
- [ ] T010 Update `enrollUser()` in `src/domain/admin/application/admin-courses.service.ts` — accept `paymentMethod` and `amount`, check for duplicate active subscription
- [ ] T011 Create `src/domain/admin/application/admin-cash-enrollment.service.ts` — orchestrate combined create+enroll flow with error handling

**Checkpoint**: Business logic implemented. Can now wire to API routes.

---

## Phase 4: Infrastructure Layer

**Purpose**: Implement repository methods for user creation and enrollment.

- [ ] T012 Implement `createUser()` in `src/domain/admin/infrastructure/db/admin.repository.ts` — insert user via Better Auth, return user + temp password
- [ ] T013 Update `enrollUser()` in `src/domain/admin/infrastructure/db/admin.repository.ts` — include `paymentMethod` and `amount` in subscription insert
- [ ] T014 Add unique constraint check for `(user_id, course_id)` to prevent duplicate subscriptions

**Checkpoint**: Data persistence layer complete. Can now create users and enroll via API.

---

## Phase 5: API Routes

**Purpose**: Create thin route handlers for user creation, enrollment, and combined flow.

- [ ] T015 [P] Create `POST /api/admin/users` route handler — validate session, validate body with `CreateUserSchema`, call `adminUsersService.createUser()`, return user + temp password
- [ ] T016 [P] Update `POST /api/admin/courses/[courseId]/enroll` route handler — validate session, validate body with `EnrollUserSchema`, call `adminCoursesService.enrollUser()` with paymentMethod/amount
- [ ] T017 [P] Create `POST /api/admin/operations/cash-enrollment` route handler — validate session, validate body with `CashEnrollmentSchema`, call `adminCashEnrollmentService.createAndEnroll()`

**Checkpoint**: API endpoints functional. Can now test with curl/Postman.

---

## Phase 6: Admin UI — User Creation (US1)

**Purpose**: Add "Create User" button and modal to the admin users page.

- [ ] T018 [P] Create `src/components/admin/create-user-modal.tsx` — form with email, firstName, lastName, phoneNumber fields, validation, submit handler
- [ ] T019 [P] Create `src/components/admin/password-display.tsx` — component to display generated temporary password with copy-to-clipboard
- [ ] T020 Add "Create User" button and modal trigger to `src/app/admin/users/page.tsx`
- [ ] T021 Wire `create-user-modal` to POST `/api/admin/users` endpoint
- [ ] T022 Show `password-display` after successful user creation

**Checkpoint ✅ US1**: Admin can create user from users page. Password is displayed for relay.

---

## Phase 7: Admin UI — Enrollments Tab (US2)

**Purpose**: Add Enrollments tab to admin course detail page with enrolled users list and enroll modal.

- [ ] T023 [P] Create `src/components/admin/enroll-user-modal.tsx` — form with email search, paymentMethod select, amount input, validation, submit handler
- [ ] T024 Create `src/app/admin/courses/[courseId]/_components/enrollments-tab.tsx` — enrolled users list + "Enroll User" button + modal
- [ ] T025 Add "Enrollments" tab to `TABS` array in `src/app/admin/courses/[courseId]/page.tsx`
- [ ] T026 Wire `enroll-user-modal` to POST `/api/admin/courses/[courseId]/enroll` endpoint
- [ ] T027 Show enrolled users list with user name, email, payment method, amount, enrolled date

**Checkpoint ✅ US2**: Admin can enroll existing users from course detail page. Enrolled users list visible.

---

## Phase 8: Admin UI — Operations Cash Enrollment (US3)

**Purpose**: Create dedicated Cash Enrollment page under Operations section.

- [ ] T028 [P] Create `src/components/admin/cash-enrollment-form.tsx` — multi-step form: Step 1 (user details) → Step 2 (course select) → Step 3 (payment) → Step 4 (confirm)
- [ ] T029 Create `src/app/admin/operations/cash-enrollment/page.tsx` — page wrapper with form
- [ ] T030 Add "Operations" section to `SIDEBAR_NAV` in `src/lib/admin/admin-constants.ts`
- [ ] T031 Add `CASH_ENROLLMENT` route to `ADMIN_ROLES` in `src/lib/admin/admin-constants.ts`
- [ ] T032 Wire `cash-enrollment-form` to POST `/api/admin/operations/cash-enrollment` endpoint
- [ ] T033 Show `password-display` and enrollment confirmation after successful submission

**Checkpoint ✅ US3**: Admin can create user + enroll in course from Operations section. Combined flow works end-to-end.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, loading states, edge cases.

- [ ] T034 [P] Add error handling for 409 (duplicate email/enrollment) in all modals — show clear error messages
- [ ] T035 [P] Add loading states to all forms — disable submit button, show spinner during API calls
- [ ] T036 [P] Add form validation feedback — inline error messages for required fields, email format, amount > 0
- [ ] T037 [P] Test concurrent enrollment scenario — two admins enrolling same user simultaneously
- [ ] T038 [P] Verify audit log entries for all mutation paths

**Checkpoint**: All user stories complete. Error handling polished. Ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (DB Schema)
    │
    ▼
Phase 2 (Contracts & Validation)
    │
    ▼
Phase 3 (Services)
    │
    ▼
Phase 4 (Infrastructure)
    │
    ▼
Phase 5 (API Routes)
    │
    ├──────────────────────────────────────────────┐
    ▼                                              ▼
Phase 6 (US1: User Creation UI)        Phase 7 (US2: Enrollments Tab UI)
    │                                              │
    └──────────────┬───────────────────────────────┘
                   ▼
           Phase 8 (US3: Operations UI)
                   │
                   ▼
           Phase 9 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Be Parallel With |
|-------|-----------|---------------------|
| US1 (Create User) | Phase 1-5 complete | US2 |
| US2 (Enroll Existing) | Phase 1-5 complete | US1 |
| US3 (Combined) | US1 + US2 complete | — |

### Within Each Phase: Task Order

1. **Contracts/types first** — nothing compiles without them
2. **Infrastructure** (repositories) before **application services**
3. **Services** before **API route handlers**
4. **Route handlers** before **UI components** that call them
5. **UI components** can be built in parallel if they don't share state

---

## Parallel Execution Examples

### Phase 2 — All Parallelisable

```
T006 (types)      ─┐
T007 (schemas)    ─┤─── All in parallel (different files)
T008 (contract)   ─┘
```

### Phase 5 — API Routes

```
T015 (POST /users)           ─┐
T016 (POST /enroll)          ─┤─── All in parallel (different files)
T017 (POST /cash-enrollment) ─┘
```

### Phase 6+7 — UI Components (after Phase 5)

```
T018 (create-user-modal)      ─┐
T019 (password-display)       ─┤─── All in parallel (different files)
T023 (enroll-user-modal)      ─┘
```

---

## Summary

| Phase | Tasks | Story | Parallelisable |
|-------|-------|-------|---------------|
| Phase 1 — DB Schema | T001–T005 | — | — |
| Phase 2 — Contracts | T006–T008 | — | T006–T008 |
| Phase 3 — Services | T009–T011 | — | — |
| Phase 4 — Infrastructure | T012–T014 | — | — |
| Phase 5 — API Routes | T015–T017 | — | T015–T017 |
| Phase 6 — US1 UI | T018–T022 | US1 | T018, T019 |
| Phase 7 — US2 UI | T023–T027 | US2 | T023 |
| Phase 8 — US3 UI | T028–T033 | US3 | T028 |
| Phase 9 — Polish | T034–T038 | — | T034–T038 |
| **Total** | **38 tasks** | 3 stories | ~12 tasks parallelisable |

**Suggested MVP scope**: Phases 1–7 (Tasks T001–T027) — 27 tasks, delivers user creation + enrollment from course page.
