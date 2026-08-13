# Research: Lesson Tasks

## Database Migration Strategy
**Decision**: Add `lesson_tasks` and `task_submissions` tables to `courses-db.schema.ts` and alter the `activity_type` enum in `point_events`.
**Rationale**: Adheres to the NFR-001 (additive, reversible migrations).
**Alternatives considered**: Modifying existing tables or adding JSON columns, which would violate schema normalization and the idempotency requirements for the leaderboard.

## Grading Workflows
**Decision**: MCQs are auto-graded, and Written/SWOT tasks are automatically awarded participation points. External links are honor-system confirmed.
**Rationale**: Clarified with the user in interview sessions; manual instructor grading is out of scope.

## Gamification Integration
**Decision**: Points will be directly inserted into `point_events`.
**Rationale**: The `point_events` ledger is the single source of truth for the course leaderboard, so direct integration is necessary to update gamification elements accurately.
