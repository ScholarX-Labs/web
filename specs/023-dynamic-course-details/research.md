# Phase 0: Research & Technical Decisions - Dynamic Course Details

## Context & Objectives
The goal of this feature is to resolve the mismatch between the Course Quick-View PopUp Window (`CourseDetailSheet`) and the Course Detail Page (`/courses/[slug]`), and to replace legacy coding-bootcamp / web development copy with dynamic, high-converting **Scholarship Preparation & Admissions Mentoring** content.

---

## Unknown 1: Data Storage Strategy for Course Learning Outcomes & Target Audience

### Context
`dbCourses` in `src/db/schema/courses-db.schema.ts` lacks attributes for course learning outcomes and target audience. Currently, outcomes are hardcoded arrays in UI components (`course-detail-sheet.tsx` has 4 items; `course-curriculum.tsx` has 6 items).

### Decision
Store `learningOutcomes` as `jsonb("learning_outcomes").$type<string[] | null>()` and `targetAudience` as `jsonb("target_audience").$type<string[] | null>()` on the `dbCourses` table.

### Rationale
1. **Schema Simplicity & Performance**: Courses typically have 3–8 outcomes. Creating a separate table (e.g. `course_learning_outcomes` with foreign keys and join tables) creates unnecessary joins for a 1:1 aggregate entity that is always fetched together with the course.
2. **Precedent in Codebase**: `dbCourses.tags` already uses `jsonb("tags").$type<string[] | null>()`. Matching this pattern maintains idiomatic consistency with Drizzle ORM in ScholarX.
3. **Additive & Non-Destructive**: Adding nullable JSONB columns requires zero migration downtime and doesn't break existing rows.

### Alternatives Considered
- *Separate normalized table (`course_learning_outcomes`)*: Over-engineered for a simple list of strings, requires foreign keys, cascade deletes, and multi-table queries for every course card/popup.
- *Delimited text string (`text` with newline or pipe separation)*: Brittle parsing, prone to escaping errors.

---

## Unknown 2: Fallback & Domain Defaults for Scholarship Preparation

### Context
Existing courses in the database may not immediately have custom `learningOutcomes` populated. If empty, the system must not show blank space or legacy coding bootcamp copy ("deploying your applications").

### Decision
Implement a central domain helper `resolveCourseLearningOutcomes(course: Course, t?: TranslationFn): string[]`.
If `course.learningOutcomes` exists and is non-empty, return it.
Otherwise, return scholarship-specific localized fallbacks:
```typescript
export const DEFAULT_SCHOLARSHIP_OUTCOMES = [
  "Master competitive scholarship and fellowship application strategies",
  "Craft compelling personal statements, research proposals, and academic CVs",
  "Navigate university admissions criteria, supervisor outreach, and funding deadlines",
  "Prepare for academic and committee interviews with proven evaluation frameworks",
  "Tailor recommendation letters and portfolio evidence to specific donor rubrics",
];
```

### Rationale
Centralizing this logic in a shared domain utility prevents divergence between the popup sheet, full page, and future mobile/card views.

### Alternatives Considered
- *Duplicating default arrays in UI components*: Exactly how the current bug occurred. Rejected.
- *Database migration inserting default text into all rows*: Causes unnecessary DB churn and locks courses into English even when rendered for Arabic users. A code-level fallback respects i18n while allowing custom DB overrides.

---

## Unknown 3: Instructor Mentorship Credibility & Bio

### Context
`CourseInstructor` component hardcodes:
- Bio: *"Passionate educator with over 15 years of industry experience... transition into tech careers... building portfolios that get you hired."*
- Metrics: `4.8 Instructor Rating`, `45,213 Students`, `12 Courses`.

### Decision
1. Enhance the `Course` / `Instructor` domain contract to support optional `bio`, `headline`, and `metrics` (or credentials).
2. Update the default fallback bio in `CourseInstructor` to reflect **Scholarship Alumni & Academic Mentorship**:
   > *"Distinguished academic advisor and scholarship mentor. Dedicated to helping ambitious applicants secure fully funded graduate and undergraduate opportunities globally through personalized application strategy, rigorous proposal review, and interview coaching."*
3. Connect the instructor card to dynamic instructor fields if populated on the course entity.

### Rationale
Establishes trust with scholarship applicants immediately without requiring a full admin instructor bio overhaul.

---

## Unknown 4: Modal vs Page Sync & State Architecture

### Context
`CourseCard` opens `CourseDetailSheet` passing the `course` summary object from the catalog grid. When clicking "View Details" or navigating to `/courses/[slug]`, the page fetches from `catalog.getBySlug(slug)`.
If `learningOutcomes` is not returned in the catalog query, the popup wouldn't have them.

### Decision
Ensure that `FlatCourseRecord`, `toCourse` in `NextCourseCatalogService`, and both `list` and `getBySlug` methods include `learningOutcomes` in the projected DTO.
This guarantees the data in `useCourseSheetStore` (which holds `course`) is 100% identical in structure to what `CourseDetailPage` receives from the server domain.

### Rationale
Avoids secondary network calls when opening the popup sheet, preserving the fast, fluid 60fps FLIP animation experience.
