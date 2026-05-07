# Courses Workflow — Production Readiness Plan

**Author**: Principal SWE Review  
**Date**: 2026-05-07  
**Context**: Full end-to-end audit of the Courses subsystem (Catalog → Detail → Enrollment → Persistence)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Layer-by-Layer Analysis](#2-layer-by-layer-analysis)
3. [Production Readiness Gaps](#3-production-readiness-gaps)
4. [Implementation Phases](#4-implementation-phases)
5. [Phase 1: Sales Inquiry Flow for Paid Courses](#phase-1-sales-inquiry-flow-for-paid-courses)
6. [Phase 2: Application Flow](#phase-2-application-flow)
7. [Phase 3: Admin Interface](#phase-3-admin-interface)
8. [Phase 4: Performance & Caching](#phase-4-performance--caching)
9. [Phase 5: Telemetry & Observability (PostHog + Sentry)](#phase-5-telemetry--observability-posthog--sentry)
10. [Phase 6: Testing & QA](#phase-6-testing--qa)
11. [Phase 7: Security Hardening](#phase-7-security-hardening)
12. [Backend Integration Pass](#8-backend-integration-pass)
13. [Migration Strategy & Rollout](#9-migration-strategy--rollout)
14. [Effort Summary](#10-effort-summary)
15. [Definition of Done](#11-definition-of-done)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-07 | Principal SWE | Initial audit |
| 1.1 | 2026-05-07 | Principal SWE | Phase 1: Stripe Checkout → Sales Inquiry Form; Phase 5: Generic Analytics → PostHog + Sentry |

---

## 1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                                                              │
│  CoursesPage (RSC)    CourseDetailPage (RSC)                 │
│       │                     │                                 │
│  CoursesView (Client)  CourseHero / StickyCTA                │
│       │                     │                                 │
│  LatestCoursesSection    CourseCurriculum                    │
│  CourseGrid              CourseInstructor                    │
│  EnrollModal             PriorityEnrollmentWindow             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  ORCHESTRATION LAYER                         │
│                                                              │
│  useEnrollIntentController  (src/lib/enrollment/)            │
│  useEnrollmentStore         (Zustand state machine)          │
│  useCourseSheetStore        (Zustand sheet state)            │
│                                                              │
│  EnrollmentExecutor         (strategy pattern)               │
│    ├─ FreeEnrollStrategy    → POST /courses/:id/enroll/free  │
│    ├─ SalesInquiryStrategy  → POST /courses/:id/inquiry     │
│    └─ FormApplicationStrategy→POST /courses/:id/enroll/app   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   API / TRANSPORT LAYER                      │
│                                                              │
│  coursesService  (src/lib/api/courses.service.ts)            │
│  └─ fetch → /api/courses/[...path]  (Next.js Route Handler) │
│       └─ createNextCourseDomain()                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    DOMAIN LAYER                               │
│                                                              │
│  NextCourseCatalogService                                    │
│    └─ list / getFeatured / getScholarX / search              │
│    └─ getById / getBySlug / getEnrollmentStatus              │
│                                                              │
│  NextCourseEnrollmentService                                 │
│    └─ enrollFree / initPaidEnrollment                        │
│    └─ initApplicationEnrollment                              │
│                                                              │
│  NextCoursesRepository (Drizzle ORM)                         │
│    └─ db.courses / db.subscriptions / db.users               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   DATA LAYER (PostgreSQL)                     │
│                                                              │
│  courses Schema:  courses, subscriptions, users              │
│  Drizzle ORM + pgSchema("courses")                           │
└─────────────────────────────────────────────────────────────┘
```

### State Machine (Enrollment Lifecycle)

```
                    ┌─────────┐
                    │  idle   │
                    └────┬────┘
                         │ enroll_click
                    ┌────▼────┐
                    │ precheck├────────► auth_redirect ──► sign-in page
                    └────┬────┘
                         │ authenticated
                    ┌────▼────┐
                    │modal_open│
                    └────┬────┘
                         │ confirm enroll
                    ┌────▼────┐
                    │processing│
                    └────┬────┘
                    ┌────┴────┐
                    │         │
               ┌────▼──┐ ┌───▼───┐
               │success│ │ error │
               └────┬──┘ └───┬───┘
                    │         │
               ┌────▼────┐    │ (retry → processing)
               │  closed │◄───┘
               └─────────┘
```

---

## 2 Layer-by-Layer Analysis

### 2.1 Presentation Layer — ✅ Ready

| Component | Status | Notes |
|-----------|--------|-------|
| `courses/page.tsx` | ✅ Done | RSC, `force-dynamic`, fetches catalog via domain layer |
| `courses/[slug]/page.tsx` | ✅ Done | RSC, handles `?intent=enroll`, passes `autoOpen` to modal |
| `courses-view.tsx` | ✅ Done | Filter/search branching to `LatestCoursesSection` or `CoursesFilterSection` |
| `courses-hero.tsx` | ✅ Done | Static hero banner |
| `latest-course-card.tsx` | ✅ Done | FLIP animation, enrollment intent dispatch |
| `course-card.tsx` | ✅ Done | Grid card with detail sheet orchestration |
| `course-grid.tsx` | ✅ Done | First-load ripple cascade, stagger animations |
| `course-detail-sheet.tsx` | ✅ Done | FLIP-based detail sheet surface |
| `course-detail-surface-portal.tsx` | ✅ Done | Portal orchestration for detail surface |
| `enroll-modal.tsx` | ✅ Done | Full state machine integration, cinematic processing sequence |
| `priority-enrollment-window.tsx` | ✅ Done | Premium 3-step processing UI |
| `enroll-modal-content.tsx` | ✅ Done | Modal content decomposition |
| Slug `_components/*` | ✅ Done | Hero, StickyCTA, Curriculum, Instructor all wired |

**Observations**:
- All components respect `prefers-reduced-motion`
- FLIP transitions implemented for desktop card → sheet expansion
- Stagger animations use `StaggerContainer` / `StaggerItem` pattern
- Processing UI shows 3-step cinematic sequence with debounce

### 2.2 Orchestration Layer — ✅ Done (Core), ⚠️ Gaps in Edge Cases

| Component | Status | Notes |
|-----------|--------|-------|
| `intent-controller.ts` | ✅ Done | Unified intent dispatch, auth precheck, correlation ID |
| `enrollment.store.ts` | ✅ Done | Zustand state machine with full lifecycle |
| `course-sheet.store.ts` | ✅ Done | Sheet state + intent tracking |
| `enrollment-executor.ts` | ✅ Done | Strategy pattern: free / paid / application |
| `error-mapper.ts` | ✅ Done | API error → enrollment error code mapping |

**Observations**:
- Auth redirect flow preserves `callbackUrl` with `intent=enroll`
- Strategy selection via `deriveEnrollmentMode()` based on `price` + `requiresForm`
- Idempotency key uses `correlationId` for safe retries

### 2.3 Domain Layer — ✅ Solid

| Component | Status | Notes |
|-----------|--------|-------|
| `NextCourseCatalogService` | ✅ Done | Pagination, subscription-aware sorting, search |
| `NextCourseEnrollmentService` | ✅ Done | Pre-checks: course active, user active, not blocked, not duplicate |
| `NextCoursesRepository` | ✅ Done | Drizzle queries, joins, pagination, subscriptions |
| `courses-db.schema.ts` | ✅ Done | `courses` + `subscriptions` tables in `courses` schema |
| `next-course.errors.ts` | ✅ Done | Typed error hierarchy with numeric codes |
| `next-course-domain.factory.ts` | ✅ Done | DI wiring |

**Observations**:
- Clean hexagonal architecture: contracts → application → infrastructure
- All DB queries use parameterized SQL via Drizzle
- Error codes are numeric (1001, 9002, 9005, etc.) with typed mapping
- Repository pattern enables testability

### 2.4 API / Transport Layer — ✅ Working, ⚠️ Backend Gaps

| Component | Status | Notes |
|-----------|--------|-------|
| Route handler `[...path]/route.ts` | ✅ Done | Catch-all for all endpoints, DI-ready with `CoursesRouteDeps` |
| `courses.service.ts` (client) | ✅ Done | Full client with fallback logic, error mapping |
| `env.ts` | ✅ Done | Zod-validated env config |
| Backend NestJS (separate repo) | ⚠️ Partial | See [Backend Integration Pass](#8-backend-integration-pass) |

**Observations**:
- Route handler uses dependency injection pattern (`createCoursesRouteHandlers(deps)`)
- Client-side service has backward-compatible fallback from `/enroll/free` to `/enroll`
- `createRequestUrl` handles both absolute and relative API base URLs
- `X-Request-Id` tracing throughout

---

## 3 Production Readiness Gaps

### Critical (Blocks Production)

| # | Gap | Impact | Location |
|---|-----|--------|----------|
| 1 | **No sales inquiry flow for paid courses** | `paid-checkout.strategy.ts` redirects to `/checkout?courseId=X` (404) instead of showing a contact form | `paid-checkout.strategy.ts`, `enrollment-executor.ts`, `enroll-modal.tsx` |
| 2 | **No inquiry DB schema or API endpoint** | Paid course inquiries cannot be stored or reviewed | Missing `dbInquiries` table, missing `POST /courses/:id/inquiry` route |
| 3 | **No application form UI** | `requiresForm` courses have no submission path | `form-application.strategy.ts` returns URL but no form exists |
| 4 | **No database migrations check** | Production schema may drift | Drizzle schema exists but no migration history verified |
| 5 | **All routes are `force-dynamic`** | No caching, higher DB load, slower responses | Both `page.tsx` and route handler use `force-dynamic` |

### High

| # | Gap | Impact | Location |
|---|-----|--------|----------|
| 6 | **No admin UI for course CRUD** | Ops team needs direct DB access | API supports CRUD; no admin interface exists |
| 7 | **Telemetry is console-only** | No production analytics | `enrollment-events.ts` only does `console.debug` |
| 8 | **No PostHog or Sentry configured** | No product analytics or error tracking | Missing `posthog-js`, `@sentry/nextjs` setup |
| 9 | **No backend endpoint for `/enroll/application/init`** | Application flow not wired | Backend NestJS controller may not have this route |
| 10 | **No backend slug endpoint** | Frontend has compatibility shim | `getBySlug` falls back to `getById` |

### Medium

| # | Gap | Impact | Location |
|---|-----|--------|----------|
| 11 | **No unit tests for enrollment store** | State machine regressions untested | `enrollment.store.ts` has no test file |
| 12 | **No unit tests for executor** | Strategy selection untested | `enrollment-executor.ts` has no test file |
| 13 | **No E2E tests for enrollment flow** | Full critical path untested | Only unit test is `enroll-modal.test.ts` |
| 14 | **Console.log statements in production path** | Noise in production logs | Multiple `console.log` in enrollment, API service, domain |
| 15 | **No CSRF protection for enrollment APIs** | Potential CSRF on mutation endpoints | Route handler has no CSRF check |
| 16 | **No rate limiting** | Enrollment endpoints vulnerable to abuse | No throttling on POST endpoints |

### Low

| # | Gap | Impact | Location |
|---|-----|--------|----------|
| 17 | **No accessibility audit** | WCAG compliance unverified | ARIA live regions exist but full audit needed |
| 18 | **No bundle size budget** | Risk of regression over time | No CI check for bundle size |
| 19 | **No feature flags** | Can't staged rollout | No flag system for enrollment changes |
| 20 | **Error boundaries not verified** | Unhandled errors may crash section | No explicit error boundary in courses layout |

---

## 4 Implementation Phases

```
Timeline (parallel tracks):
│
├── Track A (Frontend):   Phase 1 ──► Phase 2 ──► Phase 4 ──► Phase 6
├── Track B (Backend):    Backend Pass ──► Phase 1 API
├── Track C (Infra):      Phase 5 ──► Phase 7
└── Track D (QA):         Phase 6 (parallel)
```

### Phase Dependency Graph

```
Phase 1 (Inquiry) ───────────┐
                             ├──► Production Release
Phase 2 (Application) ──────┤
                             │
Backend Integration Pass ────┘
                             │
Phase 3 (Admin) ────────────┤ (separate deployment)
                             │
Phase 4 (Performance) ──────┤
                             │
Phase 5 (PostHog+Sentry) ───┤
                             │
Phase 6 (Testing) ──────────┘
                             │
Phase 7 (Security) ─────────┘
```

---

## Phase 1: Sales Inquiry Flow for Paid Courses

**Goal**: When a user clicks Enroll on a paid course, show a contact form. The ScholarX team reviews the inquiry and reaches out manually. No automated payment processing.

### 1.1 Add `salesInquiry` to Course Domain

**Files to modify**:

| File | Change |
|------|--------|
| `src/types/course.types.ts` | Add `salesInquiry?: boolean` to `Course` interface |
| `src/domain/courses/infrastructure/db/courses-db.schema.ts` | Add `salesInquiry: boolean("sales_inquiry")` column to `dbCourses` |
| `src/domain/courses/infrastructure/db/next-courses.repository.ts` | Add `salesInquiry` to `FlatCourseRecord` + `mapCourseRecord()` |
| `src/domain/courses/application/next-course-catalog.service.ts` | Add `salesInquiry` to `toCourse()` mapper |
| `src/lib/api/courses.service.ts` | Add `salesInquiry` to `CourseItemResponse` + `mapCourse()` |

### 1.2 Add `inquiry` Enrollment Mode

**File**: `src/lib/enrollment/types.ts`

```diff
- export type EnrollmentMode = "free" | "paid" | "application";
+ export type EnrollmentMode = "free" | "paid" | "inquiry" | "application";
```

**File**: `src/lib/enrollment/enrollment-executor.ts` — update `deriveEnrollmentMode`:

```typescript
export const deriveEnrollmentMode = (context: EnrollmentContext): EnrollmentMode => {
  if (context.course.requiresForm) return "application";
  if ((context.course.price ?? 0) > 0) return "inquiry";  // was "paid"
  return "free";
};
```

### 1.3 Create Inquiry Strategy (Replace Paid Checkout)

**File**: `src/lib/enrollment/strategies/sales-inquiry.strategy.ts` [NEW]

```typescript
import { coursesService } from "@/lib/api/courses.service";
import {
  EnrollmentContext,
  EnrollmentExecutionResult,
} from "@/lib/enrollment/types";
import { mapEnrollmentError } from "@/lib/enrollment/error-mapper";

export const executeSalesInquiry = async (
  context: EnrollmentContext,
  formData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
  },
  apiClient: typeof coursesService = coursesService,
): Promise<EnrollmentExecutionResult> => {
  try {
    const response = await apiClient.submitInquiry(context.course.id, {
      ...formData,
      sourceSurface: context.command.source,
      idempotencyKey: context.command.correlationId,
    });

    return {
      ok: true,
      mode: "inquiry",
      nextAction: "none",
      message: "Your inquiry has been submitted. Our team will contact you shortly.",
    };
  } catch (error) {
    const mapped = mapEnrollmentError(error);
    return { ok: false, mode: "inquiry", code: mapped.code, message: mapped.message };
  }
};
```

**File**: `src/lib/enrollment/strategies/paid-checkout.strategy.ts` — delete or replace with the above.

### 1.4 Create Inquiry Form UI Component

**File**: `src/components/courses/sales-inquiry-form.tsx` [NEW]

```
Fields:
├─ Full Name (text input, required)
├─ Email Address (email input, required, pre-filled from session)
├─ Phone Number (tel input, optional)
├─ Message / Questions (textarea, optional)
└─ Submit button → triggers executeSalesInquiry
```

**Integration with EnrollModal**:
- When `deriveEnrollmentMode()` returns `"inquiry"`, show the sales inquiry form inside the modal
- The form replaces the "Enroll Now" CTA content area
- On submit: validate fields → show processing animation → show success confirmation with message "Our team will contact you shortly"
- On success: do NOT create a subscription (team handles it manually)

### 1.5 Update EnrollModal to Handle Inquiry Mode

**File**: `src/components/courses/enroll-modal.tsx`

```diff
- const isPaid = (course.price ?? 0) > 0;
+ const mode = deriveEnrollmentMode({ command: {...}, course: {...} });
+ const isInquiry = mode === "inquiry";
+ const isPaid = mode === "paid"; // reserved for future direct payment
```

- Render `<SalesInquiryForm>` when `isInquiry` is true
- Replace the hardcoded CTA button with conditional rendering:
  - Free → "Enroll Now" (existing)
  - Inquiry → "Submit Inquiry" (new)
  - Application → "Apply Now" (existing)

### 1.6 Create Sales Inquiries DB Schema

**File**: `src/domain/courses/infrastructure/db/courses-db.schema.ts`

```typescript
export const dbInquiries = coursesSchema.table("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => dbCourses.id),
  userId: text("user_id").references(() => dbUsers.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  message: text("message"),
  status: varchar("status", { length: 50 }).default("pending"), // pending | contacted | converted | closed
  sourceSurface: varchar("source_surface", { length: 50 }),
  idempotencyKey: varchar("idempotency_key", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### 1.7 Add Backend Endpoint

**File**: `src/app/api/courses/[...path]/route.ts` — add route:

- `POST /api/courses/:id/inquiry`
- Validates: course exists, is paid, user is authenticated
- Stores inquiry in `dbInquiries` table
- Returns success with inquiry ID
- Creates a notification for admin team (email or in-app)

### 1.8 Wire API Client Method

**File**: `src/lib/api/courses.service.ts`

```typescript
submitInquiry: async (
  courseId: string,
  body: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    sourceSurface?: string;
    idempotencyKey?: string;
  },
  token?: string,
): Promise<{ inquiryId: string; message: string }> => {
  return postJson(
    `/courses/${courseId}/inquiry`,
    { body, token },
    "Failed to submit inquiry",
  );
},
```

### 1.9 Admin Review Panel (for Inquiries)

**File**: `src/app/admin/courses/inquiries/page.tsx` [NEW]

- List all inquiries with status filter (pending → contacted → converted → closed)
- Each row: course name, inquirer name, email, phone, submitted date
- Click to expand full inquiry details
- Action buttons: "Mark Contacted", "Mark Converted", "Close"
- Status updates stored on the `inquiries` record

### 1.10 Remove `/checkout` Route

- Do NOT create `src/app/(platform)/checkout/`
- Delete `paid-checkout.strategy.ts` (replaced by `sales-inquiry.strategy.ts`)
- Remove `checkoutUrl` from `EnrollmentExecutionSuccess` type

### 1.11 Acceptance Criteria

- [ ] User clicks "Enroll" on paid course → sees inquiry form (not processing animation)
- [ ] Inquiry form has validations: name and email required, email format check
- [ ] Session email is pre-filled if user is authenticated
- [ ] On submit: processing animation → success message "Our team will contact you shortly"
- [ ] Inquiry is stored in DB with `status: "pending"`
- [ ] Admin panel lists all inquiries with status management
- [ ] No subscription is created (team handles activation manually)
- [ ] All free enrollment paths continue working unchanged
- [ ] All application (requiresForm) paths continue working unchanged
- [ ] No `/checkout` route exists; no Stripe dependencies added

---

## Phase 2: Application Flow

**Goal**: Complete the `requiresForm` enrollment path with a real application form.

### 2.1 Create Application Submission UI

**File**: `src/components/courses/application-form.tsx` [NEW]

```
Fields (configurable per course):
├─ Personal statement / motivation (textarea, required)
├─ Relevant experience (textarea, optional)
├─ Portfolio URL (input, optional)
├─ Expected commitment (select: hours/week)
└─ Additional questions (dynamic from course metadata)
```

**Integration with EnrollModal**:
- When `deriveEnrollmentMode()` returns `"application"`, show the form inline in modal
- On submit: call API, show processing state, then success

### 2.2 Update Form Application Strategy

**File**: `src/lib/enrollment/strategies/form-application.strategy.ts`

```diff
- // Currently just returns a redirect URL
- return { ok: true, mode: "application", nextAction: "application", applicationUrl: url };
+ // Submit application data to backend
+ const response = await apiClient.submitApplication(context.course.id, {
+   motivation: formData.motivation,
+   experience: formData.experience,
+   ... 
+ });
+ return { ok: true, mode: "application", nextAction: "success", message: "Application submitted!" };
```

### 2.3 Add Application Backend Endpoint

**File**: `src/app/api/courses/[...path]/route.ts` — add route for:

- `POST /api/courses/:id/enroll/application/submit`
- Creates subscription with `status: "pending_review"` instead of `"active"`
- Stores application data in new `applications` table

### 2.4 Add Application DB Schema

```typescript
export const dbApplications = coursesSchema.table("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => dbCourses.id),
  userId: text("user_id").references(() => dbUsers.id),
  motivation: text("motivation").notNull(),
  experience: text("experience"),
  portfolioUrl: varchar("portfolio_url", { length: 500 }),
  commitment: varchar("commitment", { length: 50 }),
  status: varchar("status", { length: 50 }).default("pending"), // pending | approved | rejected
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewerNotes: text("reviewer_notes"),
});
```

### 2.5 Acceptance Criteria

- [ ] Courses with `requiresForm: true` show an application form in the enrollment modal
- [ ] Form validation: required fields prevent submission
- [ ] On submit: processing animation → success confirmation
- [ ] Subscription status is `pending_review` (not active)
- [ ] Course card shows "Application Submitted" state (not "Resume Learning")
- [ ] Admin can review applications and approve/reject (Phase 3)

---

## Phase 3: Admin Interface

**Goal**: Provide a dashboard for managing courses, reviewing applications, and monitoring.

### 3.1 Create Admin Layout

**File**: `src/app/admin/courses/page.tsx` [NEW]

```
src/app/admin/
├── layout.tsx                    ← Auth guard + admin sidebar
└── courses/
    ├── page.tsx                  ← Course list table (datatable)
    ├── [id]/
    │   ├── page.tsx              ← Edit course form
    │   └── applications/
    │       └── page.tsx          ← Review applications
    └── new/
        └── page.tsx              ← Create course form
```

**Note**: Guard with role-based access (`admin` or `instructor` role).

### 3.2 CRUD Course Form

**File**: `src/app/admin/courses/_components/course-form.tsx` [NEW]

- Fields match DTO from `frontend-courses-api-handover.md`
- Image upload with preview
- Slug auto-generation from title
- Category dropdown (Featured, ScholarX, Engineering, Design, etc.)
- RequiresForm toggle
- Price inputs (current + original)
- Status toggle (active/inactive)

### 3.3 Application Review Console

**File**: `src/app/admin/courses/[id]/applications/page.tsx` [NEW]

- List applications grouped by status (pending → approved → rejected)
- Each row: applicant name, submitted date, motivation preview
- Click to expand full application
- Approve / Reject buttons with optional reviewer notes
- On approve: update subscription to `active`
- On reject: send notification to applicant

### 3.4 Reuse Existing API

The NestJS backend already supports:
- `POST /courses` (create)
- `PUT /courses/:id` (update)
- `DELETE /courses/:id` (soft delete)

All admin UI needs is a fetch client for these endpoints.

### 3.5 Acceptance Criteria

- [ ] Admin can view all courses in a paginated table
- [ ] Admin can create new courses with all fields
- [ ] Admin can edit existing courses
- [ ] Admin can soft-delete (deactivate) courses
- [ ] Admin can review and act on applications
- [ ] Only users with admin role can access

---

## Phase 4: Performance & Caching

**Goal**: Reduce database load and improve page load times beyond `force-dynamic`.

### 4.1 Implement ISR for Course Catalog

**File**: `src/app/(platform)/courses/page.tsx`

```typescript
// Remove force-dynamic; add revalidation
export const revalidate = 60; // ISR: revalidate every 60 seconds
```

**Impact**: Catalog page becomes static between revalidations. 1 DB query per 60s instead of per request.

**Trade-off**: New courses may take up to 60s to appear. Acceptable for a catalog page.

### 4.2 Hybrid Approach for Detail Page

**File**: `src/app/(platform)/courses/[slug]/page.tsx`

- **`generateStaticParams`**: Pre-render top N courses at build time
- **`revalidate = 30`**: ISR for the rest
- Or keep `force-dynamic` for authenticated users (subscribed state is user-specific)

**Recommendation**: Use `export const dynamic = 'force-dynamic'` only when user session is detected. For unauthenticated users, serve cached version.

```typescript
export default async function CourseDetailPage({ params, searchParams }) {
  // ... existing code ...
  // If no session, serve cached; if authenticated, force-dynamic
  if (!session) {
    // Use cached data
  }
}
```

### 4.3 Optimize DB Queries

**File**: `src/domain/courses/infrastructure/db/next-courses.repository.ts`

- Add indexes on:
  - `courses(status, category)` — for filtered listing
  - `courses(slug)` — for slug lookup
  - `subscriptions(user_id, course_id)` — for enrollment checks
  - `subscriptions(user_id, is_active)` — for subscription listing

- Consider materialized view for `courses` + `instructor` join

### 4.4 Add React Cache for Domain Services

```typescript
import { cache } from 'react';

export const getCachedDomain = cache(() => createNextCourseDomain());
```

This ensures the same domain instance is reused within a single request.

### 4.5 Bundle Size Optimization

- Audit `enroll-modal.tsx` — dynamically import heavy dependencies (Framer Motion, etc.)
- `dynamic(() => import('@/components/courses/enroll-modal'), { ssr: false })`
- Lazy-load `priority-enrollment-window.tsx` only when needed

### 4.6 Acceptance Criteria

- [ ] Catalog page TTFB improves from DB-per-request to ISR-cached
- [ ] Lighthouse performance score ≥ 90 for catalog page
- [ ] Enrollment modal code split and lazy-loaded
- [ ] DB queries confirmed to use indexes (EXPLAIN ANALYZE)
- [ ] No regression in enrollment functionality

---

## Phase 5: Telemetry & Observability (PostHog + Sentry)

**Goal**: Replace `console.debug` with PostHog for product analytics and Sentry for error tracking.

### 5.1 Install Dependencies

```bash
npm install posthog-js @posthog/nextjs @sentry/nextjs
```

### 5.2 PostHog Setup

**File**: `src/lib/telemetry/posthog-provider.ts` [NEW]

```typescript
import { PostHog } from "posthog-js";
import { env } from "@/config/env";

let posthogClient: PostHog | null = null;

export const getPostHog = (): PostHog => {
  if (typeof window === "undefined") return null as unknown as PostHog;
  if (!posthogClient) {
    posthogClient = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      loaded: (ph) => {
        if (process.env.NODE_ENV !== "production") {
          ph.opt_out_capturing(); // no telemetry in dev
        }
      },
    });
  }
  return posthogClient;
};

export const trackEvent = (
  event: string,
  properties?: Record<string, unknown>,
) => {
  const ph = getPostHog();
  if (ph) ph.capture(event, properties);
};

export const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
  const ph = getPostHog();
  if (ph) ph.identify(userId, traits);
};
```

**File**: `src/components/providers/posthog-provider.tsx` [NEW]

- Client component that initializes PostHog on app load
- Wraps `posthog-js` `PostHogProvider`
- Identifies user on session change

### 5.3 Sentry Setup

**File**: `sentry.client.config.ts` [NEW], `sentry.server.config.ts` [NEW], `sentry.edge.config.ts` [NEW]

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
});
```

**File**: `src/app/global-error.tsx` — Sentry error boundary for the root layout

**File**: `src/lib/telemetry/sentry-adapter.ts` [NEW]

- Utility to capture enrollment-specific errors with context
- `captureEnrollmentError(error, { courseId, correlationId, mode })`
- Adds breadcrumbs for the enrollment lifecycle

### 5.4 Upgrade Enrollment Telemetry

**File**: `src/lib/telemetry/enrollment-events.ts`

```typescript
import { trackEvent } from "./posthog-provider";

export const emitEnrollmentEvent = (event: EnrollmentTelemetryEvent) => {
  // PostHog: product analytics
  trackEvent(event.event, {
    courseId: event.courseId,
    sourceSurface: event.sourceSurface,
    correlationId: event.correlationId,
    errorCode: "errorCode" in event ? event.errorCode : undefined,
  });
};
```

### 5.5 Add Performance Instrumentation via Sentry

**File**: `src/lib/telemetry/performance.ts` [NEW]

```typescript
import * as Sentry from "@sentry/nextjs";

export const trackEnrollmentTiming = (name: string, durationMs: number) => {
  Sentry.metrics.distribution(name, durationMs, {
    unit: "millisecond",
  });
};
```

Track these metrics:
- `enroll.click_to_modal_open`
- `enroll.submission_round_trip`
- `enroll.success_to_toast`
- `inquiry.form_completion_time`

### 5.6 Add PostHog Dashboard Queries

| Metric | PostHog Insight |
|--------|----------------|
| Enrollment conversion rate | `enroll_submission_succeeded / enroll_click` grouped by `sourceSurface` |
| Drop-off funnel | Steps: `enroll_click` → `enroll_submission_started` → `enroll_submission_succeeded` |
| Inquiry submission rate | `enroll_click` → `inquiry_submitted` |
| Error rate by type | `enroll_submission_failed` count by `errorCode` |

### 5.7 Add Sentry Alert Rules

- **Rule 1**: If `enroll_submission_failed` rate > 5% in 5 minutes → alert #eng-frontend
- **Rule 2**: If `enrollment-executor.ts` throws unhandled exception → alert #eng-oncall
- **Rule 3**: If `/api/courses/:id/inquiry` returns 5xx > 1% → alert #eng-backend

### 5.8 Acceptance Criteria

- [ ] PostHog captures all enrollment events with correct properties
- [ ] PostHog identifies users for cohort analysis
- [ ] Sentry captures all unhandled exceptions with full context (courseId, userId, correlationId)
- [ ] Sentry performance traces for enrollment API calls
- [ ] No PII in event names or property keys
- [ ] PostHog respects `Do Not Track` and GDPR consent
- [ ] Sentry alerts configured and tested
- [ ] No `console.log` in production enrollment paths (gated behind `process.env.NODE_ENV !== "production"`)
- [ ] Dev mode: PostHog auto-opt-out, Sentry sample rate 0

---

## Phase 6: Testing & QA

**Goal**: Comprehensive test coverage for the enrollment state machine, strategy selection, and critical paths.

### 6.1 Unit Tests

#### Enrollment Store State Machine

**File**: `src/stores/__tests__/enrollment.store.test.ts` [NEW]

```
Tests:
✓ Initial state is "idle"
✓ openModal transitions to "modal_open"
✓ closeModal transitions to "closed"
✓ setEnrolling(true) transitions to "processing"
✓ setEnrolling(false) reverts to "modal_open"
✓ setSuccess(true) transitions to "success"
✓ setError() transitions to "error"
✓ markPrecheck transitions to "precheck"
✓ markAuthRedirect transitions to "auth_redirect"
✓ reset transitions to "idle"
✓ Invalid transitions are guarded (e.g., success → processing not allowed)
✓ toFlags computed correctly for each lifecycle state
```

#### Enrollment Executor

**File**: `src/lib/enrollment/strategies/enrollment-strategies.test.ts` [exists — verify coverage]

```
Tests:
✓ deriveEnrollmentMode returns "free" for price=0 and requiresForm=false
✓ deriveEnrollmentMode returns "paid" for price>0 and requiresForm=false
✓ deriveEnrollmentMode returns "application" for requiresForm=true
✓ executeFreeEnroll calls apiClient.enrollFree with correct params
✓ executeFreeEnroll maps success response correctly
✓ executeFreeEnroll maps API error to enrollment error
✓ executePaidCheckoutInit calls apiClient.initPaidEnrollment
✓ executePaidCheckoutInit returns checkoutUrl on success
✓ executeFormApplicationInit calls apiClient.initApplicationEnrollment
✓ executeFormApplicationInit returns applicationUrl on success
✓ Error mapper handles ApiRequestError, generic Error, and unknown types
```

#### Intent Controller

**File**: `src/lib/enrollment/__tests__/intent-controller.test.ts` [NEW]

```
Tests:
✓ openFromCta dispatches enroll_click event
✓ openFromCta calls openModal with context
✓ openFromCard dispatches enroll_click event
✓ openFromCard calls markPrecheck, setIntent, openCourseSheet
✓ checkAuth redirects to sign-in when not authenticated
✓ checkAuth preserves callbackUrl with intent=enroll
✓ makeContext generates correlationId and timestamp
```

### 6.2 Integration Tests

#### Full Enrollment Flow

**File**: `src/components/courses/__tests__/enroll-modal.integration.test.tsx` [NEW]

```
Tests:
✓ Modal opens when autoOpen=true
✓ Free enrollment: click enroll → processing → success
✓ Paid enrollment: click enroll → processing → redirect to /checkout
✓ Application enrollment: click enroll → processing → redirect to application
✓ Already enrolled: shows toast and navigates
✓ API error: shows error toast, remains in modal
✓ Auth required error: redirects to sign-in
✓ Escape key closes modal (not during processing)
✓ Reduced motion: animations disabled but flow works
```

### 6.3 E2E Tests (Playwright)

**File**: `e2e/courses/enrollment.spec.ts` [NEW]

```
Scenarios:
1. Anonymous user clicks Enroll → redirected to sign-in → signs in → redirected back → auto-opens modal
2. Authenticated user clicks Enroll on free course → success → "Resume Learning" visible
3. Authenticated user clicks Enroll on paid course → redirected to /checkout
4. Authenticated user clicks Enroll on already-enrolled course → toast message
5. Desktop: card click → detail surface opens with enroll intent
6. Mobile: card click → navigates to detail page with ?intent=enroll
7. Search: filter by title → enroll from filtered results
```

### 6.4 Accessibility Audit

Run automated + manual checks:

```
Tools:
✓ axe-core (via Playwright)
✓ Lighthouse Accessibility audit
✓ Keyboard-only navigation
✓ Screen reader (NVDA / VoiceOver)
✓ prefers-reduced-motion
✓ Focus management (restore to trigger on close)
✓ ARIA live regions for dynamic content
```

### 6.5 Acceptance Criteria

- [ ] Store state machine: 15+ unit tests, all transitions covered
- [ ] Executor + strategies: 10+ unit tests, all branches covered
- [ ] Intent controller: 6+ unit tests, auth paths covered
- [ ] Integration: 8+ test scenarios for modal flow
- [ ] E2E: 7+ scenarios covering all enrollment entry points
- [ ] Accessibility: 0 violations in axe scan, keyboard navigable, screen reader compatible
- [ ] All existing tests pass (verify `enroll-modal.test.ts`)

---

## Phase 7: Security Hardening

**Goal**: Protect enrollment endpoints from abuse, CSRF, and data leaks.

### 7.1 CSRF Protection

**File**: `src/app/api/courses/[...path]/route.ts`

- Add CSRF token check for POST endpoints
- Or leverage Next.js Server Actions (which have built-in CSRF protection)

**Recommendation**: Convert enrollment mutations to Server Actions instead of Route Handlers.

```
Example Server Action:
// src/actions/enroll.actions.ts
"use server";
export async function enrollFree(courseId: string) {
  const session = await getSession();
  if (!session?.user.id) throw new Error("Unauthorized");
  const domain = createNextCourseDomain();
  return domain.enrollment.enrollFree(courseId, session.user.id);
}
```

### 7.2 Rate Limiting

**File**: `src/lib/security/rate-limit.ts` [NEW]

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const enrollmentRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 enrollments per 60s per user
  analytics: true,
});
```

Apply to enrollment POST endpoints:

```typescript
const { success } = await enrollmentRateLimit.limit(userId);
if (!success) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

### 7.3 Input Validation

- Backend already has Zod schemas for env vars
- Add Zod validation for enrollment request bodies in route handler
- Sanitize all user input (already handled by Drizzle parameterized queries)

### 7.4 Audit Logging

**File**: `src/lib/audit/enrollment-audit.ts` [NEW]

Log all enrollment mutations with:
- `userId`, `courseId`, `action` (enroll, payment, application)
- `ip`, `userAgent`
- `correlationId`, `timestamp`
- Store in DB `audit_log` table or send to security SIEM

### 7.5 Acceptance Criteria

- [ ] All POST enrollment endpoints require valid session (already done)
- [ ] Rate limiting applied to enrollment endpoints
- [ ] Input validation for all request bodies
- [ ] CSRF protection via Server Actions or token check
- [ ] Audit logging for all enrollment mutations
- [ ] No sensitive data leaked in error messages (already handled by `error-mapper.ts`)

---

## 8. Backend Integration Pass

**Goal**: Ensure NestJS backend endpoints match frontend expectations.

### 8.1 Endpoint Readiness Matrix

| Endpoint | Frontend Expectation | Backend Status | Action |
|----------|---------------------|----------------|--------|
| `GET /courses` | Paginated, category filter, `isSubscribed` when authed | ✅ Partial | Verify response shape matches |
| `GET /courses/:id` | Full course object with `isSubscribed` | ✅ Partial | Verify contract |
| `GET /courses/slug/:slug` | Course lookup by slug | ❌ Missing | **Add endpoint** |
| `GET /courses/:id/subscription-status` | `{ isSubscribed, courseId, userId }` | ✅ Partial | Verify error codes |
| `POST /courses/:id/enroll` | Idempotent enrollment | ✅ Partial | Add idempotency key support |
| `POST /courses/:id/enroll/free` | Explicit free enrollment | ❌ Missing | **Add endpoint** |
| `POST /courses/:id/inquiry` | Submit sales inquiry form | ❌ Missing | **Add endpoint** |
| `POST /courses/:id/enroll/paid/init` | Initialize payment session | ❌ Missing | **De-prioritized** — sales inquiry flow replaces this |
| `POST /courses/:id/enroll/application/init` | Initialize application flow | ❌ Missing | **Add endpoint** |
| `POST /courses/:id/enroll/application/submit` | Submit application data | ❌ Missing | **Add endpoint** |

### 8.2 Error Code Standardization

| Frontend Error | Backend HTTP | Backend Code |
|---------------|-------------|--------------|
| `auth_required` | 401 | `UNAUTHORIZED` |
| `auth_required` | 403 | `USER_BLOCKED` |
| `course_not_found` | 404 | `COURSE_NOT_FOUND` |
| `already_enrolled` | 400 | `ALREADY_ENROLLED` |
| `validation_failure` | 422 | `VALIDATION_ERROR` |
| `network_transient` | 500+ | `INTERNAL_SERVER_ERROR` |
| `payment_unavailable` | 503 | `PAYMENT_UNAVAILABLE` |

### 8.3 Response Envelope Contract

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    numericCode: number;
    statusCode: number;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    path: string;
    requestId: string;
  };
}
```

### 8.4 Backend Implementation Priority

1. **High**: `POST /courses/:id/inquiry` (sales inquiry storage)
2. **High**: `POST /courses/:id/enroll/free`, `/enroll/application/init`
3. **High**: Idempotency support on all enrollment endpoints
4. **Medium**: `GET /courses/slug/:slug` (removes frontend compatibility shim)
5. **Low**: `POST /courses/:id/enroll/paid/init` (deferred — only needed if direct payment is added later)
6. **Low**: Response envelope standardization, error code audit

---

## 9. Migration Strategy & Rollout

### 9.1 Feature Flag Strategy

Use environment variable-based flags (simplest, no external dependency):

```typescript
// src/config/flags.ts
export const flags = {
  enrollmentV2: process.env.FLAG_ENROLLMENT_V2 === "true",
  checkoutEnabled: process.env.FLAG_CHECKOUT_ENABLED === "true",
  applicationFlowEnabled: process.env.FLAG_APPLICATION_FLOW === "true",
};
```

Or use PostHog feature flags (if PostHog is chosen in Phase 5).

### 9.2 Rollout Sequence

```
Week 1-2:  Backend endpoints + Phase 1 (Inquiry Flow)
           └── Internal testing (staging)

Week 3:    Phase 1 go-live (feature flag: 10% → 50% → 100%)
           └── Monitor: inquiry submission rate, error rates, team response time

Week 4:    Phase 2 (Application) + Phase 3 (Admin)
           └── Internal testing → beta with power users

Week 5:    Phase 2 go-live (feature flag ramp)
           Phase 4 (Performance) go-live (no flag, immediate)

Week 6:    Phase 5 (PostHog + Sentry) go-live
           Phase 6 (Testing) — ongoing CI
           Phase 7 (Security) — ongoing
```

### 9.3 Rollback Plan

- Feature flag kill switch: set `FLAG_ENROLLMENT_V2=false` → immediately reverts to old flow
- Database: all new tables (`payments`, `applications`) are additive, no backward-incompatible migrations
- API: new endpoints are additive; old endpoints remain unchanged

### 9.4 Monitoring During Rollout

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|--------------------|
| Enrollment error rate | > 5% | > 15% |
| Inquiry submission failure rate | > 5% | > 10% |
| Enrollment latency p95 | > 3s | > 8s |
| Modal not opening | > 2% | > 5% |
| Inquiry form validation errors | > 10% | > 20% |

---

## 10. Effort Summary

### Frontend

| Phase | Tasks | Est. Days | Dependencies |
|-------|-------|-----------|-------------|
| Phase 1: Sales Inquiry Flow | Inquiry form, API route, remove checkout | 4-5 | Backend inquiry endpoint |
| Phase 2: Application Flow | Application form UI, API integration | 3-4 | Backend endpoints |
| Phase 3: Admin UI | Course CRUD + inquiry/application review | 5-7 | Backend endpoints |
| Phase 4: Performance | ISR, DB indexes, code splitting | 2-3 | None |
| Phase 5: Telemetry | PostHog + Sentry setup, event upgrade | 3-4 | None |
| Phase 6: Testing | Unit, integration, E2E, a11y | 5-7 | Phases 1-3 code |
| Phase 7: Security | Rate limiting, CSRF, audit | 2-3 | None |
| **Frontend Total** | | **24-33** | |

### Backend (NestJS)

| Task | Est. Days |
|------|-----------|
| Enrollment endpoints (free, application) | 2-3 |
| Inquiry endpoint (`POST /courses/:id/inquiry`) | 1-2 |
| Slug endpoint | 1-2 |
| Idempotency support | 2-3 |
| Error code standardization | 2-3 |
| Response envelope alignment | 1-2 |
| **Backend Total** | **9-15** |

### Grand Total

| Track | Days |
|-------|------|
| Frontend | 24-33 |
| Backend | 9-15 |
| QA (dedicated) | 5-7 |

**With 2 FE + 1 BE + 1 QA in parallel: ~5-7 sprint weeks calendar duration.**

---

## 11. Definition of Done

All must be true:

- [ ] **Sales Inquiry**: Paid courses show contact form → inquiry stored → team notified → admin reviews
- [ ] **Application**: User can submit application for `requiresForm` courses
- [ ] **No Payment Gateway**: No Stripe or payment provider dependencies in codebase
- [ ] **No `console.log`**: All debug logging gated behind `NODE_ENV` or DEBUG flag
- [ ] **PostHog**: All enrollment + inquiry events captured with correct properties, user identified
- [ ] **Sentry**: All unhandled exceptions captured with full context, alert rules configured
- [ ] **Tests**: Store state machine, executor, intent controller fully tested
- [ ] **E2E**: Playwright scenarios pass for all enrollment entry points
- [ ] **A11y**: 0 axe violations, keyboard navigable, reduced-motion respected
- [ ] **ISR**: Catalog page uses ISR (not `force-dynamic`)
- [ ] **Security**: Rate limiting on enrollment endpoints, CSRF protection
- [ ] **Backend**: All enrollment + inquiry endpoints exist with matching contracts
- [ ] **Migration**: DB schema matches production, all migrations applied
- [ ] **Admin**: Course CRUD, inquiry review, and application review available
