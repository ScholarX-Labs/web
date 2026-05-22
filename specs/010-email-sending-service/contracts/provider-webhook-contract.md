# Contract: Provider Webhook Ingestion

## Scope

Provider webhook routes ingest later delivery events such as bounce, complaint, deferred, and delivered. They are server-to-server endpoints, not user-facing APIs.

## POST `/api/email/provider-events/:provider`

Supported providers for v1:

- `primary`
- `gmail_fallback`

### Required Verification

Each request must be verified before parsing or persistence.

Required checks:

- provider-specific signature or shared-secret verification
- timestamp tolerance to reject replayed old requests
- content length limit
- provider event identifier extraction
- idempotency check before appending events

Requests that fail verification must always return HTTP 401 with the single canonical error code `UNAUTHORIZED` and message `Unauthorized`. The response must not reveal whether the signature, timestamp, secret, content length, or replay check failed.

### Normalized Event

```ts
type ProviderDeliveryEvent = {
  provider: "primary" | "gmail_fallback";
  providerEventId: string;
  providerMessageId?: string;
  deliveryId?: string;
  eventType: "delivered" | "bounced" | "complained" | "deferred";
  occurredAt: string;
  reasonCategory?:
    | "recipient_rejected"
    | "content_rejected"
    | "provider_unavailable"
    | "rate_limited"
    | "unknown";
  safeDetails?: string;
};
```

### Success Response

```json
{
  "ok": true,
  "data": {
    "accepted": true
  }
}
```

Duplicate provider events should return success with `accepted: false` so providers do not retry endlessly.

### Error Response

Verification-failure response:

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

Required error codes:

- `UNAUTHORIZED`
- `UNSUPPORTED_PROVIDER`
- `INVALID_PAYLOAD`
- `EVENT_NOT_LINKED`
- `INTERNAL_ERROR`

## Persistence Rules

- Insert events idempotently by `(provider, providerEventId)`.
- Link by `deliveryId` when provided, otherwise by `providerMessageId`.
- Do not store raw provider payloads by default.
- Store only normalized event type, safe reason category, safe details, provider event ID, and timestamps.
- Bounce and complaint events must update or supplement the parent delivery status.

## Security Rules

- Webhook secrets must be private server configuration.
- Signature comparison must be timing-safe.
- Raw request bodies must not be logged.
- Unknown provider message IDs must not reveal whether an email address exists.
- Verification-failure responses must not disclose expected signatures, received signature validity, configured secret names, timestamp tolerance details, replay status, or which verification check failed.
