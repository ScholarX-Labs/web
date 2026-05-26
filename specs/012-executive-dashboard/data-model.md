# Data Model: Executive Dashboard Analytics

## Existing Source Entities

### User

**Source**: `auth.user`

**Used for**: total users, new users, roles, banned accounts, email verification, profile completion,
saved opportunities, registered events, geography/city, education profile, acquisition where available.

**Key fields**: `id`, `role`, `banned`, `banReason`, `emailVerified`, `createdAt`, `updatedAt`,
`educationLevel`, `university`, `faculty`, `industry`, `nationality`, `city`, `savedOpportunities`,
`registeredEvents`.

**Privacy**: names, emails, phone numbers, and social profile URLs are drilldown-only and excluded from
overview/export unless explicitly permitted.

### Course

**Source**: `courses.courses`

**Used for**: course counts, publication states, category distribution, revenue contribution,
leaderboards, owner/status, content quality flags.

**Key fields**: `id`, `title`, `category`, `status`, `currentPrice`, `salesInquiry`, `requiresForm`,
`certificateEnabled`, `isArchived`, `updatedBy`, `createdAt`, `updatedAt`.

### Lesson

**Source**: `courses.lessons`

**Used for**: total lessons, published/draft lessons, lesson analytics, completion funnels,
critical-drop detection, content quality flags.

**Key fields**: `id`, `courseId`, `title`, `videoUrl`, `duration`, `sortIndex`, `status`, `isPrivate`,
`isArchived`, `createdAt`, `updatedAt`.

### Subscription

**Source**: `courses.subscriptions`

**Used for**: active subscriptions, new/cancelled/refunded counts, revenue, net subscriptions, course
business performance, ARPU.

**Key fields**: `id`, `userId`, `courseId`, `amount`, `status`, `isActive`, `paymentId`, `enrolledAt`.

**Validation rules**:
- Active subscription = `isActive = true` and status not in `cancelled`, `refunded`, `expired`.
- Manual grant and paid subscription for same user/course count once for enrollment metrics.

### Course Progress

**Source**: `courses.course_progress`

**Used for**: progress states, completed courses, certificate eligibility, stalled learners,
completion distribution.

**Key fields**: `userId`, `courseId`, `status`, `completedLessons`, `requiredLessons`,
`progressPercentage`, `completedAt`, `certificateEligibleAt`, `updatedAt`.

### Lesson Progress

**Source**: `courses.lesson_progress`

**Used for**: lesson unique viewers, completion count, average watched percentage, funnel steps.

**Key fields**: `userId`, `lessonId`, `courseId`, `completed`, `completedAt`, `watchedPercentage`,
`updatedAt`.

### Progress Sync Event

**Source**: `courses.progress_sync_events`

**Used for**: active users, 24-hour activity heatmap, DAU trend, monthly activity, last activity,
returning cohort activity.

**Key fields**: `userId`, `courseId`, `lessonId`, `eventType`, `createdAt`.

### Inquiry

**Source**: `courses.inquiries`

**Used for**: sales pipeline, conversion rate, SLA breaches, workload, source channel where available.

**Key fields**: `id`, `courseId`, `userId`, `status`, `sourceSurface`, `createdAt`, `updatedAt`.

### Course Application

**Source**: `courses.course_applications`

**Used for**: application workload, learner segment filters, growth funnel enrollment/application step.

**Key fields**: `courseId`, `userId`, `status`, `learnerStatus`, `submittedAt`, `reviewedAt`.

### Certificate

**Source**: `certificates.certificates`

**Used for**: certificates issued, revoked certificates, eligible-but-not-issued pipeline.

**Key fields**: `certificateNumber`, `userId`, `courseId`, `courseProgressId`, `status`, `issuedAt`,
`revokedAt`, `metadata`.

**Reporting rule**: `certificates.certificates` is the canonical issued/revoked credential source.
Legacy `courses.certificates` rows must not be counted unless a reconciliation query explicitly maps
them to canonical certificate records.

### Email Delivery

**Source**: `email.email_deliveries`, `email.email_delivery_attempts`,
`email.email_provider_circuit_states`

**Used for**: email pipeline health, failed deliveries Action Center items, provider circuit state.

### Admin Audit Event

**Source**: `auth.admin_audit_log`

**Used for**: Technical Health audit log, Action Center status-change audit, export audit.

**Key fields**: `adminId`, `action`, `entityType`, `entityId`, `before`, `after`, `createdAt`.

## New Persistent Entities

### Analytics Event

**Table**: `executive.analytics_events`

**Purpose**: Generic instrumentation for website, AI search, opportunity apply-click, opportunity link
check, public CTA, and other dashboard-only events not represented by durable business records.

**Fields**:
- `id`: unique event id
- `eventType`: enum-like string (`website_visit`, `cta_click`, `signup_started`, `ai_search`,
  `opportunity_apply_click`, `opportunity_link_check`, `ai_feedback`)
- `occurredAt`: event timestamp
- `userId`: nullable user id
- `sessionIdHash`: nullable hashed session identifier
- `entityType`: nullable affected entity type
- `entityId`: nullable affected entity id
- `source`: nullable traffic/source label
- `medium`: nullable attribution medium
- `campaign`: nullable campaign
- `deviceType`: nullable device type
- `metadata`: JSON object with event-specific safe fields

**Validation rules**:
- No raw IP addresses, emails, names, phone numbers, or tokens.
- `metadata` must contain only safe, schema-validated keys per event type.
- `occurredAt` must be indexed with `eventType`.

### Metric Freshness

**Table**: `executive.metric_freshness`

**Purpose**: Track last successful source read per page/section.

**Fields**:
- `sectionId`: stable section id
- `sourceKey`: source grouping
- `lastSuccessfulAt`: nullable timestamp
- `lastAttemptedAt`: timestamp
- `status`: `current` | `stale` | `very_stale` | `unavailable`
- `lastErrorCode`: nullable safe error code
- `lastQueryDurationMs`: nullable integer duration for the latest source query
- `rollingP95DurationMs`: nullable integer duration for the rolling p95 section query latency
- `updatedAt`: timestamp

**State rules**:
- Current: last success <= 5 minutes ago.
- Stale: last success > 5 minutes and <= 1 hour ago.
- Very stale: last success > 1 hour ago.
- Unavailable: latest source query failed and no usable previous value exists.

### Action Item State

**Table**: `executive.action_item_states`

**Purpose**: Store workflow state for derived Action Center items.

**Fields**:
- `id`: unique id
- `ruleId`: stable rule id that generated the item
- `sourceKey`: stable key derived from rule id + entity type + entity id
- `severity`: `critical` | `high` | `medium` | `low`
- `sourcePage`: page id
- `sourceSection`: section id
- `entityType`: affected entity type
- `entityId`: affected entity id
- `assignedOwnerId`: nullable user id
- `status`: `open` | `in_progress` | `resolved` | `dismissed` | `escalated`
- `dueAt`: nullable timestamp
- `resolutionNote`: nullable text
- `firstSeenAt`: timestamp
- `lastSeenAt`: timestamp
- `dismissedAt`: nullable timestamp
- `resolvedAt`: nullable timestamp
- `reopenedCount`: integer, default 0
- `updatedAt`: timestamp

**State transitions**:
- `open -> in_progress`
- `open -> dismissed`
- `open -> escalated`
- `in_progress -> resolved`
- `in_progress -> escalated`
- `escalated -> in_progress`
- `escalated -> resolved`
- `dismissed` reopens to `open` if the source condition is still present at the next rule evaluation.
- `resolved` reopens to `open` if the source condition recurs within 30 days.
- `resolved` creates a new item if the source condition recurs after 30 days.

### Public Impact Metric

**Table**: `executive.public_impact_metrics`

**Purpose**: Govern public-facing impact counters shown to leadership before publishing.

**Fields**:
- `metricId`: stable id
- `label`: display label
- `computedValue`: numeric value from source query
- `manualOverrideValue`: nullable numeric override
- `sourceDescription`: safe query/source explanation
- `ownerId`: responsible user
- `approvalStatus`: `draft` | `pending_review` | `approved` | `published` | `rejected` | `expired` | `manual_override`
- `proposedBy`: nullable user id
- `approvedBy`: nullable user id
- `approvedAt`: nullable timestamp
- `rejectedBy`: nullable user id
- `rejectedAt`: nullable timestamp
- `rejectionReason`: nullable safe text
- `auditTrail`: JSON array of safe state-transition summaries
- `autoPublish`: boolean
- `freshnessAt`: timestamp
- `updatedAt`: timestamp

**State transitions**:
- `draft -> pending_review`
- `pending_review -> approved`
- `pending_review -> rejected`
- `approved -> published`
- `rejected -> draft`
- `pending_review -> expired` after 30 days without review
- Any state may become `manual_override` by an authorized admin or executive, with an audit entry.

## Read Model DTOs

### ExecutivePageQuery

- `from`: ISO date
- `to`: ISO date
- `preset`: optional date preset
- `courseId`: optional
- `courseCategory`: optional
- `userRole`: optional
- `subscriptionStatus`: optional
- `applicationStatus`: optional
- `inquiryStatus`: optional
- `learnerSegment`: optional
- `acquisitionSource`: optional

### SectionState

- `status`: `ready` | `loading` | `empty` | `data_gap` | `stale` | `partial` | `error` | `access_denied`
- `freshness`: `current` | `stale` | `very_stale` | `unavailable`
- `lastSuccessfulAt`: nullable ISO timestamp
- `message`: optional safe display message
- `source`: optional safe source label

### MetricCard

- `id`: stable metric id
- `label`: display label
- `value`: number or string
- `format`: `number` | `currency` | `percent` | `duration`
- `delta`: nullable period-over-period delta
- `definition`: metric definition
- `sensitivity`: `public_safe` | `admin_only` | `executive_only` | `restricted`
- `state`: SectionState

### ChartSeries

- `chartType`: `line` | `area` | `bar` | `stacked_bar` | `horizontal_bar` | `donut` | `funnel` | `heatmap` | `waterfall`
- `xAxisLabel`: optional
- `yAxisLabel`: optional
- `points`: typed array per chart type
- `a11ySummary`: required text summary
- `isZoomed`: boolean

### ExecutivePageResponse

- `pageId`: stable page id
- `query`: normalized query
- `generatedAt`: ISO timestamp
- `sections`: page-specific typed section map
- `freshnessSummary`: current/stale/very-stale/unavailable counts
- `redactionNotes`: strings describing role-based omissions

## Derived Entity Rules

### Stalled Learner

A learner with an active subscription and no progress sync event in the last 14 calendar days.

### Critical Drop Lesson

A lesson whose completion rate is more than 20 percentage points below the immediately preceding
lesson in the same course sort order.

### SLA-Breached Inquiry

An inquiry with no first response within the configured SLA period. Default SLA is 48 hours.

### Course Health Alert

A course meeting one of:
- Enrollment count >= threshold and completion rate < 20%
- Revenue >= threshold and refund rate > threshold

### Data Gap

A section where required instrumentation or source table is unavailable. Data gaps must be visually
distinct from true zero.
