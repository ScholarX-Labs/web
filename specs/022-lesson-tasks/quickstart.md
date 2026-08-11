# Quickstart: Lesson Tasks

## Introduction
The Lesson Tasks feature gives learners a structured, points-backed knowledge check after each lesson and gives creators a first-class authoring surface. It supports MCQs, Written Questions, SWOT Analysis, and External Links.

## Key Components
- **LessonTask**: The core task entity in `lesson_tasks` table.
- **TaskSubmission**: The learner's submission in `task_submissions` table.
- **TaskTypeStrategy**: The polymorphic contract to handle grading, validating, and reading specific task types (e.g., MCQ vs. Written).

## Development Guide
1. Ensure the DB migrations are properly applied to Vercel Postgres using Drizzle.
2. The core logic relies on Command Query Responsibility Segregation (CQRS) within `src/domain/courses/lesson-tasks`.
3. Points awarded automatically update the Course Leaderboard via `point_events` (`src/domain/leaderboard`).
