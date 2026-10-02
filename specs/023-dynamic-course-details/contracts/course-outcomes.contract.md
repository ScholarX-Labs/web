# Contract: Course Outcomes Domain Helper & API Contracts

## 1. Domain Helper Contract: `resolveCourseLearningOutcomes`

**Location**: `src/lib/course-outcomes.ts` or `src/domain/courses/application/course-outcomes.helper.ts`

### Interface:
```typescript
import { Course } from "@/types/course.types";

export interface ResolveOutcomesOptions {
  limit?: number;
  locale?: string;
}

/**
 * Resolves course learning outcomes dynamically.
 * If course.learningOutcomes is defined and non-empty, returns it.
 * Otherwise, returns domain-aligned scholarship preparation defaults.
 */
export function resolveCourseLearningOutcomes(
  course: Pick<Course, "learningOutcomes">,
  options?: ResolveOutcomesOptions,
): string[];
```

---

## 2. Admin Course Update DTO Contract

**Location**: `src/domain/admin/contracts/admin-course.contract.ts` (and zod schema)

### Request Payload (`UpdateCourseDto`):
```typescript
export interface UpdateCourseDto {
  title?: string;
  description?: string;
  category?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  currentPrice?: number;
  originalPrice?: number;
  status?: string;
  requiresForm?: boolean;
  autoApproveApplications?: boolean;
  learningOutcomes?: string[];
  targetAudience?: string[];
  instructorBio?: string;
}
```

---

## 3. UI Component Contract

Both the popup (`CourseDetailSheet`) and the full course page (`CourseCurriculum`) must consume:
```typescript
const outcomes = resolveCourseLearningOutcomes(course);
```
Ensuring zero mismatch between the preview modal and the full page view.
