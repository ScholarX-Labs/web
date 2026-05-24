# Feature Specification: Executive Dashboard Analytics

**Feature Branch**: `012-executive-dashboard`  
**Created**: 2026-05-24  
**Status**: Draft  
**Input**: User description: "Review V1 admin dashboards and statistics, then create a professional specification for executive-grade dashboards with the information and graphs any CEO and CTO would need."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - CEO Reviews Business Health (Priority: P1)

As a CEO, I want one executive overview that shows ScholarX business health across revenue, growth, subscriptions, sales pipeline, course performance, learner outcomes, and urgent risks, so that I can understand company momentum in under five minutes.

**Why this priority**: The primary value of the feature is giving executive leadership a reliable, decision-ready command center.

**Independent Test**: Can be tested by signing in as an authorized executive, opening the overview, selecting a date range, and confirming that the page shows current headline metrics, trend charts, top drivers, and risk indicators without navigating elsewhere.

**Acceptance Scenarios**:

1. **Given** an authorized CEO has selected the default time range, **When** the overview loads, **Then** it shows total revenue, revenue this period, subscription counts, new users, active learners, sales pipeline status, top courses, conversion indicators, and data freshness.
2. **Given** the CEO changes the time range, **When** the dashboard refreshes, **Then** all headline metrics, trend charts, rankings, and comparisons update to match the selected range.
3. **Given** a metric has materially increased or decreased versus the prior comparable period, **When** the CEO views the metric, **Then** the dashboard shows the direction, magnitude, and whether the change is favorable or unfavorable.

---

### User Story 2 - CTO Reviews Platform And Operational Health (Priority: P1)

As a CTO, I want a dedicated technical health view that combines product usage, system reliability, data freshness, error states, background work health, admin activity, and security-sensitive events, so that I can detect operational risk before it affects learners or administrators.

**Why this priority**: Executive dashboards are incomplete if they show revenue without the operational health that sustains it.

**Independent Test**: Can be tested by opening the CTO view and verifying that it separates normal product metrics from operational alerts, stale data warnings, admin mutations, and reliability indicators.

**Acceptance Scenarios**:

1. **Given** all monitored areas are healthy, **When** the CTO opens the technical health view, **Then** the dashboard displays an overall healthy state, current freshness timestamps, recent activity, and no urgent alerts.
2. **Given** one or more monitored areas are stale, degraded, or failing, **When** the CTO opens the view, **Then** the dashboard highlights the affected area, severity, last known good update, and user-facing impact.
3. **Given** high-risk admin actions occurred during the selected range, **When** the CTO reviews operational activity, **Then** the dashboard lists role changes, account blocks, subscription changes, course visibility changes, and other audited events with safe summary details.

---

### User Story 3 - Leadership Drills Into Revenue, Growth, And Sales (Priority: P2)

As an executive leader, I want to drill from summary metrics into revenue trends, user acquisition, subscription movement, and sales inquiry funnel performance, so that I can understand what caused changes instead of only seeing totals.

**Why this priority**: Totals are useful, but executive decisions require drivers, segments, and trends.

**Independent Test**: Can be tested by selecting a revenue, user, subscription, or sales metric and confirming that the dashboard exposes a detail view with trend, breakdown, top contributors, and filtered records where appropriate.

**Acceptance Scenarios**:

1. **Given** the executive selects revenue, **When** the detail view opens, **Then** it shows total revenue, period-over-period comparison, revenue by month, revenue by course, average revenue per subscription, and top revenue contributors.
2. **Given** the executive selects growth, **When** the detail view opens, **Then** it shows total users, new users, active users, role distribution, signup trend, and retention or reactivation indicators where data exists.
3. **Given** the executive selects sales pipeline, **When** the detail view opens, **Then** it shows new, contacted, converted, lost, conversion rate, pipeline aging, and the highest priority inquiries requiring action.

---

### User Story 4 - Course And Learner Performance Is Explained (Priority: P2)

As a product and learning leader, I want course, enrollment, completion, application, and learner engagement analytics in one place, so that I can identify which offerings are growing, which are underperforming, and where learners get stuck.

**Why this priority**: ScholarX success depends on both commercial performance and learner outcomes.

**Independent Test**: Can be tested by opening the course performance view and verifying that courses can be ranked and compared by enrollments, revenue, completion, applications, sales inquiries, and engagement health.

**Acceptance Scenarios**:

1. **Given** multiple courses have activity, **When** the course view loads, **Then** it ranks top and bottom courses by enrollment, revenue, completion rate, and recent learner activity.
2. **Given** a course requires applications or sales inquiries, **When** the course is inspected, **Then** the dashboard shows application or inquiry volume, approval or conversion status, and pending workload.
3. **Given** learner engagement drops during the selected period, **When** the leader reviews learner performance, **Then** the dashboard identifies affected courses, cohorts, or learner segments where available.

---

### User Story 5 - Executives Export And Share Board-Ready Snapshots (Priority: P3)

As an executive, I want to export filtered dashboard snapshots and board-ready summaries, so that I can share consistent numbers in leadership meetings without manually copying charts.

**Why this priority**: Export and sharing are important, but the dashboard must first be accurate and decision-ready.

**Independent Test**: Can be tested by applying filters, exporting a snapshot, and confirming the exported file contains the same metrics, date range, filters, charts or chart data, and freshness notes visible on screen.

**Acceptance Scenarios**:

1. **Given** an executive applies filters and date ranges, **When** they export the dashboard, **Then** the export includes the selected range, filters, metrics, comparisons, chart data, and generated timestamp.
2. **Given** some data is stale or partially unavailable, **When** an export is generated, **Then** the export clearly marks stale or missing sections instead of presenting incomplete data as current.
3. **Given** the user does not have permission to view a metric category, **When** they export a dashboard, **Then** restricted metrics are excluded from the export.

### Edge Cases

- When no data exists for the selected range, the dashboard shows empty states that explain the absence of data and avoids misleading zero-value trends.
- When only part of the data is available, unaffected sections remain usable while affected sections show freshness, missing source, and last successful update.
- When the selected period has no prior comparable period, comparisons are hidden or marked unavailable instead of showing false growth.
- When a metric contains sensitive user or revenue information, only users with the correct role can view it, export it, or drill into it.
- When an authorized user's role changes while they are viewing the dashboard, restricted dashboard data and exports become unavailable on the next refresh.
- When unusually high or low values appear, the dashboard distinguishes confirmed metrics from anomalies that need review.
- When a date range is invalid or too large for interactive analysis, the user receives a clear correction path.
- When data refresh is in progress, the dashboard preserves the last known complete view and clearly indicates refresh status.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an executive overview dashboard for authorized leadership users showing business, product, learner, sales, and operational health in a single first-screen experience.
- **FR-002**: System MUST preserve and exceed the V1 baseline metrics: total users, total courses, total revenue, active subscriptions, revenue report, user report, course report, sales inquiry status counts, registration or event velocity where applicable, geographic distribution where applicable, track or category popularity, and filtered record exports.
- **FR-003**: System MUST provide separate CEO-oriented and CTO-oriented dashboard views while allowing authorized users to switch between them without losing the selected date range and filters.
- **FR-004**: System MUST show data freshness for every dashboard section, including last successful update time and whether the section is current, stale, partial, or unavailable.
- **FR-005**: System MUST support date range selection with quick presets for today, last 7 days, last 30 days, month to date, quarter to date, year to date, and custom ranges.
- **FR-006**: System MUST show period-over-period comparison for headline metrics where a comparable prior period exists.
- **FR-007**: System MUST provide revenue analytics including total revenue, period revenue, revenue trend, revenue by course, average revenue per subscription, active subscription revenue indicators, cancellations, refunds where available, and top revenue contributors.
- **FR-008**: System MUST provide growth analytics including total users, new users, active users, role distribution, signup trend, blocked or suspended account counts, and user activation indicators where data exists.
- **FR-009**: System MUST provide subscription analytics including active, cancelled, expired, refunded, new, churned, and manually granted subscriptions where data exists.
- **FR-010**: System MUST provide course analytics including total courses, active or published courses, draft or inactive courses, category distribution, top enrolled courses, low-performing courses, course revenue, completion rate, lesson engagement, and application or inquiry workload.
- **FR-011**: System MUST provide sales pipeline analytics including new, contacted, converted, lost, conversion rate, inquiry aging, pending follow-up workload, and converted revenue or course access impact where data exists.
- **FR-012**: System MUST provide learner success analytics including enrollments, course starts, completion rate, certificate eligibility or issuance where data exists, stalled learners, and course-level engagement trends.
- **FR-013**: System MUST provide opportunity and scholarship discovery analytics where data exists, including searches, viewed opportunities, saved or shared opportunities, and conversion to learner action.
- **FR-014**: System MUST provide event or campaign analytics where data exists, including total registrations, registrations today, registration trend, segment distribution, geographic distribution, and exportable registrant lists.
- **FR-015**: System MUST provide CTO operational indicators including dashboard data health, public discovery health, admin action volume, background processing health where available, error or degradation alerts, and unusual activity signals.
- **FR-016**: System MUST provide drilldowns from each headline metric to supporting trend charts, segment breakdowns, and relevant filtered records when the viewer has permission.
- **FR-017**: System MUST provide chart types appropriate to the metric: line or area charts for trends, bars for ranked comparisons, stacked bars for status composition, donuts only for compact distributions, funnels for pipeline conversion, and tables for records requiring action.
- **FR-018**: System MUST allow filtering by time range, course, category, user role, subscription status, sales inquiry status, application status, event or campaign, geography where available, and learner segment where available.
- **FR-019**: System MUST clearly label every metric with its definition, included records, excluded records, and calculation basis in a compact glossary or contextual help.
- **FR-020**: System MUST avoid double-counting revenue, subscriptions, enrollments, manual grants, and refunded or cancelled records.
- **FR-021**: System MUST restrict executive, financial, operational, and user-sensitive metrics to authorized roles only.
- **FR-022**: System MUST prevent public users, normal learners, and unauthorized staff from viewing dashboard pages, dashboard data, drilldowns, or exports.
- **FR-023**: System MUST redact sensitive personal data from overview cards, charts, alerts, and exports unless the user explicitly opens a permitted record-level drilldown.
- **FR-024**: System MUST show loading, empty, stale, partial, error, and access-denied states for every dashboard section.
- **FR-025**: System MUST provide exports for overview snapshots, filtered records, and chart data with selected filters, date range, generation timestamp, and freshness status.
- **FR-026**: System MUST support manual refresh and automatic refresh indicators without surprising users or shifting the layout during analysis.
- **FR-027**: System MUST highlight urgent anomalies and risks, including sharp revenue drops, abnormal cancellation spikes, stalled sales pipeline, data staleness, and operational degradation.
- **FR-028**: System MUST provide a recent activity timeline for important administrative and operational events, including course changes, user status changes, subscription changes, role changes, inquiry changes, and configuration changes where available.
- **FR-029**: System MUST make charts and tables usable on desktop, tablet, and mobile widths without overlapping labels, clipped values, or inaccessible controls.
- **FR-030**: System MUST make all dashboard controls, charts, drilldowns, and exports accessible by keyboard and understandable to assistive technologies.
- **FR-031**: System MUST keep existing admin management workflows separate from executive analytics so operational actions do not crowd the CEO/CTO overview.
- **FR-032**: System MUST provide a consistent interpretation of metric names and totals across overview, reports, drilldowns, and exports.

### Key Entities *(include if feature involves data)*

- **Executive Dashboard**: The overall leadership analytics workspace, including selected audience view, filters, freshness state, alerts, and visible sections.
- **Dashboard Section**: A grouped business or operational area such as revenue, growth, subscriptions, courses, sales pipeline, learner success, events, opportunity discovery, or technical health.
- **Dashboard Metric**: A named value with current amount, prior comparison, definition, freshness, sensitivity level, and optional target or threshold.
- **Chart Insight**: A visual explanation of a metric, including chart type, data points, labels, comparison period, and related drilldown.
- **Time Range**: The selected period used to calculate metrics, comparisons, charts, and exports.
- **Segment Filter**: A user-selected constraint such as course, category, role, status, event, geography, or learner segment.
- **Revenue Performance**: Financial analytics including revenue totals, revenue trend, course contribution, subscription contribution, refunds, cancellations, and average revenue indicators.
- **Growth Performance**: User and account analytics including signups, active users, role distribution, blocked or suspended accounts, and activation indicators.
- **Course Performance**: Course-level analytics including publication status, enrollments, revenue, completion, learner activity, applications, and sales inquiry workload.
- **Sales Pipeline**: Sales inquiry analytics including status counts, conversion rate, aging, pending follow-up, and converted access or revenue impact.
- **Learner Success**: Learning outcome analytics including starts, progress, completion, certificate readiness, issued certificates, and stalled learner signals.
- **Operational Health**: CTO-facing reliability and governance indicators including data freshness, degraded sections, unusual activity, admin activity, and background process health where available.
- **Admin Activity Event**: A summarized event representing an important administrative change with actor, action type, affected entity, timestamp, and sensitivity classification.
- **Dashboard Export**: A generated snapshot or dataset that records visible metrics, filters, chart data, freshness, generation timestamp, and permission-limited content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of authorized executives can answer "Is the business healthy this period?" within 5 minutes using the overview dashboard alone.
- **SC-002**: 90% of authorized technical leaders can identify whether the platform analytics are current, stale, or degraded within 2 minutes.
- **SC-003**: 95% of dashboard views show all available headline metrics and charts within 3 seconds for standard date ranges.
- **SC-004**: 100% of dashboard sections display freshness status and last successful update time.
- **SC-005**: 100% of restricted financial, operational, and personal data is hidden from unauthorized roles in dashboard views, drilldowns, and exports.
- **SC-006**: 95% of executives can export a board-ready snapshot with the correct filters and date range in under 60 seconds.
- **SC-007**: Metric totals shown in overview, drilldown, and export views match each other for the same filters and date range in 100% of sampled validation checks.
- **SC-008**: At least 8 core executive metric groups are represented: revenue, users, subscriptions, courses, sales pipeline, learner success, event/campaign performance where applicable, and operational health.
- **SC-009**: The dashboard reduces manual reporting effort for monthly leadership review by at least 50% compared with manually collecting V1 admin reports.
- **SC-010**: 90% of sampled charts remain readable and non-overlapping across desktop, tablet, and mobile review.
- **SC-011**: 100% of empty, stale, partial, and error states are understandable without developer assistance.
- **SC-012**: Executive users rate the dashboard as decision-ready in at least 4 out of 5 satisfaction score during stakeholder acceptance review.

## Assumptions

- V1 dashboard coverage is the minimum baseline, not the target quality bar.
- The primary users are CEO, CTO, founders, senior administrators, and authorized operations leaders.
- The CEO view prioritizes business performance, growth, revenue, learner outcomes, and risk.
- The CTO view prioritizes data health, operational reliability, security-sensitive admin activity, and degraded-system signals.
- Existing admin management pages continue to exist; this feature focuses on analytics, insights, drilldowns, and exports.
- Sensitive record-level data is only available in drilldowns for roles already permitted to view that data.
- Metrics should use the same source-of-truth definitions across overview cards, charts, reports, and exports.
- Where a data category does not yet exist, the dashboard should show an unavailable or not-yet-tracked state rather than inventing values.
- Date and currency display should match the user's locale where possible while preserving consistent exported values.
- Automatic refresh should be conservative enough to support live awareness without disrupting analysis or causing unnecessary load.
