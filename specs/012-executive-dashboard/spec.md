# Feature Specification: Executive Dashboard Analytics

**Feature Branch**: `012-executive-dashboard`
**Created**: 2026-05-24
**Revised**: 2026-05-24 — v4: Operations Command Center Expansion (Action Center · Public Website & Growth · Growth Funnel · Opportunity Lifecycle · AI Quality · Sales Pipeline · Events · Team Ops · Finance · Content Quality)
**Status**: Draft — CEO & CTO Review Pass + Analytics Expansion + Professional PM Review Applied
**Scope**: Analytics & Operations Command Center for ScholarX leadership, operations, growth, product, content, and technical teams.

---

## Executive Summary

ScholarX V1 exposes a minimal admin control center: four stat tiles, three flat report pages, and no time-series charts, no lesson analytics, no opportunity metrics, no AI search tracking, and no operational queues.

This feature builds a complete **Analytics & Operations Command Center** organized across ten purposeful pages. The workspace answers five leadership questions that no V1 report could answer:

1. **Is the business healthy?** → Overview
2. **Are students progressing and achieving outcomes?** → Learner Progress, Courses & Lessons
3. **Are opportunities fresh, relevant, and converting?** → Opportunities & AI, Action Center
4. **Is the team responding to issues on time?** → Action Center, Sales Pipeline, Team Operations
5. **Is the V2 website turning visitors into active ScholarX users?** → Public Website & Growth

The most important addition beyond V3 is the **Action Center**: a prioritized operational queue that makes the dashboard useful every day, not just before board meetings. The second most important addition is the **Public Website & Growth** page that connects V2 homepage behavior to actual platform outcomes.

### Workspace Page Map

| Page | Primary Audience | Core Focus |
|---|---|---|
| **1. Overview** | CEO, Board | Business health at a glance, KPI scorecards, risk indicators |
| **2. Users** | CEO, Head of Growth | User counters, growth charts, 24-hour × 7-day activity heatmap, peak time intelligence |
| **3. Courses & Lessons** | CEO, Product Lead | Per-course metrics, per-lesson engagement, critical drop flags, completion funnels |
| **4. Learner Progress** | Product Lead, CTO | Enrollment states, stalled learners, certificate pipeline |
| **5. Opportunities & AI** | CEO, Product Lead | Opportunity lifecycle, AI query volume, AI quality analytics, registered events |
| **6. Technical Health** | CTO | Data freshness, pipeline health, audit log, security signals, email pipeline |
| **7. Action Center** | Operations Lead, CEO | Prioritized operational queue with owners, severity, due dates, and status tracking |
| **8. Public Website & Growth** | Growth Manager, CEO | V2 homepage analytics, CTA conversion, signup funnel, traffic attribution, public impact metrics |
| **9. Team Operations** | CEO, Department Leads | Workload by team member, branch/chapter performance, ownership tracking *(P2)* |
| **10. Finance & Unit Economics** | CEO, CFO | Net revenue, refund rate, ARPU, course-level business performance *(P2)* |

Every page respects the global date-range selector and active filters. Navigation preserves context across all pages. All pages are restricted to authorized executive and admin roles.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — CEO Reviews Business Health (Priority: P1)

As a CEO, I want one executive overview that shows ScholarX business health across revenue, growth, subscriptions, sales pipeline, course performance, learner outcomes, and urgent risks, so that I can understand company momentum in under five minutes.

**CEO Perspective — What I need on Day 1**:
- Total revenue this period vs. the same period last year — a comparable seasonal view, not just last month.
- Net new subscriptions (not gross) so I understand real growth versus churn replacement.
- Conversion rate from sales inquiry to enrolled subscription because this tells me whether the sales motion is working.
- Top three courses by revenue and by completion rate — because a course that earns well but graduates nobody is a reputational liability.
- A single "Is anything on fire?" risk indicator before I go into a board call.
- The ability to lock a date range (e.g., Q1 2026), share it with my CFO and COO, and trust that the numbers they see match mine.

**Independent Test**: Sign in as an authorized executive, open the Overview, and confirm that headline metrics, trend charts, top drivers, and risk indicators are all visible without navigating to another page.

**Acceptance Scenarios**:
1. **Given** an authorized CEO opens the Overview with the default time range, **When** the page loads, **Then** it shows revenue, subscription counts, new users, active learners, sales pipeline status, top courses by revenue and completion, and data freshness for every section — all on one screen.
2. **Given** the CEO changes the time range, **When** the dashboard refreshes, **Then** all metrics, charts, rankings, comparisons, and risk indicators update without a page reload.
3. **Given** a metric has materially changed versus the prior period, **When** the CEO views it, **Then** the dashboard shows direction, magnitude, percentage change, and whether the change is favorable or unfavorable.
4. **Given** total revenue is below a configurable threshold or below the same period last year, **When** the CEO opens the Overview, **Then** the revenue metric is visually flagged as requiring attention without hiding the actual value.

---

### User Story 2 — Growth Analyst Reviews User Activity and Peak Times (Priority: P1)

As a CEO or head of growth, I want a dedicated Users page showing user counters, growth trend charts, time-of-day and day-of-week activity heatmaps, peak hours, and per-hour user counts, so that I know exactly when our platform is most active and can make informed decisions about campaigns, maintenance windows, and team schedules.

**Why this priority**: Knowing *when* users are active is as important as knowing *how many*. Peak-time intelligence informs campaign scheduling, maintenance windows, staffing, and content release timing.

**Acceptance Scenarios**:
1. **Given** an authorized user opens the Users page with a 30-day range, **When** the page loads, **Then** it shows the total user count, new registrations, active users, banned count, role distribution, a daily registration trend chart, a 24-hour × 7-day heatmap, and peak-hour and peak-day labels.
2. **Given** the analyst selects "year to date", **When** the charts update, **Then** the growth chart switches to weekly or monthly resolution, the heatmap aggregates across the full range, and peak month and peak day of week are highlighted.
3. **Given** the heatmap shows 9 PM–11 PM is the busiest window, **When** the CEO reviews it, **Then** the heatmap cell is visually distinct and a label reads "Peak activity window: 9 PM – 11 PM."
4. **Given** a user filters by role, **When** the charts update, **Then** all counters, the growth chart, and the heatmap reflect only the selected role segment.

---

### User Story 3 — CTO Reviews Platform and Operational Health (Priority: P1)

As a CTO, I want a dedicated Technical Health page combining data freshness, pipeline health, admin audit log, platform usage signals, and security indicators, so that I can detect operational risk before it affects learners or administrators.

**CTO Perspective — What I need**:
- Per-section data freshness timestamps — I must know whether I am looking at 5-minute-old data or 5-day-old data.
- Background job health for certificate issuance, email sending, progress sync, and data aggregation.
- The admin audit log from `auth.admin_audit_log` showing every role change, ban, manual grant, and course visibility change.
- A clear distinction between a true-zero metric and a data-gap metric.

**Acceptance Scenarios**:
1. **Given** all areas are healthy, **When** the CTO opens Technical Health, **Then** each section shows a green freshness indicator, the audit log shows recent events, and no urgent alerts are displayed.
2. **Given** a pipeline job has not completed within its expected cadence, **When** the CTO views Pipeline Health, **Then** the job is flagged with last successful completion time and status "Overdue."
3. **Given** a high-risk admin action occurred in the selected range, **When** the CTO views the Audit Log, **Then** the entry shows the acting admin's role, action type, affected entity type, and timestamp — without exposing full personal data in the list view.

---

### User Story 4 — Product Lead Inspects Per-Course and Per-Lesson Analytics (Priority: P1)

As a product or learning leader, I want a Courses & Lessons page where I can see per-course metrics and drill into any course to see per-lesson metrics, so that I can identify which lessons cause learners to abandon a course.

**Why this priority**: Lesson-level analytics reveal the exact point where learners disengage — the most actionable insight for improving completion rates.

**Acceptance Scenarios**:
1. **Given** the product lead opens the Courses & Lessons page, **When** the page loads, **Then** it shows all courses in a sortable table with enrollment count, revenue, completion rate, certificate count, active applications, and active inquiries.
2. **Given** the product lead drills into a course, **When** the lesson analytics view opens, **Then** it lists every lesson in sort order with: view count, completion count, completion rate, average watch percentage for video lessons, and drop-off indicator.
3. **Given** a lesson's completion rate drops more than 20 percentage points below the previous lesson, **When** the product lead views the lesson table, **Then** that lesson is visually flagged as "Critical Drop" with the drop magnitude shown.
4. **Given** the product lead filters the course table by category, **When** the filter is applied, **Then** only courses in the selected category are shown and all metrics recalculate.

---

### User Story 5 — Product Lead Reviews Opportunity Discovery and AI Search Usage (Priority: P2)

As a product or business leader, I want an Opportunities & AI page showing opportunity lifecycle health, AI search query analytics, and quality metrics — not just usage volume — so that I can optimize those features and understand their ROI.

**Why this priority**: Opportunity discovery and AI search are differentiating ScholarX features. Knowing whether they are *working* (not just whether they are *used*) determines where product investment should go.

**Acceptance Scenarios**:
1. **Given** the leader opens Opportunities & AI for a 30-day range, **When** the page loads, **Then** it shows total AI queries, unique AI users, average queries per user, a query volume trend chart, zero-result rate, opportunity saves, top saved opportunities, expiring opportunities count, and opportunities with broken links.
2. **Given** the AI zero-result rate exceeds 20% in the period, **When** the leader views the AI Quality section, **Then** the rate is flagged as requiring review and the top unanswered query intents are listed.
3. **Given** the AI search feature has zero queries in the selected range, **When** the leader views the page, **Then** the metrics show a labeled true-zero state: "No AI searches were recorded in this period."

---

### User Story 6 — Admin Reviews Comprehensive User and Course Management (Priority: P2)

As a senior admin, I want a comprehensive User Management view and a Course Management view within the dashboard, so that I can perform oversight without switching between multiple separate admin pages.

**Acceptance Scenarios**:
1. **Given** an admin opens User Management, **When** the page loads, **Then** it shows a searchable, paginated table of all users with role, registration date, email verification status, active subscription count, completed courses, and last activity date.
2. **Given** an admin filters by "banned" status, **When** the filter is applied, **Then** the table shows only banned users with ban reason and expiry visible in the row.
3. **Given** an admin opens Course Management, **When** the page loads, **Then** it shows all courses with publication status, lesson count, enrollment count, revenue contribution, application and inquiry counts, and certificate issuance count.
4. **Given** an admin selects a course in Course Management, **When** the detail view opens, **Then** it shows the full lesson list with each lesson's status, video duration, and lesson-level engagement metrics.

---

### User Story 7 — Executive Exports Board-Ready Snapshots from Any Page (Priority: P3)

As an executive, I want to export filtered dashboard snapshots from any page so that I can include consistent data in board presentations without manually collecting numbers.

**Acceptance Scenarios**:
1. **Given** an executive applies filters and a date range on any page, **When** they export, **Then** the export contains the selected range, filters, all visible metrics, chart data in tabular form, the generation timestamp, and freshness status for each section.
2. **Given** some sections are stale or unavailable, **When** the export is generated, **Then** those sections are marked with a staleness note rather than omitted silently.
3. **Given** the user lacks permission to view a metric category, **When** they export, **Then** restricted content is excluded and a note indicates the omission.

---

### User Story 8 — Operations Lead Uses Action Center (Priority: P1)

As an operations lead, I want one prioritized action queue showing stalled learners, overdue inquiries, expiring opportunities, failed emails, pending certificates, broken content, and security alerts — each with a severity, owner, and due date — so that I can assign work and resolve issues without manually checking every dashboard page.

**Why this priority**: Without an Action Center, the dashboard shows important insights but leaves the team to manually decide what to do. An Action Center makes the dashboard operationally useful every day.

**Independent Test**: Can be tested by seeding known stalled learners, an overdue inquiry, and a failed email delivery, then opening the Action Center and verifying that all three appear with the correct severity and entity information.

**Acceptance Scenarios**:
1. **Given** the operations lead opens the Action Center, **When** the page loads, **Then** it shows a prioritized list of actionable items grouped by severity (critical, high, medium, low), each with source section, affected entity, recommended action, assigned owner, due date, and current status.
2. **Given** there are 3 stalled learners, 1 overdue sales inquiry, and 1 failed email delivery, **When** the Action Center loads, **Then** the overdue inquiry appears as High severity, stalled learners appear as Medium, and the failed email as High.
3. **Given** an authorized admin marks an action item as "In Progress," **When** the status is saved, **Then** the change is recorded in the audit log with the actor, timestamp, previous status, and new status.
4. **Given** an action item has no assigned owner, **When** it is displayed, **Then** it is highlighted with an "Unassigned" badge and sorted above items that have an owner at the same severity level.
5. **Given** an operations lead resolves all items of a given severity, **When** the Action Center refreshes, **Then** resolved items are moved to a "Recently Resolved" section rather than disappearing, until they age out of the configured retention window.

---

### User Story 9 — Growth Lead Diagnoses Funnel Drop-Off (Priority: P1)

As a growth lead, I want to see the full learner journey from visitor to signup to enrollment to opportunity action, so that I know exactly where marketing and onboarding are failing.

**Why this priority**: Without a growth funnel, the team cannot identify whether low enrollment is caused by poor acquisition, weak onboarding, ineffective course discovery, or friction in the signup flow.

**Independent Test**: Can be tested by walking through the funnel with a known test user and verifying that each funnel step reflects the correct count, drop-off percentage, and absolute user count.

**Acceptance Scenarios**:
1. **Given** the growth lead opens the Public Website & Growth page, **When** the funnel section loads, **Then** it shows counts and drop-off percentages for each step: visitor → signup → email verification → profile completion → course page view → enrollment → first lesson started → course completed → opportunity saved.
2. **Given** the drop-off between "signed up" and "email verified" is above 40%, **When** the growth lead views the funnel, **Then** that step is flagged as a high-priority drop-off point with a visual emphasis.
3. **Given** the growth lead filters the funnel by acquisition source (e.g., organic, campaign), **When** the filter is applied, **Then** all funnel step counts update to reflect only users acquired via the selected source.

---

### User Story 10 — Opportunity Manager Maintains Opportunity Quality (Priority: P1)

As an opportunity manager, I want to see expired opportunities, broken links, missing metadata, high-save opportunities, and low-conversion opportunities, so that ScholarX's opportunity database stays useful and trustworthy.

**Why this priority**: If the opportunity catalog contains expired, broken, or incomplete opportunities, learners lose trust in the platform. Quality management must be an ongoing operational task, not a one-time cleanup.

**Independent Test**: Can be tested by creating a test opportunity with a broken application link, expiring it by setting its deadline to yesterday, and confirming it appears in both the "Broken Links" and "Expired" queues in the Opportunities & AI page.

**Acceptance Scenarios**:
1. **Given** an opportunity manager opens the Opportunities & AI page, **When** it loads, **Then** it shows the count of active opportunities, expired opportunities, opportunities expiring within 7/14/30 days, opportunities missing required metadata, and opportunities with broken application links.
2. **Given** an opportunity has high saves but fewer than 5% of savers clicked "apply," **When** the opportunity manager reviews quality signals, **Then** the opportunity is flagged as a possible eligibility, trust, or application-link mismatch.
3. **Given** 5 opportunities are expiring within 7 days, **When** the manager opens the Action Center, **Then** all 5 appear as action items with severity High and recommended action "Review and update or archive."

---

### User Story 11 — Sales Lead Manages Inquiry Pipeline (Priority: P1)

As a sales/support lead, I want to see all inquiries by status, owner, SLA, source channel, and follow-up date, so that no interested student is ignored and every lead is tracked to a resolution.

**Why this priority**: Uncontacted or delayed inquiries are lost revenue and lost learner opportunities. Without visibility into SLA compliance and workload distribution, inquiry management depends on individual memory.

**Independent Test**: Can be tested by creating a test inquiry and leaving it uncontacted for longer than the configured SLA, then opening the Action Center and confirming it appears as an SLA breach item.

**Acceptance Scenarios**:
1. **Given** the sales lead opens the Courses & Lessons or Action Center page, **When** the inquiry pipeline section loads, **Then** it shows inquiries by status (pending, contacted, converted, lost), assigned owner, source channel, time since submission, and next follow-up due date.
2. **Given** an inquiry has not received a first response within the configured SLA period, **When** the sales lead views the pipeline, **Then** the inquiry is flagged as "SLA Breach" and appears in the Action Center as a High-severity item.
3. **Given** the sales lead filters by owner, **When** the filter is applied, **Then** only that owner's inquiries are shown, with their average response time, open count, and conversion rate visible.

---

### User Story 12 — Community Lead Measures Event Impact (Priority: P2)

As a community lead, I want to see registrations, attendance, no-show rate, and conversion after events, so that I know which events actually create student outcomes and which do not.

**Independent Test**: Can be tested by opening the Events section of the Opportunities & AI page for a known event ID and verifying that registration count and post-event signup conversion (if tracked) match the known test data.

**Acceptance Scenarios**:
1. **Given** the community lead opens the Events section, **When** the page loads, **Then** it shows total event registrations from `user.registeredEvents`, count of unique events with at least one registration, top 5 events by registration count, and where attendance tracking exists, the attendance rate and no-show rate.
2. **Given** attendance tracking is not available for an event, **When** the community lead views it, **Then** the attendance column shows "Attendance tracking not active" as a data-gap state, not zero.
3. **Given** the community lead selects a specific event, **When** the detail view opens, **Then** it shows registrations over time, post-event signup conversion rate (registrants who subsequently created or verified an account), and post-event enrollment conversion rate where attributable.

---

### User Story 13 — Content Lead Identifies Courses Needing Improvement (Priority: P2)

As a content lead, I want to identify courses and lessons with poor ratings, high drop-off, missing thumbnails, broken media, or outdated material, so that I know exactly what content needs attention without manually reviewing every course.

**Independent Test**: Can be tested by marking a test course with no thumbnail, high drop-off at Lesson 2, and low completion, then opening the Courses & Lessons page and confirming all three signals appear for that course.

**Acceptance Scenarios**:
1. **Given** the content lead opens the Courses & Lessons page, **When** it loads, **Then** courses with the "Problem Course" signal (high enrollment + low completion), missing thumbnails, or no-owner attribution are flagged in the course table with distinct badges.
2. **Given** a course has a lesson with a "Critical Drop" flag and no thumbnail for the course, **When** the content lead views the course row, **Then** it shows both flags simultaneously without crowding the row.
3. **Given** the content lead opens the content quality drilldown for a course, **When** the view loads, **Then** it shows lesson-level flags: missing video, draft status, last updated date, and the drop-off indicator — as an actionable content review checklist.

---

### User Story 14 — CEO Reviews Unit Economics (Priority: P2)

As a CEO, I want revenue, refund rate, conversion, support workload, and completion outcomes by course and acquisition source, so that I can decide where ScholarX should invest more effort.

**Independent Test**: Can be tested by selecting a specific course in the Finance & Unit Economics page and verifying that gross revenue, net revenue after refunds, enrollment count, completion rate, and refund rate all match the known test data.

**Acceptance Scenarios**:
1. **Given** the CEO opens the Finance & Unit Economics page, **When** it loads, **Then** it shows gross revenue, net revenue after refunds, refund rate, average revenue per active learner, and manual grant vs. paid enrollment split for the selected period.
2. **Given** the CEO selects a specific course, **When** the course finance detail opens, **Then** it shows that course's revenue, enrollment count, completion rate, refund rate, support inquiry count, and a profitability proxy score combining these signals.
3. **Given** a course has a refund rate above a configurable threshold, **When** the CEO views the Finance page, **Then** the course is flagged with a "High Refund Rate" badge in the course-level breakdown table.

---

### User Story 15 — Growth Manager Reviews V2 Website Performance (Priority: P1)

As a growth manager, I want to understand how users interact with the V2 homepage, navigation CTAs, signup, courses, opportunities, and AI search, so that I can improve website conversion and acquisition quality.

**Why this priority**: The V2 website is the primary acquisition surface for ScholarX. If the dashboard cannot measure how well it converts visitors into registered learners, ScholarX cannot make evidence-based growth decisions.

**Independent Test**: Can be tested by simulating a known visitor flow (homepage → courses CTA → signup), then opening the Public Website & Growth page and confirming the funnel reflects the expected step counts.

**Acceptance Scenarios**:
1. **Given** the growth manager opens the Public Website & Growth page, **When** it loads, **Then** it shows homepage visit count, CTA click counts for each CTA (Courses, Opportunities, AI Search, Signup, Login, Contact), signup conversion rate, and the top acquisition traffic sources.
2. **Given** the signup CTA conversion rate drops below a configurable threshold, **When** the growth manager views the page, **Then** the metric is flagged as requiring attention with the current rate and the prior period rate shown side by side.
3. **Given** website tracking is unavailable or not yet instrumented, **When** the growth manager opens the page, **Then** each website metric section shows a data-gap state: "Website analytics tracking is not yet active — connect a tracking source to enable this section."

---

### User Story 16 — Leadership Reviews Public Impact Metrics Governance (Priority: P1)

As a leadership team member, I want public impact numbers (students served, partners, events/programs, mentorship sessions) to be sourced, approved, fresh, and traceable, so that the numbers shown on the ScholarX public website remain credible and accurate.

**Why this priority**: The ScholarX V2 homepage displays impact counters. If those numbers are stale, manually estimated, or unapproved, they undermine credibility with prospective learners and partners.

**Independent Test**: Can be tested by opening the Public Impact Metrics section and verifying that each displayed metric shows its source, owner, last verified date, and approval status.

**Acceptance Scenarios**:
1. **Given** leadership opens the Public Impact Metrics section, **When** it loads, **Then** every public metric (students served, partners, events, certificates issued) shows its value, data source, freshness timestamp, responsible owner, and approval status (approved / pending approval / override).
2. **Given** a public metric's underlying source data has not been verified in more than 30 days, **When** leadership views the section, **Then** the metric is flagged as "Freshness Review Required" with the last verification date.
3. **Given** a team member manually overrides a public impact metric, **When** the override is applied, **Then** the dashboard records the override actor, override reason, override date, and original calculated value — and the metric is labeled "Manual Override" in the governance section.

---

### Edge Cases

- When no data exists for the selected range, every metric shows an explicitly labeled empty state ("No activity in this period") and no chart renders a zero-value line that could be misread as meaningful data.
- When the heatmap has no lesson progress events for a time slot, the slot appears as an empty (very light) cell, not as zero-value — zero-value implies measurement occurred with zero result, whereas an empty cell means no events were logged.
- When a lesson has zero completions but non-zero views, the completion rate is shown as 0% (not hidden), and the watch percentage is the average across viewers who started the lesson.
- When a course is archived, its historical metrics remain in all analytics charts for periods before archival. It is excluded from "active course" counts but not from revenue or learner outcome totals.
- When a learner's subscription is refunded, their lesson progress and course completion records are preserved in learner outcome metrics. The subscription is excluded from active revenue and subscription counts.
- When an AI search query is made by an unauthenticated user, it is counted in aggregate AI query totals but excluded from the per-user table.
- When the selected range spans a partial current day, the current day's data is shown with a "partial day" indicator, and comparisons to prior complete days are labeled accordingly.
- When two courses share the same title, the course table uses the course ID or slug as a disambiguator in all charts and drilldowns.
- When the admin audit log is empty for the selected range, the CTO view shows "No administrative actions were recorded in this period" rather than hiding the section.
- When a lesson has no video (text-only lesson), the "average watch percentage" column shows "N/A — no video" rather than zero.
- When a user's saved opportunities array is empty, their row in the per-user opportunity table shows zero saves — this is a true zero, not a data gap.
- When a student signs up from an unknown source, attribution is shown as "Unknown / Direct" and never collapsed into another source category.
- When an opportunity expires during a selected reporting period, it remains visible in historical analytics but is excluded from active opportunity counts and flagged in the cleanup queue.
- When an event has registrations but no attendance tracking, attendance is shown as a data gap ("Attendance tracking not active"), not as 0%.
- When a lead is attributable to multiple sources, the dashboard records first-touch and last-touch attribution separately and does not merge them into a single source.
- When a user deletes or anonymizes their account, historical aggregate metrics remain unchanged, but record-level identity in drilldowns and tables is replaced with "[Anonymized User]."
- When an AI query contains text that may include sensitive personal data (e.g., a user typed their name in a search), the dashboard stores only safe query metadata (intent category, zero-result flag, timestamp) and not the raw query string unless explicit safe retention policy is in place.
- When a course has no rating data, satisfaction is shown as "Not enough feedback" — not 0% and not hidden.
- When a team member leaves ScholarX, their historical tasks remain attributed but they are excluded from future assignment options in the Action Center.
- When a public impact metric is manually overridden, the dashboard shows the override owner, reason, date, and original calculated value with a "Manual Override" label.
- When V2 website tracking is unavailable, all website conversion sections show a data-gap state rather than assuming zero traffic.
- When an opportunity has high saves but very low apply clicks, it is flagged as a possible eligibility mismatch, trust issue, or broken application link — the flag does not assign a root cause, only surfaces it for human review.
- When AI Search is accessed by anonymous users, aggregate metrics include the query counts but user-level tables exclude any identity.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Access, Security, and Navigation

- **FR-001**: System MUST provide the entire analytics workspace exclusively to users with authorized executive or senior admin roles. All pages must deny access to learners, instructors without explicit grants, and unauthenticated visitors.
- **FR-002**: System MUST provide persistent top-level navigation between all active pages from a sidebar or tab bar that remains visible throughout the workspace. Navigation must include pages 1–8 in Phase 1 and pages 9–10 in Phase 2.
- **FR-003**: System MUST preserve the selected date range, active filters, and current page when navigating between pages, so analysis context is never lost mid-session.
- **FR-004**: System MUST keep the analytics workspace visually and navigationally separate from the operational admin management pages (course editor, user edit forms, subscription management forms).
- **FR-005**: System MUST log all export actions and all Action Center status changes with actor identity, action type, affected entity, timestamp, and generation parameters in the admin audit log.
- **FR-006**: System MUST redact full names, email addresses, phone numbers, and payment identifiers from all overview rows, chart labels, and exports unless the viewer explicitly opens a permitted record-level drilldown.

---

#### Global Controls (Shared Across All Pages)

- **FR-007**: System MUST provide a global date range selector with presets: today, yesterday, last 7 days, last 30 days, month to date, last month, quarter to date, last quarter, year to date, last year, and custom range with a date picker.
- **FR-008**: System MUST show the active date range and active filters in a persistent header bar on every page so the user always knows their analysis context.
- **FR-009**: System MUST support the following global filter dimensions: course, course category, user role, subscription status, application status, inquiry status, learner segment (high school, undergraduate, graduate, professional), and acquisition source where attribution exists.
- **FR-010**: System MUST apply all filters and the date range identically to metric cards, charts, drilldowns, tables, and exports within the session.

---

#### Page 1 — Overview

- **FR-011**: System MUST provide an Overview page with a KPI scorecard row showing: total gross revenue this period (with period-over-period delta), net new subscriptions (new minus cancelled minus refunded), total active users, sales inquiry conversion rate, and top-performing course by revenue.
- **FR-012**: System MUST provide on the Overview page: a revenue trend line chart (daily ≤ 30 days, weekly ≤ 90 days, monthly > 90 days), a subscription health stacked bar chart, a sales pipeline funnel chart (submitted → contacted → converted → lost), and a learner completion trend chart.
- **FR-013**: System MUST provide a Risk Indicators panel on the Overview page that highlights any of: revenue below configurable threshold, net subscription count negative, sales conversion rate below historical average, stalled learner percentage above threshold, data freshness failures in critical sections, AI zero-result rate above threshold, opportunities expiring within 7 days, or any open Action Center item at Critical severity.
- **FR-014**: System MUST show data freshness timestamps for every Overview section and link directly to the Technical Health page for details on any stale or degraded indicator.

---

#### Page 2 — Users

- **FR-015**: System MUST provide a Users page with a KPI counter row showing: total registered users (all time), new users in the selected period, active users in the period (at least one lesson progress event), banned/suspended users, email-verified users, and unverified users.
- **FR-016**: System MUST provide a **User Growth Chart**: line or area chart of new registrations per day (≤ 30 days), per week (≤ 90 days), or per month (> 90 days), with a prior-period overlay for comparison.
- **FR-017**: System MUST provide a **Role Distribution Chart**: donut or horizontal bar chart showing count and percentage of users by role (learner, instructor, admin, other).
- **FR-018**: System MUST provide a **24-Hour Activity Heatmap**: a grid of 24 columns (0:00–23:00) by 7 rows (Monday–Sunday) where each cell's intensity reflects the count of lesson progress sync events (`progress_sync_events.createdAt`) in that hour-slot within the selected date range.
- **FR-019**: System MUST derive the heatmap time slots from `courses.progress_sync_events.createdAt` using UTC timestamps bucketed by hour-of-day and day-of-week for the selected range.
- **FR-020**: System MUST provide a **Peak Activity Summary** below the heatmap: the single busiest hour of day, the single busiest day of week, and the single busiest calendar month — each shown as a labeled highlight card.
- **FR-021**: System MUST provide a **Monthly Activity Chart**: bar chart of total lesson progress events per month for the selected range, with a yearly summary when the range spans more than 12 months.
- **FR-022**: System MUST provide a **User Registration Timeline**: cumulative registered users over the full platform lifetime alongside the selected period's new registration trend.
- **FR-023**: System MUST allow filtering the Users page by user role so all counters, the growth chart, and the heatmap reflect only the selected role segment.

---

#### Page 3 — Courses & Lessons

- **FR-024**: System MUST provide a Courses & Lessons page with a KPI row showing: total courses, published courses, draft courses, archived courses, total lessons, published lessons, and draft lessons.
- **FR-025**: System MUST provide a **Course Leaderboard Table** sortable by: enrollment count, total revenue contribution, completion rate, certificate issuance count, active applications count, and active inquiries count. Default sort is enrollment count descending.
- **FR-026**: System MUST provide a **Course Category Distribution Chart**: horizontal bar chart showing enrollment counts grouped by course category.
- **FR-027**: System MUST provide a **Problem Course Signal**: any course with 10 or more enrolled learners and a completion rate below 10% after 30+ days since first enrollment is flagged with a "Low Completion" badge.
- **FR-028**: System MUST provide a per-course **Lesson Analytics Drilldown**: every lesson in sort order with: lesson title, lesson status, video duration (if applicable), unique viewer count, completion count, completion rate, average watched percentage, and drop-off indicator comparing this lesson's completion rate to the prior lesson's.
- **FR-029**: System MUST flag any lesson where the completion rate drops more than 20 percentage points below the prior lesson's completion rate as a **Critical Drop** lesson, with a visual badge and the drop magnitude (e.g., "−28 pts").
- **FR-030**: System MUST provide a **Lesson Completion Funnel Chart**: a waterfall or step funnel showing the count of learners at each lesson boundary — Lesson 1 viewed → Lesson 1 completed → Lesson 2 viewed → ... → Course completed.
- **FR-031**: System MUST distinguish "N/A — no video" from "0%" for the average watch percentage for text-only lessons.
- **FR-032**: System MUST provide a **Course Management Table** alongside the analytics table, showing each course's publication status, last-updated-by admin, and direct link to the course editor.

---

#### Page 4 — Learner Progress

- **FR-033**: System MUST provide a Learner Progress page with KPI counters: total active enrollments, total completed courses, total in-progress learners, stalled learners (no lesson progress in 14 days), certificate-eligible learners, and certificates issued in the period.
- **FR-034**: System MUST provide a **Per-Course Completion Distribution Chart**: for each active course, a stacked bar showing learners in each progress state: not started, in progress, completed, stale after curriculum change, revoked.
- **FR-035**: System MUST provide a **Learner Progress Table**: paginated, listing each enrollment with course title, learner identifier (anonymized in overview), progress percentage, completed lessons, required lessons, progress status, last activity date, and certificate status.
- **FR-036**: System MUST provide a **Certificate Pipeline Section**: certificates issued in the period, revoked certificates, learners eligible but not yet issued, and a list of learners who completed in the period but whose certificate has not been issued — as an actionable table.
- **FR-037**: System MUST provide a **Stalled Learner Breakdown**: a table showing learners with zero lesson progress events in the last 14 days, with enrolled course, days since last activity, and progress percentage — sorted by days since last activity descending.

---

#### Page 5 — Opportunities & AI Search

- **FR-038**: System MUST provide an Opportunities & AI page with a KPI row showing: total AI search queries in the period, unique AI search users, average AI queries per active AI user, total opportunity saves in the period, total unique opportunities with at least one save, active opportunities count, and opportunities expiring within 7 days.
- **FR-039**: System MUST provide an **AI Search Query Volume Trend Chart**: line or area chart of AI query counts per day or week, with a prior-period overlay.
- **FR-040**: System MUST provide an **AI Search 24-Hour Activity Chart**: bar chart of AI query counts grouped by hour of day (0–23) across the selected range, identifying the peak search hour.
- **FR-041**: System MUST provide a **Per-User AI Search Usage Table** (role-gated): paginated table of each user who executed at least one AI search in the period, with query count, first query date, and last query date.
- **FR-042**: System MUST provide an **Opportunity Discovery Section** showing: total opportunity saves, top 10 most-saved opportunity IDs with save counts, net change in saves versus prior period, active opportunities, draft opportunities, archived/expired opportunities, and opportunities expiring within 7/14/30 days.
- **FR-043**: System MUST show a labeled true-zero state ("No AI searches were recorded in this period") when AI query counts are zero.
- **FR-044**: System MUST note whether the opportunity view event log exists; if not, the section shows "Opportunity view tracking is not yet active" as a data-gap state.
- **FR-045**: System MUST provide a **Registered Events Section**: total event registrations from `user.registeredEvents`, count of unique events with at least one registration, and top 5 events by registration count.
- **FR-101**: System MUST provide **AI Search Quality Analytics** showing: zero-result query rate (queries returning no results ÷ total queries), repeated failed query rate (same or similar zero-result queries from the same user), query intent category distribution (where AI infrastructure provides intent labeling), search-to-save conversion (AI searches followed by an opportunity save within the session), user satisfaction feedback rate (helpful / not helpful, where feedback UI exists), AI latency (average response time in milliseconds), AI error rate (failed queries ÷ total queries), and estimated AI cost per query where the AI infrastructure provides cost metadata.
- **FR-102**: System MUST provide **Opportunity Quality Management** showing: opportunities with broken or invalid application links (flagged if link returns a non-2xx response where checkable), opportunities missing required metadata (deadline, country, eligibility criteria, funding type), opportunities flagged or reported by users, high-save / low-apply-click opportunities (save count > configurable threshold, apply-click rate < configurable threshold), and an actionable cleanup queue sorted by impact score. Each item in the cleanup queue links to the opportunity editor in the operational admin pages.
- **FR-083**: System MUST flag opportunities expiring within 7, 14, and 30 days and surface them in the Action Center with the relevant severity.
- **FR-084**: System MUST flag opportunities with high saves but low apply clicks as a quality signal visible in both the Opportunities & AI page and the Action Center.

---

#### Page 6 — Technical Health (CTO)

- **FR-046**: System MUST provide a Technical Health page with a per-section freshness status grid: section name, last successful data fetch timestamp, freshness status (current ≤ 5 min, stale 5 min–1 hr, very stale > 1 hr, unavailable = query failed), and overall health score (% of sections that are current).
- **FR-047**: System MUST provide a **Background Pipeline Health** section: last successful completion time for each known job type (certificate issuance, email sending, progress sync, data aggregation), failure count in the period, and any job not completing within its expected cadence labeled "Overdue."
- **FR-048**: System MUST provide an **Admin Audit Log** section from `auth.admin_audit_log`: paginated, filterable timeline of admin actions within the selected date range showing action type, entity type, entity ID, acting admin identifier, and timestamp. Diff detail is available for authorized roles only.
- **FR-049**: System MUST provide a **Platform Usage Section**: total progress sync events in the period, new account registrations, email verification rate, and DAU trend.
- **FR-050**: System MUST provide a **Security Signals Section**: active session count, impersonated session count in the period, banned account count with 14-day trend, email-unverified count, and spike detection above the 14-day average.
- **FR-051**: System MUST provide an **Email Pipeline Health** section: total queued, sent, and failed emails in the period, and current circuit breaker state per provider from `email.email_provider_circuit_states`.

---

#### Page 7 — Action Center *(NEW)*

- **FR-070**: System MUST provide an Action Center page that aggregates the highest-priority operational items from all other dashboard pages into a single, prioritized queue. Source categories include: stalled learners, low-completion courses, critical-drop lessons, SLA-breached inquiries, follow-ups due today, failed email deliveries, pending certificates, AI searches with zero results, broken opportunity links, expiring opportunities, incomplete opportunity metadata, reported opportunities, unverified accounts above threshold, security spikes, data freshness failures, and open admin audit alerts.
- **FR-071**: Each Action Center item MUST include: severity (critical / high / medium / low), source page and section, affected entity type and identifier, recommended action description, assigned owner (nullable), due date (nullable), current status (open / in-progress / resolved / dismissed / escalated), and last updated timestamp.
- **FR-072**: System MUST allow authorized admins to update the status of any Action Center item from open → in-progress → resolved, or to dismiss it or escalate it, from within the Action Center without navigating to the source page.
- **FR-073**: System MUST preserve a full audit trail for every Action Center status change, recording: actor user identifier, previous status, new status, timestamp, and optional resolution note. This audit trail is visible in the Technical Health Audit Log section.
- **FR-085**: System MUST provide a **Sales & Support Pipeline section** within the Action Center (and optionally as a dedicated sub-view) showing: total inquiries by status (pending, contacted, converted, lost), assigned owner per inquiry, source channel per inquiry, time elapsed since submission, next follow-up due date, and overdue follow-up count.
- **FR-086**: System MUST flag any inquiry that has not received a first response within the configured SLA period (default: 48 hours) as "SLA Breach" in the Action Center at High severity.
- **FR-087**: System MUST show workload by team member in the Sales & Support section: assigned inquiry count, overdue follow-up count, average response time, resolved count in the period, and conversion rate — sortable by each metric.

---

#### Page 8 — Public Website & Growth *(NEW)*

- **FR-074**: System MUST provide a **Growth Funnel** on the Public Website & Growth page showing the full learner journey step by step: visitor/session → signup initiated → email verified → profile completed → course page viewed → enrollment (subscription or application submitted) → first lesson started → course completed → opportunity saved or applied. Each step shows the absolute user count, drop-off count to the next step, and drop-off percentage.
- **FR-075**: System MUST support filtering the Growth Funnel by acquisition source, medium, campaign, referral channel, and direct/organic traffic where attribution data exists. If attribution is unavailable, each funnel step shows the total count with a note that source breakdown is not available.
- **FR-076**: System MUST show drop-off percentage and absolute user count at every funnel step, and visually emphasize the step with the highest drop-off percentage in the selected range.
- **FR-077**: System MUST distinguish "Unknown / Direct" from attributed sources in all acquisition analytics, never merging unknown attribution into a specific source.
- **FR-078**: System MUST provide **Student Journey & Readiness Analytics** showing: profile completion percentage distribution across all users, most-common missing profile fields, education level distribution, field-of-study interest distribution, target country distribution where data exists, and a "No Action Taken" segment — users who registered but did not verify email, complete profile, enroll, save an opportunity, or start a course within configurable time windows.
- **FR-079**: System MUST identify **Inactive New Users**: users who created an account but took no meaningful action (no email verification, no profile completion, no enrollment, no opportunity save, no course start) within a configurable window (default: 14 days). These users are surfaced in the Action Center as a Medium-severity item.
- **FR-080**: System MUST provide **Cohort Retention Analytics**: grouping users by signup week or month and tracking what percentage of each cohort returns in subsequent weeks or months (at least one lesson progress event per return period).
- **FR-099**: System MUST provide a **Public Impact Metrics** section showing each ScholarX public-facing impact counter (students served, partners, events/programs count, mentorship sessions, opportunity applications, certificates issued) with: the computed value derived from database sources, the data source table or query used, the responsible owner, the freshness timestamp, and the approval status (approved / pending approval / manual override).
- **FR-100**: System MUST provide **V2 Website Funnel Analytics** covering the conversion path: homepage visit → CTA click (Courses, Opportunities, AI Search, Signup, Login, Contact) → signup or login → course/opportunity/AI interaction. Each step shows click count, conversion rate to the next step, and breakdown by device type, traffic source, and campaign where website tracking instrumentation is available. If website tracking is not instrumented, every section in this block shows a data-gap state: "Website analytics tracking is not yet active."

---

#### Page 9 — Team Operations *(P2)*

- **FR-091**: System MUST provide a Team Operations page showing: team member count by department/role, branch/chapter activity breakdown, assigned and overdue task counts per team member, assigned inquiry count per team member, assigned event ownership, assigned course or opportunity curation ownership, and completed task count in the period.
- **FR-092**: System MUST allow executive users to filter all Team Operations metrics by branch, department, team, and owner where these organizational relationships exist in the data.

---

#### Page 10 — Finance & Unit Economics *(P2)*

- **FR-097**: System MUST provide a Finance & Unit Economics page showing: gross revenue in the period, net revenue after refunds, refund rate (refunds ÷ gross subscriptions), payment failure rate where data exists, average revenue per active learner (ARPU), and the split between manual grant enrollments and paid enrollments in the period.
- **FR-098**: System MUST provide a **Course-Level Business Performance Table** combining, for each course: gross revenue, enrollment count, completion rate, refund rate, inquiry/support workload count, and certificate issuance count — sortable by each column. Courses with a refund rate above a configurable threshold are flagged "High Refund Rate."

---

#### Content Quality & Course Operations *(cross-cutting, added to Page 3)*

- **FR-093**: System MUST provide **Content Quality Indicators** on the Courses & Lessons page: courses missing thumbnail images, courses with no assigned owner, lessons in "draft" status within published courses (a content inconsistency signal), lessons not updated in more than 90 days where the course is active, draft courses pending review for more than 30 days, and courses with no activity in the selected period despite being published.
- **FR-094**: System MUST flag any course that simultaneously has high enrollment and low completion (below 20%) or high revenue and a refund rate above a configurable threshold as a **Course Health Alert**, visible in both the Courses & Lessons page and the Action Center.

---

#### Metric Integrity (All Pages)

- **FR-052**: System MUST apply consistent calculation definitions across all pages: "active user" = at least one `progress_sync_events` record in the period; "completed course" = `course_progress.status = 'completed'`; "active subscription" = `subscriptions.isActive = true AND status NOT IN ('cancelled','refunded','expired')`; "converted inquiry" = `inquiries.status = 'converted'`.
- **FR-053**: System MUST avoid double-counting: a user with both a paid subscription and a manual admin grant to the same course is counted once; a subscription cancelled and reactivated in the same period appears once in "new" and once in "cancelled."
- **FR-054**: System MUST ensure that the same metric value shown in an overview KPI card, a drilldown table, and a downloaded export are identical for the same filters and date range.
- **FR-055**: System MUST label every metric with its precise definition (inline tooltip or glossary link), the period it covers, and whether it is a cumulative all-time total or a period-bounded count.

---

#### Charts and Visualization (All Pages)

- **FR-056**: System MUST use chart types appropriate to each metric: line/area for time-series, vertical bar for period comparisons, horizontal bar for ranked lists, stacked bar for status composition, donut (≤ 5 segments) for distributions, funnel for pipeline conversion, heatmap grid for time-of-day analysis, waterfall for lesson-by-lesson dropout funnel.
- **FR-057**: System MUST NOT use 3D charts, pie charts with more than 5 segments, or bar/line charts with a Y-axis that does not start at zero unless the user explicitly toggles a zoomed view, which must be labeled "Zoomed View — Y-axis does not start at zero."
- **FR-058**: System MUST make all charts readable at desktop (1280px+), tablet (768–1279px), and mobile (375–767px) without overlapping labels, clipped values, or overflowing containers.
- **FR-059**: System MUST resolve chart time-axis resolution automatically: daily for ranges ≤ 30 days, weekly for ranges ≤ 90 days, monthly for ranges > 90 days.

---

#### States and Feedback (All Pages)

- **FR-060**: System MUST show loading, empty (true zero), data-gap (source unavailable or query failed), stale, partial, error, and access-denied states for every metric card and dashboard section.
- **FR-061**: System MUST visually distinguish a true-zero metric from a data-gap metric — for example, a grey "—" icon for data gaps and a numeric "0" for true zeros.
- **FR-062**: System MUST support manual refresh per section without a full page reload, showing a per-section refresh indicator that does not shift layout.
- **FR-063**: System MUST support automatic background refresh no more than every 5 minutes, notifying the user with a non-intrusive "Updated data available — click to apply" banner rather than automatically replacing values mid-analysis.

---

#### Exports (All Pages)

- **FR-064**: System MUST provide an export action on every page producing a structured CSV for tabular data and a print/PDF layout for board-ready snapshots.
- **FR-065**: System MUST include in every export: selected date range, active filters, generation timestamp, data freshness status for each section, and a note for any role-restricted content that was excluded.
- **FR-066**: System MUST exclude from exports any metric or record the authenticated user lacks permission to view, noting the exclusion rather than silently omitting it.

---

#### Accessibility (All Pages)

- **FR-067**: System MUST make all dashboard controls, metric cards, charts, navigation, tables, and exports keyboard-accessible without mouse interaction.
- **FR-068**: System MUST provide meaningful text alternatives for all charts, including data summaries readable by screen readers.
- **FR-069**: System MUST convey favorable vs. unfavorable trends using both color and shape or text, never color alone.

---

### Key Entities *(include if feature involves data)*

- **Analytics Workspace**: The top-level container for all ten dashboard pages, the global date range, active filters, and navigation state. No business record mutations occur within the workspace.
- **Overview Page**: Executive command center — KPI scorecards, trend charts, risk indicators, pipeline funnel, Action Center summary, data freshness summary.
- **Users Page**: User counters, role distribution, 24-hour × 7-day activity heatmap, peak hour/day/month summary, user growth chart, user registration timeline.
- **Courses & Lessons Page**: Course leaderboard, category distribution, problem course signals, content quality flags, per-course lesson drilldown, critical drop flag, completion funnel, course management link table.
- **Learner Progress Page**: Enrollment counters, per-course progress distribution chart, learner progress table, certificate pipeline section, stalled learner breakdown.
- **Opportunities & AI Page**: AI query volume trend, AI quality analytics (zero-result rate, latency, cost), per-user AI query table, opportunity lifecycle section, opportunity quality cleanup queue, registered events section.
- **Technical Health Page**: Per-section freshness grid, background pipeline health, admin audit log, platform usage, security signals, email pipeline health.
- **Action Center Page**: Prioritized operational queue aggregating items from all pages, each with severity, source, entity, recommended action, owner, due date, status, and audit trail.
- **Public Website & Growth Page**: Growth funnel (visitor → outcome), student journey and readiness analytics, cohort retention, V2 website CTA analytics, public impact metrics governance.
- **Team Operations Page**: Workload by team member, branch/chapter performance, ownership of courses/events/opportunities/inquiries.
- **Finance & Unit Economics Page**: Gross and net revenue, refund rate, ARPU, payment failure rate, manual grant vs. paid split, course-level business performance table.
- **Action Item**: An operational work item in the Action Center with severity, source section, affected entity, recommended action, assigned owner, due date, status, last updated timestamp, and audit trail of status changes.
- **Action Item Status Change**: An audit record in `auth.admin_audit_log` capturing actor, previous status, new status, timestamp, and resolution note for every Action Center item status transition.
- **Public Impact Metric**: A named public-facing counter (e.g., "Students Served") with computed value, data source, responsible owner, freshness timestamp, approval status, and override history.
- **Growth Funnel Step**: A named stage in the learner journey (visitor, signup, email verified, profile completed, course page viewed, enrolled, first lesson started, course completed, opportunity saved) with absolute count, drop-off count, and drop-off percentage to the next step.
- **Cohort**: A group of users who registered within the same calendar week or month, tracked over subsequent periods to measure return activity rate.
- **24-Hour Activity Heatmap**: A 24 × 7 grid (hours × days of week) where each cell aggregates `progress_sync_events` counts for that hour-slot across the selected date range.
- **Lesson Analytics Record**: Per-lesson computed metrics — unique viewer count, completion count, completion rate, average watched percentage, drop-off delta — derived from `lesson_progress` records.
- **Critical Drop Lesson**: A lesson where completion rate is more than 20 percentage points below the preceding lesson's completion rate in the same course.
- **Lesson Completion Funnel**: A waterfall or step-funnel chart for a single course showing learner counts at each lesson boundary.
- **AI Search Event**: A user-initiated AI search query event counted per user per time period. If no dedicated event log exists, this section degrades gracefully.
- **Opportunity Interaction Event**: A learner action on the opportunity discovery surface. The `user.savedOpportunities` array is the minimum available source; a dedicated event log is preferred.
- **Stalled Learner**: A user with an active subscription who has had zero `lesson_progress` updates in the last 14 calendar days.
- **Data Gap**: A dashboard section where the underlying query failed, the source is unavailable, or the required table does not yet exist — distinguished from a true-zero by a visual indicator and descriptive label.
- **Admin Audit Event**: A record in `auth.admin_audit_log` containing adminId, action, entityType, entityId, before/after diff, ipAddress, and createdAt.
- **SLA Breach**: A sales inquiry that has not received a first response within the configured SLA period (default 48 hours), surfaced in the Action Center as a High-severity item.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of authorized executives can answer "Is the business healthy this period?" within 5 minutes using the Overview page alone.
- **SC-002**: 90% of authorized technical leaders can determine whether platform data is current, stale, or degraded within 2 minutes of opening the Technical Health page.
- **SC-003**: 95% of page loads render all available KPI cards and primary charts within 3 seconds for date ranges of 90 days or less.
- **SC-004**: 100% of dashboard sections on all active pages display a freshness status and last successful update timestamp at all times.
- **SC-005**: 100% of restricted financial, operational, and personal data is inaccessible to unauthorized roles in all pages and exports — verified by RBAC audit prior to release.
- **SC-006**: 95% of executives can export a board-ready snapshot with the correct filters and date range in under 60 seconds.
- **SC-007**: Metric totals shown in an overview KPI card, the corresponding drilldown detail, and the downloaded export are identical for the same filters and date range in 100% of sampled validation checks.
- **SC-008**: The 24-hour activity heatmap correctly identifies the peak usage hour in 100% of controlled test cases (verified by inserting known events at specific hours and confirming the heatmap highlights the correct cell).
- **SC-009**: The per-lesson completion funnel shows the correct sequence, view count, and completion count for a known test course in 100% of sampled validation checks.
- **SC-010**: A "Critical Drop" lesson flag appears on exactly the lessons where the completion rate drops more than 20 percentage points from the prior lesson in 100% of sampled test cases.
- **SC-011**: 90% of sampled charts are readable and non-overlapping at 1280px, 768px, and 375px viewport widths.
- **SC-012**: 100% of true-zero states and data-gap states are presented with distinct, understandable visual indicators without developer assistance.
- **SC-013**: 100% of archived courses, refunded subscriptions, and banned users are correctly excluded from active-state metric counts in sampled validation checks.
- **SC-014**: The AI Search usage table correctly counts only queries within the selected date range, verified by a controlled test with known query counts per user in 100% of sampled checks.
- **SC-015**: Executive users rate the overall dashboard workspace as decision-ready in at least 4 out of 5 in a satisfaction survey after the first full leadership review cycle.
- **SC-016**: 90% of operations leads can identify the top 10 urgent action items within 2 minutes of opening the Action Center.
- **SC-017**: 95% of sales inquiries in the Action Center and Sales Pipeline section show an assigned owner, status, source channel, and next follow-up date.
- **SC-018**: 100% of expired opportunities are excluded from learner-facing active opportunity counts and visible in the admin opportunity cleanup queue.
- **SC-019**: 90% of growth stakeholders can identify the largest funnel drop-off point within 3 minutes of opening the Public Website & Growth page.
- **SC-020**: Event registration reports show registration count and top events by registration for 100% of events with tracking data in `user.registeredEvents`.
- **SC-021**: AI search quality reports show zero-result rate and per-user query count for 100% of tracked AI search sessions where the event log exists.
- **SC-022**: 100% of actionable dashboard alerts in the Action Center have a severity, due date classification, and status — even if owner is unassigned.
- **SC-023**: The Courses & Lessons page identifies all courses simultaneously meeting the "high enrollment + low completion" or "high revenue + high refund rate" threshold in 100% of sampled test cases.
- **SC-024**: CEO can compare revenue, completion rate, refund rate, and support workload for any two courses within 5 minutes using the Finance & Unit Economics page.
- **SC-025**: 95% of public impact metrics show source, owner, freshness timestamp, and approval status in the Public Impact Metrics governance section.
- **SC-026**: Growth stakeholders can identify homepage CTA conversion rate, signup conversion rate, and top acquisition source within 3 minutes of opening the Public Website & Growth page — or see a clear data-gap state explaining why website tracking is not yet active.
- **SC-027**: 100% of opportunities expiring within 7 days are visible in an admin cleanup queue on the Opportunities & AI page and in the Action Center.
- **SC-028**: 100% of AI searches with zero results are available for aggregate review in the AI Search Quality Analytics section where the event log exists.

---

## Assumptions

- The primary users are CEO, CTO, founders, senior administrators, and explicitly authorized operations leaders. Normal learners and instructors do not have access unless an explicit role grant exists.
- `courses.progress_sync_events.createdAt` is the primary data source for the 24-hour activity heatmap and all peak-time intelligence. This table exists in the current schema.
- `auth.admin_audit_log` exists in the current schema (confirmed in `admin-db.schema.ts`) and is the source for the CTO Audit Log and Action Center audit trails.
- AI Search usage events require a dedicated queryable event log. If this log does not exist at implementation time, the AI search analytics and quality sections degrade gracefully to unavailable states.
- Opportunity view events are not yet in a queryable per-view event log. `user.savedOpportunities` provides the minimum viable source for saves. An opportunity view event log is a future instrumentation item.
- `user.registeredEvents` provides registered-event counts. Aggregate counts are computed by querying across all users.
- The dashboard uses the Redis caching layer (spec 011) to meet the 3-second load target. Freshness timestamps reflect when the underlying source was last queried, not when the cache was last hit.
- Lesson-level analytics are derived from `lesson_progress` (completion and watch percentage) and `progress_sync_events` (view events). Both tables exist in the current schema.
- Action Center item severity is computed by rule-based logic defined at implementation time (e.g., SLA breach > 2× the SLA period = Critical; first breach = High). These thresholds should be configurable.
- Website CTA and traffic analytics (FR-100) require external tracking instrumentation (e.g., an analytics script on the V2 pages that writes to a backend event log or an integrated analytics service). If this instrumentation does not exist at implementation time, all website funnel sections display a data-gap state. Building the instrumentation is a separate task.
- Public Impact Metrics governance (FR-099) requires agreement on which database queries represent each public metric. The responsible owner field and approval workflow require a lightweight governance model to be defined during planning.
- Team Operations (Page 9) requires organizational relationships (department, branch, chapter, ownership) to be recorded in the database. If these do not exist at implementation time, the page degrades gracefully.
- The AI Search zero-result rate and per-query metadata (FR-101) require the AI search infrastructure to emit structured events including a `hasResults` flag and a `latencyMs` field. If this is not in the AI search implementation, the quality metrics degrade gracefully.
- Action Center items do not trigger automated actions — they surface information and allow status tracking. No automated user contact, email trigger, or record modification occurs from within the Action Center.
- Automatic refresh fires no more than every 5 minutes using a notification-not-silent pattern.
- The existing admin operational pages are not replaced. The analytics workspace adds a read-oriented view that links to those pages for edit actions.

---

## Implementation Priority

### Phase 1 — Make the Dashboard Operationally Useful (P1)
Pages 1–8 (Overview, Users, Courses & Lessons, Learner Progress, Opportunities & AI, Technical Health, Action Center, Public Website & Growth) and all P1 requirements.

- Action Center operational queue with SLA breach, expiring opportunities, stalled learners, pending certificates, and data freshness failures.
- Inquiry SLA tracking and sales pipeline section.
- Opportunity cleanup queue and expiry management.
- AI zero-result rate and quality analytics (where event log exists).
- Growth funnel on Public Website & Growth page.
- Public impact metrics governance section.

### Phase 2 — Deepen Product and Business Intelligence (P2)
Pages 9–10 (Team Operations, Finance & Unit Economics) and all P2 requirements.

- Cohort retention analytics.
- Student journey and readiness analytics.
- Content quality indicators.
- Course-level unit economics and refund rate analysis.
- Team workload and branch performance.
- Event impact analytics with post-event conversion.

---

## Out of Scope

- Real-time live event streaming (WebSocket-based metric push). The dashboard uses periodic refresh with a user notification pattern.
- Predictive analytics, AI-generated forecasts, or ML-based anomaly detection. Risk indicators and Critical Drop flags are rule-based threshold comparisons.
- Multi-tenant or multi-organization views. The dashboard reflects ScholarX as a single operational entity.
- Learner-facing self-service analytics or personal progress dashboards. This workspace is exclusively for executive and authorized admin roles.
- Modification of business records from within the analytics workspace. The workspace is read-oriented; edit actions link to the existing operational admin pages.
- Integration with external BI tools (Looker, Tableau, Power BI, Metabase) in the initial version. CSV and PDF exports are the export boundary.
- Billing and payment gateway reconciliation. Revenue figures are derived from subscription records in the ScholarX database, not from payment processor statements.
- Building the opportunity view event log or the AI search event log. If they do not exist, the relevant sections degrade gracefully. Creating these logs is a separate instrumentation task.
- Geographic analytics beyond `user.nationality` and `user.city`. No IP-based geolocation is added.
- Individual lesson video engagement beyond `watchedPercentage` and `completed` in `lesson_progress`. Second-by-second heatmaps are out of scope.
- Automated actions from the Action Center. The Action Center tracks and routes operational work — it does not trigger emails, modify records, or send notifications to learners automatically.
- Website analytics instrumentation. The Public Website & Growth page displays available data; building the tracking script or integrating an analytics service is a separate task.
- Public impact metric override automation. The governance model is manual: a human owner approves or overrides each metric.
