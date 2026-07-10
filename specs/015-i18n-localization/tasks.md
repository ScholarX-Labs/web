# Tasks: Production Internationalization and Arabic Localization

**Input**: Design documents from `/specs/015-i18n-localization/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Tests are required by the specification for unit, integration, E2E, accessibility, visual regression, security, and release-gate validation.

**Organization**: Tasks are grouped by setup, foundational work, then user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel when dependencies are satisfied and files do not overlap
- **[Story]**: Maps the task to a specific user story (`US1`-`US5`)
- Every task includes an exact file path or artifact target

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Capture baselines, install the i18n dependency, and create the task-supporting validation scripts and manifests.

- [ ] T001 Capture SSR latency and bundle-size baselines documented in `specs/015-i18n-localization/quickstart.md` before code changes
- [X] T002 Add `next-intl` and i18n validation scripts to `package.json`
- [X] T003 [P] Create the message catalog directory structure under `src/messages/en/` and `src/messages/ar/`
- [X] T004 [P] Create the route inventory validation script in `scripts/validate-route-inventory.ts`
- [X] T005 [P] Create the translation coverage validation script in `scripts/check-translations.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the locale foundation, middleware, route inventory helpers, and shared localization infrastructure that all stories depend on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [X] T006 Create locale constants, type guards, and direction helpers in `src/lib/i18n/locales.ts`
- [X] T007 [P] Create Next Intl routing config in `src/lib/i18n/routing.ts`
- [X] T008 [P] Create locale-aware navigation helpers in `src/lib/i18n/navigation.ts`
- [X] T009 Create request-scoped message loading in `src/lib/i18n/messages.ts`
- [X] T010 [P] Create client-side direction hooks in `src/lib/i18n/direction.ts`
- [X] T011 [P] Create localized metadata helpers in `src/lib/i18n/metadata.ts`
- [X] T012 Create route inventory definitions derived from `contracts/route-inventory.md` in `src/lib/i18n/route-inventory.ts`
- [X] T013 Update `next.config.ts` to wrap the app with the `next-intl` plugin
- [X] T014 Update `tsconfig.json` and create `src/types/next-intl.d.ts` for type-safe message keys
- [X] T015 Create locale middleware with exclusion logic in `src/middleware.ts`
- [X] T016 Create the localized root layout in `src/app/[locale]/layout.tsx`
- [X] T017 Simplify the global app shell so locale layout owns `lang` and `dir` in `src/app/layout.tsx`

**Checkpoint**: Locale infrastructure, validation scripts, and middleware are ready for story work.

---

## Phase 3: User Story 1 - Arabic users browse core ScholarX journeys (Priority: P1) 🎯 MVP

**Goal**: Deliver Arabic route support, localized UI copy, RTL layout, and Arabic-friendly typography across all in-scope core journeys.

**Independent Test**: Open `/ar`, `/ar/about`, `/ar/contact`, `/ar/courses`, `/ar/opportunities`, `/ar/opportunity/[id]`, `/ar/certificates`, `/ar/profile`, `/ar/auth/signin`, `/ar/ai-search`, and lesson routes; verify Arabic copy, `lang="ar-EG"`, `dir="rtl"`, and usable RTL layouts with no English fallback keys visible.

### Tests for User Story 1

- [x] T018 [P] [US1] Add locale utility unit tests in `tests/unit/i18n/locales.test.ts`
- [x] T019 [P] [US1] Add translation coverage script tests in `tests/unit/i18n/check-translations.test.ts`
- [x] T020 [P] [US1] Add localized route integration tests in `tests/integration/i18n/middleware-routes.test.ts`
- [x] T021 [P] [US1] Add Arabic route Playwright coverage in `tests/e2e/i18n/arabic-routes.spec.ts`
- [x] T022 [P] [US1] Add RTL visual regression snapshots in `tests/e2e/i18n/rtl-visual.spec.ts`
- [x] T023 [P] [US1] Add Arabic accessibility checks with axe in `tests/e2e/a11y/arabic-pages.spec.ts`

### Implementation for User Story 1

- [X] T024 [US1] Create English source catalogs for `common`, `home`, `auth`, `courses`, `certificates`, `opportunities`, `profile`, `about`, `contact`, `aiSearch`, `metadata`, and `email` in `src/messages/en/*.json`
- [X] T025 [US1] Create matching Arabic stub catalogs with identical keys in `src/messages/ar/*.json`
- [X] T026 [US1] Migrate batch A public pages into localized routes in `src/app/[locale]/page.tsx`, `src/app/[locale]/about/page.tsx`, and `src/app/[locale]/contact/page.tsx`
- [X] T027 [US1] Migrate batch B public platform routes into `src/app/[locale]/(platform)/courses/`, `src/app/[locale]/(platform)/opportunities/`, and `src/app/[locale]/opportunity/[id]/`
- [X] T028 [US1] Migrate batch C certificate and lesson routes into `src/app/[locale]/(platform)/certificates/` and `src/app/[locale]/(platform)/courses/[slug]/lessons/`
- [X] T029 [US1] Migrate batch D auth, profile, and scholar routes into `src/app/[locale]/auth/`, `src/app/[locale]/profile/`, and `src/app/[locale]/scholar/[username]/`
- [X] T030 [US1] Migrate batch E AI search route into `src/app/[locale]/ai-search/page.tsx`
- [X] T031 [US1] Extract home and public marketing strings from `src/lib/home-data.ts`, `src/components/home/*.tsx`, and `src/app/about/constants.ts` into localized message usage
- [X] T032 [US1] Extract authentication and profile UI strings from `src/components/ui/sign-in-card-2.tsx`, `src/app/auth/_components/*.tsx`, and `src/components/profile/*.tsx`
- [X] T033 [US1] Extract courses, enrollment, certificates, and opportunities strings from `src/components/courses/*.tsx`, `src/components/certificates/*.tsx`, and `src/components/opportunities/*.tsx`
- [X] T034 [US1] Extract AI search strings from `src/components/ai-search/*.tsx` and `src/lib/ai-search/*.ts`
- [X] T035 [US1] Add Arabic typography and locale-sensitive global styles in `src/app/globals.css`
- [X] T036 [US1] Replace physical direction Tailwind classes with logical RTL-safe utilities across localized surfaces in `src/app/[locale]/**/*` and `src/components/**/*`
- [X] T037 [US1] Add RTL-aware motion helpers in `src/hooks/useRTLMotion.ts` and apply them to RTL-sensitive animations in `src/components/**/*` and `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/*`
- [X] T038 [US1] Add runtime localization gap reporting for missing translations and unsupported locale requests in `src/lib/i18n/messages.ts`, `src/middleware.ts`, and `src/lib/debug/agent-log.ts`

**Checkpoint**: Arabic core journeys render through localized routes with RTL-safe UI and translated chrome.

---

## Phase 4: User Story 2 - Existing English experience remains stable (Priority: P1)

**Goal**: Preserve unprefixed English routes, auth boundaries, admin/API exclusions, and safe 404 behavior for unsupported locale prefixes.

**Independent Test**: Open existing English routes such as `/`, `/courses`, `/about`, `/auth/signin`, `/profile`, `/ai-search`, `/opportunities`, and `/scholar/[username]`; verify they remain unprefixed English routes with no `Accept-Language` redirect, while `/xyz/*` returns 404 and `/admin/*` and `/api/*` stay outside locale handling.

### Tests for User Story 2

- [X] T039 [P] [US2] Add English stability Playwright tests in `tests/e2e/i18n/english-stability.spec.ts`
- [X] T040 [P] [US2] Add unsupported-prefix and access-boundary integration tests in `tests/integration/i18n/access-boundaries.test.ts`
- [X] T041 [P] [US2] Add route inventory script coverage in `tests/unit/i18n/validate-route-inventory.test.ts`

### Implementation for User Story 2

- [X] T042 [US2] Implement route inventory coverage rules from the contract in `scripts/validate-route-inventory.ts` and wire them through `src/lib/i18n/route-inventory.ts`
- [X] T043 [US2] Ensure unsupported locale prefixes terminate with 404 in `src/app/[locale]/layout.tsx` and `src/middleware.ts`
- [X] T044 [US2] Preserve admin, API, ingest, and diagnostic exclusions in `src/middleware.ts` and verify no localized duplicates are introduced under `src/app/[locale]/`
- [X] T045 [US2] Update shared internal navigation to use locale-aware links only on localized surfaces in `src/components/Header.tsx`, `src/components/MobileMenu.tsx`, `src/components/PremiumHeader*.tsx`, and `src/components/PremiumMobileMenu.tsx`
- [X] T046 [US2] Add feature-flag rollback support for Arabic exposure in `src/lib/i18n/routing.ts`, `src/middleware.ts`, and `src/lib/app-config.ts`

**Checkpoint**: English routes remain stable and excluded boundaries remain unchanged while Arabic routing is active.

---

## Phase 5: User Story 3 - Users intentionally choose a language (Priority: P2)

**Goal**: Let visitors and authenticated users switch between English and Arabic, navigate to equivalent or safe fallback routes, and persist preference without blocking navigation.

**Independent Test**: Use the language switcher from desktop navigation, mobile navigation, and auth pages to switch `en → ar` and `ar → en`; verify route changes complete in two interactions or fewer and still succeed when persistence fails.

### Tests for User Story 3

- [X] T047 [P] [US3] Add locale preference API tests in `tests/integration/i18n/locale-preference-api.test.ts`
- [X] T048 [P] [US3] Add language switcher component tests in `tests/unit/i18n/locale-switcher.test.tsx`
- [X] T049 [P] [US3] Add Playwright language-switcher journey tests in `tests/e2e/i18n/language-switcher.spec.ts`

### Implementation for User Story 3

- [X] T050 [US3] Add the durable locale column to `src/db/schema/auth-schema.ts` and generate the matching migration in `drizzle/migrations/`
- [X] T051 [US3] Implement authenticated locale preference updates in `src/app/api/v1/me/locale/route.ts`
- [X] T052 [US3] Create locale switch routing and persistence helpers in `src/lib/i18n/switch-locale.ts`
- [X] T053 [US3] Create the language switcher UI in `src/components/locale-switcher.tsx`
- [X] T054 [US3] Integrate the locale switcher into `src/components/Header.tsx`, `src/components/MobileMenu.tsx`, `src/components/PremiumHeader.tsx`, `src/components/PremiumMobileMenu.tsx`, and auth entry pages under `src/app/[locale]/auth/`
- [X] T055 [US3] Add fallback-route resolution for non-localized destinations such as certificate downloads in `src/lib/i18n/switch-locale.ts` and `src/lib/i18n/route-inventory.ts`
- [X] T056 [US3] Ensure locale preference cookie behavior and fire-and-forget persistence semantics satisfy the contract in `src/lib/i18n/navigation.ts`, `src/components/locale-switcher.tsx`, and `src/app/api/v1/me/locale/route.ts`

**Checkpoint**: Language switching works across entry points and preference persistence never blocks navigation.

---

## Phase 6: User Story 4 - Users receive localized account messages (Priority: P2)

**Goal**: Localize verification, sign-in OTP, password reset, and account-change messages using a safe locale fallback chain and sanitized HTML output.

**Independent Test**: Trigger each account email flow for English and Arabic users; verify localized subject, text body, optional HTML body, `lang`, `dir`, and safe fallback behavior without leaking OTPs or reset URLs.

### Tests for User Story 4

- [ ] T057 [P] [US4] Add email locale resolution unit tests in `tests/unit/email/resolve-email-locale.test.ts`
- [ ] T058 [P] [US4] Add HTML escaping and template rendering tests in `tests/unit/email/templates.test.ts`
- [ ] T059 [P] [US4] Add integration tests for localized auth email flows in `tests/integration/email/localized-auth-email.test.ts`

### Implementation for User Story 4

- [X] T060 [US4] Create email template primitives and the fallback chain in `src/lib/email/templates/base.ts` and `src/lib/email/send.ts`
- [X] T061 [US4] Create localized verification, sign-in OTP, password reset, and email-change templates in `src/lib/email/templates/verification.ts`, `src/lib/email/templates/signin-otp.ts`, `src/lib/email/templates/password-reset.ts`, and `src/lib/email/templates/email-change.ts`
- [X] T062 [US4] Refactor auth email generation to use localized template helpers in `src/lib/auth.ts`
- [ ] T063 [US4] Add guardrails so localization gap reporting and auth flows do not log OTPs, reset URLs, or sensitive identifiers in `src/lib/auth.ts`, `src/lib/email/send.ts`, and `src/lib/debug/agent-log.ts`

**Checkpoint**: All account emails resolve locale correctly and render safe English and Arabic outputs.

---

## Phase 7: User Story 5 - Search and sharing identify localized pages (Priority: P3)

**Goal**: Publish correct localized metadata, sitemap entries, and alternate-language links for in-scope public pages only.

**Independent Test**: Inspect localized public pages and `/sitemap.xml`; verify `hreflang`, canonical URLs, and Arabic Open Graph metadata are correct while admin, API, diagnostic, and English-only routes remain absent.

### Tests for User Story 5

- [ ] T064 [P] [US5] Add metadata and sitemap integration tests in `tests/integration/i18n/metadata-sitemap.test.ts`
- [ ] T065 [P] [US5] Add Playwright verification for localized metadata in `tests/e2e/i18n/metadata.spec.ts`

### Implementation for User Story 5

- [ ] T066 [US5] Update public localized pages to use shared metadata helpers in `src/app/[locale]/page.tsx`, `src/app/[locale]/about/page.tsx`, `src/app/[locale]/contact/page.tsx`, `src/app/[locale]/(platform)/courses/page.tsx`, `src/app/[locale]/(platform)/opportunities/page.tsx`, `src/app/[locale]/opportunity/[id]/page.tsx`, `src/app/[locale]/ai-search/page.tsx`, `src/app/[locale]/scholar/[username]/page.tsx`, and `src/app/[locale]/(platform)/certificates/[certificateNumber]/page.tsx`
- [X] T067 [US5] Update sitemap generation for localized public routes only in `src/app/sitemap.ts`
- [X] T068 [US5] Enforce metadata namespace usage and public-route-only discoverability rules in `src/lib/i18n/route-inventory.ts` and `scripts/validate-route-inventory.ts`

**Checkpoint**: Search engines and social previews can identify English and Arabic public page variants correctly.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finish validation, launch-gate automation, and operational readiness across all stories.

- [ ] T069 [P] Create a localization security regression suite for locale injection and translation XSS in `tests/integration/i18n/security.spec.ts`
- [ ] T070 [P] Add launch-readiness verification tasks and status tracking aligned to `specs/015-i18n-localization/contracts/launch-readiness.md`
- [ ] T071 [P] Update any missing developer documentation for i18n workflows in `specs/015-i18n-localization/quickstart.md` and repository docs touched by the implementation
- [ ] T072 Run the full validation suite defined in `specs/015-i18n-localization/quickstart.md` and record results against the feature branch

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and should validate route behavior after US1 route migration
- **User Story 3 (Phase 5)**: Depends on Foundational completion and route inventory helpers from US2
- **User Story 4 (Phase 6)**: Depends on Foundational completion and locale types from Phase 2; benefits from US3 persistence work
- **User Story 5 (Phase 7)**: Depends on localized routes and message namespaces from US1 and route inventory validation from US2
- **Polish (Phase 8)**: Depends on all selected user stories being complete

### User Story Dependencies

- **US1 (P1)**: MVP; first deployable Arabic browsing experience
- **US2 (P1)**: Must pass before release because it protects existing English and access boundaries
- **US3 (P2)**: Depends on localized routing being stable
- **US4 (P2)**: Depends on locale types and preference storage, but can be built once the fallback chain is defined
- **US5 (P3)**: Depends on the final public localized route set and translated metadata

### Within Each User Story

- Write tests first where listed and confirm they fail before implementation
- Shared contracts and helpers precede route/component integration
- Route migration precedes copy extraction for the moved route
- Message catalogs precede type-safe translation usage
- Validation and rollout tasks happen after functional implementation

### Parallel Opportunities

- Phase 1 script and directory tasks marked `[P]` can run together
- Phase 2 routing, navigation, direction, and metadata helper tasks marked `[P]` can run in parallel after `locales.ts`
- In US1, test tasks `T018`-`T023` can run in parallel, then extraction tasks across domains can be split by namespace
- In US3, API, component, and Playwright test authoring can proceed in parallel once the locale schema contract is fixed
- In US4, email template files can be split by template after base helpers are in place
- In US5, metadata tests and sitemap implementation can proceed in parallel once the route inventory is stable

---

## Parallel Example: User Story 1

```bash
# Parallel test authoring
Task: "Add locale utility unit tests in tests/unit/i18n/locales.test.ts"
Task: "Add Arabic route Playwright coverage in tests/e2e/i18n/arabic-routes.spec.ts"
Task: "Add Arabic accessibility checks with axe in tests/e2e/a11y/arabic-pages.spec.ts"

# Parallel extraction by namespace after catalogs exist
Task: "Extract authentication and profile UI strings from src/components/ui/sign-in-card-2.tsx, src/app/auth/_components/*.tsx, and src/components/profile/*.tsx"
Task: "Extract courses, enrollment, certificates, and opportunities strings from src/components/courses/*.tsx, src/components/certificates/*.tsx, and src/components/opportunities/*.tsx"
Task: "Extract AI search strings from src/components/ai-search/*.tsx and src/lib/ai-search/*.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases
2. Complete User Story 1 route migration, message extraction, and RTL work
3. Validate Arabic browsing journeys independently
4. Demo the Arabic MVP before adding persistence, emails, and SEO

### Incremental Delivery

1. Foundation enables route-localized rendering
2. US1 adds Arabic browsing and RTL support
3. US2 hardens English stability and boundary safety
4. US3 adds user-controlled switching and persistence
5. US4 localizes critical account emails
6. US5 enables discoverability and sharing outputs
7. Polish closes launch gates and operational readiness

### Parallel Team Strategy

1. One engineer completes middleware and locale infrastructure
2. A second engineer handles catalog extraction and RTL/UI migration
3. A third engineer can build preference persistence and email localization after Phase 2
4. QA and metadata work can start once localized routes and catalogs stabilize

---

## Notes

- `[P]` means the task touches separate files and can be split safely after prerequisites
- Route inventory and launch-readiness contracts are release gates, not optional docs
- Keep English routes unprefixed throughout implementation
- Do not localize `admin/*`, `api/*`, `ingest/*`, or diagnostic routes
- Arabic broad exposure stays disabled until the launch-readiness gates all pass
