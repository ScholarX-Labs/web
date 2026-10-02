# Phase 1: Data Model - Dynamic Course Details

## Entity Definitions

### 1. Course (Schema & Domain DTO)

#### Database Schema: `coursesSchema.courses` (`src/db/schema/courses-db.schema.ts`)
Additive modification to `dbCourses`:

```typescript
export const dbCourses = coursesSchema.table("courses", {
  id: uuid("id").primaryKey(),
  // ... existing fields ...
  tags: jsonb("tags").$type<string[] | null>(),
  
  // NEW ADDITIONS:
  learningOutcomes: jsonb("learning_outcomes").$type<string[] | null>(),
  targetAudience: jsonb("target_audience").$type<string[] | null>(),
  instructorBio: text("instructor_bio"),
  // ... rest of fields ...
});
```

#### TypeScript Domain Interface: `src/types/course.types.ts`
```typescript
export interface Instructor {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  bio?: string;
  rating?: number;
  studentsCount?: number;
  coursesCount?: number;
}

export interface Course {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;

  // Pricing
  price?: number;
  currentPrice?: number;
  originalPrice?: number;

  // Metadata
  category?: string;
  instructor?: Instructor;
  rating?: number;
  totalRatings?: number;
  videosCount?: number;
  lessonsCount?: number;
  studentsCount?: number;

  // Outcomes & Curriculum Details (Dynamic)
  learningOutcomes?: string[];
  targetAudience?: string[];

  // Access & Engagement
  videoPreviewUrl?: string;
  isBestseller?: boolean;
  urgencyText?: string;
  tags?: string[];
  requiresForm: boolean;
  autoApproveApplications?: boolean;
  salesInquiry?: boolean;
  isPublished: boolean;
  level?: "Beginner" | "Intermediate" | "Advanced";
  duration?: string;

  createdAt: string;
  updatedAt: string;
  isSubscribed?: boolean;
  lessons?: Lesson[];
}
```

### 2. Validation & Application Schemas

In `src/domain/admin/application/admin-courses.service.ts` and `src/actions/course.actions.ts`:
- `learningOutcomes`: Array of strings, optional, max 10 items, each item trimmed and max 255 characters.
- `targetAudience`: Array of strings, optional, max 10 items, each item trimmed and max 255 characters.
- `instructorBio`: Optional text, max 1000 characters.

---

## State & Flow Transitions

```
[ Admin Edits Course ]
         │
         ▼
[ Admin Input: Learning Outcomes (Tag/List Input) ]
         │
         ▼
[ Save Course (API / Action) ] ──▶ [ Validate JSONB Array ]
         │
         ▼
[ Persist to coursesSchema.courses.learning_outcomes ]
         │
         ▼
[ Revalidate Course Caches: course-cache.ts ]
         │
         ├──────────────────────────────────────────┐
         ▼                                          ▼
[ Catalog Grid / PopUp ]                    [ Full Detail Page ]
CourseCard -> openCourseSheet()             courses/[slug]/page.tsx
       │                                            │
       ▼                                            ▼
resolveCourseLearningOutcomes()             resolveCourseLearningOutcomes()
       │                                            │
       └───────────────────┬────────────────────────┘
                           ▼
          [ 100% Identical Rendered List ]
```
