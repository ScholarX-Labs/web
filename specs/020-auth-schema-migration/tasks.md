# Tasks: Auth Schema Migration to `app_auth`

**Input**: Design documents from `/specs/020-auth-schema-migration/` (`plan.md`, `spec.md`, `data-model.md`, `contracts/db-namespace.md`, `research.md`, `quickstart.md`, `checklists/requirements.md`)

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps to User Story (US1, US2, US3, US4, US5) from `spec.md`
- Includes exact file paths for all implementation targets

---

## Dependencies & Execution Order

```mermaid
graph TD
    Phase1[Phase 1: Setup] --> Phase2[Phase 2: Foundational]
    Phase2 --> US1[Phase 3: US1 - Core Auth Continuity (P1) 🎯 MVP]
    Phase2 --> US4[Phase 4: US4 - Single Source of Truth (P2)]
    Phase2 --> US2[Phase 5: US2 - Idempotent Migration & Provisioning (P2)]
    Phase2 --> US3[Phase 6: US3 - Analytics & Audit Visibility (P3)]
    Phase2 --> US5[Phase 7: US5 - ORM Analysis Deliverable (P3)]
    
    US1 --> Polish[Phase 8: Polish & Cutover Hardening]
    US4 --> Polish
    US2 --> Polish
    US3 --> Polish
    US5 --> Polish
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish canonical namespace resolution module and static analysis lint rules.

- [x] T001 Create canonical database namespace resolution module in `src/db/schema/namespaces.ts`
- [x] T002 Configure ESLint rule `import/no-cycle` for `src/db/schema/` in `eslint.config.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core verification infrastructure and dynamic schema filtering configuration.

**⚠️ CRITICAL**: Must complete before user story work begins.

- [x] T003 [P] Create automated schema literal verification script in `scripts/audit-schema-literals.mjs`
- [x] T004 Add `"audit:schema-literals"` script entry in `package.json`
- [x] T005 [P] Update `drizzle.config.ts` to derive `schemaFilter` dynamically via `[...Object.values(DB_SCHEMAS), "public"]`

---

## Phase 3: User Story 1 - Platform Users Keep Signing In and Using Platform (Priority: P1) 🎯 MVP

**Goal**: Point core authentication schema definitions to `app_auth` via `namespaces.ts`, ensure continuous sign-in, session resume, sign-up, and password reset flows with a startup health canary.

**Independent Test**: Sign in with existing credentials, navigate courses/dashboard, sign out, sign back in, and run authentication integration test suite against `app_auth`.

- [x] T006 [P] [US1] Update `src/db/schema/auth-schema.ts` to import `authSchema` from `namespaces.ts` and clean up legacy banner comments
- [x] T007 [P] [US1] Update `src/db/schema/admin-db.schema.ts` to import `authSchema` and `coursesSchema` from `namespaces.ts`
- [x] T008 [P] [US1] Update `src/db/schema/courses-db.schema.ts` to import `coursesSchema` from `namespaces.ts`
- [x] T009 [P] [US1] Update `src/db/schema/certificates-db.schema.ts` to import `certificatesSchema` from `namespaces.ts`
- [x] T010 [P] [US1] Update `src/db/schema/email-db.schema.ts` to import `emailSchema` from `namespaces.ts`
- [x] T011 [P] [US1] Update `src/db/schema/executive-analytics.schema.ts` to import `executiveSchema` from `namespaces.ts`
- [x] T012 [US1] Implement startup readiness canary probe in `src/app/api/health/route.ts` checking `SELECT 1 FROM app_auth.user LIMIT 1`
- [x] T013 [US1] Delete obsolete script `scripts/fix-auth-schema.js` and verify `src/lib/auth.ts` resolves `app_auth` cleanly

**Checkpoint**: Core auth schema definitions updated and active sessions/sign-ins independently verified.

---

## Phase 4: User Story 4 - Centralized Identity Schema Relocation (Priority: P2)

**Goal**: Ensure all schema names resolve from one single source of truth (`namespaces.ts`), and verify changing a single definition propagates throughout the system.

**Independent Test**: Execute `pnpm audit:schema-literals` and run full query and integration suite verifying zero residual hardcoded schema literals.

- [x] T014 [US4] Run `pnpm audit:schema-literals` to identify and verify all schema literal replacements across `src/` and `scripts/`
- [x] T015 [P] [US4] Update documentation guidance in `docs/frontend-nextjs-schema-auth-guide.md` to reference `app_auth` and `contracts/db-namespace.md`

**Checkpoint**: Zero hardcoded `"auth"` schema strings remain in source code or documentation.

---

## Phase 5: User Story 2 - Idempotent Migration Baseline & Environment Provisioning (Priority: P2)

**Goal**: Rebase Drizzle migration chain onto an idempotent `app_auth` baseline using `IF NOT EXISTS` guards so fresh restores and already-renamed DBs deploy without manual repair.

**Independent Test**: Restore database dump to scratch environment, run `pnpm db:migrate` followed by `pnpm db:generate`, and verify zero migration errors and an empty schema diff.

- [x] T016 [US2] Update helper script `scripts/baseline-drizzle-migrations.mjs` to resolve auth schema via `process.env.AUTH_SCHEMA ?? "app_auth"`
- [x] T017 [P] [US2] Update database inspection script `scripts/inspect-db.js` to default auth schema to `"app_auth"`
- [x] T018 [P] [US2] Update raw migration helper SQL files in `scripts/migrations/` to reference `app_auth`
- [x] T019 [US2] Regenerate baseline migration `drizzle/0000_round_william_stryker.sql` and snapshot, ensuring schema-drift assertions (`drizzle-kit generate` / schema-diff clean) match `app_auth`
- [x] T020 [US2] Rebase migration chain SQL files, `drizzle/meta/_journal.json` hashes, and snapshots to reference `app_auth`
- [x] T021 [US2] Validate fresh restore idempotency and existing-database schema shape by executing `pnpm db:migrate` and schema-drift assertions (`pnpm db:generate`) against scratch and existing-database restores

**Checkpoint**: Migration chain reproduces `app_auth` cleanly and idempotently on fresh and existing environments.

---

## Phase 6: User Story 3 - Executive Analytics & Admin Audit Visibility (Priority: P3)

**Goal**: Update raw SQL queries and analytics registry in the executive domain to resolve `app_auth` dynamically via `sql.identifier()`.

**Independent Test**: Execute executive analytics and admin audit queries before and after cutover to verify identical row counts and join resolution.

- [x] T022 [US3] Refactor 7 raw SQL query locations in `src/domain/executive/infrastructure/db/executive.repository.ts` to interpolate `sql.identifier(DB_SCHEMAS.auth)`
- [x] T023 [P] [US3] Update description and metadata strings in `src/domain/executive/application/metric-definition.registry.ts` to reference `app_auth`

**Checkpoint**: Executive domain raw SQL queries resolve `app_auth` dynamically without hardcoded strings.

---

## Phase 7: User Story 5 - ORM & Migration Tooling Analysis Deliverable (Priority: P3)

**Goal**: Deliver a comprehensive written analysis comparing current Drizzle migration history management against alternatives (Prisma, Kysely, etc.) with zero production code changes.

**Independent Test**: Verify `specs/020-auth-schema-migration/orm-analysis.md` exists, contains issue history, alternatives comparison, and clear recommendations.

- [x] T024 [P] [US5] Create migration tooling analysis document in `specs/020-auth-schema-migration/orm-analysis.md`

**Checkpoint**: Decision-support deliverable `orm-analysis.md` completed and reviewed.

---

## Phase 8: Polish & Cutover Hardening

**Purpose**: Cross-repo consumer documentation, SPECKIT index updates, and final DoD verification.

- [x] T025 [P] Document cross-repository consumer audit in `docs/consumer-audit-020.md`
- [x] T026 Update `AGENTS.md` SPECKIT markers to include `specs/020-auth-schema-migration/plan.md`
- [x] T027 Validate full Definition of Done by executing `pnpm audit:schema-literals`, `pnpm typecheck`, `pnpm lint`, and `pnpm test` (verified across fresh and existing app_auth database checks)

---

## Parallel Execution Opportunities

### Phase 3 (US1 - Core Auth)
- T006, T007, T008, T009, T010, T011 can all be implemented concurrently as they touch separate schema files.

### Phase 5 (US2 - Migration Baseline)
- T017 and T018 can be implemented concurrently with T016.

### Phase 6 (US3 - Executive Domain) & Phase 7 (US5 - ORM Analysis)
- T023 (metric registry) and T024 (documentation deliverable) can run in parallel with repository refactoring.

---

## Implementation Strategy & MVP Scope

1. **MVP Scope**: Complete Phase 1 (Setup), Phase 2 (Foundational), and Phase 3 (User Story 1). Verify session resume and user sign-in independently.
2. **Incremental Rollout**:
   - Deliver US4 (Single Source of Truth audit)
   - Deliver US2 (Migration rebase & scratch DB verification)
   - Deliver US3 (Executive raw SQL updates)
   - Deliver US5 (ORM analysis documentation)
3. **Hardening**: Run Phase 8 DoD verification suite (`audit:schema-literals`, `typecheck`, `lint`, `test`).
