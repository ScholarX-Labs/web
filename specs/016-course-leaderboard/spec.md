# Feature Specification: Course Leaderboard

**Feature Branch**: `016-course-leaderboard`
**Created**: 2026-07-01
**Status**: Approved
**Authors**: Principal Engineering, ScholarX Platform
**Input**: User description: "Imagine You are a Principal Full Stack SWE at Apple and Make a Professional Spec for a Leaderboard Features, So It gonna be for the Top Achiever in the Course and Analyse How can we best Assess that"

---

## Overview

The Course Leaderboard surfaces the top-performing learners in a course, drives healthy academic competition, and gives every enrolled student a transparent view of how their effort translates to ranking. It is a gamification primitive that increases weekly active engagement and raises course completion rates through social accountability.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View Course Leaderboard (Priority: P1)

As an enrolled learner, I want to immediately see a ranked list of top achievers in my course so that I understand where I stand relative to peers and am motivated to improve.

**Why this priority**: The leaderboard's primary value is social proof and motivational benchmarking. Without this core view, the entire feature is non-functional.

**Independent Test**: Can be fully tested with a seeded course dataset of 50+ users. Navigate to the Leaderboard tab of any enrolled course. Verify that ranked entries render, your own rank is highlighted (even if outside top 10), and the page loads in under 500ms.

**Acceptance Scenarios**:

1. **Given** I am an enrolled learner with a non-zero score, **When** I open the Leaderboard tab of my course, **Then** I see a ranked list of the top 10 learners showing their rank position, anonymized display name (or real name if opted in), and total score.
2. **Given** I am ranked 45th in a 200-person course, **When** the leaderboard loads, **Then** the top 10 are shown, followed by a visual separator, and then a "your rank" row showing positions 44–46 for context.
3. **Given** I have opted out of the public leaderboard, **When** any other learner views the leaderboard, **Then** my name appears as "Anonymous Learner" and my avatar is replaced with a placeholder.
4. **Given** two learners have identical total scores, **When** the leaderboard is displayed, **Then** the learner who reached that score first (earliest timestamp) is ranked higher.

---

### User Story 2 — Understand Scoring Methodology (Priority: P2)

As an enrolled learner, I want a clear, always-accessible explanation of how leaderboard scores are calculated so that I can deliberately focus on the right activities.

**Why this priority**: Without scoring transparency, gamification backfires and learners feel rankings are arbitrary. Transparency is non-negotiable for educational equity.

**Independent Test**: Can be tested independently by clicking the "How Scores Work" info panel on the leaderboard page and verifying it renders the correct weight breakdown per activity type without requiring a network request.

**Acceptance Scenarios**:

1. **Given** I am viewing the leaderboard, **When** I click the "How Scores Work" information icon, **Then** a detailed breakdown panel opens showing: Quiz & Exam completion (40%), Academic Participation (30%), and Course Completion milestones (30%).
2. **Given** I click on my own score, **When** a score detail view opens, **Then** I see a per-category breakdown of my own points (e.g. "Quiz Points: 320 / Participation: 185 / Completion: 150").

---

### User Story 3 — Filter Leaderboard by Time Window (Priority: P3)

As an enrolled learner, I want to switch between an All-Time, This Week, and This Month leaderboard view so that I can compete over shorter time horizons even if I joined the course late.

**Why this priority**: Long-running courses create "runaway leader" dynamics. Time-windowed views preserve competitive tension and give late joiners a meaningful on-ramp.

**Independent Test**: Can be tested independently by toggling the time-window selector. Verify that the displayed rankings change and that the date range caption updates to reflect the selected window.

**Acceptance Scenarios**:

1. **Given** I am on the leaderboard page, **When** I switch from "All-Time" to "This Week", **Then** only points earned in the current calendar week (Monday 00:00 UTC to now) are counted and rankings re-render within 300ms (from cache).
2. **Given** I earned zero points this week, **When** I switch to "This Week", **Then** my rank row displays "No activity this week" instead of a rank number.

---

### User Story 4 — Admin View Unfiltered Leaderboard (Priority: P4)

As a course admin or instructor, I want to see the full unfiltered leaderboard—including opted-out students with their real names—so that I can validate scoring integrity and identify disengaged learners for outreach.

**Why this priority**: Admin oversight is a compliance and quality assurance requirement. Opt-outs must not create blind spots for instructors.

**Independent Test**: Can be tested by switching to an admin role and navigating to the leaderboard page. Verify that opted-out learners display real names with a visual "private" badge and that a full export is available.

**Acceptance Scenarios**:

1. **Given** I am a course instructor, **When** I view the leaderboard, **Then** all learners appear with real names regardless of their opt-out setting, and opted-out learners are indicated with a visible privacy badge.
2. **Given** I am a course instructor, **When** I click "Export", **Then** I receive a CSV containing all students' real names, scores, rank, and per-category point breakdown.

---

### Edge Cases

- **Score Recalculation**: When a grader corrects a quiz grade, the affected learner's total score and rank must be recalculated and reflected within the next cache refresh cycle (≤ 5 minutes).
- **Course with Zero Points Possible**: If a course has no graded activities yet, the leaderboard should show an informational "No scores yet" empty state rather than rendering all users at rank 1 with a score of 0.
- **Extremely Large Courses (10,000+ learners)**: The page must not degrade. Only pre-computed cache data is served. The leaderboard must never execute a full-table rank scan on load.
- **Privacy Toggle Mid-Session**: If a learner opts out while another user's leaderboard view is open, the change must be reflected on the next page load or background refresh (not mid-render).
- **Single Enrolled Learner**: A course with one learner shows that learner at rank 1 with a note that the leaderboard updates as more learners join.
- **Deactivated or Banned User**: Their score is preserved historically but their entry is replaced with "Former Learner" in the public leaderboard.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate a cumulative score for each enrolled learner per course using a weighted formula: **Quizzes & Exams (40%), Academic Participation (30%), Course Completion Milestones (30%)**.
- **FR-002**: System MUST display the top 10 ranked learners on the leaderboard by default, with pagination or infinite scroll for ranks 11–100.
- **FR-003**: System MUST always display the requesting learner's own rank and score in a persistent "your rank" row, regardless of whether they are in the visible window.
- **FR-004**: System MUST update leaderboard rankings within 5 minutes of any point-earning event (near real-time SLA via asynchronous cache refresh).
- **FR-005**: System MUST allow any enrolled learner to opt out of the public leaderboard at any time, masking their identity as "Anonymous Learner" to peers while preserving their score for their own view and for admins.
- **FR-006**: System MUST break ties by ranking the learner who reached the tied score earliest (by UTC timestamp of the point event that caused the tie) higher.
- **FR-007**: System MUST support three leaderboard time windows: **All-Time**, **This Week** (Mon 00:00 UTC – now), and **This Month** (1st 00:00 UTC – now).
- **FR-008**: System MUST expose a per-category score breakdown when a learner inspects their own score.
- **FR-009**: System MUST provide instructors and course admins with an unmasked leaderboard view showing real identities and a full data export in CSV format.
- **FR-010**: System MUST invalidate and recalculate cache when an admin applies a grade correction affecting a learner's total score.
- **FR-011**: System MUST display an informational empty state if no point-earning activities exist in a course yet.
- **FR-012**: System MUST handle deactivated, banned, or unenrolled learners by replacing their display name with "Former Learner" in public views while preserving score data for auditability.

### Non-Functional Requirements

- **NFR-001 Performance**: Leaderboard page (top-10 + user rank) must load in under 500ms at p95 for courses with up to 10,000 learners. This is only achievable via a pre-computed cache layer; it is not acceptable to satisfy this via direct database queries.
- **NFR-002 Consistency**: Leaderboard data may be stale for up to 5 minutes. This eventual consistency window must be visually communicated to the learner (e.g., "Last updated 2 min ago").
- **NFR-003 Privacy**: Opt-out preference must be enforced server-side. The real identity of an opted-out learner must never be present in any client-facing API response for peer views.
- **NFR-004 Auditability**: All point events that contribute to leaderboard scores must be persisted in an immutable append-only log for grade dispute resolution.
- **NFR-005 Accessibility**: The leaderboard table must conform to WCAG 2.1 AA, including keyboard navigation, screen-reader announcements for rank changes, and sufficient color contrast.

### Key Entities

- **PointEvent**: An immutable record of a single point-earning action by a learner (who, which course, what activity type, how many points, when). This is the system-of-record for all scores.
- **LeaderboardEntry**: A derived, read-optimized view of a learner's standing (rank, total score, per-category breakdown, display identity) for a specific course and time window. Computed from PointEvents and cached.
- **LeaderboardOptOut**: A learner's privacy preference for a specific course, toggling between public and anonymous display.
- **LeaderboardSnapshot**: A timestamped, pre-computed ranking of all learners in a course for a given time window, stored in a cache layer and refreshed asynchronously.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 Performance**: Leaderboard page load time is under 500ms at the 95th percentile for all courses, regardless of enrolled learner count.
- **SC-002 Engagement**: Weekly active days per enrolled learner increases by at least 15% within 30 days of the feature launching to production.
- **SC-003 Reach**: At least 70% of enrolled learners in a course view the leaderboard at least once in any given 7-day period.
- **SC-004 Fairness**: Zero support tickets citing scoring inaccuracy or tie-breaking unfairness within the first 60 days of launch.
- **SC-005 Privacy**: Zero incidents of a learner's real identity being exposed to peers following an opt-out, confirmed by security review before launch.
- **SC-006 Recalculation**: After a grade correction, the affected learner's rank is updated within 5 minutes in 99% of cases.

---

## Assumptions

- A point-awarding pipeline for Quiz, Exam, Participation, and Course Completion activities either exists or will be built as part of this feature's implementation.
- The existing Better Auth session system provides the necessary learner identity context for both privacy enforcement and admin-role discrimination.
- The infrastructure supports a Redis-compatible cache layer, which is required to meet NFR-001.
- Mobile responsiveness is required; a dedicated native mobile app is out of scope.
- Learners outside the top 100 can view their approximate rank but not the full ranked list beyond position 100.
- Internationalization (i18n) for leaderboard labels and dates follows the project-wide i18n setup (Feature 015).
