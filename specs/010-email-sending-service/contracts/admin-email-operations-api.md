# Contract: Admin Email Operations API

## Scope

Admin-only route contracts for inspecting email delivery status and retrying failed delivery requests. These routes are not public and must enforce admin authorization before returning any data.

## GET `/api/admin/email-deliveries`

Returns a paginated list of delivery records.

### Query Parameters

| Name | Required | Notes |
|------|----------|-------|
| `status` | no | Filter by current delivery status. |
| `category` | no | Filter by email category. |
| `recipient` | no | Optional exact recipient lookup; server converts to safe lookup form. |
| `page` | no | 1-based page number. |
| `limit` | no | Page size, capped by server policy. |
| `batchId` | no | Future bulk-send grouping filter; nullable in v1. |

### Success Response

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "delivery_123",
        "requestId": "auth-otp-user-123-20260522",
        "category": "auth_otp",
        "status": "accepted",
        "recipientMasked": "m***@example.com",
        "acceptedProvider": "primary",
        "createdAt": "2026-05-22T10:00:00.000Z",
        "updatedAt": "2026-05-22T10:00:02.000Z"
      }
    ],
    "page": 1,
    "limit": 25,
    "total": 1
  }
}
```

## GET `/api/admin/email-deliveries/:deliveryId`

Returns one delivery record with attempt and event history.

### Success Response

```json
{
  "ok": true,
  "data": {
    "id": "delivery_123",
    "requestId": "auth-otp-user-123-20260522",
    "category": "auth_otp",
    "status": "accepted",
    "recipientMasked": "m***@example.com",
    "subjectHash": "abc123def456",
    "acceptedProvider": "gmail_fallback",
    "providerMessageId": "provider-message-id",
    "failureCategory": null,
    "createdAt": "2026-05-22T10:00:00.000Z",
    "updatedAt": "2026-05-22T10:00:05.000Z",
    "attempts": [
      {
        "attemptNumber": 1,
        "provider": "primary",
        "status": "failed",
        "failureCategory": "provider_unavailable",
        "startedAt": "2026-05-22T10:00:00.000Z",
        "finishedAt": "2026-05-22T10:00:03.000Z"
      },
      {
        "attemptNumber": 2,
        "provider": "gmail_fallback",
        "status": "accepted",
        "startedAt": "2026-05-22T10:00:03.000Z",
        "finishedAt": "2026-05-22T10:00:05.000Z"
      }
    ],
    "events": []
  }
}
```

## POST `/api/admin/email-deliveries/:deliveryId/retry`

Retries a failed or retry-scheduled delivery when policy allows it.

### Request

```json
{
  "reason": "Primary provider outage resolved"
}
```

### Success Response

```json
{
  "ok": true,
  "data": {
    "deliveryId": "delivery_123",
    "status": "accepted",
    "acceptedProvider": "primary",
    "retriedAt": "2026-05-22T10:10:00.000Z"
  }
}
```

## Error Response

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Admin access is required"
  }
}
```

Required error codes:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `INVALID_REQUEST`
- `RETRY_NOT_ALLOWED`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## Security Rules

- Responses must not include provider credentials.
- Responses must not include raw provider payloads.
- Responses must not include full email body content.
- Recipient display must be masked by default.
- Admin authorization must happen before any lookup returns delivery existence.
- Large result sets must be paginated; unbounded export is not part of v1.
- Admin diagnostics must expose retry depth, provider, and failure category but not raw SMTP responses.
