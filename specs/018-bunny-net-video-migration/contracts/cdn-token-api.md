# Contract: CDN Token API

**Feature**: 018-bunny-net-video-migration
**Date**: 2026-07-24
**Status**: Complete

---

## Overview

API endpoint for generating HMAC-signed tokens for Bunny CDN video access.

**Endpoint**: `GET /api/bunny/token`
**Authentication**: Required (session-based)
**Rate Limit**: 5 requests per user per lesson per minute

---

## Request

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoUrl` | string | Yes | Bunny CDN video URL to sign |
| `expires` | number | No | Custom expiration timestamp (default: 1 hour from now) |

### Request Example

```
GET /api/bunny/token?videoUrl=https://vz-123.b-cdn.net/videos/lesson.m3u8&expires=1721380800
```

### Request Headers

| Header | Value | Required |
|--------|-------|----------|
| `Cookie` | Session cookie | Yes |

---

## Response

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "token": "HS256-5a5de480...",
    "expires": 1721380800,
    "signedUrl": "https://vz-123.b-cdn.net/bcdn_token=HS256-5a5de480...&token_path=%2Fvideos%2F&expires=1721380800/videos/lesson.m3u8"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data.token` | string | HMAC-SHA256 signed token |
| `data.expires` | number | Unix timestamp when token expires |
| `data.signedUrl` | string | Complete signed URL for video playback |

### Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "numericCode": 9005,
    "statusCode": 400,
    "message": "Missing required parameter: videoUrl"
  }
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "numericCode": 9002,
    "statusCode": 401,
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "numericCode": 9003,
    "statusCode": 403,
    "message": "You must be enrolled in this course to access this video"
  }
}
```

#### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "numericCode": 9004,
    "statusCode": 429,
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "numericCode": 9999,
    "statusCode": 500,
    "message": "Internal server error"
  }
}
```

---

## Validation Rules

### videoUrl Validation

- Must be a valid URL format
- Must contain `b-cdn.net` domain
- Must have `.m3u8` or `.mp4` extension
- Must not contain existing token parameters

### expires Validation

- Must be a future Unix timestamp
- Maximum value: 24 hours from now
- Minimum value: 5 minutes from now
- Default value: 1 hour from now

---

## Security

### Authentication

- Session-based authentication required
- User must be authenticated (logged in)
- Session cookie must be valid and not expired

### Authorization

- User must be enrolled in the course containing the lesson
- Free courses do not require enrollment
- Admin users can access all videos

### Rate Limiting

- 5 requests per user per lesson per minute
- Sliding window algorithm
- Redis-backed storage
- Returns 429 with `retryAfter` header when exceeded

### Token Security

- HMAC-SHA256 signing with Pull Zone URL token-authentication key (`BUNNY_CDN_TOKEN_AUTH_KEY`)
- Key stored in environment variables (never in client code)
- Token includes expiration timestamp
- Path-style tokens cover entire HLS directory

---

## Implementation Notes

### Token Signing

Bunny Advanced Token Auth — path-style directory tokens (HLS-safe).

```typescript
// Pseudocode matching BunnyCDN.TokenAuthentication + token-signer.ts
function signVideoUrl(videoUrl: string, securityKey: string, expiresAt: number): string {
  const url = new URL(videoUrl);
  // Directory prefix so one token covers .m3u8 + all .ts segments
  const tokenPath = url.pathname.substring(0, url.pathname.lastIndexOf("/") + 1);

  const signaturePath = tokenPath;
  const signingData = `token_path=${tokenPath}`;
  const ipBytes = Buffer.alloc(0); // empty when IP locking is not used

  // HMAC payload order is required: path → expires → ip → signingData
  const hmac = createHmac("sha256", securityKey);
  hmac.update(signaturePath);
  hmac.update(String(expiresAt));
  hmac.update(ipBytes);
  hmac.update(signingData);

  const signature = hmac
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const token = `HS256-${signature}`;
  // Path-style URL: token block before the real pathname (not ?query)
  return (
    `${url.origin}/bcdn_token=${token}` +
    `&token_path=${encodeURIComponent(tokenPath)}` +
    `&expires=${expiresAt}` +
    url.pathname
  );
}
```

#### Fixed Reference Vector

| Input | Value |
|-------|-------|
| `securityKey` | `test-security-key-abc123` |
| `videoUrl` | `https://vz-123.b-cdn.net/videos/lesson.m3u8` |
| `expiresAt` | `2000000000` (2033-05-18; fixed future timestamp) |

| Output | Value |
|--------|-------|
| `tokenPath` | `/videos/` |
| `token` | `HS256-WBqIz5Hj7Hl36wp-zxMHgjh3QUgwAGQ2nJPEluIyIzg` |
| `signedUrl` | `https://vz-123.b-cdn.net/bcdn_token=HS256-WBqIz5Hj7Hl36wp-zxMHgjh3QUgwAGQ2nJPEluIyIzg&token_path=%2Fvideos%2F&expires=2000000000/videos/lesson.m3u8` |

### Rate Limiting

```typescript
// Pseudocode for rate limiting
const rateLimitKey = `${userId}:${lessonId}:token-request`;
const { success } = await ratelimit.limit(rateLimitKey);
if (!success) {
  return NextResponse.json(
    { error: "Rate limit exceeded", retryAfter: 60 },
    { status: 429 }
  );
}
```

---

## Testing

### Unit Tests

- Token signing with known inputs
- URL validation for various formats
- Rate limit key generation
- Expiration timestamp calculation

### Integration Tests

- Successful token generation
- Authentication required
- Authorization check (enrollment)
- Rate limiting enforcement
- Invalid URL handling

### E2E Tests

- Token generation from frontend
- Video playback with signed URL
- Token expiration and refresh
- Error handling and retry

---

## Contract Complete

API contract fully specified with request/response formats, validation rules, security requirements, and testing strategy.
