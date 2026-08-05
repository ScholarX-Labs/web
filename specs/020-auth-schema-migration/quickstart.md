# Quickstart: Auth Schema Migration to `app_auth`

**Audience**: Engineers applying and verifying the `auth` → `app_auth` migration.
**Run during**: The announced maintenance window, after all pre-cutover gates pass.

---

## Prerequisites

- Node 20 + pnpm (see `package.json` for exact versions).
- `DATABASE_URL` set to the **direct connection** (port **5432**) for DDL/migrations. The pooled URL (port 6543, PgBouncer) cannot execute DDL — do not use it for migration steps.
- `AUTH_SCHEMA` env (optional): defaults to `app_auth` in all scripts; only override in dev/test.
- The provided database dump confirmed available and restored on a scratch DB (pre-cutover gate).

---

## Gate 1 — Pre-Cutover (Run Before the Maintenance Window)

All items must pass **before** announcing the window. A failure here blocks the cutover.

```bash
# 1a. Schema-literal audit — zero prohibited literals
pnpm audit:schema-literals

# 1b. Type safety
pnpm typecheck

# 1c. Lint (includes import/no-cycle for namespaces.ts)
pnpm lint

# 1d. All tests
pnpm test
```

**Cross-repo consumer audit** (human gate):
- [ ] Identify all services, reporting tools, BI connectors, or database grants that reference the `auth` schema directly (not through this application).
- [ ] Confirm each is updated, isolated, or coordinated before proceeding.
- [ ] Document findings in `docs/consumer-audit-020.md`.

**Dump validation** (run on scratch DB):
```bash
# Restore dump → migrate → confirm schema-diff is clean
pnpm db:migrate                   # must complete with 0 errors
pnpm db:generate                  # must produce empty diff (no pending changes)

# Repeat on a second scratch restore to confirm reproducibility
```

**Rollback SLA validation**:
- [ ] Measure actual dump restore time + pipeline redeployment time in staging.
- [ ] Confirm total ≤ 25 minutes (5-minute safety margin for SC-005's 30-minute SLA).
- [ ] If measured time exceeds 25 minutes: **do not proceed** — reschedule after optimizing the restore path.

---

## Gate 2 — Announcement

```
Template: 
  "Scheduled maintenance: [DATE] [TIME] [TZ].
   The ScholarX platform will be in maintenance mode for approximately [N] minutes.
   Authentication and all platform features will be temporarily unavailable.
   We will announce all-clear when complete."
```

- [ ] Announcement sent via [engineering channel / status page / email] at least [N hours] in advance.
- [ ] On-call engineer confirmed available for the window duration.
- [ ] Platform maintenance mode enabled (if applicable).

---

## Gate 3 — Deploy

```bash
# Apply the code deployment against the already-renamed shared DB.
# The rename was already performed by the database specialist — do NOT run ALTER SCHEMA here.
```

Confirm the shared DB state first (optional double-check):
```sql
-- Connect via direct port 5432
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'app_auth'
ORDER BY table_name;
-- Expected: account, admin_audit_log, session, user, verification
```

If `auth` tables still exist (rename not applied): **STOP**. Contact the database specialist. Do not proceed until `app_auth` is confirmed.

**Startup canary** — verify immediately after deployment:
```sql
-- Executed automatically by the health endpoint / startup hook.
-- If this query errors, the deployment health check fails and traffic is not routed.
SELECT 1 FROM app_auth.user LIMIT 1;
```

- [ ] Canary passes (no `relation "app_auth.user" does not exist` error).
- [ ] No immediate spike in application error logs.

---

## Gate 4 — Smoke Tests

Run manually against the production environment immediately after deployment.

| Check | Expected Result |
|-------|----------------|
| Sign in with an existing account | Session created; reaches authenticated home |
| Resume an active session (refresh the page) | Session remains valid; no re-authentication prompt |
| Sign up a new user | Account created; stored in `app_auth`; confirmation flow works |
| Password reset flow | Email sent; link works; password updated successfully |
| OTP / magic-link sign-in | OTP delivered; sign-in succeeds |
| Executive analytics page | Loads with correct counts; no query errors |
| Admin audit log | Records displayed; identity joins resolve correctly |

All checks must pass. Any failure triggers the rollback path immediately.

---

## Gate 5 — All-Clear

- [ ] Maintenance mode disabled.
- [ ] All-clear notification sent (same channels as announcement).
- [ ] 30-day log alert configured: trigger on any occurrence of `relation "auth"` (not `app_auth`) in production logs. Configure in your observability platform (Datadog / Grafana / CloudWatch / etc.).

---

## Rollback Path

Execute in order if any gate fails after deployment begins.

1. Restore the database from the dump (pre-rename state).
2. Revert the code deployment to the previous release.
3. Restore pre-rebase `drizzle/` and `drizzle/meta/` from source control (if migration chain was rebased).
4. Confirm startup canary passes against the rolled-back state.
5. Run smoke tests on the rolled-back environment.
6. Announce the rollback and ETA for a new maintenance window.

> **Note**: The dump restore + code revert must complete within the 30-minute rollback SLA (SC-005). Validate this SLA in Gate 1 before the maintenance window — not during an incident.

---

## Deliverables (Definition of Done)

| Deliverable | Required By | Status |
|-------------|------------|--------|
| `src/db/schema/namespaces.ts` created | FR-013, SC-007 | ☐ |
| All schema modules import from `namespaces.ts` | FR-002, FR-013 | ☐ |
| `fix-auth-schema.js` deleted | Plan §6 | ☐ |
| `drizzle/0000` regenerated with `IF NOT EXISTS` guards | FR-006, SC-004 | ☐ |
| `pnpm audit:schema-literals` exits 0 | FR-002, SC-003 | ☐ |
| `pnpm typecheck` + `pnpm lint` + `pnpm test` pass | FR-002 | ☐ |
| Fresh restore → migrate → zero drift confirmed | FR-006, SC-004 | ☐ |
| Startup canary implemented | Plan §Canary | ☐ |
| Rollback SLA validated | SC-005 | ☐ |
| Cross-repo consumer audit documented | Plan §Cross-Repo | ☐ |
| `docs/frontend-nextjs-schema-auth-guide.md` updated | FR-009 | ☐ |
| `orm-analysis.md` delivered and reviewed | FR-014, SC-008 | ☐ |
