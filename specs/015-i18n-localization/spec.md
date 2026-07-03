# Feature Specification: Production Internationalization and Arabic Localization

**Feature Branch**: `015-i18n-localization`
**Created**: 2026-06-02
**Revised**: 2026-06-02
**Status**: Production-Grade Draft
**Input**: `SPEC-I18N.md` + engineering review pass

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Arabic users browse core ScholarX journeys (Priority: P1)

Arabic-speaking visitors and learners can complete the full ScholarX experience — including public browsing, authentication, learner profile, course discovery, certificate verification, opportunity discovery, and AI-assisted search — in Arabic. The experience uses correct Arabic copy, right-to-left reading direction, Arabic-appropriate typography, localized form labels and validation messages, and mirrored directional controls throughout.

**Why this priority**: Arabic is the highest-priority second language. Unlike French or German it is RTL, uses a distinct script, and affects readability, layout, accessibility, trust, and acquisition across every user-facing surface. A partial or layout-broken Arabic experience is worse than no Arabic.

**Independent Test**: Open Arabic variants of each in-scope journey, complete primary user actions, and verify language, direction, layout, controls, validation states, and assistive metadata are Arabic-appropriate with no English fallback keys visible to users.

**Acceptance Scenarios**:

1. **Given** an Arabic-speaking visitor opens an Arabic-supported public page, **When** the page loads, **Then** the visible interface copy is Arabic, the page declares `lang="ar"` and `dir="rtl"`, and the document title is Arabic.
2. **Given** an Arabic-speaking learner uses an in-scope form, **When** they review labels, helper text, validation errors, action buttons, loading states, and completion states, **Then** each user-facing message is Arabic and the form is readable right-to-left with no horizontal overflow on desktop, tablet, or mobile viewports.
3. **Given** an Arabic page includes directional navigation controls, carousel controls, breadcrumbs, step indicators, or directional iconography, **When** the user views or activates those controls, **Then** their visual direction and semantic meaning match Arabic reading flow.
4. **Given** a page contains mixed Arabic and English content (e.g., a course title not yet translated), **When** it renders, **Then** the page overall direction remains RTL and the embedded English term remains legible without breaking surrounding Arabic punctuation order or alignment.
5. **Given** an Arabic user interacts with any interactive component (modal, dropdown, drawer, tooltip), **When** the component opens, **Then** it renders in RTL orientation, focus order is correct for RTL reading, and it closes without leaving layout artifacts.

---

### User Story 2 — Existing English experience remains stable (Priority: P1)

Existing users, search traffic, shared links, bookmarks, and third-party integrations continue using the current unprefixed English routes without unexpected redirects, content changes, or authentication regressions. Arabic route variants are available separately without affecting English routes.

**Why this priority**: Localization must not degrade the default experience. Breaking existing English links, disrupting SEO, or accidentally moving public routes behind authentication would have immediate negative impact on all current users.

**Independent Test**: Open existing English routes before and after the feature ships; verify routes remain unprefixed and stable with no redirects introduced solely by browser language. Test unsupported locale-like prefixes fail safely.

**Acceptance Scenarios**:

1. **Given** a visitor opens an existing unprefixed public route (e.g., `/courses`), **When** the page loads, **Then** the route remains English and does not redirect because the browser's `Accept-Language` header is Arabic.
2. **Given** a visitor opens the Arabic-prefixed equivalent (e.g., `/ar/courses`), **When** the page loads, **Then** the route displays the complete Arabic experience for that journey.
3. **Given** a visitor opens a route with an unsupported locale-like prefix (e.g., `/xyz/courses`), **When** the request is evaluated, **Then** the system returns a 404 response — not a redirect to a valid locale, not a partial page, and not a leak of unrelated content.
4. **Given** a signed-in user accesses an authenticated English route, **When** localization is enabled, **Then** existing access control, session behavior, and user-specific content boundaries are unchanged.
5. **Given** an API or admin route receives a request with an Arabic-like prefix, **When** the middleware evaluates the request, **Then** it is not rerouted through locale handling and reaches its existing handler unchanged.

---

### User Story 3 — Users intentionally choose a language (Priority: P2)

Visitors and authenticated users can intentionally switch between English and Arabic from key entry points. The switch navigates to the equivalent localized journey when possible, persists the explicit preference, and does not block the current navigation if persistence fails.

**Why this priority**: Users whose browser settings differ from their preference need a reliable, low-friction mechanism to choose a language. Silent auto-routing based only on browser language creates surprising behavior.

**Independent Test**: Switch language on desktop navigation, mobile navigation, and authentication journeys while signed out and signed in. Verify destination, remembered preference, and graceful failure in at most two user interactions.

**Acceptance Scenarios**:

1. **Given** a visitor is on an English supported route, **When** they choose Arabic in the language switcher, **Then** they land on the Arabic equivalent route in two interactions or fewer.
2. **Given** a visitor is on an Arabic supported route, **When** they choose English, **Then** they land on the unprefixed English equivalent route in two interactions or fewer.
3. **Given** an authenticated user changes language, **When** the preference is saved successfully, **Then** future authenticated sessions, the profile page, and applicable account messages use the saved language.
4. **Given** preference saving fails (network error, session expiry, service unavailability), **When** the user switches language, **Then** the route change still completes and the user is not blocked or shown a preference-save error dialog.
5. **Given** the current route has no localized equivalent (e.g., a certificate download endpoint), **When** the user switches language, **Then** the system navigates to the closest safe localized destination (e.g., certificates index) and does not produce a broken URL or 404.
6. **Given** a user switches language repeatedly in a short period, **When** each switch is processed, **Then** the system applies the last explicit choice without producing request loops, duplicate cookies, or inconsistent preference state.

---

### User Story 4 — Users receive localized account messages (Priority: P2)

Users receive essential account-related transactional messages (verification OTP, sign-in OTP, password reset, account change) in the language matching their saved preference or current account journey. Messages remain understandable and safe if localization data is incomplete.

**Why this priority**: Authentication and account recovery are critical trust flows. Receiving a password reset email in an unexpected language creates support risk and account-access confusion. Localization that breaks these flows is unacceptable.

**Independent Test**: Trigger each account message type for English and Arabic users. Verify subject, body, plain-text alternative, language declaration, reading direction, and fallback behavior for each.

**Acceptance Scenarios**:

1. **Given** an Arabic-locale user triggers an account verification OTP message, **When** the message is generated, **Then** the subject and body are Arabic, the message declares `dir="rtl"` in HTML output, the OTP code is clearly presented, and the message reads correctly in a major Arabic email client.
2. **Given** an English-locale user triggers a password reset message, **When** the message is generated, **Then** the subject and body are English.
3. **Given** a user has no saved locale, **When** an account message is generated, **Then** the message uses the active account journey locale if known, otherwise English.
4. **Given** an Arabic message template is missing a required text segment before release, **When** release validation runs, **Then** Arabic enablement is blocked for that message type until the missing translation is resolved or explicitly removed from V2 scope.
5. **Given** a message is generated for any account event, **When** the template renders, **Then** no OTP value, reset URL, or internal identifier appears in any server log, error trace, or gap report outside the intended delivery context.

---

### User Story 5 — Search and sharing identify localized pages (Priority: P3)

Search engines, social preview renderers, and shared links can distinguish English and Arabic page variants. Users arriving from search or a shared link land on the correct localized experience without unexpected redirects, and duplicate-content risk is minimized.

**Why this priority**: Discoverability and sharing support business growth, but only after the core localized route and content experience are functional. This is P3 because it has no user-facing impact if P1/P2 are incomplete.

**Independent Test**: Inspect localized public page metadata, alternate-language references, sitemap coverage, and social preview text for English and Arabic variants. Confirm out-of-scope pages are not advertised as localized.

**Acceptance Scenarios**:

1. **Given** a supported public page has English and Arabic variants, **When** HTML metadata is inspected, **Then** each variant includes `hreflang` alternates for `en`, `ar`, and `x-default`, and the canonical URL matches the expected locale path.
2. **Given** discoverability outputs (sitemap) are generated, **When** supported public routes are reviewed, **Then** English and Arabic variants appear for every in-scope public page, and no admin, API, or out-of-scope pages appear as localized variants.
3. **Given** an Arabic page is shared on a social platform, **When** a link preview is generated, **Then** the Open Graph title and description are Arabic where translations exist.
4. **Given** a page is outside V2 localization scope, **When** discoverability outputs are reviewed, **Then** it is not listed as a localized variant in any sitemap entry or alternate-language reference.

---

### Edge Cases

- Browser language is Arabic but no explicit preference exists: existing unprefixed English routes stay English; users choose Arabic explicitly.
- A signed-in user's saved preference conflicts with the route they opened directly: the requested route locale wins for the current page view; saved preference is not overwritten.
- A user switches language on a route without a localized equivalent: system navigates to the closest safe localized destination; no dead ends or broken navigation.
- Arabic translation coverage is incomplete at launch: release validation blocks Arabic broad exposure for affected surfaces; no partial Arabic launch.
- A translated string is missing in production at runtime: the affected text falls back to English silently; no raw key, placeholder token, or internal ID is shown; the gap is reported to operators.
- Mixed Arabic and English content appears on the same page (e.g., untranslated course title): overall page `dir` remains `rtl` and embedded LTR terms remain readable.
- Existing course titles, descriptions, lessons, and locale-specific slugs are English-only in V2: surrounding interface chrome is localized; course content itself is English.
- Internal admin pages are requested with an Arabic locale URL: middleware correctly identifies the route as admin-only and does not treat the request as a localized user-facing route.
- Preference persistence fails due to sign-out, connectivity, or account state: language switching still changes the current experience and does not block the user or show a system error.
- RTL layout changes affect responsive breakpoints differently: each supported viewport (mobile ≥ 375px, tablet ≥ 768px, desktop ≥ 1280px) must be validated before launch.
- A localized page contains user-generated or externally sourced content: system chrome and interface labels are localized; content remains in its source language.
- A locale-injection attempt embeds an unsupported locale code in a URL, cookie, or form field: all locale inputs are validated against the supported list before use; invalid values are rejected with a safe response, not reflected to the user.
- A locale switch triggers while an in-flight form submission or mutation is pending: the switch must not discard unsaved user data.

---

## Scope & Boundaries

### In Scope for V2

- English (`en`) and Arabic (`ar`) user-facing localization for the route inventory defined in `contracts/route-inventory.md`.
- English as the default unprefixed route experience; Arabic as `/ar`-prefixed routes.
- Language choice controls on desktop navigation, mobile navigation, and authentication journeys.
- Saved locale preference for authenticated users (durable) and remembered explicit choice for visitors (cookie, best-effort).
- Localized account-related transactional messages: verification OTP, sign-in OTP, password reset, account-change.
- Correct `lang` and `dir` attributes, accessible form messages, localized page titles, Open Graph metadata, `hreflang` alternates, and sitemap coverage for in-scope localized routes.
- Human-approved Arabic translation coverage and launch validation before Arabic broad exposure.
- Production gap reporting for missing translations and unsupported locale requests.
- Staged Arabic enablement: Arabic routes are functional but not broadly exposed until all launch gates pass.

### Out of Scope for V2

- Machine-generated or machine-approved translation as shipped production copy.
- Localization of internal admin surfaces (`/admin/*`) or right-to-left admin layouts.
- Translated course record fields: course titles, descriptions, lesson content, localized course slugs.
- French (`fr`) and German (`de`) locales — architecture must support adding them, but no copy or testing is required.
- Custom date, number, or currency formatting rules beyond standard user-locale `Intl` presentation.
- Translator-facing content management UI or authoring workflows.
- Per-user language selection on individual content items (e.g., switching a single lesson to English while in Arabic mode).

---

## Requirements *(mandatory)*

### Functional Requirements

**Locale & Route**
- **FR-001**: The system MUST support `en` and `ar` as the only V2 production user-facing locales. Adding a new locale (e.g., `fr`) MUST require no database schema changes.
- **FR-002**: The system MUST keep English as the default locale with unprefixed routes. Existing URLs (e.g., `/courses`) MUST remain stable and MUST NOT redirect based solely on `Accept-Language`.
- **FR-003**: The system MUST provide `/ar`-prefixed routes for every route classified as `localized` in the route inventory.
- **FR-004**: The system MUST treat requests with unsupported locale-like prefixes (e.g., `/xyz/courses`) as 404 responses — not redirects to a valid locale, not partial pages.
- **FR-005**: The system MUST exclude `admin/*`, `api/*`, `ingest/*`, and diagnostic routes from locale routing middleware. These routes MUST reach their existing handlers unchanged.
- **FR-006**: The system MUST validate all locale values received from URLs, cookies, form fields, and API request bodies against the supported locale list before using them. Invalid values MUST be rejected.
- **FR-007**: The system MUST set `lang` and `dir` HTML attributes correctly on every localized page at server render time.

**Content & Messages**
- **FR-008**: The system MUST use human-approved Arabic copy for all V2 shipped interface text. Machine translation MUST NOT be used as the sole basis for shipped production copy.
- **FR-009**: The system MUST maintain a complete English source message set and matching Arabic message coverage for all in-scope V2 interface text.
- **FR-010**: The system MUST block Arabic broad exposure for any in-scope surface that has missing required Arabic translations at launch time.
- **FR-011**: The system MUST fall back to English text for unexpected missing Arabic strings in production. The fallback MUST NOT expose raw message keys, placeholder tokens, stack traces, or internal identifiers to users.
- **FR-012**: The system MUST log a localization gap record when a production translation fallback is triggered, without including private user data in the log.
- **FR-013**: The system MUST present Arabic pages with RTL layout, mirrored directional controls where semantically required, and Arabic typography (font, line height, letter spacing).

**Language Switching & Preference**
- **FR-014**: The system MUST provide a language switcher accessible from desktop navigation, mobile navigation, and authentication journeys.
- **FR-015**: The system MUST navigate users to the equivalent localized page when they switch language and an equivalent page exists. When no equivalent exists, the system MUST navigate to the closest safe localized destination.
- **FR-016**: The system MUST persist a visitor's explicit locale choice as a cookie for future visits. Cookie MUST store locale code only — no user identity, session ID, email, or route history.
- **FR-017**: The system MUST store an authenticated user's locale preference in `auth.user.locale` and use it for future authenticated sessions and transactional messages.
- **FR-018**: The system MUST allow the route locale to override saved preference for the current page view without modifying the saved preference.
- **FR-019**: The system MUST allow language switching to complete (route change) even if preference persistence fails.

**Transactional Email**
- **FR-020**: The system MUST localize account verification, sign-in OTP, password reset, and account-change messages for English and Arabic.
- **FR-021**: The system MUST resolve transactional message locale in this order: (1) saved authenticated user preference, (2) active auth journey locale, (3) English fallback.
- **FR-022**: Every localized transactional message MUST include: locale code, reading direction, localized subject, plain-text body (sufficient without HTML), and optional HTML body with correct `lang` and `dir` metadata.
- **FR-023**: Transactional message generation MUST NOT log OTP values, reset URLs, or authentication tokens outside the intended delivery context.

**SEO & Discoverability**
- **FR-024**: The system MUST include `hreflang` alternates for `en`, `ar`, and `x-default` on all in-scope public localized pages.
- **FR-025**: The system MUST generate sitemap entries only for in-scope localized public routes. Admin, API, diagnostic, and out-of-scope pages MUST NOT appear as localized sitemap variants.
- **FR-026**: Open Graph metadata on Arabic pages MUST use Arabic title and description where translations exist.

**Access Control & Data Boundaries**
- **FR-027**: The system MUST preserve public, authenticated, and admin access boundaries exactly as they exist before this feature. Localization MUST NOT cause a previously authenticated route to become public, or vice versa.
- **FR-028**: The system MUST NOT include private user data, session details, or internal route identifiers in localized metadata, shared previews, account messages, or fallback text.

**Observability & Operations**
- **FR-029**: The system MUST expose operator-visible reporting for production localization gaps, categorized by type (`missing_translation`, `unsupported_locale_request`) and severity, without logging private data.
- **FR-030**: The system MUST support staged Arabic route exposure. Arabic routes MUST be functional before broad exposure but shielded until all launch gates pass.
- **FR-031**: The system MUST maintain a release-owned route inventory (defined in `contracts/route-inventory.md`) that classifies every `src/app/**/page.tsx` route. The inventory MUST be the source of truth for scope control and QA assignment.

**V3 Extensibility**
- **FR-032**: The system's locale architecture MUST support adding `fr` and `de` in V3 with no database schema migrations and no changes to routing middleware logic — only new message files and locale list entries.

### Performance Requirements

- **PR-001**: Adding locale routing middleware MUST NOT increase P95 SSR response time for any existing English route by more than 10ms under the same load conditions.
- **PR-002**: Client-side language switching MUST complete the route change (navigation start to interactive) in under 300ms on a median device (Moto G4-class) on a 4G connection.
- **PR-003**: Arabic message bundles MUST NOT be included in the JavaScript bundle delivered to users browsing English routes, and vice versa. Each locale's messages are loaded only on demand.
- **PR-004**: Arabic font (Noto Sans Arabic) MUST NOT be downloaded on English-locale pages.
- **PR-005**: The locale switcher component MUST NOT block the main thread during preference persistence. Persistence MUST be fire-and-forget from the user's perspective.

### Security Requirements

- **SR-001**: The locale preference cookie MUST be set with `HttpOnly: false` (required for client JS reads), `SameSite=Lax`, `Secure` (in production), and MUST store only a validated locale code string.
- **SR-002**: All locale values received from external sources (URL segments, cookies, query params, request bodies) MUST be validated against the supported locale allowlist before use. Invalid values MUST be rejected with a safe 404 or ignored, never reflected unsanitized.
- **SR-003**: Localized HTML email bodies MUST sanitize all runtime variables (OTP, reset URL, display names) to prevent HTML injection in email clients.
- **SR-004**: RTL text rendering MUST NOT introduce XSS vectors. Rich text in message catalogs MUST use structured rendering (e.g., `next-intl` rich text API), never `dangerouslySetInnerHTML` with raw translation strings.
- **SR-005**: Locale data MUST NOT appear in Content Security Policy violation reports or error payloads that could leak internal route structure to external reporters.
- **SR-006**: The language preference update API endpoint MUST require an authenticated session and MUST validate that the `locale` value is in the supported list before writing to the database.

### Accessibility Requirements

- **AR-001**: Every localized page MUST declare the correct `lang` attribute at the `<html>` level so that screen readers apply the correct voice and pronunciation rules.
- **AR-002**: Every localized page MUST declare the correct `dir` attribute at the `<html>` level so that assistive technologies apply correct reading order.
- **AR-003**: Arabic form fields MUST have localized `<label>`, `aria-describedby` hint text, and `aria-live` validation error text.
- **AR-004**: Keyboard focus order on Arabic pages MUST follow RTL reading sequence for interactive elements in navigation, forms, and modals.
- **AR-005**: The language switcher MUST be keyboard-accessible and announce the current language and available options to screen readers.
- **AR-006**: Arabic font MUST render at a minimum effective size of 16px body text and 18px form labels to account for Arabic script legibility requirements.

### Quality Requirements

- **QR-001**: Localized routes MUST remain fully usable on mobile (≥ 375px), tablet (≥ 768px), and desktop (≥ 1280px) viewports.
- **QR-002**: Arabic pages MUST pass visual QA with no major text clipping, horizontal overflow, inaccessible controls, unreadable truncation, or overlapping layout on any supported viewport.
- **QR-003**: Language switching MUST NOT block or error any critical user journey (authentication, enrollment, certificate access) if preference persistence fails.
- **QR-004**: Localized account messages MUST remain understandable and actionable when rendered in plain text without HTML or images.
- **QR-005**: Discoverability outputs (sitemap, hreflang) MUST NOT include pages outside V2 localization scope as localized variants.
- **QR-006**: Arabic rollout MUST support staged validation in a non-production environment before broad user exposure.

---

### Key Entities *(include if feature involves data)*

- **Locale** — A supported user-facing language identified by a BCP-47 code (`en`, `ar`). V2 supports exactly two locales. Adding a locale requires no DB migration.
- **Route Locale** — The locale resolved from the requested URL, used as the source of truth for the current page view.
- **Localized Route Inventory** — The release-owned list classifying every app route as `localized`, `english_only`, `admin_only`, `api_only`, `diagnostic_only`, or `deferred`. Maintained in `contracts/route-inventory.md`.
- **Message Catalog** — The versioned, namespace-scoped set of human-approved user-facing strings for one locale. English is the canonical source; Arabic must match required English keys before launch.
- **Translation Coverage Record** — The validation result comparing Arabic keys against required English keys for each namespace. `fail` status blocks Arabic enablement.
- **User Locale Preference** — The durable, authenticated locale choice stored in `auth.user.locale`. Used for future sessions and transactional messages; does not override the current page's route locale.
- **Visitor Locale Choice** — A best-effort, cookie-persisted explicit language choice for signed-out visitors. Stored as locale code only — no personal data.
- **Language Switch Action** — A user-initiated locale change that navigates to the equivalent or fallback route and persists the preference. Preference persistence failure MUST NOT block navigation.
- **Transactional Message Template** — A locale-specific account message with subject, plain-text body, optional HTML body, locale code, and reading direction.
- **Localized Metadata** — The `<title>`, `<meta description>`, Open Graph, canonical URL, and `hreflang` alternates generated for a localized public page.
- **Localization Gap** — A classifiable quality issue (missing translation fallback, unsupported locale request, layout regression) that is reported to operators without leaking private data. Severity determines whether it blocks release or triggers a post-launch triage SLA.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of routes in the V2 localized route inventory correctly declare their locale's `lang` and `dir` attributes during release validation.
- **SC-002**: 100% of required Arabic interface message keys for all in-scope V2 namespaces are present and human-approved before Arabic broad exposure is enabled.
- **SC-003**: 100% of requests to unsupported locale-prefixed routes return 404 without serving partial page content, redirecting to a valid locale, or exposing unrelated content.
- **SC-004**: Language switching between English and Arabic completes in ≤ 2 user interactions on desktop navigation, mobile navigation, and authentication journeys.
- **SC-005**: ≥ 95% of Arabic page and component states pass RTL visual QA with no major clipping, overflow, incorrect icon direction, inaccessible controls, or unreadable text defects on any supported viewport.
- **SC-006**: 100% of in-scope English unprefixed routes continue to resolve successfully with no redirects introduced by locale routing.
- **SC-007**: 100% of tested account transactional messages use the expected language, reading direction, subject, body, and plain-text alternative for both English and Arabic users.
- **SC-008**: 100% of supported public localized pages include `hreflang` alternates for `en`, `ar`, and `x-default` in rendered HTML.
- **SC-009**: 100% of in-scope form states reviewed in Arabic expose localized labels, helper text, validation messages, and completion messages with no English fallback keys visible.
- **SC-010**: No measurable P95 SSR latency regression (> 10ms) on any existing English route compared to pre-feature baseline under equivalent load.
- **SC-011**: Arabic message bundles are absent from JavaScript payloads delivered to English-locale users (verified via bundle analysis in CI).
- **SC-012**: In user acceptance testing with Arabic-speaking participants, ≥ 90% successfully complete the homepage-to-course-discovery journey and authentication entry/recovery journey without language or layout blockers.
- **SC-013**: During staged rollout, zero critical journeys (authentication, course enrollment, certificate access) are blocked by localization preference persistence failure, missing text fallback, or locale routing.
- **SC-014**: Production localization gaps classified as `user_visible` or above are triaged within 1 business day during the first 30 days after Arabic launch.
- **SC-015**: Zero security incidents attributable to locale input validation failures (locale injection, XSS via translation strings, cookie data leakage) during the first 90 days.

---

## Assumptions

- English remains the default public experience and all existing unprefixed URLs remain stable.
- Arabic is the only new V2 locale; French and German are planned for V3+ but the architecture must accommodate them.
- The V2 localized route inventory (in `contracts/route-inventory.md`) is agreed before delivery planning and is the source of truth for scope decisions.
- Course titles, descriptions, lesson content, and locale-specific slugs are out of V2 scope.
- Admin pages and admin RTL support are out of V2 scope.
- All V2 Arabic translations are produced and approved by humans before release validation.
- Existing public, authenticated, and admin data boundaries remain intact when localized routes are introduced.
- Visitor locale cookie persistence is best-effort; authenticated locale persistence is durable when the user is signed in and connectivity is available.
- Standard `Intl` API formatting is sufficient for dates, numbers, and currencies in V2.
- A non-production staging environment is available for Arabic launch gate validation before broad user exposure.
- Support, content, or product owners are available to review Arabic copy and triage post-launch localization gaps within the stated SLA.
- The application is deployed in a way that allows per-request `Vary` headers for locale-sensitive CDN caching.
