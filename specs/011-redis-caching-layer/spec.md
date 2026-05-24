# Feature Specification: Shared Performance Caching Layer

**Feature Branch**: `011-redis-caching-layer`  
**Created**: May 23, 2026  
**Status**: Draft  
**Input**: User description: "Review the ScholarX codebase and specify where to introduce a Redis caching layer with production-grade scalability, maintainability, performance, and SOLID boundaries."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Faster Public Discovery (Priority: P1)

Visitors browsing courses, scholarship opportunities, public scholar profiles, and public certificate pages see fast, reliable responses without waiting on repeated expensive reads or repeated upstream lookups.

**Why this priority**: Public discovery pages are the highest-visibility surfaces and must stay fast under traffic spikes without exposing private user data.

**Independent Test**: Can be tested by repeatedly loading public course listing/detail pages, opportunity detail pages, public profile pages, and certificate verification pages while confirming response speed, freshness limits, and absence of private fields.

**Acceptance Scenarios**:

1. **Given** public catalog content exists, **When** multiple visitors request the same course list or course detail, **Then** they receive the same public data within the expected freshness window.
2. **Given** an external opportunity detail has already been requested recently, **When** another visitor requests the same opportunity and language, **Then** the page loads from the shared fast path unless the data is expired or invalidated.
3. **Given** a profile is marked public, **When** visitors request the public profile page, **Then** only public profile fields are returned and the response remains fast during repeated access.

---

### User Story 2 - Fresh Content After Admin Changes (Priority: P1)

Admins who create, edit, publish, archive, or reorder courses and lessons can trust that learners and public visitors see updated content within a bounded time.

**Why this priority**: Caching is unacceptable if it causes stale course availability, stale lesson visibility, or stale public profile data after authoritative edits.

**Independent Test**: Can be tested by changing a course, lesson, category, or public profile field, then verifying the related public pages and API responses update within the declared freshness target.

**Acceptance Scenarios**:

1. **Given** an admin publishes or archives a course, **When** public catalog pages are requested after the change, **Then** the course appears or disappears within the configured freshness target.
2. **Given** an admin reorders or changes public lesson details, **When** a learner loads the course detail or lesson navigation, **Then** the visible curriculum reflects the change within the configured freshness target.
3. **Given** a learner updates profile visibility or public profile fields, **When** the public profile URL is requested, **Then** the cached public result is invalidated or refreshed without exposing private profile fields.

---

### User Story 3 - Consistent Abuse Protection Across Instances (Priority: P2)

Users and visitors are subject to consistent request limits for upload, application, contact, admin, and public-read abuse controls regardless of which server instance handles their requests.

**Why this priority**: In-memory limits are not reliable in horizontally scaled deployments and can allow abuse or inconsistent blocking.

**Independent Test**: Can be tested by sending repeated requests through multiple application instances and verifying that each protected workflow observes one shared limit.

**Acceptance Scenarios**:

1. **Given** a learner reaches the avatar upload limit, **When** subsequent upload requests hit different application instances, **Then** all instances enforce the same remaining limit and retry timing.
2. **Given** a learner repeatedly submits a course application, **When** requests are distributed across instances, **Then** duplicate or excessive attempts are blocked consistently.
3. **Given** an admin API route is called repeatedly, **When** the requests are load-balanced across instances, **Then** the rate limit remains consistent and returns a predictable retry response.

---

### User Story 4 - Operationally Safe Cache Management (Priority: P3)

Operators can understand cache health, disable or bypass cache-dependent behavior during incidents, and verify that failures degrade gracefully without breaking core user journeys.

**Why this priority**: Production caching must be observable and reversible; otherwise it becomes a hidden source of stale data or outages.

**Independent Test**: Can be tested by simulating cache unavailability, stale entries, invalidation failures, and high traffic while confirming the system either serves safe stale data or falls back to the authoritative source according to policy.

**Acceptance Scenarios**:

1. **Given** the shared cache is unavailable, **When** a public read request is made, **Then** the system uses the authoritative source or a safe stale result according to the surface policy.
2. **Given** the shared cache is unavailable, **When** an abuse-sensitive write request is made, **Then** the system fails closed or applies the stricter configured fallback for that workflow.
3. **Given** cache health degrades, **When** operators inspect platform health, **Then** they can see cache availability, error rate, latency, and invalidation outcomes.

### Edge Cases

- Public and personalized data must never share the same cache entry.
- Authenticated learner progress, enrollment status, sessions, secrets, raw email bodies, and private profile fields must not be cached in public or broadly shared entries.
- Cache keys must remain stable for semantically identical requests and distinct for different language, pagination, filter, identity, or permission scopes.
- Stale public content must expire or be invalidated after admin edits, profile privacy changes, course status changes, lesson visibility changes, and certificate revocation.
- Abuse-protection limits must behave safely when the shared cache is slow, unavailable, or partially failing.
- External opportunity data must handle upstream errors without turning transient provider failures into repeated slow page failures.
- Operational dashboards must avoid caching user-specific authorization decisions while still reducing repeated expensive aggregate reads.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST classify each read or control surface as public shared, authenticated personalized, admin-only, operational control, or abuse-protection before caching is enabled.
- **FR-002**: System MUST provide shared fast-path reads for public course listings, public course details, public course categories, and public lesson summaries.
- **FR-003**: System MUST exclude learner-specific enrollment, application, and progress state from public course cache entries.
- **FR-004**: System MUST provide shared fast-path reads for opportunity detail data by opportunity identifier and language, with a separate policy for query-based opportunity search results.
- **FR-005**: System MUST provide shared fast-path reads for public scholar profiles while preserving profile visibility rules and public-field-only responses.
- **FR-006**: System MUST provide bounded fast-path reads for public certificate verification and artifact status responses, with immediate or near-immediate refresh after revocation or artifact readiness changes.
- **FR-007**: System MUST provide short-lived fast-path reads for admin overview statistics, report summaries, and paginated admin lists without caching authorization decisions.
- **FR-008**: System MUST provide shared configuration lookup for runtime feature flags and kill switches while preserving environment override precedence.
- **FR-009**: System MUST enforce distributed abuse limits for avatar uploads, course application submission, admin API calls, contact submission, and high-volume public profile or opportunity reads.
- **FR-010**: System MUST define freshness targets, invalidation triggers, and fallback behavior for every cached surface before rollout.
- **FR-011**: System MUST invalidate or refresh affected public course cache entries after course creation, update, status change, archive, lesson creation, lesson update, lesson archive, lesson reorder, and category changes.
- **FR-012**: System MUST invalidate or refresh affected public profile cache entries after profile field updates, social link updates, avatar changes, privacy changes, username changes, or account deletion.
- **FR-013**: System MUST invalidate or refresh affected certificate cache entries after certificate issue, revocation, artifact generation completion, or artifact failure.
- **FR-014**: System MUST provide cache health visibility including availability, latency, hit rate, miss rate, stale responses, invalidation failures, and fallback events.
- **FR-015**: System MUST allow operators to disable caching globally and per surface without code changes.
- **FR-016**: System MUST avoid storing secrets, session internals, private environment values, raw provider payloads, raw message bodies, or unnecessary personally identifiable data in shared cache entries.
- **FR-017**: System MUST define safe behavior for cache unavailability: public reads may fall back to authoritative reads or safe stale data, while abuse-sensitive writes must use the strictest safe fallback.
- **FR-018**: System MUST support horizontal scaling so all application and worker instances observe consistent cache, rate-limit, and operational-control state.

### Key Entities

- **Cacheable Surface**: A product area eligible for shared fast-path reads or distributed control state, including its ownership, data sensitivity, freshness target, and invalidation triggers.
- **Cache Policy**: The rules for key scope, freshness, stale handling, fallback behavior, invalidation, and observability for a cacheable surface.
- **Cache Entry**: A normalized response snapshot or control value associated with a policy and safe for its declared audience.
- **Invalidation Event**: A business change that requires one or more cache entries to be refreshed, expired, or bypassed.
- **Distributed Limit Rule**: A shared request-control rule that defines actor, action, window, threshold, retry behavior, and failure fallback.
- **Cache Health Signal**: A measurable operational signal used to detect cache latency, errors, stale responses, and bypass behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of repeated public course catalog and course detail requests complete in under 500 ms during normal traffic.
- **SC-002**: 95% of repeated public opportunity detail requests complete in under 700 ms when the upstream data has been requested recently.
- **SC-003**: Public course, profile, and certificate pages reflect authoritative changes within 60 seconds for standard edits and within 10 seconds for privacy, archive, or revocation changes.
- **SC-004**: Repeated admin overview and report requests reduce repeated expensive read load by at least 50% while keeping displayed data within a 60-second freshness target.
- **SC-005**: Distributed abuse limits remain consistent across application instances for at least 99.9% of tested requests.
- **SC-006**: Cache unavailability does not prevent users from browsing public content, signing in, submitting legitimate course actions, or admins using critical write operations.
- **SC-007**: No verified test case exposes private profile fields, session data, secrets, private enrollment state, or raw message content through cached responses.
- **SC-008**: Operators can identify cache health, stale-response rate, and invalidation failure rate within 5 minutes of an incident starting.

## Assumptions

- The authoritative source of record remains unchanged; the cache improves read speed and coordination but does not become the primary business data store.
- Existing public, authenticated, and admin boundaries remain mandatory and take precedence over performance goals.
- Public content can tolerate bounded staleness when privacy, archive, revocation, or access-control state is not affected.
- Authenticated personalized data may use narrowly scoped per-user entries only when the policy proves the key cannot be shared across users.
- Distributed limits should fail closed for risky writes and fail open only for low-risk public reads where blocking legitimate visitors would be worse than temporary overuse.
- Existing route handlers should remain thin; cache decisions belong at domain, service, repository-adapter, or infrastructure boundaries.
