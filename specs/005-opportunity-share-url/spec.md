# Feature Specification: Shareable Opportunity Detail URLs

**Feature Branch**: `005-opportunity-share-url`
**Created**: 2026-05-18
**Status**: Draft
**Input**: "When the user clicks an Opportunity Card and the Animation Starts, Update the URL to that Specific Opportunity URL so Users can Share that Link" + "Make the shareable URL public as it's static data and will increase website traffic"

---

## Clarifications

### Session 2026-05-18

- **Q: Does the API always return IDs for opportunities?** → A: TBD — `SearchResult.id` is optional (`id?: string`). Fallback: opportunities without IDs simply aren't shareable.
- **Q: Should the search query also live in the URL?** → A: Yes — required for deep linking since the modal fetches data reactively from search results.
- **Q: Public access for shared URLs?** → A: Yes — public users should see opportunity details without logging in. Use a separate public route (`/opportunity/[id]`) not the auth-protected `/ai-search`.
- **Q: Data freshness for public pages?** → A: Opportunity data is static. Use ISR with `revalidate: 3600` (1 hour cache).

---

## User Stories & Testing

### User Story 1 — Share an open opportunity (Priority: P1)

As an authenticated user browsing search results, I want the URL to update when I open an opportunity detail and to have a "Copy Link" button, so that I can share the opportunity with others.

**Acceptance Scenarios**:

1. **Given** I am viewing search results, **When** I click an opportunity card, **Then** the URL updates to `?q=<query>&o=<id>` without page reload, and the modal opens.
2. **Given** the modal is open, **When** I click "Copy Link", **Then** `https://<domain>/opportunity/<id>` is copied to my clipboard.
3. **Given** the modal is open, **When** I press the browser back button, **Then** the modal closes and `&o=` is removed from the URL.
4. **Given** the modal is open, **When** I click "Close & Continue Searching", **Then** the URL returns to `?q=<query>`.

### User Story 2 — Deep-link into a shared opportunity (Priority: P1)

As a recipient of a shared opportunity link, I want to see the opportunity details without signing in, so that I can evaluate it before deciding to create an account.

**Acceptance Scenarios**:

1. **Given** I open `/opportunity/<valid-id>` as a logged-out user, **Then** I see a fully rendered page with the opportunity title, description, deadline, funding, and eligibility.
2. **Given** I am viewing a public opportunity page, **Then** I see a "Sign in to search all opportunities" call-to-action button.
3. **Given** I open `/opportunity/<invalid-id>`, **Then** I see a 404 page.

### User Story 3 — SEO indexing (Priority: P2)

As a search engine, I want to crawl and index opportunity pages so that users can discover opportunities via Google.

**Acceptance Scenarios**:

1. **Given** a search engine crawls `/opportunity/<id>`, **Then** the HTML response includes Open Graph meta tags and JSON-LD structured data.
2. **Given** an opportunity page is indexed, **When** a user searches on Google, **Then** the opportunity appears in search results with title and description.

---

## Requirements

### Functional

| ID | Requirement | Priority |
|---|---|---|
| F-01 | URL `q` param syncs with the search query on each new search | P1 |
| F-02 | URL `o` param syncs with the selected opportunity ID when modal opens | P1 |
| F-03 | Back/forward browser navigation correctly opens and closes the modal | P1 |
| F-04 | Deep link with both `q` and `o` params on `/ai-search` auto-opens the modal | P1 |
| F-05 | Public route `/opportunity/[id]` renders opportunity details without auth | P1 |
| F-06 | Public route has OG meta tags and JSON-LD structured data | P2 |
| F-07 | Public route uses ISR with `revalidate: 3600` | P1 |
| F-08 | Modal footer includes a "Copy Link" button that copies `/opportunity/<id>` | P1 |
| F-09 | Opportunities without an `id` silently skip URL updates and hide "Copy Link" | P2 |
| F-10 | Invalid/missing `o` IDs are silently ignored on `/ai-search` | P2 |
| F-11 | /opportunity/[id] returns 404 for unknown IDs | P1 |

### Non-Functional

| ID | Requirement | Priority |
|---|---|---|
| NF-01 | URL updates use `router.replace` — no extra history entries for modal state | P1 |
| NF-02 | `useSearchParams` consumer wrapped in `<Suspense>` per Next.js requirement | P1 |
| NF-03 | No page reload or layout shift on URL update | P1 |
| NF-04 | Public page `Cache-Control: public, s-maxage=3600` | P1 |
| NF-05 | Lighthouse Performance ≥ 90, SEO ≥ 90 on public page | P2 |
| NF-06 | Zero new npm dependencies | P1 |
