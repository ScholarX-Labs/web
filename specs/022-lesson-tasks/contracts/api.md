# API Contracts

- **GET `/api/courses/[slug]/lessons/[lessonId]/tasks`**: Returns published tasks & user submission status.
- **POST `/api/courses/[slug]/lessons/[lessonId]/tasks/[taskId]/submissions`**: Learner answer submission.
- **POST `/api/courses/[slug]/lessons/[lessonId]/tasks/[taskId]/skip`**: Learner skipping an optional task.
- **Admin API**: CRUD operations under `/api/admin/courses/[courseId]/lessons/[lessonId]/tasks`.
