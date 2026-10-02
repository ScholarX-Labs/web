# Implementation Plan: Dynamic Course Details & Scholarship Alignment

**Branch**: `023-dynamic-course-details` | **Date**: 2026-10-02 | **Spec**: [specs/023-dynamic-course-details/spec.md](file:///Users/mac/Documents/ScholarX/web/specs/023-dynamic-course-details/spec.md)

## Summary

Resolve the mismatch and stale copy between the Course Quick-View PopUp Window (`CourseDetailSheet`) and the Course Detail Page (`/courses/[slug]`) by transitioning from hardcoded coding-bootcamp copy to dynamic, scholarship-preparation outcomes. The implementation adds dynamic `learningOutcomes` to the course domain and database schema, unifies outcome resolution via a single domain helper with scholarship fallbacks, updates the admin course editor to allow custom outcome management, and aligns instructor presentation with academic mentorship credibility.

## Technical Context

| Field | Value |
|---|---|
| **Language/Version** | TypeScript 5.x / Next.js 15 (App Router) |
| **Primary Dependencies** | React 19, Tailwind CSS, shadcn/ui, Drizzle ORM, Framer Motion, next-intl |
| **Storage** | PostgreSQL (Supabase) via Drizzle ORM `coursesSchema` |
| **Testing** | Vitest for unit & domain tests, React Testing Library / manual verification |
| **Target Platform** | Web (Vercel Node runtime) |
| **Performance Goals** | Sub-millisecond outcome resolution in memory; 0 layout shift or flicker during FLIP modal open |
| **Constraints** | Non-destructive schema addition (additive nullable columns). Preserve existing course slugs and enrollments. |
| **Scale/Scope** | Affects course catalog modal, course detail page, admin course editor, course domain repository. |

## Constitution Check

| Principle | Status | Justification |
|---|---|---|
| **I — Proper Architecture & SOLID** | ✅ PASS | Single Source of Truth for outcome resolution (`resolveCourseLearningOutcomes`). Domain layer maps schema to immutable DTOs without leaking presentation logic into DB entities. |
| **II — Uncompromising Code Quality & Type Safety** | ✅ PASS | Strictly typed `learningOutcomes?: string[]` on `Course`, `FlatCourseRecord`, and Admin DTOs. Zero `any`. |
| **III — Rigorous Testing Standards** | ✅ PASS | Unit tests for domain outcome resolver and catalog repository mapping. |
| **IV — Premium User Experience Consistency** | ✅ PASS | Eliminates jarring discrepancy between popup and page. Preserves 60fps FLIP animation and responsive layouts. |
| **V — Performance, Scalability & Maintainability** | ✅ PASS | JSONB column on existing table avoids extra joins. In-memory fallback avoids database churn. |

## Project Structure

### Documentation (this feature)

```text
specs/023-dynamic-course-details/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── course-outcomes.contract.md
└── checklists/
    └── requirements.md
```

### Source Code Touched

```text
src/
├── db/schema/
│   └── courses-db.schema.ts           # Add learning_outcomes & target_audience columns
├── types/
│   └── course.types.ts                # Add learningOutcomes & targetAudience to Course
├── domain/courses/
│   ├── infrastructure/db/
│   │   └── next-courses.repository.ts # Map learningOutcomes from DB
│   └── application/
│       ├── next-course-catalog.service.ts # Map learningOutcomes in toCourse
│       └── course-outcomes.helper.ts      # Single source of truth for outcome resolution
├── domain/admin/
│   └── application/
│       └── admin-courses.service.ts   # Support learningOutcomes in updates
├── components/courses/
│   └── course-detail-sheet.tsx        # Consume resolveCourseLearningOutcomes()
├── app/(platform)/courses/[slug]/_components/
│   ├── course-curriculum.tsx          # Consume resolveCourseLearningOutcomes()
│   └── course-instructor.tsx          # Scholarship mentor copy & bio alignment
└── app/admin/courses/[courseId]/
    └── page.tsx                       # Admin UI to edit learning outcomes
```

## Implementation Phases

### Phase 1: Domain & Schema Foundation
1. Add `learningOutcomes` and `targetAudience` JSONB columns to `dbCourses` in `courses-db.schema.ts`.
2. Update TypeScript `Course` and `Instructor` interfaces in `src/types/course.types.ts`.
3. Update `NextCoursesRepository` and `NextCourseCatalogService` to project and map `learningOutcomes`.
4. Create `src/lib/course-outcomes.ts` (or `domain/courses/application/course-outcomes.helper.ts`) implementing `resolveCourseLearningOutcomes(course)` with scholarship-focused defaults.

### Phase 2: Public Presentation Alignment (Popup & Page)
1. Update `CourseDetailSheet` to use `resolveCourseLearningOutcomes(course)`. Remove hardcoded `learningOutcomes` array.
2. Update `CourseCurriculum` to use `resolveCourseLearningOutcomes(course)`. Remove hardcoded `Master the fundamentals...` array.
3. Update `CourseInstructor` to replace hardcoded tech bootcamp copy with scholarship and academic mentorship copy, allowing dynamic bio if provided.

### Phase 3: Admin Course Management
1. Update admin course update handler and types to accept `learningOutcomes`.
2. Add a tag/list editor in `src/app/admin/courses/[courseId]/page.tsx` allowing course administrators to add, edit, and reorder outcomes.

### Phase 4: Validation & Quality Checks
1. Run lint, type-check, and automated test suite.
2. Verify visual parity between popup sheet and full page in desktop and mobile viewport.
