# Implementation Plan: Admin Dashboard — Course, Lesson & User Management

**Branch**: `003-admin-dashboard` | **Date**: 2026-05-07

---

## Overview

Build a production-grade admin dashboard for managing courses, lessons, users, subscriptions, and inquiries. The design follows clean architecture (matching existing domain patterns), enforces role-based access at every layer, and prioritizes security, observability, and incremental rollout.

---

## Reference Analysis: Legacy Admin (ScholarX-Api + ScholarX-React)

### What the existing implementation does well (keep these patterns)

| Pattern | Location | Why Keep It |
|---|---|---|
| **Tab-based course editor** | `CourseEditorModal.jsx` — 6 tabs (Basic, Content, Pricing, Media, Audience, Settings) | Good UX separation of concerns; users can fill fields in any order |
| **Progress indicator** | `calculateProgress()` in editor | Gives admins a sense of completion; reduces abandoned drafts |
| **Live preview panel** | Right-side panel in editor | Immediate feedback on how the course card looks to students |
| **Debounced search** | `useEffect` + `setTimeout(500ms)` in `Courses.jsx` | Prevents API flood on keystroke; good UX pattern |
| **Actions dropdown menu** | Per-row `actions-menu` in course table | Keeps table clean; actions don't overflow the row |
| **Responsive card layout** | CSS `@media (max-width: 768px)` with stacked card view | Mobile admin access is a real requirement |
| **Status badges** | `status-badge` CSS class | Instant visual scan of resource state |
| **Markdown editor + renderer** | Used in course description and lesson content | Rich content without heavy WYSIWYG |

### What the existing implementation gets wrong (avoid these)

| Anti-pattern | Location | Why It's Wrong |
|---|---|---|
| **No TypeScript** | Every `.jsx` and `.ts` file | Zero type safety; runtime errors for simple typos; no IDE autocomplete for API shapes |
| **Inline `useState` for every field** | `Courses.jsx` — `newCourse`, `newLesson` objects with individual setters | 15+ state variables in one component; no form library means manual validation, dirty tracking, error display |
| **Direct `fetch()` calls in components** | `handleDeleteLesson` calls `fetch()` directly | Bypasses Redux store; inconsistent error handling; no caching |
| **No Zod validation on frontend** | Forms submit raw data | Backend gets invalid payloads; user sees generic server errors instead of field-level messages |
| **Hard deletes** | `deleteCourse`, `deleteLesson` | Data loss; no recovery; no audit trail |
| **No concurrency control** | Two admins can overwrite each other's edits silently | Last writer wins — data loss |
| **No audit trail** | No logging of admin actions | Zero accountability for destructive operations |
| **No rate limiting** | API has no guardrails | One misconfigured script can DoS the backend |
| **SweetAlert2 for everything** | Mixed toast + confirm + prompt dialogs | Inconsistent UX; not composable with React; breaks accessibility |
| **Static controller methods** | `admin.controller.ts` — all static | Not testable without mocking globals; no dependency injection |
| **Magic string API URLs** | `process.env.REACT_APP_API_URL || "http://localhost:5000"` | Hard to maintain; breaks when the API moves |
| **MongoDB (schemaless)** | Mongoose models with minimal validation | No referential integrity; runtime schema drift |

### Key features from legacy that must be in the new plan

- [x] Subscription management (list, detail, update)
- [x] Revenue/user/course reports with date filters
- [x] User blocking/unblocking with audit trail
- [x] Enrollment management (enroll user to course, revoke)
- [x] Course status toggle (public/private/archived)
- [x] Lesson visibility toggle (public/private)
- [x] Dashboard stats (total users, courses, revenue, subscriptions)
- [x] Image upload for course thumbnails

---

## Core Principles

| Principle | Application |
|---|---|
| **Defense in depth** | Authorization at middleware, API handler, domain service, and DB query levels |
| **Single source of truth** | All writes go through domain services; no direct DB access from UI |
| **Observability by default** | Every admin mutation emits an audit event; rate limits and action logs are built in |
| **Incremental rollout** | Admin UI is feature-flagged; endpoints ship before pages |
| **Fail closed** | Any auth/role resolution failure denies access — no fallback to public role |
| **Idempotent mutations** | All write endpoints accept idempotency keys to prevent duplicate processing |
| **Optimistic concurrency** | Every update uses `updatedAt` — reject stale writes with 409 |
| **Soft-delete everywhere** | No hard deletes through UI; resources are archived/suspended |

---

## Architecture Diagram (Logical)

```
Browser (Admin UI)
    │
    ├── Next.js App Router (src/app/admin/)
    │   ├── Page Components (Server Components where possible)
    │   ├── Client Components (forms, tables, interactive widgets)
    │   └── Layout (sidebar nav, session guard, breadcrumbs)
    │
    ├── Server Actions (src/actions/admin/)
    │   └── Thin orchestration layer — validates role, delegates to domain
    │
    ├── API Routes (src/app/api/admin/[[...path]]/route.ts)
    │   └── Extends existing dependency-injected handler pattern
    │
    └── Domain Layer (src/domain/admin/)
        ├── contracts/    — Port interfaces (e.g. AdminRepository, AuditGateway)
        ├── application/  — Use cases (CreateCourseUseCase, UpdateLessonUseCase, etc.)
        └── infrastructure/
            ├── db/       — Drizzle repositories, schema extensions
            └── audit/    — Audit log writer
```

---

## Route Structure

### Pages (`src/app/admin/`)

```
/admin
├── page.tsx                  → Overview / stats dashboard
├── layout.tsx                → Admin shell: sidebar nav, session guard, breadcrumbs
│
├── courses/
│   ├── page.tsx              → Course list (DataTable: search, filter, sort, paginate)
│   ├── new/page.tsx          → Create course (tab-based editor with live preview)
│   └── [courseId]/
│       ├── page.tsx          → Edit course (same tab-based editor, pre-filled)
│       ├── lessons/
│       │   ├── page.tsx      → Lesson list (draggable reorder, status badges)
│       │   └── new/page.tsx  → Create lesson
│       └── lessons/[lessonId]/page.tsx → Edit lesson
│
├── users/
│   ├── page.tsx              → User list (search, filter by role/status)
│   └── [userId]/
│       ├── page.tsx          → User detail (profile, role, block/unblock, enrollments)
│       └── enrollments/page.tsx → User enrollment history
│
├── subscriptions/
│   ├── page.tsx              → Subscription list (filter by status, course)
│   └── [subscriptionId]/page.tsx → Subscription detail
│
├── inquiries/
│   ├── page.tsx              → Sales inquiry inbox (status filters, assignee)
│   └── [inquiryId]/page.tsx  → Inquiry detail / response thread
│
├── reports/
│   ├── page.tsx              → Report dashboard (revenue, users, courses charts)
│   └── [reportType]/
│       └── page.tsx          → Drill-down report view
│
└── settings/
    └── page.tsx              → Platform settings (future: site config, roles, etc.)
```

### Sidebar Navigation

```
Dashboard           → /admin
Courses             → /admin/courses
  ├── All Courses   → /admin/courses
  └── New Course    → /admin/courses/new
Users               → /admin/users
Subscriptions       → /admin/subscriptions
Inquiries           → /admin/inquiries
Reports             → /admin/reports
Settings            → /admin/settings
```

---

## API Design

### Pattern: Dependency-Injected Handlers

Follow the existing pattern from `src/app/api/courses/[[...path]]/route.ts`:

```typescript
// src/app/api/admin/[[...path]]/route.ts
export const { GET, POST, PUT, DELETE } = createAdminRouteHandlers({
  getSession: (headers) => auth.api.getSession({ headers }),
  createAdminDomain: (session) => createAdminDomain({ db, session }),
  authorize: (session) => {
    if (session.user.role !== "admin") throw new AdminAuthorizationError();
  },
});
```

### Endpoints

#### Courses

| Method | Path | Handler | Notes |
|---|---|---|---|
| `GET` | `/api/admin/courses` | `domain.catalog.listAll(query)` | Paginated, filtered (status, category, search title) |
| `GET` | `/api/admin/courses/:id` | `domain.catalog.getById(id)` | Full course detail with lesson count, student count |
| `POST` | `/api/admin/courses` | `domain.course.create(body)` | Creates course + optional image upload |
| `PUT` | `/api/admin/courses/:id` | `domain.course.update(id, body, expectedVersion)` | Partial update, optimistic concurrency via `updatedAt` |
| `PATCH` | `/api/admin/courses/:id/status` | `domain.course.updateStatus(id, status)` | Toggle public/private/archived |
| `DELETE` | `/api/admin/courses/:id` | `domain.course.archive(id)` | Soft-delete (sets status=archived) |
| `POST` | `/api/admin/courses/:id/enroll` | `domain.course.enrollUser(id, email)` | Manually enroll a user by email |
| `DELETE` | `/api/admin/courses/:id/enroll` | `domain.course.revokeUser(id, email)` | Remove user enrollment |

#### Lessons

| Method | Path | Handler | Notes |
|---|---|---|---|
| `GET` | `/api/admin/courses/:courseId/lessons` | `domain.lesson.list(courseId)` | Ordered by sort index |
| `GET` | `/api/admin/lessons/:id` | `domain.lesson.getById(id)` | |
| `POST` | `/api/admin/lessons` | `domain.lesson.create(courseId, body)` | |
| `PUT` | `/api/admin/lessons/:id` | `domain.lesson.update(id, body, expectedVersion)` | Optimistic concurrency |
| `PATCH` | `/api/admin/lessons/:id/visibility` | `domain.lesson.toggleVisibility(id)` | Toggle public/private |
| `DELETE` | `/api/admin/lessons/:id` | `domain.lesson.archive(id)` | Soft-delete |
| `PUT` | `/api/admin/courses/:courseId/lessons/reorder` | `domain.lesson.reorder(courseId, lessonIds[])` | Bulk reorder with optimistic locking |

#### Users

| Method | Path | Handler | Notes |
|---|---|---|---|
| `GET` | `/api/admin/users` | `domain.admin.listUsers(query)` | Paginated, filterable by role/status/blocked |
| `GET` | `/api/admin/users/:id` | `domain.admin.getUser(id)` | Full profile + enrollment stats + subscription history |
| `PUT` | `/api/admin/users/:id` | `domain.admin.updateUser(id, body)` | Profile edits (name, email, phone) |
| `PUT` | `/api/admin/users/:id/role` | `domain.admin.setRole(id, role)` | Separate endpoint for audit trail |
| `POST` | `/api/admin/users/:id/block` | `domain.admin.blockUser(id, reason)` | Soft-block with reason and audit |
| `POST` | `/api/admin/users/:id/unblock` | `domain.admin.unblockUser(id)` | Unblock with audit |
| `DELETE` | `/api/admin/users/:id` | `domain.admin.suspend(id)` | Suspend account (cannot be undone by user) |

#### Subscriptions

| Method | Path | Handler | Notes |
|---|---|---|---|
| `GET` | `/api/admin/subscriptions` | `domain.subscription.list(query)` | Paginated, filterable by status/course/user |
| `GET` | `/api/admin/subscriptions/:id` | `domain.subscription.getById(id)` | Full subscription detail |
| `PUT` | `/api/admin/subscriptions/:id` | `domain.subscription.update(id, body)` | Status changes, refunds |

#### Inquiries

| Method | Path | Handler | Notes |
|---|---|---|---|
| `GET` | `/api/admin/inquiries` | `domain.inquiry.list(query)` | Paginated, filterable by status/assignee |
| `GET` | `/api/admin/inquiries/:id` | `domain.inquiry.getById(id)` | |
| `PUT` | `/api/admin/inquiries/:id/status` | `domain.inquiry.updateStatus(id, status)` | e.g. pending → contacted → resolved |

#### Dashboard Stats

| Method | Path | Handler | Notes |
|---|---|---|---|
| `GET` | `/api/admin/stats` | `domain.stats.getOverview()` | Total users, courses, enrollments, inquiries by status, revenue YTD |

#### Reports

| Method | Path | Handler | Notes |
|---|---|---|---|
| `GET` | `/api/admin/reports/revenue` | `domain.reports.revenue(from, to)` | Revenue grouped by month/course |
| `GET` | `/api/admin/reports/users` | `domain.reports.users(from, to)` | User signups, role distribution |
| `GET` | `/api/admin/reports/courses` | `domain.reports.courses(from, to)` | Course enrollments, completion rates |

### Standardized Response Envelope

All admin API responses follow JSend (matching `src/types/api.types.ts`):

```typescript
// Success
{ status: "success", data: { /* resource */ }, meta?: { page, limit, total, pages } }

// Error
{ status: "error", message: "Human-readable description", code: "ADMIN_UNAUTHORIZED" }

// Validation
{ status: "fail", message: "Validation failed", data: { field: ["error message"] } }
```

Error codes:
| Code | HTTP Status | Meaning |
|---|---|---|
| `ADMIN_UNAUTHORIZED` | 403 | User lacks admin role |
| `ADMIN_SESSION_EXPIRED` | 401 | Token expired / not present |
| `RESOURCE_NOT_FOUND` | 404 | Course/lesson/user not found |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `CONCURRENCY_CONFLICT` | 409 | Stale `updatedAt` — resource modified since last read |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

---

## Data Model Extensions

### New Tables (`src/domain/admin/infrastructure/db/admin-db.schema.ts`)

```typescript
// ========== Audit Log ==========
// Tracks every admin write operation for compliance and debugging
export const adminAuditLog = authSchema.table("admin_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: text("admin_id").notNull().references(() => authUser.id),
  action: varchar("action", { length: 100 }).notNull(),
  // e.g. "course.create", "user.role.update", "lesson.delete"
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  // "course" | "lesson" | "user" | "inquiry"
  entityId: varchar("entity_id", { length: 255 }),
  // The target resource ID
  before: jsonb("before"),
  // Snapshot of state before mutation
  after: jsonb("after"),
  // Snapshot of state after mutation
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Indexes
adminAuditLogActionIdx: index("admin_audit_log_action_idx").on(adminAuditLog.action),
adminAuditLogEntityIdx: index("admin_audit_log_entity_idx").on(adminAuditLog.entityType, adminAuditLog.entityId),
adminAuditLogAdminIdx: index("admin_audit_log_admin_idx").on(adminAuditLog.adminId),
adminAuditLogCreatedAtIdx: index("admin_audit_log_created_at_idx").on(adminAuditLog.createdAt),
```

### Existing Table Enhancements

#### `courses` table additions
```typescript
// Add columns to existing courses schema
isArchived: boolean("is_archived").default(false),
seoDescription: text("seo_description"),
seoKeywords: varchar("seo_keywords", { length: 500 }),
updatedBy: text("updated_by").references(() => authUser.id),
```

#### `lessons` table (new — currently only referenced in frontend components)
```typescript
export const dbLessons = coursesSchema.table("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => dbCourses.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"),              // Rich text / markdown / JSON content
  videoUrl: varchar("video_url", { length: 500 }),
  duration: integer("duration"),           // Seconds
  sortIndex: integer("sort_index").notNull().default(0),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  // "draft" | "published" | "archived"
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Indexes
lessonsCourseIdx: index("lessons_course_id_idx").on(dbLessons.courseId),
lessonsSortIdx: index("lessons_sort_idx").on(dbLessons.courseId, dbLessons.sortIndex),
```

---

## Domain Layer Extensions

### New Domain Module: `src/domain/admin/`

```typescript
// ========== Contracts ==========
// src/domain/admin/contracts/admin-repository.contract.ts

// ========== Shared Types ==========
interface AdminSession {
  userId: string;
  role: "admin";
  ipAddress?: string;
  userAgent?: string;
}

interface PaginatedData<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// ========== Repository Contract ==========
interface AdminRepository {
  // Courses
  listCourses(query: AdminCourseQuery): Promise<PaginatedData<Course>>;
  getCourse(id: string): Promise<Course>;
  createCourse(data: CreateCourseInput): Promise<Course>;
  updateCourse(id: string, data: UpdateCourseInput, expectedVersion: Date): Promise<Course>;
  updateCourseStatus(id: string, status: string): Promise<Course>;
  archiveCourse(id: string): Promise<void>;
  enrollUser(courseId: string, email: string): Promise<void>;
  revokeUser(courseId: string, email: string): Promise<void>;

  // Lessons
  listLessons(courseId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson>;
  createLesson(courseId: string, data: CreateLessonInput): Promise<Lesson>;
  updateLesson(id: string, data: UpdateLessonInput): Promise<Lesson>;
  toggleLessonVisibility(id: string): Promise<Lesson>;
  archiveLesson(id: string): Promise<void>;
  reorderLessons(courseId: string, lessonIds: string[]): Promise<Lesson[]>;

  // Users (admin operations)
  listUsers(query: AdminUserQuery): Promise<PaginatedData<User>>;
  getUser(id: string): Promise<UserProfile>;
  updateUser(id: string, data: UpdateUserInput): Promise<User>;
  setUserRole(id: string, role: UserRole): Promise<User>;
  blockUser(id: string, reason: string): Promise<User>;
  unblockUser(id: string): Promise<User>;
  suspendUser(id: string): Promise<void>;

  // Subscriptions
  listSubscriptions(query: AdminSubscriptionQuery): Promise<PaginatedData<Subscription>>;
  getSubscription(id: string): Promise<Subscription>;
  updateSubscription(id: string, data: UpdateSubscriptionInput): Promise<Subscription>;

  // Inquiries
  listInquiries(query: AdminInquiryQuery): Promise<PaginatedData<Inquiry>>;
  getInquiry(id: string): Promise<Inquiry>;
  updateInquiryStatus(id: string, status: string): Promise<Inquiry>;

  // Stats & Reports
  getOverviewStats(): Promise<AdminOverviewStats>;
  getRevenueReport(from: Date, to: Date): Promise<RevenueReport>;
  getUserReport(from: Date, to: Date): Promise<UserReport>;
  getCourseReport(from: Date, to: Date): Promise<CourseReport>;
}

// ========== Application Services ==========
// src/domain/admin/application/admin-courses.service.ts
// src/domain/admin/application/admin-lessons.service.ts
// src/domain/admin/application/admin-users.service.ts
// src/domain/admin/application/admin-subscriptions.service.ts
// src/domain/admin/application/admin-inquiries.service.ts
// src/domain/admin/application/admin-stats.service.ts
// src/domain/admin/application/admin-reports.service.ts

// Each service follows the same pipeline:
// 1. Receives AdminSession + input
// 2. Validates input via Zod schemas
// 3. Checks authorization (role gate — redundant with API layer, defense in depth)
// 4. Calls repository for data access
// 5. Writes audit log for every mutation
// 6. Returns typed result

// === Example: AdminCoursesService.enrollUser ===
// 1. Validate: email must be valid, user must exist
// 2. Authorize: session.role === "admin" (already guaranteed by API layer)
// 3. Execute: repository.enrollUser(courseId, email)
// 4. Audit: auditLogger.log({ adminId, action: "course.enroll_user", entityType: "course", entityId: courseId, after: { email } })
// 5. Return: { success: true }

// ========== Infrastructure ==========
// src/domain/admin/infrastructure/db/admin.repository.ts
// Implements AdminRepository using Drizzle ORM with PostgreSQL
// - All read queries use paginated SELECT with offset/limit
// - All writes use transactions where multiple tables are affected
// - Image upload delegates to a storage adapter (S3/local) — not stored in DB

// src/domain/admin/infrastructure/audit/audit-logger.ts
// Writes to admin_audit_log table with structured metadata:
// - before/after are JSON snapshots of the resource state
// - Never exposes passwords, tokens, or PII in snapshots
```

### Zod Validation Schemas

All input validated at the domain boundary before reaching repositories:

```typescript
// src/domain/admin/contracts/admin-validation.schemas.ts

// ========== Course Schemas ==========
const CreateCourseSchema = z.object({
  title: z.string().min(3).max(255),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(5000).optional(),
  category: z.string().min(1).optional(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  price: z.number().min(0).optional(),
  originalPrice: z.number().min(0).optional(),
  requiresForm: z.boolean().optional(),
  salesInquiry: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  videoPreviewUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive", "draft"]).optional(),
  instructorId: z.string().uuid().optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().max(500).optional(),
});

const UpdateCourseSchema = CreateCourseSchema.partial().extend({
  expectedVersion: z.string().datetime(),  // ISO timestamp for concurrency check
});

const CourseStatusSchema = z.object({
  status: z.enum(["active", "inactive", "archived"]),
});

const EnrollUserSchema = z.object({
  email: z.string().email(),
});

// ========== Lesson Schemas ==========
const CreateLessonSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().int().positive().optional(),
  isPrivate: z.boolean().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const UpdateLessonSchema = CreateLessonSchema.partial().extend({
  expectedVersion: z.string().datetime(),
});

const ReorderLessonsSchema = z.object({
  lessonIds: z.array(z.string().uuid()),
});

// ========== User Schemas ==========
const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
});

const UpdateUserRoleSchema = z.object({
  role: z.enum(["admin", "sales", "instructor", "user"]),
});

const BlockUserSchema = z.object({
  reason: z.string().min(1).max(500),
  durationHours: z.number().int().positive().optional(), // null = permanent
});

// ========== Inquiry Schema ==========
const UpdateInquiryStatusSchema = z.object({
  status: z.enum(["pending", "contacted", "resolved", "closed"]),
});

// ========== Subscription Schema ==========
const UpdateSubscriptionSchema = z.object({
  status: z.enum(["active", "cancelled", "expired", "refunded"]).optional(),
  amount: z.number().min(0).optional(),
});

// ========== Report Schema ==========
const ReportRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});
```

---

## Component Architecture

### Server Components (Data Fetching)

| Component | Route | Purpose |
|---|---|---|
| `AdminLayout` | `/admin/layout.tsx` | Session guard, sidebar, breadcrumbs |
| `CoursesPage` | `/admin/courses/page.tsx` | Fetches course list, renders DataTable |
| `CourseEditPage` | `/admin/courses/[courseId]/page.tsx` | Fetches course detail, renders form |
| `UsersPage` | `/admin/users/page.tsx` | Fetches user list, renders DataTable |
| `InquiriesPage` | `/admin/inquiries/page.tsx` | Fetches inquiry list, renders DataTable |
| `DashboardPage` | `/admin/page.tsx` | Fetches stats, renders dashboard cards |

### Client Components (Interactive)

```
src/components/admin/
├── layout/
│   ├── admin-sidebar.tsx          → Collapsible nav with icons + active state
│   │                                  Sections: Dashboard, Courses, Users,
│   │                                  Subscriptions, Inquiries, Reports, Settings
│   ├── admin-breadcrumbs.tsx      → Auto-generated breadcrumbs from path segments
│   └── admin-header.tsx           → Top bar: admin name, logout, notification badge
│
├── data-table/
│   ├── data-table.tsx             → Generic TanStack Table (sort, filter, paginate, select)
│   ├── data-table-column-header.tsx
│   ├── data-table-pagination.tsx
│   ├── data-table-toolbar.tsx     → Search input, column visibility, filters
│   ├── data-table-row-actions.tsx → Edit / archive / block dropdown
│   └── data-table-faceted-filter.tsx → Multi-select column filter
│
├── course-editor/
│   ├── course-editor-modal.tsx    → Full-screen slide-over editor (create + edit modes)
│   ├── course-editor-sidebar.tsx  → Tab navigation + progress indicator
│   ├── course-editor-preview.tsx  → Live course card preview panel
│   ├── tabs/
│   │   ├── basic-info-tab.tsx     → Title, slug, description (MarkdownEditor), category, level
│   │   ├── content-tab.tsx        → Full description editor, learning objectives, prerequisites
│   │   ├── pricing-tab.tsx        → Current price, original price, requiresForm, salesInquiry toggle
│   │   ├── media-tab.tsx          → Image upload with preview, video URL, tags (multi-select)
│   │   ├── audience-tab.tsx       → Instructor assignment, target audience, difficulty
│   │   └── settings-tab.tsx       → Status toggle, SEO meta, visibility
│   └── hooks/
│       └── use-course-progress.ts → Calculates completion % across all tabs
│
├── forms/
│   ├── course-form.tsx            → thin wrapper that renders course-editor-modal
│   ├── lesson-form.tsx            → Create/Edit lesson form (react-hook-form + zod)
│   ├── user-form.tsx              → Edit user profile
│   └── inquiry-response-form.tsx  → Reply to inquiry
│
├── dialogs/
│   ├── confirm-delete-dialog.tsx  → "Are you sure?" with resource name
│   ├── archive-course-dialog.tsx
│   ├── role-select-dialog.tsx     → Change user role with confirmation + audit note
│   ├── block-user-dialog.tsx      → Block user with reason + duration
│   ├── enroll-user-dialog.tsx     → Enroll user to course by email
│   └── revoke-access-dialog.tsx   → Revoke user from course with confirmation
│
├── dashboard/
│   ├── stat-card.tsx              → Metric card with icon, value, trend arrow
│   ├── stat-card-grid.tsx         → Responsive grid layout for stat cards
│   ├── recent-activity.tsx        → Recent audit log feed (last 10 actions)
│   └── quick-actions.tsx          → Common admin shortcuts (create course, view users)
│
├── subscriptions/
│   ├── subscription-status-badge.tsx → Active/cancelled/expired badge
│   └── subscription-detail-card.tsx  → Full subscription info
│
├── reports/
│   ├── revenue-chart.tsx          → Monthly revenue bar/line chart
│   ├── users-chart.tsx            → Signups over time
│   ├── courses-chart.tsx          → Enrollment distribution
│   └── report-date-range.tsx      → Date range picker for reports
│
└── shared/
    ├── status-badge.tsx           → Reusable status badge (color-coded)
    ├── page-header.tsx            → Title + action buttons row
    ├── empty-state.tsx            → "No results" with icon + CTA
    ├── loading-skeleton.tsx        → Skeleton loader for tables/cards
    ├── debounced-search-input.tsx  → Search input with built-in debounce
    └── confirm-action-dialog.tsx   → Generic confirm dialog
```

### Shared UI Library

Extend existing shadcn components — no new UI library. Use:
- `@radix-ui/react-dialog` for modals
- `@radix-ui/react-select` for dropdowns
- `@radix-ui/react-dropdown-menu` for row actions
- `sonner` for toast notifications
- `lucide-react` for icons

---

## Authorization & Security

### Defense in Depth

```
Layer 1: Middleware
  └── src/middleware.ts — Check /admin/* routes require auth + admin role cookie/session

Layer 2: Admin Layout (Server Component)
  └── src/app/admin/layout.tsx — Fetch session, validate role, redirect if not admin

Layer 3: API Route Handler
  └── src/app/api/admin/[[...path]]/route.ts — authorize() gate before any domain call

Layer 4: Domain Service
  └── Each use case receives session and checks role before executing

Layer 5: Repository
  └── Row-level security (future: Drizzle WHERE clauses scoped to admin's org)
```

### Middleware Update

```typescript
// Extend src/middleware.ts
const ADMIN_ROUTES = ["/admin"];

if (pathname.startsWith("/admin")) {
  const sessionToken = request.cookies.get("better-auth.session_token");
  if (!sessionToken) return redirect("/auth/signin");
  // For role check, rely on the layout/API layer — middleware validates session exists
}
```

### Rate Limiting

Admin mutation endpoints use token-bucket rate limiting:

```typescript
// Shared rate limiter (in-memory for single-instance, Redis for production)
const adminMutationLimiter = rateLimiter({
  windowMs: 60_000,       // 1 minute window
  max: 30,                // 30 mutations per minute per admin
  key: (req) => `${session.user.id}:admin-mutations`,
});
```

### Audit Trail

Every write operation logs to `admin_audit_log`:

```typescript
// Usage in every domain service mutation:
await auditLogger.log({
  adminId: session.user.id,
  action: "course.update",
  entityType: "course",
  entityId: course.id,
  before: previousState,    // JSON snapshot
  after: updatedState,      // JSON snapshot
  ipAddress: request.ip,
  userAgent: request.headers["user-agent"],
});
```

---

## Data Fetching & State Management

### React Query Integration

```typescript
// src/hooks/admin/use-admin-courses.ts
export function useAdminCourses(query: AdminCourseQuery) {
  return useQuery({
    queryKey: queryKeys.admin.courses.list(query),
    queryFn: () => adminApi.getCourses(query),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseInput) => adminApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.lists() });
      toast.success("Course created");
    },
  });
}
```

### Query Key Factory Extension

```typescript
// Extend src/config/query-keys.ts
export const queryKeys = {
  // ... existing keys
  admin: {
    all: ["admin"] as const,
    courses: {
      all: () => [...queryKeys.admin.all, "courses"] as const,
      lists: () => [...queryKeys.admin.courses.all(), "list"] as const,
      list: (query: AdminCourseQuery) =>
        [...queryKeys.admin.courses.lists(), query] as const,
      details: () => [...queryKeys.admin.courses.all(), "detail"] as const,
      detail: (id: string) => [...queryKeys.admin.courses.details(), id] as const,
    },
    lessons: {
      all: (courseId: string) =>
        [...queryKeys.admin.courses.detail(courseId), "lessons"] as const,
      detail: (courseId: string, lessonId: string) =>
        [...queryKeys.admin.lessons.all(courseId), lessonId] as const,
    },
    users: {
      all: () => [...queryKeys.admin.all, "users"] as const,
      lists: () => [...queryKeys.admin.users.all(), "list"] as const,
      list: (query: AdminUserQuery) =>
        [...queryKeys.admin.users.lists(), query] as const,
      detail: (id: string) => [...queryKeys.admin.users.all(), "detail", id] as const,
    },
    inquiries: {
      all: () => [...queryKeys.admin.all, "inquiries"] as const,
      list: (query: AdminInquiryQuery) =>
        [...queryKeys.admin.inquiries.all(), "list", query] as const,
      detail: (id: string) =>
        [...queryKeys.admin.inquiries.all(), "detail", id] as const,
    },
    stats: {
      all: () => [...queryKeys.admin.all, "stats"] as const,
      overview: () => [...queryKeys.admin.stats.all(), "overview"] as const,
    },
  },
};
```

---

## File Structure (Summary)

```
src/
├── app/admin/
│   ├── layout.tsx                     → Admin shell with sidebar
│   ├── page.tsx                       → Redirect to /admin/courses
│   ├── courses/
│   │   ├── page.tsx                   → Course list
│   │   ├── new/page.tsx               → Create course
│   │   └── [courseId]/
│   │       ├── page.tsx               → Edit course
│   │       ├── lessons/
│   │       │   ├── page.tsx           → Lesson list
│   │       │   └── new/page.tsx       → Create lesson
│   │       └── lessons/[lessonId]/page.tsx → Edit lesson
│   ├── users/
│   │   ├── page.tsx                   → User list
│   │   └── [userId]/
│   │       ├── page.tsx               → User detail
│   │       └── enrollments/page.tsx   → User enrollments
│   ├── inquiries/
│   │   ├── page.tsx                   → Inquiry list
│   │   └── [inquiryId]/page.tsx       → Inquiry detail
│   └── settings/
│       └── page.tsx                   → Settings (future)
│
├── app/api/admin/[[...path]]/
│   └── route.ts                       → Admin API handler
│
├── components/admin/
│   ├── layout/
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-breadcrumbs.tsx
│   │   └── admin-header.tsx
│   ├── data-table/
│   │   ├── data-table.tsx
│   │   ├── data-table-column-header.tsx
│   │   ├── data-table-pagination.tsx
│   │   ├── data-table-toolbar.tsx
│   │   ├── data-table-row-actions.tsx
│   │   └── data-table-faceted-filter.tsx
│   ├── course-editor/
│   │   ├── course-editor-modal.tsx
│   │   ├── course-editor-sidebar.tsx
│   │   ├── course-editor-preview.tsx
│   │   ├── tabs/
│   │   │   ├── basic-info-tab.tsx
│   │   │   ├── content-tab.tsx
│   │   │   ├── pricing-tab.tsx
│   │   │   ├── media-tab.tsx
│   │   │   ├── audience-tab.tsx
│   │   │   └── settings-tab.tsx
│   │   └── hooks/
│   │       └── use-course-progress.ts
│   ├── forms/
│   │   ├── course-form.tsx
│   │   ├── lesson-form.tsx
│   │   ├── user-form.tsx
│   │   └── inquiry-response-form.tsx
│   ├── dialogs/
│   │   ├── confirm-delete-dialog.tsx
│   │   ├── archive-course-dialog.tsx
│   │   ├── role-select-dialog.tsx
│   │   ├── block-user-dialog.tsx
│   │   ├── enroll-user-dialog.tsx
│   │   └── revoke-access-dialog.tsx
│   ├── dashboard/
│   │   ├── stat-card.tsx
│   │   ├── stat-card-grid.tsx
│   │   ├── recent-activity.tsx
│   │   └── quick-actions.tsx
│   ├── subscriptions/
│   │   ├── subscription-status-badge.tsx
│   │   └── subscription-detail-card.tsx
│   ├── reports/
│   │   ├── revenue-chart.tsx
│   │   ├── users-chart.tsx
│   │   ├── courses-chart.tsx
│   │   └── report-date-range.tsx
│   └── shared/
│       ├── status-badge.tsx
│       ├── page-header.tsx
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       ├── debounced-search-input.tsx
│       └── confirm-action-dialog.tsx
│
├── domain/admin/
│   ├── index.ts                    → Barrel export
│   ├── contracts/
│   │   ├── admin-repository.contract.ts  → AdminRepository interface
│   │   ├── admin-types.ts                → Query, input, report types
│   │   └── admin-validation.schemas.ts   → All Zod schemas
│   ├── application/
│   │   ├── admin-courses.service.ts      → Course CRUD, status, enroll/revoke
│   │   ├── admin-lessons.service.ts      → Lesson CRUD, reorder, visibility
│   │   ├── admin-users.service.ts        → User CRUD, role, block/suspend
│   │   ├── admin-subscriptions.service.ts → Subscription CRUD
│   │   ├── admin-inquiries.service.ts    → Inquiry list, status updates
│   │   ├── admin-stats.service.ts        → Dashboard overview stats
│   │   └── admin-reports.service.ts      → Revenue/user/course reports
│   └── infrastructure/
│       ├── db/
│       │   ├── admin-db.schema.ts        → audit_log table, lessons table
│       │   └── admin.repository.ts       → Full AdminRepository impl
│       └── audit/
│           └── audit-logger.ts           → Append-only audit writer
│
├── hooks/admin/
│   ├── use-admin-courses.ts       → Course list, detail queries + mutations
│   ├── use-admin-lessons.ts       → Lesson list, CRUD, reorder mutations
│   ├── use-admin-users.ts          → User list, detail, role, block mutations
│   ├── use-admin-subscriptions.ts  → Subscription list + update mutation
│   ├── use-admin-inquiries.ts      → Inquiry list + status mutation
│   ├── use-admin-stats.ts          → Dashboard stats query
│   └── use-admin-reports.ts        → Revenue/user/course report queries
│
├── lib/admin/
│   ├── admin-api-client.ts         → Typed fetch wrapper for /api/admin/*
│   │                                  Auto-injects auth headers, handles 401 refresh
│   ├── admin-utils.ts              → formatDate, statusColor, truncate, slugify
│   └── admin-constants.ts          → Status enums, role labels, nav config
│
└── config/query-keys.ts            → Extended with admin query keys
```

---

## Testing Strategy

| Layer | Tool | Focus |
|---|---|---|
| Domain services | `node:test` + `node:assert/strict` | Pure business logic with mocked repositories |
| API handlers | `node:test` + fetch | Request/response contract, auth gates, validation errors |
| React components | Playwright (optional future) | Form submission, validation feedback, optimistic updates |
| Repository | Integration test with testcontainers | SQL correctness, index usage, concurrent write safety |
| E2E | Playwright | Critical path: login as admin → create course → add lesson → verify public visibility |

### Key Test Cases

| Scenario | What It Validates |
|---|---|
| Non-admin hits `/admin` | Redirect to home or 403 |
| Admin creates course without title | Zod validation returns 422 with field errors |
| Two admins edit same course simultaneously | Concurrency conflict (409) based on `updatedAt` |
| Admin archives course with active enrollments | Soft-archive; enrollments remain valid for enrolled users |
| Admin blocks a user | User cannot log in; existing sessions invalidated |
| Admin enrolls user to course by email | Subscription record created with correct course/user IDs |
| Audit log written on every mutation | Query `admin_audit_log` after each write |
| Lesson reorder with stale client state | Optimistic update with rollback on conflict |
| Revenue report with date range | Aggregated data matches raw subscription totals |
| Image upload for course thumbnail | File saved to storage; URL returned in response |
| Admin role change for self | Rejected — admin cannot demote themselves |
| Concurrent enroll/revoke for same user | Correct final state; no duplicate subscriptions |

---

## Implementation Phases

### Phase 1: Foundation (Days 1-2)

1. **Database migrations**: Add `lessons` table, `admin_audit_log` table, new columns to `courses`
2. **Domain layer**: Add `src/domain/admin/` with contracts, Zod schemas, repository implementation
3. **Audit logger**: Write-only service for admin audit trail
4. **API handler**: `src/app/api/admin/[[...path]]/route.ts` with auth gate and route dispatching
5. **Admin API client**: Typed fetch wrapper `src/lib/admin/admin-api-client.ts`

**Deliverable**: All admin read/write endpoints working via curl/API client. No UI yet.

### Phase 2: Core UI (Days 3-5)

1. **Admin layout**: Sidebar, breadcrumbs, session guard
2. **Data table**: Generic TanStack Table component with search, sort, pagination
3. **Courses CRUD pages**: List, create, edit with `react-hook-form` + Zod
4. **Lessons CRUD pages**: List with drag-and-drop reorder, create, edit
5. **Toast feedback**: Success/error on every mutation

**Deliverable**: Admin can manage courses and lessons end-to-end.

### Phase 3: User & Inquiry Management (Days 6-7)

1. **User list + detail page**: Search, filter by role, view enrollment history
2. **Role management**: Change user role with audit trail
3. **Inquiry inbox**: Table with status filters, mark as contacted/resolved
4. **Dashboard stats**: Overview card with key metrics

**Deliverable**: Full admin dashboard feature-complete.

### Phase 4: Hardening (Days 8-9)

1. **Rate limiting**: Apply to mutation endpoints
2. **Concurrency handling**: Optimistic locking via `updatedAt`
3. **Error boundaries**: React error boundaries per section
4. **Loading skeletons**: Skeleton states for every table and form
5. **Empty states**: Graceful empty/zero states throughout

**Deliverable**: Production-ready admin dashboard.

### Phase 5: Polish & Test (Day 10)

1. **Test suite**: Write domain service tests, API handler tests
2. **Accessibility audit**: Keyboard navigation, screen reader labels, focus management
3. **Performance**: Verify pagination works at scale (10K+ courses/users), add virtual scrolling if needed
4. **Documentation**: README for admin module, API reference

**Deliverable**: Shippable admin dashboard.

---

## Security Checklist

- [ ] Admin session expires after 15 minutes of inactivity (reduced from default)
- [ ] All admin API responses exclude `password`, `token`, and other sensitive fields
- [ ] Role checks at middleware, layout, API handler, and domain layers
- [ ] CORS restricted to production origin on admin endpoints
- [ ] Audit log is append-only — no delete or update operations
- [ ] Rate limiting on all mutation endpoints
- [ ] Input validation at API boundary (Zod) prevents injection
- [ ] Soft-delete for all resources — no hard deletes through UI
- [ ] Idempotency keys on all create operations to prevent duplicates
- [ ] XSS prevention: all rich text content sanitized before render
