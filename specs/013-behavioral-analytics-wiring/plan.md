# Implementation Plan: Behavioral Analytics Production Wiring

**Branch**: `013-behavioral-analytics-wiring`  
**Date**: 2026-05-26  
**Parent Feature**: `specs/012-executive-dashboard`  
**Objective**: Wire production user and system actions into `executive.analytics_events` so Executive Dashboard behavioral metrics reflect real traffic and actions, not seeded test data.

---

## Summary

ScholarX already has the durable analytics table, Drizzle schema, repository write path, and executive read models for behavioral analytics. The missing production layer is instrumentation: routes, client hooks, server-side tracking calls, and background jobs that write events through:

```ts
createExecutiveDomain().repositories.analyticsEvents.record({
  eventType,
  occurredAt: new Date(),
  userId,
  sessionIdHash,
  entityType,
  entityId,
  source,
  medium,
  campaign,
  deviceType,
  metadata,
});
```

This plan wires the seven supported event types:

- `website_visit`
- `cta_click`
- `signup_started`
- `ai_search`
- `opportunity_apply_click`
- `opportunity_link_check`
- `ai_feedback`

The work must preserve public/auth/admin boundaries, avoid PII leakage, avoid client-side secrets, and fail open so analytics outages never block product workflows.

---

## Current State

### Already Implemented

- Table: `executive.analytics_events`
- Schema: `src/db/schema/executive-analytics.schema.ts`
- Repository write path: `src/domain/executive/infrastructure/db/analytics-event.repository.ts`
- Domain factory exposure: `createExecutiveDomain().repositories.analyticsEvents`
- Dashboard readers:
  - Website analytics: traffic source, device, campaign, CTA performance
  - AI search quality: searches, zero-result rate, errors, latency, cost
  - Opportunity quality: apply clicks, link checks, broken/expired/missing metadata signals
  - Growth funnel: website visits, signup starts, opportunity actions

### Missing

- Public route/API to accept browser analytics events.
- Client tracker for page visits and CTA clicks.
- Server-side instrumentation in AI search execution.
- Server-side instrumentation for opportunity apply-link clicks.
- Background or admin-triggered opportunity link-check event writing.
- AI feedback event capture.
- Tests for production event-writing behavior and PII filtering.

---

## Design Principles

1. **Thin capture boundary**: Route handlers validate and normalize events, call the existing repository, and return small responses.
2. **No PII in metadata**: Metadata must reject or omit raw email, name, phone, tokens, IP address, user-agent strings, and prompt text unless explicitly safe and bounded.
3. **Fail open**: Analytics write failure must not block navigation, search, enrollment, apply clicks, or feedback submission.
4. **Server-owned enrichment**: User ID, session hash, IP-derived rate limit subject, and user-agent-derived device type should be added server-side where possible.
5. **Event-specific schemas**: Each event type gets a small Zod schema for allowed metadata keys.
6. **Idempotency where needed**: Browser `website_visit` and `cta_click` can be best effort; server-side actions should include stable correlation IDs when available.
7. **Admin privacy boundary**: Analytics capture must be available to public/product routes without importing admin UI or admin route code.

---

## Target Architecture

### New Public Capture Route

Add:

```text
src/app/api/analytics/events/route.ts
```

Responsibilities:

- Accept `POST` JSON body.
- Validate event type and event-specific metadata.
- Read optional current session using Better Auth.
- Derive:
  - `userId` from session when authenticated.
  - `sessionIdHash` from a first-party anonymous analytics cookie.
  - `source`, `medium`, `campaign` from request body or referrer/UTM fields.
  - `deviceType` from a coarse user-agent classifier.
- Rate-limit anonymous writes.
- Call `analyticsEvents.record(...)`.
- Return `202 Accepted` or `204 No Content`.
- Swallow/log repository errors and still return a non-blocking response unless validation fails.

### New Client Tracker

Add:

```text
src/lib/executive/analytics-client.ts
src/components/analytics/analytics-tracker.tsx
```

Responsibilities:

- Generate or reuse anonymous session cookie/client ID.
- Send `website_visit` on route changes for public/product pages.
- Provide `trackCtaClick(...)` helper for CTA components.
- Use `navigator.sendBeacon` when possible; fall back to `fetch(..., { keepalive: true })`.
- Respect Do Not Track if product policy requires it.
- Never include private fields from the DOM or user profile.

### Server-Side Event Helper

Add:

```text
src/lib/executive/record-analytics-event.ts
```

Responsibilities:

- Shared server helper wrapping `createExecutiveDomain().repositories.analyticsEvents.record(...)`.
- Accept typed event input.
- Validate/sanitize metadata.
- Catch errors and log operational context without full payloads.
- Keep route handlers and domain services thin.

---

## Event Wiring Plan

### 1. `website_visit`

Capture from client tracker on page view.

Fields:

- `eventType`: `website_visit`
- `occurredAt`: server receive time
- `sessionIdHash`: anonymous session hash
- `userId`: session user when available
- `source`, `medium`, `campaign`: UTM fields if present
- `deviceType`: coarse classifier
- `metadata`:
  - `path`
  - `referrerHost`
  - `locale`

Do not store:

- Full URL with sensitive query params
- Raw referrer URL
- IP address
- User agent string

### 2. `cta_click`

Capture from CTA components and important conversion buttons.

Initial CTA targets:

- Home hero CTAs
- Course browse/enroll CTAs
- Opportunity search/start CTAs
- Signup/login entry CTAs

Metadata:

- `ctaId`
- `ctaLabel`
- `surface`
- `path`
- `destinationType`

### 3. `signup_started`

Capture when a user intentionally starts signup, not merely viewing login/register.

Recommended wiring:

- Add server-side call in the auth/signup entry action or route if one exists.
- If signup is external/library-managed, fire from the signup form submit handler before handoff.

Metadata:

- `surface`
- `path`
- `method` (`email`, `google`, etc. when known)

### 4. `ai_search`

Capture inside the AI search API route/service after search completes or fails.

Metadata:

- `status`: `success` | `error` | `failed`
- `ok`: boolean-like string or boolean
- `resultCount`: number
- `zeroResults`: boolean
- `latencyMs`: number
- `estimatedCost`: number when known
- `queryLength`: number
- `filtersUsed`: string array or count

Do not store:

- Raw search prompt/query
- Full AI response
- User profile details

### 5. `opportunity_apply_click`

Capture via server redirect route rather than direct external link navigation.

Add route:

```text
src/app/api/opportunities/[id]/apply/route.ts
```

Responsibilities:

- Validate opportunity ID.
- Resolve official application URL.
- Record `opportunity_apply_click`.
- Redirect to external URL.

Metadata:

- `surface`
- `path`
- `fundingType`
- `country`
- `deadlineBucket`

### 6. `opportunity_link_check`

Capture from a background/admin-safe link checker.

Recommended first slice:

- Add a manual admin-only route or script to check a bounded batch.
- Record one event per checked opportunity.

Metadata:

- `title`
- `status`: `ok` | `broken` | `failed` | `not_found` | `expired`
- `ok`: boolean
- `brokenLink`: boolean
- `expired`: boolean
- `missingFields`: string[]
- `httpStatus`
- `latencyMs`

### 7. `ai_feedback`

Capture from feedback UI on AI search results.

Metadata:

- `rating`: `positive` | `negative`
- `reasonCode`
- `hasComment`: boolean
- `searchEventId` if available

Do not store:

- Free-form feedback text in analytics metadata unless separately moderated and bounded.

---

## Security And Privacy Requirements

- Use Zod schemas for every event type.
- Strip unexpected metadata keys.
- Bound all string lengths.
- Bound arrays and numeric ranges.
- Never accept client-provided `userId`.
- Hash anonymous session IDs server-side or use opaque random IDs that are hashed before storage.
- Do not log full event payloads on failures.
- Rate-limit anonymous capture route by IP/session.
- Ensure public capture route cannot be used to write unsupported `eventType` values.

---

## Reliability Requirements

- Analytics writes must never throw into product flows.
- Capture API should return success for repository failures after logging.
- Server-side helpers should use best-effort semantics.
- Dashboard read models already render data-gap states for missing instrumentation; preserve that behavior.

---

## Testing Plan

### Unit Tests

- Event metadata schemas accept valid payloads.
- Schemas strip/reject PII and unknown fields.
- `recordAnalyticsEvent` catches repository errors.
- Device/source normalization handles missing headers.

### Route Tests

- `POST /api/analytics/events` accepts valid public events.
- Route rejects unsupported event types.
- Route does not trust client-provided `userId`.
- Route rate-limits abusive anonymous writes.
- Route records authenticated user ID when session exists.

### Integration Tests

- AI search route records `ai_search` for success, zero-result, and failure paths.
- Opportunity apply redirect records `opportunity_apply_click`.
- Link checker records `opportunity_link_check`.
- AI feedback endpoint records `ai_feedback`.

### E2E Smoke

- Visit public page -> `website_visit` recorded.
- Click CTA -> `cta_click` recorded.
- Perform AI search -> dashboard AI search counters update.

---

## Implementation Slices

### Slice 1: Shared Contracts And Capture Route

- Add analytics event Zod schemas.
- Add server helper.
- Add `POST /api/analytics/events`.
- Add tests for validation and no-throw behavior.

### Slice 2: Client Page Visit And CTA Tracker

- Add client tracker component.
- Mount tracker in public/product layout boundary.
- Wire a small set of core CTAs.
- Add route/client tests where practical.

### Slice 3: AI Search Instrumentation

- Locate AI search API/service.
- Record `ai_search` with latency/result/error metadata.
- Add tests for success/failure/zero-result.

### Slice 4: Opportunity Apply Click Instrumentation

- Add redirect route for opportunity apply links.
- Update UI links to use internal redirect route.
- Record `opportunity_apply_click`.
- Add tests.

### Slice 5: Link Check And Feedback Events

- Add bounded link-check runner/route.
- Add AI feedback capture endpoint/UI wiring.
- Add tests.

### Slice 6: Dashboard Verification And Operational Hardening

- Seed realistic events locally.
- Confirm public growth, opportunities/AI, and website analytics sections populate.
- Add production runbook notes.
- Confirm all analytics failures degrade gracefully.

---

## Acceptance Criteria

- Production user actions write real rows to `executive.analytics_events`.
- Dashboard behavioral sections no longer depend only on seeded data.
- No raw PII is stored in analytics metadata.
- Analytics write failures do not break user workflows.
- Existing executive read models continue to work.
- Focused route/unit/integration tests cover each event type.
- `pnpm run lint`, relevant tests, and production build pass after implementation.

---

## Open Questions

- Should anonymous analytics respect a user-facing cookie consent preference?
- Which public/product layouts should mount the first page-view tracker?
- Should `website_visit` include authenticated admin visits, or exclude `/admin/*` paths?
- Should AI feedback free text be stored elsewhere, or only captured as `hasComment` analytics metadata?
- What batch size and schedule should `opportunity_link_check` use in production?
