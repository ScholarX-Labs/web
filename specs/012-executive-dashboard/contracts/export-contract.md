# Contract: Executive Dashboard Exports

## Export Types

### CSV Export

Used for tables and chart data.

Must include:

- Page id
- Date range
- Active filters
- Generation timestamp
- Section freshness status
- Redaction/omission notes
- Tabular data with stable headers

### Snapshot Export

Print/PDF-ready HTML view used for board-ready summaries.

Must include:

- Page title
- Date range and filters
- KPI cards
- Chart summaries and chart data tables
- Freshness notes
- Restricted-content omission notes
- Generated-by actor id or safe identifier
- Generation timestamp

## Request

```ts
interface ExecutiveExportRequest {
  pageId:
    | "overview"
    | "users"
    | "courses_lessons"
    | "learner_progress"
    | "opportunities_ai"
    | "technical_health"
    | "action_center"
    | "public_growth"
    | "team_operations"
    | "finance";
  format: "csv" | "snapshot";
  query: ExecutivePageQuery;
  sectionIds?: string[];
}
```

## Response

```ts
interface ExecutiveExportResponse {
  exportId: string;
  fileName: string;
  contentType: "text/csv" | "text/html";
  generatedAt: string;
  auditId: string;
  redactionNotes: string[];
}
```

## Overflow Response

Phase 1 does not support asynchronous export jobs. Requests over 50,000 rows or date ranges longer
than 365 days return `413 Payload Too Large` with the standard error envelope and no export file.
`202 Accepted` export jobs and `/api/admin/executive/export/status/:jobId` are Phase 2.

## Redaction Rules

- Overview exports must not include raw names, emails, phone numbers, payment ids, or full audit diffs.
- Drilldown exports may include record-level identifiers only if the actor has permission.
- Omitted restricted content must be listed in `redactionNotes`.
- Export generation must never bypass the same read service and redaction policy used by the UI.

## Audit Rules

Every export writes `auth.admin_audit_log` with:

- `action`: `executive.export.generated`
- `entityType`: `executive_export`
- `entityId`: generated export id
- `before`: null
- `after`: page id, format, query, section ids, redaction notes
- actor, IP address, user agent, timestamp
