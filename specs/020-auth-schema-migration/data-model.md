# Data Model: Auth Schema Migration to app_auth

**Phase 1 output** — describes the database-side change and the centralized namespace model. Date: 2026-08-05.

## 1. The core change

A single PostgreSQL schema rename: `auth` → `app_auth`. All objects inside the schema (tables, indexes, constraints) move with it; PostgreSQL rewrites dependent foreign-key references automatically, so the shared database is already consistent. No data values change, no table/column names change, no rows move.

## 2. Tables that move into `app_auth`

| Table | Owned by | Notes |
|-------|----------|-------|
| `user` | Better Auth + profile extensions | identity; FKs from every domain |
| `session` | Better Auth | session management |
| `account` | Better Auth | OAuth/provider accounts |
| `verification` | Better Auth | OTP/password-reset tokens, email-send rate-limit records |
| `admin_audit_log` | Admin domain | references `user` |

## 3. Dependent data (foreign keys into `auth.user`, now `app_auth.user`)

| Domain | Tables |
|--------|--------|
| courses | `courses`, `subscriptions`, `inquiries`, `lesson_progress`, `course_completion_state` family, `course_applications` |
| certificates | `certificates` (+ revoked_by) |
| email | `email_batches`, `email_deliveries` |
| executive | analytics events, `action_item_states`, `public_impact_metrics` |
| leaderboard | `point_events`, `leaderboard_opt_outs` (these tables live in `public`, referencing `app_auth.user`) |

All FK semantics (cascade / set null / restrict) are preserved by the schema rename; the migration must not alter any of them.

## 4. Centralized namespace model (new)

New module `src/db/schema/namespaces.ts` is the single source of truth for schema names. It exposes:

- `DB_SCHEMAS` — `as const` map of logical namespace → physical schema name.
- Typed `DbSchemaName` type.
- Derived `pgSchema()` instances consumed by every schema-definition module.

```text
namespaces.ts
├── DB_SCHEMAS.auth        = "app_auth"      (was "auth")
├── DB_SCHEMAS.courses     = "courses"
├── DB_SCHEMAS.certificates= "certificates"
├── DB_SCHEMAS.email       = "email"
├── DB_SCHEMAS.executive   = "executive"
└── (public is implicit: leaderboard tables use the default schema)
```

Schema-definition modules import the schema instances from here instead of calling `pgSchema()` with a literal:

- `auth-schema.ts` → `authSchema` (tables `user`, `session`, `account`, `verification`)
- `admin-db.schema.ts` → `authSchema` + `coursesSchema` (`admin_audit_log`, admin courses tables)
- `courses-db.schema.ts` → `coursesSchema`
- `certificates-db.schema.ts` → `certificatesSchema`
- `email-db.schema.ts` → `emailSchema`
- `executive-analytics.schema.ts` → `executiveSchema`

## 5. State transitions

The feature has two verifiable states:

1. **Pre-migration (current)**: schema definitions, raw SQL, migrations, and docs reference `auth`. Platform queries would fail against the renamed shared DB.
2. **Post-migration (target)**: every reference resolves `app_auth` from the canonical source; migration chain reproduces `app_auth` on fresh environments; all authenticated and dependent-query flows pass.

Transition is atomic per deployment (single maintenance window); rollback is restore-from-dump.

## 6. Validation rules (derived from the spec)

- All schema-qualified SQL must resolve through `DB_SCHEMAS`/its derived instances — no hardcoded schema literals remain (FR-002, FR-013).
- FK references from dependent domains into `app_auth.user` must be identical in count and semantics before/after (FR-003, FR-010).
- Fresh restore → migration → schema-diff must be clean (FR-006, SC-004).
- Connection details never committed (FR-007).
