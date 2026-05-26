# Contract: Executive Dashboard API

All routes are admin/executive-only and return JSON. Unauthorized users must receive `401` or `403`.
Routes must validate query parameters before calling the domain.

Phase 1 code access is admin-only. The contracts retain executive terminology for product intent,
but non-admin executive/operations/growth/finance roles are Phase 2 unless explicitly feature-flagged.

## Shared Query Parameters

| Parameter | Type | Required | Notes |
|---|---|---:|---|
| `from` | ISO date | Yes | Inclusive start date. |
| `to` | ISO date | Yes | Inclusive end date. |
| `preset` | string | No | One of the supported date presets. |
| `courseId` | UUID | No | Filters course-related metrics. |
| `courseCategory` | string | No | Filters course category. |
| `userRole` | string | No | Filters user/growth metrics. |
| `subscriptionStatus` | string | No | Filters subscription metrics. |
| `applicationStatus` | string | No | Filters course application metrics. |
| `inquiryStatus` | string | No | Filters sales inquiry metrics. |
| `learnerSegment` | string | No | Filters learner/application segment. |
| `acquisitionSource` | string | No | Applies only where attribution exists. |
| `page` | integer | No | Paginated tables default to 1. |
| `pageSize` | integer | No | Paginated tables default to 25 and cap at 100. |
| `sort` | string | No | Route-specific stable sort key. |
| `direction` | `asc` \| `desc` | No | Defaults to route-specific primary sort. |

## Shared DTOs

```ts
type SectionStatus =
  | "ready"
  | "empty"
  | "data_gap"
  | "stale"
  | "partial"
  | "error"
  | "access_denied";

interface SectionState {
  status: SectionStatus;
  freshness: "current" | "stale" | "very_stale" | "unavailable";
  lastSuccessfulAt: string | null;
  message?: string;
  source?: string;
}

interface MetricCardDto {
  id: string;
  label: string;
  value: number | string | null;
  format: "number" | "currency" | "percent" | "duration";
  deltaValue: number | null;
  deltaPercent: number | null;
  definition: string;
  state: SectionState;
}

interface ChartDto<TPoint> {
  id: string;
  title: string;
  chartType: "line" | "area" | "bar" | "stacked_bar" | "horizontal_bar" | "donut" | "funnel" | "heatmap" | "waterfall";
  points: TPoint[];
  a11ySummary: string;
  isZoomed: boolean;
  state: SectionState;
}

interface TableDto<TRow> {
  id: string;
  rows: TRow[];
  page: number;
  pageSize: number;
  totalRows: number;
  sort: string;
  direction: "asc" | "desc";
  state: SectionState;
}
```

## Response Envelope

```json
{
  "status": "success",
  "data": {
    "pageId": "overview",
    "query": {},
    "generatedAt": "2026-05-24T12:00:00.000Z",
    "sections": {},
    "freshnessSummary": {
      "current": 8,
      "stale": 0,
      "veryStale": 0,
      "unavailable": 0
    },
    "redactionNotes": []
  }
}
```

## Error Envelope

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "from and to are required",
  "data": {
    "fieldErrors": {
      "from": ["Required"]
    }
  }
}
```

## Routes

### GET `/api/admin/executive/overview`

Returns KPI cards, revenue trend, subscription health, sales funnel, learner completion trend,
risk indicators, Action Center summary, and freshness summary.

Sections: `kpis`, `revenueTrend`, `subscriptionHealth`, `salesPipelineFunnel`,
`learnerCompletionTrend`, `riskIndicators`, `actionCenterSummary`, `freshnessSummary`.

### GET `/api/admin/executive/users`

Returns user counters, growth chart, role distribution, activity heatmap, peak activity summary,
monthly activity, and registration timeline.

Sections: `kpis`, `growthTrend`, `roleDistribution`, `activityHeatmap`, `peakActivity`,
`monthlyActivity`, `registrationTimeline`.

### GET `/api/admin/executive/courses-lessons`

Returns course KPI row, course leaderboard, category distribution, problem course signals, content
quality indicators, and course management links.

Sections: `kpis`, `courseLeaderboard`, `categoryDistribution`, `problemCourseSignals`,
`contentQualityIndicators`, `courseManagementLinks`.

### GET `/api/admin/executive/courses-lessons/:courseId/lessons`

Returns per-lesson analytics, completion funnel, and critical-drop flags for one course.

Sections: `lessonTable`, `completionFunnel`, `criticalDropFlags`.

### GET `/api/admin/executive/learner-progress`

Returns enrollment/progress KPIs, per-course completion distribution, learner progress table,
certificate pipeline, and stalled learner breakdown.

Sections: `kpis`, `completionDistribution`, `learnerProgressTable`, `certificatePipeline`,
`stalledLearnerBreakdown`.

### GET `/api/admin/executive/opportunities-ai`

Returns AI usage metrics when instrumentation exists, opportunity saves, opportunity quality
management, expiring opportunities, and registered events.

Sections: `kpis`, `aiQueryTrend`, `aiSearchActivity`, `perUserAiUsage`, `opportunityDiscovery`,
`aiSearchQuality`, `opportunityQualityQueue`, `registeredEvents`.

### GET `/api/admin/executive/technical-health`

Returns freshness grid, pipeline health, admin audit log, platform usage, security signals,
and email pipeline health.

Sections: `freshnessGrid`, `pipelineHealth`, `adminAuditLog`, `platformUsage`, `securitySignals`,
`emailPipelineHealth`, `queryLatency`.

### GET `/api/admin/executive/action-center`

Returns derived Action Center items merged with persisted workflow state.

Sections: `actionItems`, `severitySummary`, `salesSupportPipeline`, `workloadByOwner`.

### PATCH `/api/admin/executive/action-center/:itemId`

Updates Action Center status/owner/due date/resolution note.

Request:

```json
{
  "status": "in_progress",
  "assignedOwnerId": "user_123",
  "dueAt": "2026-05-25T12:00:00.000Z",
  "resolutionNote": "Optional safe note"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "id": "item_123",
    "status": "in_progress",
    "updatedAt": "2026-05-24T12:30:00.000Z"
  }
}
```

### GET `/api/admin/executive/public-growth`

Returns growth funnel, website funnel where instrumentation exists, student journey/readiness,
cohort retention, and public impact metric governance.

Sections: `growthFunnel`, `websiteFunnel`, `studentReadiness`, `cohortRetention`,
`publicImpactMetrics`.

### GET `/api/admin/executive/public-growth/metrics`

Returns public impact metric governance rows with computed value, source description, owner,
freshness, approval status, and safe audit summary.

### POST `/api/admin/executive/public-growth/metrics`

Proposes a new or updated public impact metric value.

Request:

```json
{
  "metricId": "students_served",
  "computedValue": 1200,
  "manualOverrideValue": null,
  "sourceDescription": "Count of active learner accounts",
  "ownerId": "user_123",
  "rationale": "Monthly leadership review"
}
```

### PATCH `/api/admin/executive/public-growth/metrics/:id/approve`

Approves a pending public impact metric. A user cannot approve their own proposal.

### PATCH `/api/admin/executive/public-growth/metrics/:id/reject`

Rejects a pending public impact metric with a safe rejection reason.

### POST `/api/admin/executive/export`

Generates CSV or print snapshot payload for a page and logs an audit event.

Request:

```json
{
  "pageId": "overview",
  "format": "snapshot",
  "query": {
    "from": "2026-05-01",
    "to": "2026-05-24"
  }
}
```

Exports over 50,000 rows or a date range longer than 365 days return `413 Payload Too Large`.

## Phase 2 Routes

- `GET /api/admin/executive/team-operations`
- `GET /api/admin/executive/finance`
