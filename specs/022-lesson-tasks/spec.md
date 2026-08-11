# Feature Specification: Lesson Tasks

**Feature Branch**: `022-lesson-tasks`  
**Created**: 2026-08-11  
**Status**: Draft  
**Input**: User description: "Adding a Task Or more After each Lesson in the Course and that might be Optional, The Task Could be MCQs, Written Question, a SWOT Analysis or a Link whether to a Google DOC, forms etc And for each Task a Number of Points If Solved Correctly and That Could be Solved One time So Take Care If You Have to Change DB Schema Tell me that You Changed it as Current CI/CDs aren't working as we moved to Vercel not Azure and That's why we Should take care If we Should Migrate the DB Make Sure to Mention where we can best Add the UI Of that and The UI"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Take a Lesson Task (Priority: P1)

As a learner, I want to see and complete tasks after finishing a lesson, so that I can test my knowledge and earn points.

**Why this priority**: Completing tasks is the core engagement mechanism for this feature, providing immediate value to the learner.

**Independent Test**: Can be fully tested by taking a course lesson, reaching the end, and submitting a task successfully to earn points.

**Acceptance Scenarios**:

1. **Given** a learner has completed a lesson with an associated task, **When** they view the lesson end screen, **Then** they see the task UI (MCQ, Written Question, SWOT, or External Link) presented.
2. **Given** a learner is viewing a task, **When** they submit a correct answer, **Then** they are awarded the defined number of points and cannot submit it again.
3. **Given** a learner is viewing an optional task, **When** they choose to skip it, **Then** they can proceed to the next lesson without penalty.

---

### User Story 2 - Add a Task to a Lesson (Priority: P1)

As a course creator/admin, I want to add one or more tasks to a lesson, specifying the task type, point value, and optionality.

**Why this priority**: Course creators need to be able to create tasks for learners to interact with, enabling the primary feature.

**Independent Test**: Can be fully tested by opening the course builder UI, adding a new task to a lesson, saving, and seeing it appear in the curriculum.

**Acceptance Scenarios**:

1. **Given** an admin is editing a lesson in the course builder, **When** they add a new task, **Then** they can select the type (MCQ, Written, SWOT, Link), set the points, and mark it as optional or mandatory.
2. **Given** an admin has added tasks to a lesson, **When** they save the lesson, **Then** the tasks are persisted and become visible in the learner view.

### Edge Cases

- What happens when a learner submits an incorrect answer?
- How does system handle a broken external link task?
- What happens when an admin changes the point value of a task after learners have already solved it?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support associating multiple tasks with a single lesson.
- **FR-002**: System MUST support the following task types: Multiple Choice Question (MCQ), Written Question, SWOT Analysis, and External Link.
- **FR-003**: System MUST allow tasks to be configured as optional or mandatory.
- **FR-004**: System MUST allow course creators to assign a point value to each task.
- **FR-005**: System MUST enforce that each task can only be solved once per user.
- **FR-006**: System MUST award points to the user if the task is solved correctly.
- **FR-007**: System MUST display the learner task UI immediately following the lesson content.
- **FR-008**: System MUST integrate the task creation UI into the existing course admin dashboard / lesson builder.

### Non-Functional Requirements & Constraints
- **NFR-001**: Due to CI/CD constraints (migration to Vercel), any database schema changes required for this feature MUST be carefully planned and explicitly communicated before deployment.

### Key Entities

- **Lesson Task**: Represents a task associated with a lesson (Type, Points, IsOptional, Data payload for specific type).
- **Task Submission**: Represents a user's one-time attempt/submission for a task (User ID, Task ID, Earned Points).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Learners can successfully view and submit tasks after completing a lesson.
- **SC-002**: Admins can successfully create, edit, and delete tasks within the course builder UI.
- **SC-003**: Points are accurately awarded and recorded for correct first-time submissions.
- **SC-004**: Database migrations, if required, are successfully applied without breaking the deployment pipeline.

## Assumptions

- We will need a schema migration to support `Lesson Task` and `Task Submission` entities.
- For "External Link" tasks, completion is likely based on the honor system (e.g. clicking the link or confirming completion) since we cannot automatically verify submissions on third-party platforms like Google Forms/Docs unless a webhook is involved.
- The UI for the learner will be placed at the bottom of the lesson view or on a subsequent screen immediately following the lesson content.
- The UI for the admin will be placed in the course curriculum builder, likely as an "Add Task" button below the lesson content editor.
