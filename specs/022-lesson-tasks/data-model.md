# Data Model: Lesson Tasks

## Entities
1. **LessonTask**
   - `id` (UUID, PK)
   - `lessonId` (UUID, FK to `lessons`)
   - `type` (varchar: 'mcq', 'written', 'swot', 'link')
   - `title` (varchar)
   - `instructions` (text)
   - `pointsAwarded` (integer)
   - `isOptional` (boolean)
   - `sortIndex` (integer)
   - `status` (varchar: 'draft', 'published', 'archived')
   - `config` (JSONB) - Type-specific configuration
   - `version` (integer) - For optimistic locking
2. **TaskSubmission**
   - `id` (UUID, PK)
   - `clientEventId` (UUID) - Idempotency key
   - `userId` (text, FK to users)
   - `taskId` (UUID, FK to lesson_tasks)
   - `courseId` (UUID, FK to courses)
   - `answer` (JSONB)
   - `status` (varchar: 'pending', 'correct', 'incorrect', 'skipped')
   - `pointsEarned` (integer)
   - `taskSnapshot` (JSONB)

## Relationships
- `LessonTask` belongs to `Lesson` (one-to-many).
- `TaskSubmission` belongs to `LessonTask`, `User`, and `Course`.
- `TaskSubmission` results in a new `PointEvent` when status changes to `correct` or participation points are awarded.
