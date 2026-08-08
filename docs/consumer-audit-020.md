# Cross-Repo Consumer Audit — `auth` → `app_auth`

**Status**: Pre-cutover human gate (hard gate). Populated by the team lead.
**Feature**: `020-auth-schema-migration`
**SLA**: Must be fully signed off before the maintenance window (Gate 1 of `quickstart.md`).

---

## Purpose

The physical rename `auth` → `app_auth` was already applied to the shared database. Application code in this repository now resolves the schema name from `src/db/schema/namespaces.ts` (`DB_SCHEMAS.auth = "app_auth"`). However, anything that talks to the database **outside this repository** still references the old `auth` schema by name and will break if it is not updated or isolated.

This checklist exists to make every such consumer explicit and coordinated **before** the window, not discovered during the incident.

---

## Audit Checklist

### 1. Direct database consumers (internal services)

- [ ] Identify every internal service connecting to the shared PostgreSQL database (search for `DATABASE_URL` consumers, `.env` files, orchestration configs, cron/manifest definitions).
- [ ] For each service, grep for `auth.` / `"auth".` / `auth.user` / `auth.*` in SQL, migrations, and connection-time schema references.
- [ ] Classify each finding: **updated** (points at `app_auth`), **isolated** (uses its own schema/DB), or **needs coordination**.
- [ ] Record the owning team and a single accountable engineer per finding.

### 2. Reporting / BI / analytics

- [ ] Inventory BI connectors, reporting tools, and read-replica consumers (Looker/Metabase/PowerBI/Superset, scheduled export jobs, data pipelines).
- [ ] Confirm each query that referenced `auth.` now references `app_auth.` or is otherwise isolated.
- [ ] Confirm read-replica grants/schemas were renamed alongside the primary.

### 3. Database-level grants, RLS, and extensions

- [ ] Search `information_schema` / `pg_policies` for `USAGE`/`SELECT` grants referencing `auth` schema.
- [ ] Confirm `GRANT USAGE ON SCHEMA auth` → `app_auth` for each application role.
- [ ] Confirm no `CREATE POLICY` / RLS clause hardcodes `auth.` as a schema-qualified name.
- [ ] Confirm any extensions, triggers, or functions with `SET search_path` including `auth` are updated.

### 4. Tooling and pipelines

- [ ] CI/CD jobs that run SQL or DB migrations for other services.
- [ ] Backfill/ETL scripts and data-team notebooks referencing `auth.`.
- [ ] Monitoring/observability queries (Datadog/Grafana/CloudWatch) that reference `auth.*` — note these should be left to alert on the old name per SC-003 (see `quickstart.md` Gate 5), then migrated to `app_auth` after the 30-day window.

### 5. Documentation and runbooks

- [ ] Runbooks, schema diagrams, and support docs referencing `auth.` schema are updated or annotated with the new name.

---

## Findings Log

| # | Consumer | Owner | Reference found | Classification | Resolution | Verified by | Date |
|---|----------|-------|-----------------|----------------|-------------|-------------|------|
|   |          |       |                 |                |             |             |      |

---

## Sign-off

- [ ] Every row above has a resolution and a verifier.
- [ ] Zero findings remain in **needs coordination** state.
- [ ] Team lead sign-off recorded with date and name.

**Gate rule**: The cutover does not proceed if any unknown or uncoordinated consumer exists.
