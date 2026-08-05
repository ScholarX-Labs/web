# Feature Specification: Auth Schema Migration to app_auth

**Feature Branch**: `020-auth-schema-migration`  
**Created**: 2026-08-05  
**Status**: Draft  
**Input**: User description: "Move the custom authentication database schema to `app_auth` on Supabase to avoid the reserved `auth` schema, align all application code and migration tooling, and restore from the provided database dump."

## Background

The platform's own authentication and identity data (user accounts, sessions, linked provider accounts, verification tokens) is currently stored in a database schema named `auth`. The hosting provider reserves `auth` for its built-in authentication system, so the custom data must live under a different name — `app_auth`. The database specialist will provide a connection string and a dump file. This feature realigns the application, its migration tooling, and its runbooks so the platform operates against `app_auth` without collisions, downtime for users, or data loss.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Platform users keep signing in and using the platform (Priority: P1)

A learner or admin who already has an account opens the platform during and after the migration. Their account, password, OTP flows, and active session keep working. They are not asked to register again, and nothing they see changes.

**Why this priority**: Authentication is the front door to every product feature. If sign-in or sessions break, all users are blocked, so continuity here is the most critical outcome.

**Independent Test**: Sign in with an existing account, navigate to a course and to the dashboard, sign out, and sign back in — all must succeed without any authentication-related errors.

**Acceptance Scenarios**:

1. **Given** an existing user account with a valid session cookie, **When** the migration is applied, **Then** the session remains valid and the user can continue without re-authentication.
2. **Given** an existing user with known credentials, **When** they sign in after the migration, **Then** sign-in succeeds and they reach the authenticated home screen.
3. **Given** an existing user, **When** they request a password reset or OTP login after the migration, **Then** the flow completes and sends the expected email.
4. **Given** the platform after migration, **When** a new user signs up, **Then** account creation succeeds and the new account is stored in the relocated schema.

---

### User Story 2 - Engineers can provision fresh environments from the dump (Priority: P2)

An engineer restores the provided dump into a new Supabase environment, connects the application, and starts the platform. Everything — authentication, courses, certificates, leaderboard — works without manual schema fixes.

**Why this priority**: The dump is the safety net and the basis for reproducible environments. If restore + run does not work out of the box, every future deployment inherits the risk.

**Independent Test**: Restore the dump into a fresh environment, run all automated integration checks for authentication and course enrollment, and confirm all pass with zero manual SQL.

**Acceptance Scenarios**:

1. **Given** a fresh environment restored from the dump, **When** the application starts and migration tooling runs, **Then** it completes with no "relation not found" or DDL errors.
2. **Given** a fresh restored environment, **When** authentication integration tests run, **Then** they pass and accounts resolve to the relocated schema.

---

### User Story 3 - Administrators keep correct audit and analytics visibility (Priority: P3)

Admin audit records and executive analytics that join identity data continue to return correct results — the same rows as before the migration, with no missing or duplicated data.

**Why this priority**: Admin trust depends on correct audit trails and analytics. Lower priority than core auth because it is read-only visibility, but it must not silently break.

**Independent Test**: Run the admin audit log view and the executive analytics queries before and after the migration and confirm identical result sets.

**Acceptance Scenarios**:

1. **Given** admin audit records exist, **When** the audit log is queried after the migration, **Then** all records with identity information are returned correctly.
2. **Given** analytics queries that aggregate identity data, **When** run after the migration, **Then** they return results consistent with pre-migration counts.

---

### User Story 4 - Engineers relocate the identity schema from one place (Priority: P2)

An engineer who needs to move the identity data to a different schema name edits one centralized definition, and the entire platform — every query, migration, and report — resolves the new name automatically with nothing else to touch.

**Why this priority**: The current setup has the schema name scattered across definitions, raw SQL, and tooling, which is exactly why this rename was painful. Centralizing it removes the recurring failure mode.

**Independent Test**: After a controlled change to the single schema definition, run the full query and integration suite and confirm every identity-related query resolves without additional edits.

**Acceptance Scenarios**:

1. **Given** the centralized schema configuration, **When** the schema name is changed in that one place, **Then** no other code, migration, or tooling change is needed for queries to resolve.
2. **Given** the migration completion, **When** an audit is run, **Then** no direct reference to the old schema name remains anywhere in the platform.

---

### User Story 5 - Engineering gets a documented migration-tooling recommendation (Priority: P3)

Engineering receives a written analysis that documents the pain points with the current migration-history approach (including past "push schema to make it work" incidents) and compares it with alternatives, concluding with a clear recommendation. No production code or database changes result from the analysis.

**Why this priority**: This is a decision-support deliverable. It protects the platform's long-term stability but does not change runtime behavior, so it ranks below the stabilization work.

**Independent Test**: The analysis document exists, is reviewed by the team, and contains the issue history, alternatives compared, and a stated recommendation.

**Acceptance Scenarios**:

1. **Given** the analysis deliverable, **When** it is reviewed, **Then** it includes the concrete migration-history problems encountered and at least two alternative approaches with tradeoffs.
2. **Given** the analysis deliverable, **When** it is completed, **Then** no production code or database state has been changed by it.

---

### Edge Cases

- **Active sessions at cutover**: Users with live sessions must not be logged out or invalidated by the change.
- **Interrupted migration**: If a schema change is interrupted partway, the system must be restorable to a known-good state without data loss.
- **Pooled connection limitations**: The provided connection (port 6543) uses a pooling layer; schema changes must be executed over a connection that permits DDL, and this must be documented.
- **Mixed-schema state**: Tooling must not silently query the old schema location if both names exist temporarily during cutover.
- **Fresh restore that already contains the renamed schema**: Restore must be idempotent and not require a second manual rename.
- **Downstream consumers**: Any other system or repository that referenced the old schema location must be updated in coordination, or it will fail to resolve identity rows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The platform's custom authentication data MUST be stored in a schema whose name does not collide with any namespace reserved by the hosting database provider.
- **FR-002**: ALL application code that reads or writes authentication records MUST reference the relocated schema; NO reference to the old schema location MAY remain in code, tooling, or migrations.
- **FR-003**: All other application areas that link to identity records (course enrollment, lesson progress, certificates, leaderboard, email delivery, executive analytics, admin audit log) MUST continue to resolve those relationships correctly after the move.
- **FR-004**: Existing user accounts, credentials, and active sessions MUST remain valid across the migration; users MUST NOT be required to re-register or re-authenticate.
- **FR-005**: The migration MUST be reversible; a documented rollback procedure MUST restore the previous state without data loss.
- **FR-006**: The platform MUST be deployable to a fresh environment from the provided database dump with no manual schema repair steps.
- **FR-007**: Database connection details MUST be supplied only through secure environment configuration and MUST NOT appear in source control, logs, or documentation.
- **FR-008**: Schema-change tooling MUST execute reliably against the hosting provider, with the connection method (direct vs. pooled) explicitly documented for any DDL operations.
- **FR-009**: All internal documentation and runbooks MUST reflect the relocated schema so no future query references the old name.
- **FR-010**: The migration MUST preserve all foreign-key relationships from application data to identity records, including their referential integrity behavior.
- **FR-011**: The migration MUST be applied during a brief, announced maintenance window scheduled at a low-traffic time; platform downtime during cutover is acceptable but MUST be kept to minutes.
- **FR-012**: The physical rename to `app_auth` is ALREADY COMPLETE in the shared database; this work MUST align code, tooling, migrations, and documentation to the renamed schema and MUST verify the existing database state rather than performing the rename itself.
- **FR-013**: The identity schema name MUST be resolved from a single centralized configuration point, so that relocating the schema again requires changing exactly one definition and the entire platform follows automatically.
- **FR-014**: The migration MUST include a written analysis (no production code changes) comparing the current schema/migration tooling against alternatives for migration-history management, documenting the issues encountered (e.g., schema drift that required pushing the schema) and a recommendation.
- **FR-015**: The analysis deliverable MUST NOT alter production code or database state.

### Key Entities *(include if feature involves data)*

- **Identity Records**: User accounts, sessions, linked provider accounts, and verification tokens. The core authentication data that moves to the relocated schema.
- **Admin Audit Log**: Administrative action records that reference identity records by identifier; must retain correct joins after the move.
- **Application Data**: Course enrollments, lesson progress, certificates, leaderboard entries, email delivery records, and analytics events that reference identity records via foreign keys; all joins must keep working.
- **Database Dump**: A backup of structure and data used to restore environments; the restore process must reproduce the relocated schema.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pre-migration user accounts, sessions, and credentials are present and functional after the migration.
- **SC-002**: All core authenticated flows (sign in, resume session, sign out, password reset, OTP login) succeed within 5 minutes of cutover with no "relation not found" or schema-resolution errors.
- **SC-003**: No application or database errors referencing the old schema location appear in production logs for 30 days after migration.
- **SC-004**: A fresh environment provisioned from the provided dump passes all authentication and course-enrollment checks with zero manual SQL repairs.
- **SC-005**: Rollback, if ever needed, restores the prior state within 30 minutes.
- **SC-006**: No database connection details (including the connection string) appear in the committed repository.
- **SC-007**: Relocating the identity schema again requires changing exactly one configuration definition; all identity queries and migrations resolve without additional changes.
- **SC-008**: A written analysis on schema/migration tooling is delivered and reviewed, and it makes no production code or database changes.

## Assumptions

- The physical rename of the schema is ALREADY COMPLETE in the shared database; this feature aligns the application, tooling, migrations, and documentation with the `app_auth` name and verifies the existing state.
- A database dump is available as a restore point before the change and can serve as the rollback safety net.
- The new schema name `app_auth` is final and reserved exclusively for the platform's custom authentication data.
- All target environments (development, staging, production) will use the relocated schema.
- A brief maintenance window is acceptable and will be scheduled at a low-traffic time; platform stability after the change is the top priority.
- The centralized schema configuration will become the single source of truth for the identity schema name going forward.
- The ORM/schema-tooling analysis is a documentation deliverable only; no production code or database changes result from it.
- Other repositories or teams that reference the old schema location must be updated in coordination, since this repository cannot change code it does not own.
- Existing authentication sessions are identified by cookies that are independent of the schema name, so no client-side change is required.

## Resolved Decisions

- Q1 (outage tolerance): A brief, announced maintenance window at a low-traffic time is acceptable; downtime is kept to minutes.
- Q2 (rename ownership): The rename to `app_auth` is already done in the database. This work aligns and verifies code, tooling, migrations, and documentation — it does not perform the rename.
