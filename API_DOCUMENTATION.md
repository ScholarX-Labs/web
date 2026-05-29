# 📡 API_DOCUMENTATION

## Conventions
- Framework: Next.js route handlers (`src/app/api/**/route.ts`)
- JSON responses by default
- Auth required for protected/admin endpoints
- Validation at boundaries for query/body params

## Representative Endpoints

### Public / Product
1. `GET /api/opportunities/search?q=...`
- Performs public opportunity search
- Applies rate limit checks
- Emits non-blocking analytics (`ai_search`)

2. `POST /api/analytics/events`
- Internal mirror ingestion endpoint for selected client events
- Validates payload schema
- Sanitizes and records analytics event

### Executive / Admin
1. `GET /api/admin/executive/*`
- Serves executive page read-model payloads
- Requires auth/admin access
- Supports date-window and paging query shapes per section

## Error Handling Pattern
- `400` invalid request/query
- `401` unauthenticated
- `403` unauthorized
- `404` feature-disabled/resource-not-found contextually
- `429` rate-limited
- `500` unexpected server errors

## Versioning
- Current APIs are path-versionless and controlled through internal contracts/tests.
- Backward compatibility is maintained through additive changes where possible.

