# Specification Quality Checklist: Executive Dashboard Analytics

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-05-24
**Revised**: 2026-05-24 — v4: Professional PM Review Integration
**Feature**: [spec.md](../spec.md)

---

## Review Pass Summary

This is the fourth and most comprehensive review pass. The spec was expanded from a six-page analytics workspace into a ten-page **Analytics & Operations Command Center** based on a Professional Project Management review of the ScholarX platform direction, V2 website positioning, and operational gaps in the existing specification.

**Key additions in v4**:
- **Page 7 — Action Center**: Prioritized operational queue making the dashboard useful every day, not just before board meetings.
- **Page 8 — Public Website & Growth**: V2 homepage analytics, CTA conversion, growth funnel, student readiness, cohort retention, and public impact metrics governance.
- **Page 9 — Team Operations** *(P2)*: Workload, branch performance, ownership tracking.
- **Page 10 — Finance & Unit Economics** *(P2)*: Net revenue, refund rate, ARPU, course-level business performance.
- **9 new user stories** (Stories 8–16) covering Action Center, funnel drop-off, opportunity quality, inquiry pipeline, events, content quality, unit economics, V2 website, and public impact metrics.
- **13 new success criteria** (SC-016–SC-028).
- **12 new edge cases** covering attribution, anonymization, event tracking data gaps, AI query safety, and manual overrides.
- **Implementation Priority phasing**: Phase 1 (P1, pages 1–8) and Phase 2 (P2, pages 9–10).

---

## Content Quality

- [x] No implementation details (languages, frameworks, APIs, SQL)
- [x] Focused on user value, business decision needs, and operational usefulness
- [x] Written for non-technical and technical stakeholders
- [x] All mandatory sections completed
- [x] Executive Summary answers the five leadership questions the dashboard must resolve
- [x] Workspace Page Map table provides a clear ten-page orientation
- [x] Implementation Priority section distinguishes Phase 1 (P1) from Phase 2 (P2)
- [x] Out of Scope section updated to cover 11 items and prevent scope creep

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable and technology-agnostic
- [x] All acceptance scenarios are defined (16 user stories × multiple scenarios)
- [x] Edge cases are identified and thorough (23 edge cases)
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified (16 assumptions)
- [x] Out-of-scope items explicitly listed (12 items)

---

## Page Coverage Verification

### Page 1 — Overview (FR-011 to FR-014) ✅
- [x] KPI scorecard row with period-over-period deltas
- [x] Revenue trend chart (auto-resolution)
- [x] Subscription health stacked bar chart
- [x] Sales pipeline funnel chart
- [x] Learner completion trend chart
- [x] Risk Indicators panel — now expanded to include AI zero-result rate, expiring opportunities, and open Action Center Critical items (FR-013 updated)
- [x] Per-section freshness timestamps with link to Technical Health

### Page 2 — Users (FR-015 to FR-023) ✅
- [x] KPI row: total, new, active, banned, verified, unverified
- [x] User Growth Chart (daily/weekly/monthly auto-resolution)
- [x] Role Distribution Chart
- [x] 24-Hour × 7-Day Activity Heatmap (progress_sync_events.createdAt)
- [x] Peak Activity Summary: busiest hour, day, month
- [x] Monthly Activity Chart
- [x] User Registration Timeline
- [x] Role filter narrows all counters, charts, and heatmap

### Page 3 — Courses & Lessons (FR-024 to FR-032, FR-093 to FR-094) ✅
- [x] KPI row: total/active/draft/archived courses, total/active/draft lessons
- [x] Course Leaderboard Table (multi-column sort)
- [x] Problem Course Signal: ≥10 learners + <10% completion after 30+ days
- [x] Course Category Distribution Chart
- [x] Per-course Lesson Analytics Drilldown (view count, completion rate, watch %, drop-off delta)
- [x] Critical Drop Lesson flag (>20 pp drop)
- [x] Lesson Completion Funnel Chart
- [x] N/A vs. 0% for text-only lessons
- [x] Course Management Table with edit links
- [x] Content Quality Indicators: missing thumbnail, no owner, draft lessons in published course, stale lessons (FR-093)
- [x] Course Health Alert: high enrollment + low completion OR high revenue + high refund rate (FR-094)

### Page 4 — Learner Progress (FR-033 to FR-037) ✅
- [x] KPI row: active enrollments, completed, in-progress, stalled, certificate-eligible, issued
- [x] Per-Course Completion Distribution Chart
- [x] Learner Progress Table (paginated, filterable)
- [x] Certificate Pipeline Section (eligible, issued, revoked, actionable backlog)
- [x] Stalled Learner Breakdown (zero progress in 14 days, sorted by staleness)

### Page 5 — Opportunities & AI (FR-038 to FR-045, FR-083, FR-084, FR-101, FR-102) ✅
- [x] KPI row: AI queries, unique AI users, avg queries/user, saves, unique saved opportunities, active opportunities, expiring within 7 days
- [x] AI Search Query Volume Trend Chart (prior-period overlay)
- [x] AI Search 24-Hour Activity Chart (bar, hour 0–23)
- [x] Per-User AI Search Usage Table (role-gated)
- [x] Opportunity Discovery Section (saves, top 10 saved, net change, lifecycle counts)
- [x] Registered Events Section (user.registeredEvents)
- [x] True-zero state for zero AI queries
- [x] Graceful degradation for unavailable opportunity view event log
- [x] **AI Search Quality Analytics** (FR-101): zero-result rate, repeated failed queries, intent categories, search-to-save conversion, user feedback, latency, error rate, estimated cost
- [x] **Opportunity Quality Management** (FR-102): broken links, missing metadata, reported opportunities, high-save/low-apply flag, cleanup queue
- [x] Expiring opportunities flagged at 7/14/30 days (FR-083)
- [x] High-save/low-apply-click signal (FR-084)

### Page 6 — Technical Health (FR-046 to FR-051) ✅
- [x] Per-section freshness status grid (current/stale/very stale/unavailable)
- [x] Background Pipeline Health (certificate, email, progress sync, data aggregation — overdue detection)
- [x] Admin Audit Log (auth.admin_audit_log — paginated, filterable, diff detail role-gated)
- [x] Platform Usage Section (progress sync events, registrations, email verification rate, DAU trend)
- [x] Security Signals Section (active sessions, impersonation, banned trend, spike detection)
- [x] Email Pipeline Health (queued, sent, failed, circuit breaker state per provider)

### Page 7 — Action Center (FR-070 to FR-073, FR-085 to FR-087) ✅ NEW
- [x] Aggregated operational queue from all source pages (FR-070)
- [x] Action items include: severity, source section, entity, recommended action, owner, due date, status, last updated (FR-071)
- [x] Status transitions: open → in-progress → resolved, dismiss, escalate (FR-072)
- [x] Full audit trail for every status change in auth.admin_audit_log (FR-073)
- [x] Sales & Support Pipeline sub-section: inquiry status, owner, channel, elapsed time, follow-up due (FR-085)
- [x] SLA Breach flagging (default 48 hrs → High severity) (FR-086)
- [x] Team workload in Sales Pipeline: assigned count, overdue, avg response time, conversion rate (FR-087)

### Page 8 — Public Website & Growth (FR-074 to FR-080, FR-099, FR-100) ✅ NEW
- [x] Growth Funnel: visitor → signup → email verified → profile completed → course page viewed → enrolled → first lesson → course completed → opportunity saved (FR-074)
- [x] Acquisition source filter: source, medium, campaign, referral, direct/organic (FR-075)
- [x] Drop-off % and absolute count at every funnel step; highest drop-off step visually emphasized (FR-076)
- [x] "Unknown / Direct" attribution distinction (FR-077)
- [x] Student Journey & Readiness Analytics: profile completion distribution, missing fields, education level, field of interest, target country, "No Action Taken" segment (FR-078)
- [x] Inactive New User identification with configurable window (FR-079)
- [x] Cohort Retention Analytics: grouped by signup week/month, return rate per subsequent period (FR-080)
- [x] Public Impact Metrics governance: value, source, owner, freshness, approval status (FR-099)
- [x] V2 Website Funnel Analytics: homepage → CTA click → signup/login → course/opportunity/AI interaction; device and traffic source breakdown; data-gap state if tracking not instrumented (FR-100)

### Page 9 — Team Operations (FR-091 to FR-092) — P2 ✅
- [x] Team member count by department/role
- [x] Branch/chapter activity breakdown
- [x] Assigned and overdue task counts per team member
- [x] Ownership tracking for courses, events, opportunities, inquiries
- [x] Filter by branch, department, team, owner (FR-092)

### Page 10 — Finance & Unit Economics (FR-097 to FR-098) — P2 ✅
- [x] Gross revenue, net revenue after refunds, refund rate, payment failure rate, ARPU
- [x] Manual grant vs. paid enrollment split (FR-097)
- [x] Course-Level Business Performance Table: revenue, enrollment, completion rate, refund rate, support workload, certificate count (FR-098)
- [x] "High Refund Rate" badge for courses above configurable threshold

---

## Cross-Cutting Requirements Coverage

- [x] Global navigation between all active pages (FR-002)
- [x] Filter and date range persistence across page navigation (FR-003)
- [x] Date range presets (10 presets + custom) — FR-007
- [x] Global filter dimensions including acquisition source — FR-009 updated
- [x] Consistent filter application across metrics, charts, drilldowns, tables, exports — FR-010
- [x] Metric integrity: single source of truth, calculation definitions, anti-double-counting — FR-052 to FR-055
- [x] Chart type rules per data shape — FR-056
- [x] Anti-patterns prohibited (3D, pie > 5, truncated Y-axis) — FR-057
- [x] Responsive layout at 1280px, 768px, 375px — FR-058
- [x] Auto chart resolution (daily ≤ 30d, weekly ≤ 90d, monthly > 90d) — FR-059
- [x] All 7 section states defined (loading, empty, data-gap, stale, partial, error, access-denied) — FR-060
- [x] True-zero vs. data-gap visual distinction — FR-061
- [x] Manual refresh per section — FR-062
- [x] Non-disruptive auto-refresh (5-min minimum, notification not silent) — FR-063
- [x] Export: CSV + PDF/print — FR-064
- [x] Export includes: range, filters, timestamp, freshness, exclusion notes — FR-065
- [x] RBAC export gating with exclusion notes — FR-066
- [x] Keyboard accessibility — FR-067
- [x] Screen reader text alternatives — FR-068
- [x] Color + shape/text for trend direction (never color alone) — FR-069

---

## Functional Requirement Count Summary

| Revision | FR Count | User Stories | Success Criteria | Edge Cases |
|---|---|---|---|---|
| v1 (initial) | 32 | 5 | 12 | 7 |
| v2 (CEO/CTO pass) | 42 | 5 | 14 | 8 |
| v3 (analytics expansion) | 69 | 7 | 15 | 11 |
| **v4 (PM review)** | **102** | **16** | **28** | **23** |

---

## Operational Usefulness Verification (v4 PM Review Checklist)

- [x] Dashboard includes an Action Center, not only analytics pages
- [x] Every major risk signal has an owner, due date, and action state (FR-071)
- [x] Full student funnel is covered from visitor to opportunity/application outcome (FR-074)
- [x] V2 homepage conversion and CTA tracking are covered (FR-100)
- [x] Public impact metrics are sourced, approved, freshness-tracked, and governed (FR-099)
- [x] Opportunity quality and expiry management are covered (FR-102, FR-083)
- [x] Inquiry follow-up and SLA tracking are covered (FR-085, FR-086)
- [x] Event registration and post-event conversion are covered (FR-045, US-12)
- [x] Team/branch/owner workload is covered (FR-091, FR-092)
- [x] Course quality, content QA, and missing assets are covered (FR-093, FR-094)
- [x] AI search quality is measured, not just volume (FR-101)
- [x] Finance view includes net revenue, refund rate, and course-level business performance (FR-097, FR-098)
- [x] Dashboard helps ScholarX decide what to do today, not only what happened yesterday
- [x] Dashboard answers all five leadership questions defined in the Executive Summary

---

## Graceful Degradation Coverage

All sections that depend on data sources that may not exist at implementation time have explicit graceful degradation states:

| Section | Data Dependency | Degradation State |
|---|---|---|
| AI Search Quality & Volume | AI search event log | "AI search tracking not yet active" |
| Opportunity View Counts | Opportunity view event log | "View tracking not yet active" |
| Website Funnel Analytics | Website analytics instrumentation | "Website tracking not yet active" |
| Event Attendance | Attendance tracking per event | "Attendance tracking not active for this event" |
| Background Pipeline Health | Job completion records | "Job health data not yet available" |
| Cohort Retention | Sufficient signup history | "Not enough history for cohort analysis" |
| Team Operations | Organizational relationships in DB | "Team structure not yet configured" |
| Finance — Payment Failure Rate | Payment gateway failure records | "Payment failure data not available" |

---

## Schema Sources Confirmed

| Spec Requirement | Source Table(s) | Confirmed |
|---|---|---|
| 24-Hour Heatmap | `courses.progress_sync_events.createdAt` | ✅ |
| Lesson Analytics | `courses.lesson_progress` (watchedPercentage, completed) | ✅ |
| Admin Audit Log | `auth.admin_audit_log` (adminId, action, entityType, entityId, createdAt) | ✅ |
| Email Pipeline Health | `email.email_deliveries`, `email.email_provider_circuit_states` | ✅ |
| Opportunity Saves | `auth.user.savedOpportunities` (array field) | ✅ |
| Registered Events | `auth.user.registeredEvents` (array field) | ✅ |
| User Bans & Roles | `auth.user` (banned, banReason, banExpires, role) | ✅ |
| Certificate Pipeline | `certificates.certificates` canonical source (issuedAt, revokedAt/status) | ✅ |
| Course Applications | `courses.course_applications` (status, submittedAt, reviewedAt) | ✅ |
| Session Security | `auth.session` (expiresAt, impersonatedBy) | ✅ |
| Sales Inquiries | `courses.inquiries` (status, createdAt, updatedAt) | ✅ |
| AI Search Events | ⚠️ To be confirmed — graceful degradation specified | ⚠️ |
| Opportunity View Events | ⚠️ To be confirmed — graceful degradation specified | ⚠️ |
| Website Analytics | ⚠️ Requires instrumentation — data-gap state specified | ⚠️ |
| Team Organizational Data | ⚠️ To be confirmed — graceful degradation specified | ⚠️ |

---

## Notes

**v1 → v2**: CEO and CTO perspectives; Risk Indicators; metric integrity; chart anti-patterns; Out of Scope; entity definitions grounded in schema.

**v2 → v3**: Restructured into 6 pages; 24-hour activity heatmap; per-lesson analytics; Critical Drop flag; AI quality per user; Opportunity Discovery; Email Pipeline Health.

**v3 → v4**: Restructured into 10 pages; Action Center (operational queue, SLA breach, audit trail); Public Website & Growth (growth funnel, student readiness, cohort retention, V2 CTA analytics); Public Impact Metrics governance; Opportunity Lifecycle Management; AI Search Quality Analytics; Sales & Support Pipeline; Content Quality Indicators; Course Health Alerts; Team Operations; Finance & Unit Economics; Implementation Priority phasing; 9 new user stories; 13 new success criteria; 12 new edge cases.

**Most important architectural decision in v4**: The Action Center is not a new analytics view — it is an operational work queue. It aggregates signals from all other pages and converts them into assignable, trackable, audited action items. This is what transforms the dashboard from a reporting tool into a management workspace.
