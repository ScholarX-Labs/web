# Implementation Plan: Profile Feature

**Branch**: `feat/profile-page` | **Date**: 2026-05-08 | **Status**: Final (v2 — Post-Review)

---

## Table of Contents

1. [Strategic Overview](#1-strategic-overview)
2. [Architecture](#2-architecture)
3. [Route Structure](#3-route-structure)
4. [Data Model](#4-data-model)
5. [Component Architecture](#5-component-architecture)
6. [Data Flow](#6-data-flow)
7. [Implementation Phases](#7-implementation-phases)
8. [Security & Compliance](#8-security--compliance)
9. [Performance & Scalability](#9-performance--scalability)
10. [Monitoring & Operations](#10-monitoring--operations)
11. [Automated Testing](#11-automated-testing)
12. [File Manifest](#12-file-manifest)
13. [Dependencies](#13-dependencies)
14. [Verification Plan](#14-verification-plan)

---

## 1. Strategic Overview

### 1.1 Vision

Deliver a production-grade profile ecosystem for ScholarX that serves three distinct use cases through a single, cohesive system:

| Use Case | Route | Primary Audience |
|---|---|---|
| **Own Profile Management** | `/profile` | Authenticated users |
| **Public Profile Discovery** | `/scholar/[username]` | All visitors (SEO-indexed) |
| **Profile Quick Access** | Header popup | Authenticated users |

### 1.2 Hosting Context — Azure App Service

The application runs on **Azure App Service** (Windows/Linux), which has important architectural implications:

| Characteristic | Implication |
|---|---|
| **Persistent process** | `globalThis` cache survives across requests — no cold-start penalty |
| **No serverless functions** | No Vercel/Cloudflare edge limitations; traditional request lifecycle |
| **App Settings** | Environment variables toggleable via Azure Portal with auto-restart |
| **Azure Cron / WebJobs** | Replaces Vercel Cron for scheduled tasks |
| **Azure Redis Cache** | Optional alternative to Upstash Redis if already in Azure stack |
| **ISR behavior** | Works on Azure App Service via Next.js output; on-demand revalidation via `revalidatePath` |
| **Multi-instance scaling** | App Service Plan auto-scale; shared Redis for rate limiter state |

### 1.3 Design Principles

| Principle | Application |
|---|---|
| **Single Responsibility** | Every component, action, and route has one clear job |
| **Type Safety First** | All boundaries (API, DB, UI) enforce Zod validation and TypeScript strict mode |
| **Defense in Depth** | Rate limiting at layer 7, auth at middleware + action + API levels, magic-byte file validation, Sharp re-encoding |
| **Observability by Default** | Every rejection has a reason, every failure is logged |
| **Cost-Aware Architecture** | Kill switch, storage monitoring, and cleanup built in from day one |
| **Server-Driven UI** | SSR prefetch + React Query hydration = fast initial load + live updates |
| **SOLID** | Separated concerns: actions, UI, domain, infrastructure in distinct layers |

### 1.4 Key Decisions (Executive Summary)

| Decision | Rationale |
|---|---|
| `/scholar/[username]` over `/profile/[id]` | Brand alignment, SEO, human-readable URLs |
| `username` generation at signup via better-auth hook | Zero-friction onboarding, no post-signup step |
| Upstash Redis for rate limiting | Stateless, horizontally scalable from day one; also works as kill switch cache |
| Cloudflare R2 for avatars | 10GB free, zero egress fees, S3-compatible SDK |
| **Kill switch via DB + env var** (not GitHub Gist) | Auth-controlled, auditable, no external dependency; Azure App Settings as override |
| Privacy toggle (default ON) | GDPR-respecting, user-controlled visibility |
| **On-demand ISR revalidation** (not 60s TTL) | Privacy toggle takes effect immediately — no exposure window |
| TanStack Query Hydration | SSR data bootstrap + automatic background refetching |
| In-memory cache (globalThis) | Safe on Azure App Service — persistent process, no cold start |
| **Sharp re-encoding on upload** | Strips polyglot payloads, enforces valid image data, resizes to standard dimensions |

### 1.5 Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. SOLID / Architecture | ✅ PASS | Each layer has one responsibility; domain/actions/components/infrastructure separated |
| II. Type Safety | ✅ PASS | Zod at every boundary, TypeScript strict, no `any`; startup env validation |
| III. Testing | ✅ PASS | Unit tests for all server actions, integration tests for upload route, E2E smoke tests (Playwright) |
| IV. Premium UX | ✅ PASS | Framer Motion spring animations, glassmorphism popup, AnimatePresence tab transitions |
| V. Performance | ✅ PASS | SSR prefetch, on-demand ISR, React Query hydration, R2 CDN, Sharp-optimized images |
| VI. Security | ✅ PASS | Rate limiting, Zod validation, Sharp re-encoding (blocks polyglot), magic-byte verification, auth gates |
| VII. Cost Control | ✅ PASS | DB-backed kill switch, storage monitoring, orphan cleanup, strict upload limits |
| VIII. Config Validation | ✅ PASS | Zod env schema at module load — app fails fast on missing config, not at runtime |

**No violations.**

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser                                    │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐      │
│  │ Profile    │  │ /profile     │  │ /scholar/[username]    │      │
│  │ Popup      │  │ (own edit)   │  │ (public view)          │      │
│  └─────┬──────┘  └──────┬───────┘  └───────────┬────────────┘      │
│        │                │                      │                    │
├────────┴────────────────┴──────────────────────┴────────────────────┤
│                  Azure App Service (Next.js)                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Server     │  │ Client       │  │ Server       │  │ API      │ │
│  │ Actions    │  │ Components   │  │ Components   │  │ Routes   │ │
│  │ (profile)  │  │ (tabs, form) │  │ (page shell) │  │ (avatar) │ │
│  └──────┬─────┘  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │
│         │               │                 │               │        │
├─────────┴───────────────┴─────────────────┴───────────────┴────────┤
│                         Data Layer                                  │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Drizzle ORM  │  │ Upstash   │  │ Cloudflare   │  │ Azure    │ │
│  │ (PostgreSQL) │  │ Redis     │  │ R2           │  │ App      │ │
│  │              │  │ (ratelimit)│  │ (avatars)    │  │ Settings │ │
│  │              │  │ + config  │  │              │  │ (env     │ │
│  │              │  │ cache     │  │              │  │  override)│ │
│  └──────────────┘  └────────────┘  └──────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

| Layer | Directory | Responsibility |
|---|---|---|
| **Pages** | `src/app/(platform)/profile/`, `src/app/scholar/` | Route handlers, metadata, server-side data fetching |
| **Client Components** | `src/components/profile/` | Interactive UI: forms, tabs, popups, animations |
| **Server Actions** | `src/actions/profile.actions.ts` | Mutations: update profile, change password, etc. |
| **API Routes** | `src/app/api/profile/avatar/route.ts` | File upload (multipart), Sharp re-encode, rate-limited |
| **Infrastructure** | `src/lib/upload.ts`, `src/lib/app-config.ts` | R2 client, feature flag store (DB + env var) |
| **Domain** | `src/domain/` (existing) | Course enrollments, certificates (reuse) |

### 2.3 SOLID Compliance

| Letter | Principle | Implementation |
|---|---|---|
| **S** | Single Responsibility | Each file does one thing: `profile-info-form.tsx` = form only, `upload.ts` = R2 only, `sharp` = image processing only |
| **O** | Open/Closed | New social platforms = add to enum + schema, no core changes |
| **L** | Liskov Substitution | All components accept consistent prop interfaces |
| **I** | Interface Segregation | `PublicProfile` type exposes only what's needed, not the full `User` |
| **D** | Dependency Inversion | Actions depend on `auth.api.getSession` interface, not direct DB; upload depends on `upload.ts` abstraction, not R2 SDK directly |

### 2.4 Design Patterns

| Pattern | Usage |
|---|---|
| **Repository** | R2 client abstracted behind `upload.ts` — swap to S3/Local/Blob without changing callers |
| **Strategy** | Rate limiter algorithms (sliding window via Upstash) |
| **Feature Flag** | Kill switch via `app_config` DB table + Azure App Settings override |
| **Factory** | Better-auth plugin pattern for username generation |
| **Hydration** | TanStack Query `HydrationBoundary` for SSR → client handoff |
| **Server Action** | Next.js `"use server"` for mutations with revalidation |
| **Pipeline** | Upload pipeline: validate MIME → validate magic bytes → Sharp re-encode → R2 upload → DB update → cleanup old |

---

## 3. Route Structure

### 3.1 Page Routes

```
/profile                                   → Own profile dashboard (Server Component)
/profile/layout.tsx                        → Profile shell with sidebar tab navigation
/profile/?tab=info                         → Profile info (default)
/profile/?tab=courses                      → My enrolled courses
/profile/?tab=certificates                 → Certificate gallery
/profile/?tab=saved                        → Saved opportunities
/profile/?tab=settings                     → Account settings

/scholar/[username]                        → Public profile page (ISR, SEO metadata)
```

### 3.2 API Routes

| Method | Path | Purpose | Rate Limited |
|---|---|---|---|
| `POST` | `/api/profile/avatar` | Upload + Sharp re-encode + R2 upload | Yes — 3/hr, 5/day, 7/week, 10/month per user |
| `DELETE` | `/api/profile/avatar` | Remove avatar from R2 | No |
| `GET` | `/api/admin/storage-check` | Weekly R2 usage check (Azure Cron / WebJob) | No (internal) |

### 3.3 Server Actions

| Action | Input | Output |
|---|---|---|
| `updateProfile` | `UpdateProfileInput` (Zod) | `ActionResponse` |
| `updatePassword` | `{ currentPassword, newPassword }` | `ActionResponse` |
| `getPublicProfile` | `username: string` | `PublicProfile \| null` |
| `generateUsername` | `{ firstName, lastName }` | `{ username: string }` |
| `reportProfile` | `{ username, reason }` | `ActionResponse` |

---

## 4. Data Model

### 4.1 Database Schema — New Columns on `auth.user`

```typescript
// src/db/schema/auth-schema.ts — additions to existing user table

// Step 1 migration: add as NULLABLE (no NOT NULL yet)
username:          text("username").unique(),        // NULLABLE initially, constrained after backfill
githubUrl:         text("github_url"),
facebookUrl:       text("facebook_url"),
instagramUrl:      text("instagram_url"),
twitterUrl:        text("twitter_url"),
linkedinUrl:       text("linkedin_url"),
isProfilePublic:   boolean("is_profile_public").default(true).notNull(),

// Step 2 migration (after backfill): ALTER COLUMN username SET NOT NULL
```

### 4.2 New Table: `app_config` (Feature Flags)

```typescript
// src/db/schema/app-config-schema.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: text("updated_by"),
});

// Seed row:
// key: "avatar_upload_enabled"
// value: "true"
```

### 4.3 Better-auth Additional Fields

```typescript
// src/lib/auth.ts — additions to user.additionalFields
username:          { type: "string", required: false },  // set after signup, not during
githubUrl:         { type: "string", required: false },
facebookUrl:       { type: "string", required: false },
instagramUrl:      { type: "string", required: false },
twitterUrl:        { type: "string", required: false },
linkedinUrl:       { type: "string", required: false },
isProfilePublic:   { type: "boolean", required: false, defaultValue: true },
```

### 4.4 Zod Validation Schemas

```typescript
// src/actions/profile.actions.ts

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  firstNameAr: z.string().max(100).optional(),
  lastNameAr: z.string().max(100).optional(),
  educationLevel: z.string().optional(),
  university: z.string().optional(),
  faculty: z.string().optional(),
  company: z.string().optional(),
  school: z.string().optional(),
  gpa: z.coerce.number().min(0).max(4).optional(),
  industry: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().optional(),
  city: z.string().optional(),
  currentInterest: z.string().optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  isProfilePublic: z.boolean().optional(),
});

const UsernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9][a-z0-9_-]*[a-z0-9]$/,
      "Username must start and end with a letter or number, and contain only letters, numbers, hyphens, or underscores"
    ),
});

const ReportProfileSchema = z.object({
  username: z.string().min(3).max(30),
  reason: z.string().min(10).max(500),
});
```

### 4.5 Environment Variables Validation (Startup)

```typescript
// src/config/env.ts — extended with runtime validation
import { z } from "zod";

const envSchema = z.object({
  // Existing
  NEXT_PUBLIC_API_URL: z.string().min(1).default("/api"),
  NEXT_PUBLIC_API_BASE_URL: z.string().min(1).default("/api"),

  // R2 — required if avatar upload enabled
  R2_ENDPOINT: z.string().url().optional(),
  R2_ACCESS_KEY: z.string().optional(),
  R2_SECRET_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  // Rate limiting — required in production
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),

  // Kill switch override (Azure App Setting)
  // Set to "false" to disable avatar uploads globally (overrides DB config)
  AVATAR_UPLOAD_ENABLED: z.enum(["true", "false"]).optional(),

  // Better-auth
  BETTER_AUTH_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
});

// CRASHES AT STARTUP if required vars missing in production
// This is intentional — fail fast, not at first request
export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

### 4.6 TypeScript Types

```typescript
// src/types/profile.types.ts

export interface PublicProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  educationLevel: string | null;
  university: string | null;
  faculty: string | null;
  currentInterest: string | null;
  githubUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail: string;
  instructor: { name: string; avatar: string | null };
  progress: number; // 0–100
  slug: string;
  lastAccessedAt: string | null;
}

export interface Certificate {
  id: string;
  courseName: string;
  issueDate: string;
  credentialId: string;
  downloadUrl: string;
}

export interface SavedOpportunity {
  id: string;
  title: string;
  organization: string;
  location: string | null;
  type: string;
  savedAt: string;
}

export interface ProfileCompletion {
  percentage: number; // 0–100
  missingFields: string[];
}

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string | Record<string, string[]>;
}

export type SocialPlatform = "github" | "facebook" | "instagram" | "twitter" | "linkedin";

export const SOCIAL_PLATFORMS: Record<SocialPlatform, { color: string; label: string }> = {
  github:    { color: "#181717",  label: "GitHub" },
  facebook:  { color: "#1877F2",  label: "Facebook" },
  instagram: { color: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", label: "Instagram" },
  twitter:   { color: "#000000",  label: "X (Twitter)" },
  linkedin:  { color: "#0A66C2",  label: "LinkedIn" },
};
```

### 4.7 Profile Completion Algorithm

```typescript
// src/components/profile/profile-completion-ring.tsx

const COMPLETION_FIELDS = [
  { key: "image",            weight: 20, label: "Profile photo" },
  { key: "firstName+lastName", weight: 10, label: "Full name" },
  { key: "socialLinks",     weight: 10, label: "Social link (any)" },
  { key: "educationLevel+university", weight: 15, label: "Education" },
  { key: "currentInterest", weight: 15, label: "Bio / Interest" },
  { key: "nationality+city", weight: 10, label: "Location" },
  { key: "company+school",  weight: 10, label: "Work / School" },
  { key: "dateOfBirth",     weight: 10, label: "Date of birth" },
] as const;
```

### 4.8 Migration Strategy (Two-Step, Atomic, Reversible)

#### Step 1: `001_add_profile_columns.sql` — Add columns as NULLABLE

```sql
-- Reversible: DROP COLUMN IF EXISTS
ALTER TABLE auth.user
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS is_profile_public boolean DEFAULT true;

-- Create unique index (partial: only non-null usernames)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_username ON auth.user (username) WHERE username IS NOT NULL;
```

#### Step 2: Backfill script — Atomic per-row via `INSERT ... ON CONFLICT`

```typescript
// scripts/backfill-usernames.ts — ATOMIC, no race conditions

import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { isNull, eq, sql } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

const BATCH_SIZE = 100;

async function backfillUsernames(): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  while (true) {
    // Fetch one batch of users without usernames
    const batch = await db
      .select({ id: user.id, firstName: user.firstName, lastName: user.lastName })
      .from(user)
      .where(isNull(user.username))
      .limit(BATCH_SIZE);

    if (batch.length === 0) break;

    // Process batch in parallel — each UPDATE is atomic
    const results = await Promise.allSettled(
      batch.map(async (u) => {
        const base = slugify(`${u.firstName}.${u.lastName}`)
          .toLowerCase()
          .replace(/[^a-z0-9._-]/g, "")
          .slice(0, 26); // leave room for suffix

        // Use DB-level retry with ON CONFLICT to guarantee atomicity
        // No read-then-write race condition
        for (let attempt = 0; attempt < 10; attempt++) {
          const candidate = attempt === 0
            ? base
            : `${base}-${uuidv4().slice(0, 6)}`;

          const result = await db
            .update(user)
            .set({ username: candidate })
            .where(sql`${user.id} = ${u.id} AND ${user.username} IS NULL`);

          // Condition + atomic update prevents double-assignment
          if (result.rowCount !== null && result.rowCount > 0) return;
        }
        throw new Error(`Failed to generate unique username for ${u.id} after 10 attempts`);
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") succeeded++;
      else { failed++; console.error(r.reason); }
    }

    console.log(`Progress: ${succeeded} succeeded, ${failed} failed (batch of ${batch.length})`);
  }

  return { succeeded, failed };
}

// Run: npx tsx scripts/backfill-usernames.ts
```

#### Step 3: `002_set_username_not_null.sql` — Add NOT NULL constraint (only if 100% coverage verified)

```sql
-- Verify first: SELECT COUNT(*) FROM auth.user WHERE username IS NULL;
-- If 0, proceed:
ALTER TABLE auth.user ALTER COLUMN username SET NOT NULL;
```

#### Rollback

```sql
-- 002_rollback.sql
ALTER TABLE auth.user ALTER COLUMN username DROP NOT NULL;

-- 001_rollback.sql
ALTER TABLE auth.user
  DROP COLUMN IF EXISTS username,
  DROP COLUMN IF EXISTS github_url,
  DROP COLUMN IF EXISTS facebook_url,
  DROP COLUMN IF EXISTS instagram_url,
  DROP COLUMN IF EXISTS twitter_url,
  DROP COLUMN IF EXISTS linkedin_url,
  DROP COLUMN IF EXISTS is_profile_public;
```

---

## 5. Component Architecture

### 5.1 Component Tree

```
src/components/profile/
├── profile-popup.tsx                    → Header dropdown (GlassPanel + scaleFade)
│   ├── Avatar (small)
│   ├── Name + Email
│   ├── Quick links (View Profile, Courses, Certs, Saved, Settings)
│   └── Sign Out button
│
├── profile-shell.tsx                    → Tab layout with sidebar + AnimatePresence
│   ├── Sidebar navigation (5 tabs)
│   │   └── profile-completion-ring.tsx  → Circular progress indicator
│   └── Tab content (AnimatePresence + itemFade)
│
├── profile-avatar-upload.tsx            → Drag-and-drop upload area
│   ├── Current avatar preview
│   ├── Drop zone / file picker
│   ├── Upload progress indicator
│   ├── Kill switch awareness (hides if disabled)
│   └── Sharp-optimized preview (re-encoded client-side preview)
│
├── profile-info-form.tsx                → Edit form (react-hook-form + Zod)
│   ├── Personal info section
│   ├── Education section
│   ├── Professional section
│   ├── Social links section
│   │   └── social-icon-link.tsx         → Brand-colored icon per platform
│   └── Save / Cancel buttons
│
├── profile-info-display.tsx             → Read-only view (for own profile tab)
│   └── Same layout as form, but display mode
│
├── my-courses-list.tsx                  → Enrolled courses grid
│   ├── Course card with progress bar
│   └── Empty state (illustration + "Browse Courses" CTA)
│
├── certificate-gallery.tsx              → Certificate cards grid
│   └── Empty state (illustration)
│
├── saved-opportunities-list.tsx         → Bookmarked opportunities
│   └── Empty state (illustration + "Discover Opportunities" CTA)
│
├── account-settings-form.tsx            → Account actions
│   ├── Change password
│   ├── Resend email verification
│   ├── Privacy toggle (isProfilePublic)
│   └── Delete account (with confirmation dialog)
│
├── public-profile-header.tsx            → Public profile hero
│   ├── Avatar (large)
│   ├── Name + username
│   ├── Education / Interest
│   └── Social icon links (brand-colored)
│
├── onboarding-nudge.tsx                 → Post-signup banner
│   └── Dismissible, max 3 shows
│
└── report-profile-dialog.tsx            → Report inappropriate profile
    ├── Reason dropdown
    └── Submit button
```

### 5.2 Component Design Guidelines

| Guideline | Rule |
|---|---|
| **Client boundary** | All interactive components use `"use client"` |
| **Server boundary** | Page shells, layouts, metadata generators use `"use server"` |
| **Animation variants** | Import from `@/lib/motion-variants.ts` — no inline variants |
| **Styling** | Tailwind CSS v4 + `cn()` utility — no CSS modules |
| **Icons** | Lucide React + `social-icon-link.tsx` for brand icons |
| **Forms** | `react-hook-form` with `@hookform/resolvers/zod` |
| **Toasts** | Sonner — unified at `bottom-right` with `richColors` |
| **Error boundaries** | Per-tab error boundaries with retry button |
| **Data fetching** | Server Component prefetch → `HydrationBoundary` → client `useQuery` |

### 5.3 Animated States

| Element | Library | Variant | Trigger |
|---|---|---|---|
| Popup menu | Framer Motion | `scaleFade` | Hover/click toggle |
| Tab content switch | Framer Motion | `itemFade` | Tab change |
| Avatar upload progress | Framer Motion | Custom spring | File selection |
| Profile completion ring | Framer Motion | `statCardReveal` | Page load |
| Social icon hover | Framer Motion | `tapScale` | Hover |
| Form submission | Sonner | — | Submit success/failure |

---

## 6. Data Flow

### 6.1 Profile Edit Flow

```
┌──────────┐     ┌──────────────────┐     ┌───────────────┐     ┌──────────┐
│  User    │     │  Client Form     │     │  Server       │     │  DB      │
│  fills   │ ──► │  (react-hook-    │ ──► │  Action       │ ──► │  (Drizzle│
│  form    │     │   form + Zod)    │     │  (profile     │     │   ORM)   │
│          │     │                  │     │   .actions.ts)│     │          │
└──────────┘     └──────────────────┘     └──────┬────────┘     └──────────┘
       ▲                                        │
       │                                        │  Sync name = firstName + lastName
       │                                        │  (better-auth compatibility)
       │                                        │
       │              ┌──────────────────┐       │
       │              │  revalidatePath  │◄──────┘
       │              │  /profile        │
       │              │  /scholar/[user] │
       │              │  revalidateTag   │
       │              └────────┬─────────┘
       │                       │
       └───────────────────────┘
        Sonner toast "Saved"
```

### 6.2 Avatar Upload Flow (with Sharp Re-Encoding)

```
┌──────────┐     ┌───────────────┐     ┌─────────────────────┐     ┌─────────┐
│  User    │     │  rate-limiter  │     │  POST               │     │  Sharp  │
│  drops   │ ──► │  (Upstash)    │ ──► │  /api/profile/avatar│ ──► │  re-    │
│  file    │     │  3/hr, 5/day..│     │                     │     │  encode │
└──────────┘     └───────────────┘     └──────────┬──────────┘     └────┬────┘
       ▲                                          │                     │
       │                         ┌───────────────────┐                  │
       │                         │  Kill switch?     │                  │
       │                         │  (DB config +     │                  │
       │                         │   env override)   │                  │
       │                         └───────────────────┘                  │
       │                                          │                     │
       │                                  ┌───────▼────────┐           │
       │                                  │  Validate:     │           │
       │                                  │  1. MIME type  │           │
       │                                  │  2. Magic bytes│           │
       │                                  │     (FF D8 FF) │           │
       │                                  │  3. Max 1MB    │           │
       │                                  └───────┬────────┘           │
       │                                          │                     │
       │                                  ┌───────▼────────┐           │
       │                                  │  Sharp:        │◄──────────┘
       │                                  │  - Resize 512px│
       │                                  │  - Strip EXIF  │
       │                                  │  - JPEG 85%    │
       │                                  │  - Output      │
       │                                  │    buffer      │
       │                                  └───────┬────────┘
       │                                          │
       │                                  ┌───────▼────────┐
       │                                  │  Upload to R2  │
       │                                  │  avatars/{uid}/│
       │                                  │  {uuid}.jpg    │
       │                                  └───────┬────────┘
       │                                          │
       │                                  ┌───────▼────────┐
       │                                  │  Delete old    │
       │                                  │  from R2       │
       │                                  └───────┬────────┘
       │                                          │
       │                                  ┌───────▼────────┐
       │                                  │  Update        │
       │                                  │  user.image in │
       │                                  │  DB            │
       │                                  └───────┬────────┘
       │                                          │
       │              ┌──────────────────────┐    │
       │              │  revalidatePath      │◄───┘
       │              │  /scholar/[username]  │
       │              │  revalidateTag('...') │
       │              └──────────────────────┘
       │
       └── Upload progress → Success toast
```

### 6.3 Public Profile Request Flow (On-Demand ISR)

```
┌──────────┐     ┌──────────────────┐     ┌───────────────┐     ┌──────────┐
│  Visitor │     │  Next.js Route   │     │  Server       │     │  DB      │
│  requests│ ──► │  (scholar/       │ ──► │  Component    │ ──► │  Query   │
│  /scholar│     │   [username])    │     │  generateMeta │     │  user by │
│  /name   │     │                  │     │  data + fetch │     │  username│
└──────────┘     └──────────────────┘     └──────┬────────┘     └──────────┘
       ▲                                        │
       │                                        │  ┌───────────────────┐
       │                                        │  │ isProfilePublic?  │
       │                                        │  │ → Yes: render     │
       │                                        │  │ → No: 404         │
       │                                        │  └───────────────────┘
       │                                        │
       │                                        │  ┌───────────────────┐
       │                                        │  │ On-demand ISR     │
       │                                        │  │ revalidatePath    │
       │                                        │  │ is called by      │
       │                                        │  │ updateProfile     │
       │                                        │  │ action when save  │
       │                                        │  └───────────────────┘
       │                                        │
       │              ┌─────────────────────┐   │
       │              │  SEO metadata:      │◄──┘
       │              │  - <title>Name      │
       │              │  - OG: image, name  │
       │              │  - JSON-LD: Person  │
       │              │  - noindex if       │
       │              │    private/incomplete│
       │              └─────────────────────┘
       │
       └── Full HTML page (no client JS waterfall)
```

---

## 7. Implementation Phases

### Phase 1: Foundation & Infrastructure Smoke Tests (Day 1)

**CRITICAL: All infra must be verified before any feature code is written.**

1. **Git worktree setup**
   ```bash
   git worktree add ../web-profile master
   cd ../web-profile
   git checkout -b feat/profile-page
   ```

2. **Install dependencies**
   ```bash
   pnpm add @aws-sdk/client-s3 @upstash/redis @upstash/ratelimit sharp uuid
   pnpm add -D @types/sharp @types/uuid
   ```

3. **Startup env validation** — `src/config/env.ts`
   - Zod schema validates all required vars
   - App crashes on boot if missing — fail fast, not at first request

4. **DB schema + two-step migration**
   - Add columns as NULLABLE (Step 1)
   - Create `app_config` table
   - Run `pnpm db:generate && pnpm db:push`
   - Run backfill script for existing users
   - Verify 100% coverage → add NOT NULL constraint (Step 2)
   - Verify rollback scripts work

5. **Infrastructure smoke tests**
   - **R2:** Can we write an object, read it back, delete it? CORS configured?
   - **Upstash Redis:** Can we set a key, get it back, TTL works?
   - **Azure App Settings:** Can we read env vars at runtime?
   - **Sharp:** Can we re-encode a test image to JPEG at 85% quality?

6. **Better-auth config**
   - Add `additionalFields` entries in `src/lib/auth.ts`
   - Add `afterSignUp` hook for username generation

7. **Infrastructure layer**
   - `src/lib/upload.ts` — R2 client + Sharp pipeline
   - `src/lib/app-config.ts` — Feature flag store (DB + env override)
   - `src/lib/rate-limiter.ts` — Upstash Redis rate limiter

**Deliverable:** All infrastructure verified, DB migrated, rollback proven, env validation working.

### Phase 2: Profile Popup + Header (Day 2)

1. `src/components/profile/profile-popup.tsx` — Glassmorphism dropdown
2. `src/components/Header.tsx` — Replace `User` icon with popup
3. Wire up `useSession()` for user data

**Deliverable:** Click/hover profile popup in header with glassmorphism styling.

**Smoke test:** Log in → popup appears → navigate to profile.

### Phase 3: Own Profile Page (Days 3-4)

1. `src/app/(platform)/profile/layout.tsx` — Profile shell
2. `src/components/profile/profile-shell.tsx` — Sidebar tabs + AnimatePresence
3. `src/components/profile/profile-completion-ring.tsx` — Circular progress
4. `src/components/profile/profile-info-form.tsx` — Edit form
5. `src/components/profile/profile-info-display.tsx` — Read-only view
6. `src/components/profile/social-icon-link.tsx` — Brand-colored icons
7. `src/actions/profile.actions.ts` — Server actions
8. `src/types/profile.types.ts` — Type definitions

**Tests:**
- Unit test: `updateProfile` with valid data returns `{ success: true }`
- Unit test: `updateProfile` with invalid data returns field-level errors
- Unit test: `updateProfile` without session returns `{ success: false, error: "Unauthorized" }`
- Unit test: `updateProfile` syncs `name = firstName + " " + lastName`

**Deliverable:** `/profile` with all tabs working. Profile data can be edited and saved.

### Phase 4: Avatar Upload (Day 5)

1. `src/components/profile/profile-avatar-upload.tsx` — Upload UI
2. `src/app/api/profile/avatar/route.ts` — Upload API with full pipeline
3. `src/lib/upload.ts` — Sharp re-encoding + R2 upload
4. `src/lib/app-config.ts` — Kill switch integration
5. `next.config.ts` — Add R2 remote pattern

**Upload pipeline code (in route.ts):**
```typescript
// 1. Validate session
// 2. Check kill switch (DB config + env override)
// 3. Check rate limit (Upstash Redis)
// 4. Parse multipart form data
// 5. Validate MIME type (headers) — quick reject
// 6. Validate magic bytes (read first 3 bytes: FF D8 FF for JPEG, 89 50 4E 47 for PNG)
// 7. Sharp re-encode: resize to 512x512, strip EXIF, JPEG quality 85%
// 8. Upload re-encoded buffer to R2
// 9. Delete old avatar from R2 (if exists)
// 10. Update user.image in DB
// 11. revalidatePath('/scholar/' + user.username)
// 12. Return { url: string }
```

**Tests:**
- Unit test: `upload.ts` Sharp pipeline produces correct JPEG output
- Integration test: `POST /api/profile/avatar` with valid JPEG returns 200
- Integration test: `POST /api/profile/avatar` with renamed .exe → .jpg returns 415
- Integration test: `POST /api/profile/avatar` with 2MB file returns 413
- Integration test: `POST /api/profile/avatar` when rate limited returns 429
- Integration test: `POST /api/profile/avatar` when kill switch off returns 503

**Deliverable:** Users can upload/change/delete avatar with strict validation and rate limits.

### Phase 5: Public Profiles (Day 6)

1. `src/app/scholar/[username]/page.tsx` — Public profile page (Server Component)
2. `src/components/profile/public-profile-header.tsx` — Public hero section
3. `generateMetadata` per profile with SEO + OG + JSON-LD
4. Privacy toggle integration (404 if disabled) — on-demand revalidation
5. `src/components/profile/report-profile-dialog.tsx` — Report button
6. Rate limiting on public profile lookups (Upstash Redis per IP, 60/min)

**On-demand revalidation:** When privacy toggle changes, the `updateProfile` action calls:
```typescript
revalidatePath('/scholar/' + user.username);
```
This ensures the cached public page is purged immediately — no 60-second exposure window.

**Tests:**
- Unit test: `getPublicProfile` with valid username returns `PublicProfile`
- Unit test: `getPublicProfile` with private profile returns `null`
- Unit test: `getPublicProfile` excludes sensitive fields (email, phone, DOB, settings)
- E2E test: Visit `/scholar/[username]` → verify SEO metadata, OG tags, JSON-LD present
- E2E test: Toggle privacy OFF → verify 404

**Deliverable:** `/scholar/[username]` returns SEO-optimized public profiles with immediate privacy enforcement.

### Phase 6: Remaining Tabs (Day 7)

1. `src/components/profile/my-courses-list.tsx` — Enrolled courses
2. `src/components/profile/certificate-gallery.tsx` — Certificates
3. `src/components/profile/saved-opportunities-list.tsx` — Saved opps
4. `src/components/profile/account-settings-form.tsx` — Settings
5. `src/components/profile/onboarding-nudge.tsx` — Post-signup banner
6. Empty states with illustrations for all tabs

**Deliverable:** Full profile dashboard complete.

### Phase 7: Monitoring, Operations & Hardening (Day 8)

1. `src/app/api/admin/storage-check/route.ts` — R2 usage check (triggered by Azure Cron / WebJob)
2. DB-backed kill switch with admin API toggle
3. Upstash Redis dashboard review
4. Account deletion cleanup flow (R2 → DB)
5. Error boundaries per tab
6. Load testing: 100 concurrent avatar uploads, 1000 concurrent public profile reads

**Deliverable:** Operational readiness — monitoring, kill switch, cleanup, load-verified.

---

## 8. Security & Compliance

### 8.1 Defense in Depth (6 Layers)

```
Layer 1: Rate Limiting (Upstash Redis)
  └── Avatar upload: 3/hr, 5/day, 7/week, 10/month per user
  └── Public profile: 60/min per IP

Layer 2: Input Validation (Zod)
  └── All server actions validate input before touching DB
  └── File upload: MIME headers + magic bytes + Sharp re-encode

Layer 3: Authentication (better-auth)
  └── Profile mutations require valid session
  └── Avatar upload requires valid session

Layer 4: Authorization
  └── Own profile edit: session.user.id matches
  └── Admin features: role === "admin"

Layer 5: Output Sanitization
  └── Public profile excludes: email, phone, DOB, settings
  └── Social URLs open with target="_blank" rel="noopener noreferrer"
  └── All user text escaped before render

Layer 6: Kill Switch (DB + env override)
  └── Global disable of avatar upload via app_config table
  └── Azure App Setting "AVATAR_UPLOAD_ENABLED=false" overrides DB
  └── No external dependencies (no GitHub Gist)
  └── Audit trail via app_config.updatedBy and updatedAt
```

### 8.2 Avatar Upload Security Pipeline

Every upload goes through this **mandatory** pipeline:

```
1. Rate limit check (Upstash)         → 429 if exceeded
2. Kill switch check (DB + env)        → 503 if disabled
3. File size check (Content-Length)    → 413 if > 1MB
4. MIME type check (Content-Type)      → 415 if not image/*
5. Magic bytes verification            → 415 if headers don't match content
   JPEG:  FF D8 FF
   PNG:   89 50 4E 47
   WebP:  52 49 46 46 ?? ?? ?? ?? 57 45 42 50
6. Sharp re-encode                     → Strips ALL metadata, EXIF, hidden payloads
   - Resize to 512×512 (max, maintain aspect ratio)
   - Strip EXIF and all metadata
   - Output JPEG quality 85%
   - Output WebP (if browser supports)
7. Upload to R2                        → URL returned
8. Delete old avatar                   → Cleanup
9. Update DB                           → user.image = new URL
```

### 8.3 Security Checklist

- [x] Avatar upload validates MIME type (image/jpeg, image/png, image/webp)
- [x] Avatar upload validates **magic bytes** (reads first bytes of stream, not just headers)
- [x] Avatar upload re-encodes via **Sharp** (strips all hidden payloads)
- [x] Avatar upload enforces max 1MB file size
- [x] Avatar rate limits enforced server-side via Upstash Redis
- [x] Kill switch is DB-backed with env var override — no external Gist dependency
- [x] Public profile lookups rate limited per IP
- [x] Social link URLs sanitized before storage and display
- [x] All external links use `rel="noopener noreferrer"`
- [x] Profile deletion cascades: R2 → DB (cleanup before delete)
- [x] Better-auth session validated on every mutation
- [x] Zod validation on every server action input
- [x] XSS prevented via React's default escaping
- [x] SQL injection prevented via Drizzle ORM parameterized queries
- [x] No sensitive fields (email, phone, DOB) exposed on public profile
- [x] Username regex prevents injection characters
- [x] Kill switch disables upload at both API and UI level
- [x] Startup env validation — app fails fast on missing config
- [x] Two-step migration with rollback — no data loss on failed migration

### 8.4 GDPR Compliance

| Requirement | Implementation |
|---|---|
| Right to access | Profile page shows all user data |
| Right to rectification | Profile edit form |
| Right to deletion | Account deletion flow (R2 cleanup + DB delete) |
| Right to data portability | Future: export as JSON |
| Consent management | Privacy toggle for public profile |
| Data minimization | Public profile exposes minimum required fields |

---

## 9. Performance & Scalability

### 9.1 Performance Budget

| Metric | Target | Strategy |
|---|---|---|
| Time to First Byte (TTFB) | < 200ms | On-demand ISR for public profiles, SSR for own profile |
| First Contentful Paint (FCP) | < 1.5s | Minimal client JS, code-split tabs |
| Largest Contentful Paint (LCP) | < 2.5s | Avatar prioritized in HTML, on-demand loading for tab content |
| Cumulative Layout Shift (CLS) | < 0.1 | Fixed dimensions for avatar, skeleton loaders |
| Lighthouse Performance | ≥ 90 | ISR, code splitting, image optimization |
| API Response Time (avatar) | < 800ms | Sharp processing + R2 upload (budget includes re-encoding time) |

### 9.2 Caching Strategy

| Resource | Strategy | Cache Duration |
|---|---|---|
| Public profile page | On-demand ISR (`revalidatePath` on profile update) | Until next mutation |
| Own profile page | SSR + React Query | On-demand revalidation |
| Avatar images | R2 CDN + Cache-Control | 86,400 seconds (1 day) |
| Kill switch config | In-memory (globalThis) + DB read | 60 seconds |
| Rate limiter state | Upstash Redis | Automatic TTL |
| Social favicons | Browser cache | Standard |
| Public profile list | Not cached (unique per user) | N/A |

### 9.3 Scalability Architecture (Azure App Service)

```
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Azure App Service  │    │  Azure App Service  │    │  Azure App Service  │
│  Instance 1         │    │  Instance 2         │    │  Instance N         │
│  (Persistent proc)  │    │  (Persistent proc)  │    │  (Persistent proc)  │
│  - globalThis cache │    │  - globalThis cache │    │  - globalThis cache │
│  - In-memory rate   │    │  - In-memory rate   │    │  - In-memory rate   │
│    limiter (warm)   │    │    limiter (warm)   │    │    limiter (warm)   │
└────────┬───────────┘    └────────┬───────────┘    └────────┬───────────┘
         │                        │                         │
         └────────────────────────┼─────────────────────────┘
                                  │
                       ┌──────────▼──────────┐
                       │   Upstash Redis      │
                       │   (shared state)     │
                       │   - Rate limits      │
                       │   (cross-instance)   │
                       │   - Config cache     │
                       └──────────┬──────────┘
                                  │
                       ┌──────────▼──────────┐
                       │   PostgreSQL         │
                       │   (Azure DB / Neon)  │
                       │   - User data        │
                       │   - app_config       │
                       └─────────────────────┘
```

### 9.4 Database Query Optimization

| Query | Index | Expected Rows |
|---|---|---|
| `SELECT by username` | Unique index on `auth.user.username` (partial: WHERE IS NOT NULL) | 1 row |
| `SELECT by user id` | Primary key on `auth.user.id` | 1 row |
| `SELECT enrollments by user` | Index on `course_enrollments.user_id` | 1–50 rows |
| `SELECT certificates by user` | Index on `certificates.user_id` | 1–20 rows |
| `SELECT app_config by key` | Primary key on `app_config.key` | 1 row |

---

## 10. Monitoring & Operations

### 10.1 Kill Switch — DB + Env Override (Not GitHub Gist)

```typescript
// src/lib/app-config.ts
// Feature flag store with in-memory cache and Azure env override.

interface AppConfig {
  key: string;
  value: string;
  updatedAt: Date;
  updatedBy: string | null;
}

const CACHE_TTL = 60 * 1000; // 60 seconds
let configCache: Map<string, { data: string; timestamp: number }> = new Map();

export async function getConfig(key: string): Promise<string | null> {
  // 1. Check Azure App Settings override first (takes precedence)
  const envOverride = process.env[key.toUpperCase()];
  if (envOverride !== undefined) return envOverride;

  // 2. Check in-memory cache (safe on Azure — persistent process)
  const cached = configCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // 3. Read from DB
  try {
    const row = await db
      .select({ value: appConfig.value })
      .from(appConfig)
      .where(eq(appConfig.key, key))
      .limit(1);

    if (row.length > 0) {
      configCache.set(key, { data: row[0].value, timestamp: Date.now() });
      return row[0].value;
    }
  } catch (error) {
    console.error(`[app-config] DB read failed for key="${key}":`, error);
  }

  return null;
}

// For kill switch specifically:
export async function isAvatarUploadEnabled(): Promise<boolean> {
  const value = await getConfig("avatar_upload_enabled");

  // Azure env override: AVATAR_UPLOAD_ENABLED=false
  // DB config: "true" or "false"
  // Default: true

  if (value === "false") return false;
  return true;
}
```

**Toggle via admin API:**
```typescript
// src/app/api/admin/config/[key]/route.ts
export async function PUT(request: NextRequest) {
  // 1. Admin auth check
  // 2. Parse { value: string }
  // 3. UPSERT into app_config
  // 4. Clear in-memory cache
  // 5. Audit log
  // 6. Return { success: true }
}
```

### 10.2 Weekly Storage Check — Azure Cron / WebJob

```typescript
// src/app/api/admin/storage-check/route.ts
// Triggered by Azure Scheduler / WebJob: every Monday at 09:00 UTC
// 1. Query R2 bucket usage (ListObjectsV2, sum sizes)
// 2. Compare against 10GB free tier
// 3. If > 80% → Slack/email alert
// 4. If > 95% → auto-update app_config avatar_upload_enabled=false

export async function GET(request: NextRequest) {
  // Internal auth check (API key in header or Azure internal network)
  const isInternal = request.headers.get("x-internal-key") === process.env.INTERNAL_API_KEY;
  if (!isInternal) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const totalBytes = await calculateR2Usage();
  const totalGB = totalBytes / (1024 * 1024 * 1024);
  const threshold80 = 10 * 0.8; // 8GB
  const threshold95 = 10 * 0.95; // 9.5GB

  if (totalGB > threshold95) {
    await db.insert(appConfig).values({
      key: "avatar_upload_enabled",
      value: "false",
      updatedBy: "system:storage-check",
    }).onConflictDoUpdate({ target: appConfig.key, set: { value: "false" } });
    clearConfigCache(); // Clear in-memory cache so new value takes effect
    await sendAlert(`R2 storage at ${totalGB.toFixed(1)}GB — auto-disabled uploads`);
  } else if (totalGB > threshold80) {
    await sendAlert(`R2 storage at ${totalGB.toFixed(1)}GB (80% of 10GB free tier)`);
  }

  return NextResponse.json({ totalGB: Math.round(totalGB * 10) / 10, status: "ok" });
}
```

### 10.3 Logging Strategy

| Event | Method | Retention |
|---|---|---|
| Profile update | Server action log | 30 days |
| Avatar upload/reject | Rate limiter + API log | 30 days |
| Public profile rate limit | Upstash Redis | TTL-based |
| Kill switch state change | app_config table + audit log | Permanent |
| Storage check result | Cron log | 30 days |
| Account deletion | Audit + email confirmation | Permanent |
| Sharp re-encode failure | API error log | 30 days |
| Magic byte validation failure | API warn log | 30 days |

### 10.4 Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `UPLOAD_DISABLED` | 503 | Kill switch active |
| `RATE_LIMITED_AVATAR` | 429 | Upload rate limit exceeded |
| `RATE_LIMITED_PROFILE` | 429 | Public profile lookup rate limit |
| `PROFILE_NOT_FOUND` | 404 | Username does not exist |
| `PROFILE_PRIVATE` | 404 | Profile exists but privacy toggled off |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `UNAUTHORIZED` | 401 | No valid session |
| `FILE_TOO_LARGE` | 413 | Exceeds 1MB limit |
| `INVALID_FILE_TYPE` | 415 | Not an accepted image format |
| `INVALID_MAGIC_BYTES` | 415 | File headers don't match declared type |
| `SHARP_REENCODE_FAILED` | 422 | Image processing pipeline failed |
| `UPLOAD_FAILED` | 500 | R2 upload error |

### 10.5 R2 Bucket Structure

```
avatars/
  └── {userId}/
      └── {uuid}.jpg   ← Always JPEG (re-encoded by Sharp)
```

All avatars are converted to JPEG via Sharp, so `{ext}` is always `jpg`. This simplifies caching and CDN configuration.

---

## 11. Automated Testing

### 11.1 Testing Philosophy

> The "manual verification matrix" is a QA checklist, not a test plan. This section defines the actual automated tests required.

| Layer | Tool | What to Test |
|---|---|---|
| **Unit (Server Actions)** | `node:test` + `node:assert/strict` | Pure business logic: validation, auth gates, DB interactions (mocked) |
| **Integration (API Routes)** | `node:test` + fetch | Request/response contract, auth, rate limiting, file upload pipeline |
| **Unit (Upload Pipeline)** | `node:test` + Sharp | Magic byte detection, re-encoding output, file size enforcement |
| **E2E (Critical Flows)** | Playwright | Signup → upload avatar → public profile visibility |

### 11.2 Unit Tests: `src/actions/__tests__/profile-actions.test.ts`

```typescript
import { describe, it, before, mock } from "node:test";
import assert from "node:assert/strict";

// Mock better-auth session
const mockSession = { user: { id: "user-1" } };

// Mock DB
const mockDb = {
  update: mock.fn(() => ({
    set: mock.fn(() => ({
      where: mock.fn(() => Promise.resolve({ rowCount: 1 })),
    })),
  })),
};

describe("updateProfile", () => {
  it("returns success with valid data", async () => {
    const result = await updateProfile({ firstName: "John" }, mockSession, mockDb);
    assert.equal(result.success, true);
  });

  it("returns validation errors with invalid data", async () => {
    const result = await updateProfile({ gpa: 99 }, mockSession, mockDb);
    assert.equal(result.success, false);
    assert.ok(result.error); // Should contain field-level errors
  });

  it("returns unauthorized without session", async () => {
    const result = await updateProfile({ firstName: "John" }, null, mockDb);
    assert.equal(result.success, false);
    assert.equal(result.error, "Unauthorized");
  });

  it("syncs name field when firstName or lastName changes", async () => {
    // Should call db.update with { firstName: "John", name: "John Doe" }
    await updateProfile({ firstName: "John", lastName: "Doe" }, mockSession, mockDb);
    const setCall = mockDb.update.mock.calls[0];
    // Verify name was included in the SET
  });
});

describe("getPublicProfile", () => {
  it("returns PublicProfile (not full User)", async () => {
    const profile = await getPublicProfile("john-doe");
    assert.equal("email" in profile, false); // Sensitive field excluded
    assert.equal("phoneNumber" in profile, false);
    assert.ok(profile.firstName); // Public field included
  });

  it("returns null for private profiles", async () => {
    const profile = await getPublicProfile("private-user");
    assert.equal(profile, null);
  });

  it("returns null for non-existent usernames", async () => {
    const profile = await getPublicProfile("nonexistent");
    assert.equal(profile, null);
  });
});

describe("generateUsername", () => {
  it("generates slug from first.last name", () => {
    const username = generateUsername({ firstName: "John", lastName: "Doe" });
    assert.match(username, /^john\.doe/);
  });

  it("falls back to UUID suffix after collisions", async () => {
    // Mock 10 collisions
    const username = await generateUniqueUsername("John", "Doe", mockCollisionDb);
    assert.match(username, /^john\.doe-/); // Has suffix
  });

  it("never throws — always returns a valid username", async () => {
    const username = await generateUniqueUsername("John", "Doe", mockMaxCollisionDb);
    assert.ok(username); // Returns string even after max retries
    assert.equal(typeof username, "string");
  });
});
```

### 11.3 Integration Tests: `src/app/api/profile/avatar/__tests__/route.test.ts`

```typescript
describe("POST /api/profile/avatar", () => {
  it("returns 200 with valid JPEG under 1MB", async () => {
    const form = new FormData();
    form.append("file", validJpegBuffer, "avatar.jpg");
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form, headers: { cookie: validSession } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.url);
    assert.match(body.url, /r2\./); // R2 URL
  });

  it("returns 415 for renamed .exe → .jpg (magic bytes mismatch)", async () => {
    const form = new FormData();
    form.append("file", exeBufferRenamedToJpg, "avatar.jpg");
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form, headers: { cookie: validSession } });
    assert.equal(res.status, 415);
    assert.match(body.code, /INVALID_MAGIC_BYTES/);
  });

  it("returns 413 for files over 1MB", async () => {
    const form = new FormData();
    form.append("file", oversizedBuffer, "large.jpg");
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form, headers: { cookie: validSession } });
    assert.equal(res.status, 413);
  });

  it("returns 429 when rate limited", async () => {
    // Exhaust rate limit for test user
    for (let i = 0; i < 3; i++) {
      await fetch("/api/profile/avatar", { method: "POST", body: validForm, headers: { cookie: validSession } });
    }
    const res = await fetch("/api/profile/avatar", { method: "POST", body: validForm, headers: { cookie: validSession } });
    assert.equal(res.status, 429);
  });

  it("returns 503 when kill switch is active", async () => {
    // Set avatar_upload_enabled=false in app_config
    await setConfig("avatar_upload_enabled", "false");
    const form = new FormData();
    form.append("file", validJpegBuffer, "avatar.jpg");
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form, headers: { cookie: validSession } });
    assert.equal(res.status, 503);
  });
});
```

### 11.4 Unit Tests: `src/lib/__tests__/upload.test.ts`

```typescript
describe("Sharp re-encode pipeline", () => {
  it("re-encodes JPEG to JPEG at quality 85%", async () => {
    const output = await processAvatar(validJpegBuffer);
    assert.ok(output.length > 0);
    assert.ok(output.length < validJpegBuffer.length); // Compressed
    // Verify output is valid JPEG (starts with FF D8 FF)
    assert.equal(output.readUInt8(0), 0xFF);
    assert.equal(output.readUInt8(1), 0xD8);
    assert.equal(output.readUInt8(2), 0xFF);
  });

  it("strips EXIF metadata", async () => {
    const output = await processAvatar(jpegWithExif);
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.exif, undefined); // Stripped
    assert.equal(metadata.iptc, undefined);
    assert.equal(metadata.xmp, undefined);
  });

  it("resizes to max 512px", async () => {
    const output = await processAvatar(largeJpegBuffer);
    const metadata = await sharp(output).metadata();
    assert.ok(metadata.width! <= 512);
    assert.ok(metadata.height! <= 512);
  });

  it("rejects invalid image data", async () => {
    await assert.rejects(
      () => processAvatar(Buffer.from("notanimage")),
      /Invalid image data/
    );
  });
});

describe("Magic byte detection", () => {
  it("detects JPEG correctly", () => {
    assert.equal(detectMagicBytes(jpegHeader), "image/jpeg");
  });
  it("detects PNG correctly", () => {
    assert.equal(detectMagicBytes(pngHeader), "image/png");
  });
  it("detects WebP correctly", () => {
    assert.equal(detectMagicBytes(webpHeader), "image/webp");
  });
  it("returns null for unknown types", () => {
    assert.equal(detectMagicBytes(Buffer.from([0x00, 0x01, 0x02])), null);
  });
});
```

### 11.5 E2E Smoke Tests (Playwright)

```typescript
// e2e/profile.spec.ts

test("user can sign up and see their profile", async ({ page }) => {
  await page.goto("/auth/signup");
  await page.fill("[name=email]", `test-${Date.now()}@example.com`);
  // ... complete signup flow
  await page.goto("/profile");
  await expect(page.locator("[data-testid=profile-shell]")).toBeVisible();
  await expect(page.locator("[data-testid=profile-completion-ring]")).toBeVisible();
});

test("user can upload avatar", async ({ page }) => {
  await page.goto("/profile?tab=info");
  const fileInput = page.locator("[data-testid=avatar-upload]");
  await fileInput.setInputFiles("test-fixtures/valid-avatar.jpg");
  await expect(page.locator("[data-testid=avatar-preview]")).toBeVisible();
  await expect(page.locator("[data-testid=toast-success]")).toBeVisible();
});

test("public profile renders correctly", async ({ page }) => {
  await page.goto("/scholar/john-doe");
  await expect(page.locator("[data-testid=public-profile-header]")).toBeVisible();
  // Verify SEO metadata
  const title = await page.title();
  expect(title).toContain("ScholarX");
});
```

### 11.6 Test Execution

```bash
# Unit tests
node --import tsx --test src/actions/__tests__/*.test.ts
node --import tsx --test src/lib/__tests__/*.test.ts

# Integration tests (requires running dev server)
node --import tsx --test src/app/api/profile/avatar/__tests__/*.test.ts

# E2E tests (requires Playwright)
pnpm exec playwright test e2e/profile.spec.ts
```

---

## 12. File Manifest

### 12.1 New Files

```
src/
├── actions/
│   ├── profile.actions.ts                         [NEW] Server actions
│   └── __tests__/
│       └── profile-actions.test.ts                [NEW] Unit tests
│
├── app/(platform)/
│   └── profile/
│       ├── layout.tsx                              [NEW] Profile shell layout
│       └── page.tsx                                [NEW] Own profile page
│
├── app/scholar/
│   └── [username]/
│       └── page.tsx                                [NEW] Public profile (ISR)
│
├── app/api/
│   ├── profile/
│   │   └── avatar/
│   │       ├── route.ts                            [NEW] Avatar upload with Sharp
│   │       └── __tests__/
│   │           └── route.test.ts                   [NEW] Integration tests
│   └── admin/
│       └── config/
│           └── [key]/
│               └── route.ts                        [NEW] Admin config toggle API
│
├── components/
│   ├── profile/
│   │   ├── profile-popup.tsx                       [NEW] Header dropdown
│   │   ├── profile-shell.tsx                       [NEW] Tab layout
│   │   ├── profile-avatar-upload.tsx               [NEW] Upload UI
│   │   ├── profile-completion-ring.tsx             [NEW] Progress ring
│   │   ├── profile-info-form.tsx                   [NEW] Edit form
│   │   ├── profile-info-display.tsx                [NEW] Read-only view
│   │   ├── social-icon-link.tsx                    [NEW] Brand icon
│   │   ├── my-courses-list.tsx                     [NEW] Courses tab
│   │   ├── certificate-gallery.tsx                 [NEW] Certificates tab
│   │   ├── saved-opportunities-list.tsx            [NEW] Saved opps tab
│   │   ├── account-settings-form.tsx               [NEW] Settings tab
│   │   ├── public-profile-header.tsx               [NEW] Public hero
│   │   ├── onboarding-nudge.tsx                    [NEW] Signup prompt
│   │   └── report-profile-dialog.tsx               [NEW] Report abuse
│   │
│   ├── ui/
│   │   └── author-form-card.tsx                    [NEW] Reusable form card
│   │
│   └── admin/
│       └── authors/
│           ├── author-form-dialog.tsx              [NEW] Admin author dialog
│           ├── author-list-page.tsx                [NEW] Admin author table
│           └── author-row-actions.tsx              [NEW] Admin row actions
│
├── lib/
│   ├── upload.ts                                   [NEW] R2 client + Sharp pipeline
│   ├── app-config.ts                               [NEW] Feature flag store
│   ├── rate-limiter.ts                             [NEW] Upstash Redis rate limiter
│   └── __tests__/
│       └── upload.test.ts                          [NEW] Sharp + magic byte tests
│
├── types/
│   └── profile.types.ts                            [NEW] Types
│
├── db/
│   └── schema/
│       └── app-config-schema.ts                    [NEW] app_config table
│
└── scripts/
    ├── backfill-usernames.ts                       [NEW] Safe backfill
    └── migrations/
        ├── 001_add_profile_columns.sql             [NEW] Step 1
        ├── 001_rollback.sql                         [NEW] Rollback
        ├── 002_set_username_not_null.sql            [NEW] Step 2
        └── 002_rollback.sql                         [NEW] Rollback
```

### 12.2 Modified Files

```
src/
├── db/
│   └── schema/
│       └── auth-schema.ts                          [MODIFY] +7 columns
│
├── lib/
│   └── auth.ts                                     [MODIFY] +7 additionalFields + afterSignUp hook
│
├── components/
│   └── Header.tsx                                  [MODIFY] ProfilePopup integration
│
├── providers/
│   └── app-providers.tsx                           [VERIFY] Toaster already at bottom-right
│
├── config/
│   └── env.ts                                      [MODIFY] +R2, Upstash, kill switch env vars + Zod validation
│
├── middleware.ts                                    [MODIFY] +public profile rate limiting
│
└── next.config.ts                                  [MODIFY] +R2 remote patterns
```

### 12.3 Infrastructure Files

```
.env.example                                         [MODIFY] +R2, Upstash, Azure env vars
scripts/backfill-usernames.ts                        [NEW] Safe backfill
e2e/profile.spec.ts                                 [NEW] Playwright E2E tests
```

---

## 13. Dependencies

### 13.1 Install

```bash
pnpm add @aws-sdk/client-s3 @upstash/redis @upstash/ratelimit sharp uuid
pnpm add -D @types/sharp @types/uuid
```

### 13.2 Already Installed (no action needed)

| Package | Version | Used By |
|---|---|---|
| `framer-motion` | ^12.35.2 | Popup, tabs, animations |
| `lucide-react` | ^0.575.0 | Icons |
| `sonner` | ^2.0.7 | Toasts |
| `@radix-ui/react-avatar` | ^1.1.11 | Avatar component |
| `@radix-ui/react-dialog` | ^1.1.15 | Dialogs |
| `@radix-ui/react-tooltip` | ^1.2.8 | Tooltips |
| `@radix-ui/react-slot` | ^1.2.4 | Button asChild |
| `class-variance-authority` | ^0.7.1 | Button variants |
| `react-hook-form` | ^7.71.2 | Profile edit form |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for RHF |
| `zod` | ^4.3.6 | Validation |
| `nuqs` | ^2.8.9 | Tab URL state |
| `tailwind-merge` | ^3.5.0 | `cn()` utility |
| `clsx` | ^2.1.1 | `cn()` utility |
| `@tanstack/react-query` | ^5.90.21 | Data hydration |

---

## 14. Verification Plan

### 14.1 Automated Checks

```bash
# Type checking
pnpm tsc --noEmit          # Zero TypeScript errors

# Linting
pnpm lint                  # ESLint clean

# Unit tests (run in CI)
node --import tsx --test src/actions/__tests__/*.test.ts
node --import tsx --test src/lib/__tests__/*.test.ts

# Integration tests (run in CI with dev server)
node --import tsx --test src/app/api/profile/avatar/__tests__/*.test.ts

# E2E tests (run in CI with staging deploy)
pnpm exec playwright test e2e/profile.spec.ts

# Production build
pnpm build                 # Production build passes
```

### 14.2 Manual Verification Matrix

| # | Test Case | Expected Result | Phase |
|---|---|---|---|
| 1 | Log in → click User icon | Popup appears with glassmorphism | 2 |
| 2 | Hover User icon | Popup appears after 300ms | 2 |
| 3 | Click outside popup | Popup closes | 2 |
| 4 | Visit `/profile` while logged out | Redirect to sign-in | 3 |
| 5 | Visit `/profile` while logged in | Profile page renders with 5 sidebar tabs | 3 |
| 6 | Switch between tabs | AnimatePresence transitions + URL updates via nuqs | 3 |
| 7 | Edit profile fields → Save | Toast success, data persists on reload | 3 |
| 8 | Edit social links → Save | Brand-colored icons appear in view mode | 3 |
| 9 | Upload valid JPEG avatar (≤1MB) | Preview updates, R2 URL stored in DB | 4 |
| 10 | Upload file >1MB | Rejected with toast "File too large" | 4 |
| 11 | Upload renamed .exe → .jpg | Rejected with toast "Invalid file" (magic bytes) | 4 |
| 12 | Upload 4th avatar in same hour | Rejected with toast "Rate limit exceeded" | 4 |
| 13 | Toggle privacy setting OFF | `/scholar/[username]` returns 404 immediately | 5 |
| 14 | Visit `/scholar/[username]` (public) | SEO metadata, OG tags, JSON-LD present | 5 |
| 15 | Visit `/scholar/[username]` (own) | "Edit Profile" link shown | 5 |
| 16 | Non-existent username | 404 page | 5 |
| 17 | My Courses tab with enrollments | Course cards with progress bars | 6 |
| 18 | My Courses tab without enrollments | Empty state with "Browse Courses" CTA | 6 |
| 19 | Certificates tab | Earned certificates grid | 6 |
| 20 | Saved tab | Bookmarked opportunities with unsave button | 6 |
| 21 | Change password | Success toast, can sign in with new password | 6 |
| 22 | Delete account | Account removed, R2 avatar cleaned up | 7 |
| 23 | Kill switch enabled (DB toggle) | Upload UI hidden, API returns 503 | 7 |
| 24 | Storage check cron | Weekly report, alert at 80%+ | 7 |
| 25 | Mobile viewport (375px) | Tabs become bottom sheet, no horizontal scroll | 3–6 |
| 26 | Reduced motion preference | All animations disabled, instant transitions | 3–6 |
| 27 | Missing env var at startup | App crashes with clear error message | 1 |
| 28 | R2 bucket unreachable | Upload returns 500 with logged error | 4 |
| 29 | Sharp re-encode of corrupt image | Returns 422, toast "Image processing failed" | 4 |
| 30 | Username collision at signup | Auto-fallback with UUID suffix, user can rename later | 1 |

---

## Appendix A: Rate Limiter Implementation

```typescript
// src/lib/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Avatar upload: 3 per hour, 5 per day, 7 per week, 10 per month per user
const hourlyLimiter = new Ratelimit({
  redis, prefix: "ratelimit:avatar:hourly", analytics: true,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
});
const dailyLimiter = new Ratelimit({
  redis, prefix: "ratelimit:avatar:daily", analytics: true,
  limiter: Ratelimit.slidingWindow(5, "1 d"),
});
const weeklyLimiter = new Ratelimit({
  redis, prefix: "ratelimit:avatar:weekly", analytics: true,
  limiter: Ratelimit.slidingWindow(7, "1 w"),
});
const monthlyLimiter = new Ratelimit({
  redis, prefix: "ratelimit:avatar:monthly", analytics: true,
  limiter: Ratelimit.slidingWindow(10, "1 M"),
});

export async function checkAvatarUploadLimit(identifier: string) {
  const [hourly, daily, weekly, monthly] = await Promise.all([
    hourlyLimiter.limit(identifier),
    dailyLimiter.limit(identifier),
    weeklyLimiter.limit(identifier),
    monthlyLimiter.limit(identifier),
  ]);
  const remaining = Math.min(hourly.remaining, daily.remaining, weekly.remaining, monthly.remaining);
  const reset = Math.max(hourly.reset, daily.reset, weekly.reset, monthly.reset);
  return { denied: hourly.denied || daily.denied || weekly.denied || monthly.denied, remaining, reset };
}

// Public profile lookups: 60 per minute per IP
export const publicProfileLimiter = new Ratelimit({
  redis,
  prefix: "ratelimit:profile",
  analytics: true,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
});
```

## Appendix B: Kill Switch — DB + Azure Env Override

```typescript
// src/lib/app-config.ts
// Replaces the deprecated GitHub Gist approach.
// Two layers: DB persistence + Azure App Settings override.

import { db } from "@/db";
import { appConfig } from "@/db/schema/app-config-schema";
import { eq } from "drizzle-orm";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: string; timestamp: number }>();

export function clearConfigCache(): void {
  cache.clear();
}

export async function getConfig(key: string): Promise<string | null> {
  // 1. Azure App Settings override (highest priority, no restart needed for env reads)
  const envKey = key.toUpperCase();
  const envOverride = process.env[envKey];
  if (envOverride !== undefined) return envOverride;

  // 2. In-memory cache (safe: Azure App Service = persistent process)
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.value;
  }

  // 3. DB read
  try {
    const row = await db
      .select({ value: appConfig.value })
      .from(appConfig)
      .where(eq(appConfig.key, key))
      .limit(1);

    if (row.length > 0) {
      cache.set(key, { value: row[0].value, timestamp: Date.now() });
      return row[0].value;
    }
  } catch (error) {
    console.error(`[app-config] DB error for key="${key}":`, error);
  }

  return null;
}

export async function isAvatarUploadEnabled(): Promise<boolean> {
  const value = await getConfig("avatar_upload_enabled");
  return value !== "false"; // defaults to true
}

export async function setConfig(key: string, value: string, updatedBy?: string): Promise<void> {
  await db
    .insert(appConfig)
    .values({ key, value, updatedBy: updatedBy ?? "system" })
    .onConflictDoUpdate({
      target: appConfig.key,
      set: { value, updatedBy: updatedBy ?? "system", updatedAt: new Date() },
    });

  // Invalidate cache
  cache.delete(key);
}
```

## Appendix C: Sharp Re-Encoding Pipeline

```typescript
// src/lib/upload.ts — File validation + Sharp re-encode + R2 upload

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const AVATAR_MAX_DIMENSION = 512;

// Magic byte signatures — each entry is an array of { bytes, offset } segments
type MagicSignature = { bytes: number[]; offset: number }[];

const MAGIC_BYTES: Record<string, MagicSignature> = {
  "image/jpeg": [{ bytes: [0xFF, 0xD8, 0xFF], offset: 0 }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4E, 0x47], offset: 0 }],
  "image/webp": [
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },  // "RIFF" prefix
    { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },  // "WEBP" chunk header
  ],
};

function detectMagicBytes(buffer: Buffer): string | null {
  for (const [mime, segments] of Object.entries(MAGIC_BYTES)) {
    const matches = segments.every(({ bytes, offset }) =>
      buffer.length >= offset + bytes.length &&
      bytes.every((b, i) => buffer[offset + i] === b)
    );
    if (matches) return mime;
  }
  return null;
}

async function processAvatar(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .resize(AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export async function uploadAvatar(
  userId: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  // 1. Validate file size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new AppError("FILE_TOO_LARGE", 413, `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  // 2. Validate MIME type
  if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
    throw new AppError("INVALID_FILE_TYPE", 415, `Accepted types: ${ACCEPTED_MIME_TYPES.join(", ")}`);
  }

  // 3. Validate magic bytes (REAL check, not just headers)
  const detectedMime = detectMagicBytes(fileBuffer);
  if (detectedMime !== mimeType) {
    throw new AppError("INVALID_MAGIC_BYTES", 415, "File content does not match declared type");
  }

  // 4. Re-encode via Sharp (strips all EXIF, metadata, hidden payloads)
  let processedBuffer: Buffer;
  try {
    processedBuffer = await processAvatar(fileBuffer);
  } catch (error) {
    throw new AppError("SHARP_REENCODE_FAILED", 422, "Image processing failed — file may be corrupt");
  }

  // 5. Upload to R2
  const key = `avatars/${userId}/${crypto.randomUUID()}.jpg`;
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: processedBuffer,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=86400",
  });

  try {
    await r2Client.send(command);
  } catch (error) {
    throw new AppError("UPLOAD_FAILED", 500, "Failed to upload to storage");
  }

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
```

## Appendix D: Username Generation — No Throw Guarantee

```typescript
// src/lib/auth.ts — afterSignUp hook
import { slugify } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

async function generateUniqueUsername(
  firstName: string,
  lastName: string
): Promise<string> {
  const base = slugify(`${firstName}.${lastName}`)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24); // Leave room for suffix

  // Attempt unique username via atomic DB operation
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt === 0
      ? base
      : `${base}-${uuidv4().slice(0, 6)}`;

    const result = await db
      .update(user)
      .set({ username: candidate })
      .where(sql`${user.id} = ${userId} AND ${user.username} IS NULL`);

    if (result.rowCount !== null && result.rowCount > 0) {
      return candidate;
    }
  }

  // GUARANTEED FALLBACK: never throw, never block signup.
  // Last resort: UUID-based username that is guaranteed unique.
  const fallback = `user-${uuidv4().slice(0, 12)}`;
  await db
    .update(user)
    .set({ username: fallback })
    .where(eq(user.id, userId));

  return fallback;
}
```

---

## Appendix E: On-Demand ISR Revalidation

When a user updates their profile or toggles privacy, the public profile page must be invalidated **immediately** (no 60-second window):

```typescript
// Inside updateProfile server action
export async function updateProfile(data: UpdateProfileInput) {
  // ... validation, DB update ...

  // Sync better-auth name field
  if (data.firstName || data.lastName) {
    const current = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: { firstName: true, lastName: true, username: true },
    });
    if (current) {
      const fullName = `${data.firstName ?? current.firstName} ${data.lastName ?? current.lastName}`.trim();
      await db.update(user).set({ name: fullName }).where(eq(user.id, session.user.id));

      // IMMEDIATE public profile cache invalidation
      revalidatePath(`/scholar/${current.username}`);
    }
  }

  revalidatePath("/profile");
  return { success: true };
}
```

---

## Appendix F: Azure Deployment Considerations

| Concern | Solution |
|---|---|
| **ISR on Azure App Service** | Next.js ISR works on App Service via filesystem. On-demand `revalidatePath` works out of the box. |
| **Azure Cron / Scheduled Jobs** | Use Azure WebJobs or Logic Apps to call `/api/admin/storage-check` weekly. Or use a simple App Service Timer Function. |
| **Env vars / App Settings** | Configure in Azure Portal → App Service → Settings → Environment variables. Changes trigger auto-restart. |
| **Multi-instance rate limiting** | Upstash Redis provides shared state across instances. In-memory cache is per-instance but acceptable for config (60s TTL). |
| **R2 network access** | Ensure Azure App Service outbound IPs are allowed in Cloudflare R2 bucket CORS policy. |
| **File size for Sharp** | Sharp requires sufficient memory. Azure App Service B1 plan (1.75GB RAM) is sufficient for 1MB images. Monitor if scaling. |
| **Cold start** | Not applicable — App Service keeps process warm. `globalThis` cache persists indefinitely. |

---

*End of Plan (v2)*
