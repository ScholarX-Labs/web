# Data Model: Bunny.net Video Infrastructure Migration

**Feature**: 018-bunny-net-video-migration
**Date**: 2026-07-24
**Status**: Complete

---

## Entity Relationship Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Video Source Domain                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐  │
│  │   VideoSource    │      │     CdnToken     │      │  LessonVideo     │  │
│  │                  │      │                  │      │    Config        │  │
│  │  url: string     │◄────│  token: string   │────►│  videoUrl: string│  │
│  │  type: enum      │      │  expires: number │      │  sourceType: enum│  │
│  │  isProtected:    │      │  tokenPath:      │      │  requiresAuth:   │  │
│  │    boolean       │      │    string        │      │    boolean       │  │
│  │  signedUrl:      │      │  videoUrl:       │      │  securityLevel:  │  │
│  │    string        │      │    string        │      │    enum          │  │
│  │  expiresAt:      │      └──────────────────┘      └──────────────────┘  │
│  │    number        │                                                       │
│  └──────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           Rate Limiting Domain                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐  │
│  │   RateLimit      │      │  RateLimitKey    │      │  RateLimit       │  │
│  │    Window        │      │                  │      │    Result        │  │
│  │                  │      │  userId: string  │      │                  │  │
│  │  windowMs:       │◄────│  lessonId:       │────►│  allowed:        │  │
│  │    number        │      │    string        │      │    boolean       │  │
│  │  maxRequests:    │      │  action: string  │      │  remaining:      │  │
│  │    number        │      │                  │      │    number        │  │
│  │  algorithm:      │      └──────────────────┘      │  resetAt:        │  │
│  │    enum          │                                │    number        │  │
│  └──────────────────┘                                └──────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           Error Handling Domain                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐  │
│  │   ErrorState     │      │  RetryConfig     │      │  UserMessage     │  │
│  │                  │      │                  │      │                  │  │
│  │  code: string    │◄────│  maxAttempts:     │────►│  message:        │  │
│  │  message: string │      │    number        │      │    string        │  │
│  │  retryable:      │      │  backoffMs:      │      │  severity:       │  │
│  │    boolean       │      │    number        │      │    enum          │  │
│  │  retryAfter:     │      │  delayMs:        │      │  action:         │  │
│  │    number        │      │    number        │      │    string        │  │
│  └──────────────────┘      └──────────────────┘      └──────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Entity Definitions

### VideoSource

Represents a video URL and its detected source type.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | Yes | — | Raw video URL (YouTube or Bunny CDN) |
| `type` | VideoSourceType | Yes | — | Detected source type |
| `isProtected` | boolean | Yes | — | Whether source requires token signing |
| `signedUrl` | string | No | null | URL with HMAC token (Bunny CDN only) |
| `expiresAt` | number | No | null | Token expiration timestamp (Bunny CDN only) |

#### VideoSourceType Enum

| Value | Pattern | Example |
|-------|---------|---------|
| `youtube` | Contains `youtube.com` or `youtu.be` | `https://www.youtube.com/watch?v=jNQXAC9IVRw` |
| `bunny-cdn` | Hostname contains `b-cdn.net` | `https://vz-123.b-cdn.net/videos/lesson.m3u8` |
| `unknown` | No pattern match | `https://example.com/video.mp4` |

#### Validation Rules

- `url` must be a valid URL format
- `type` is auto-detected from URL pattern (not user-provided)
- `isProtected` is `true` only for `bunny-cdn` type
- `signedUrl` is only populated for `bunny-cdn` type
- `expiresAt` is only populated when `signedUrl` is populated

---

### CdnToken

Represents a HMAC-signed token for Bunny CDN access.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `token` | string | Yes | — | HMAC-SHA256 signed token |
| `expires` | number | Yes | — | Unix timestamp when token expires |
| `tokenPath` | string | Yes | — | Directory prefix for HLS path-style auth |
| `videoUrl` | string | Yes | — | Original unsigned video URL |

#### Token Format

```
HS256-<base64-encoded-hmac-signature>
```

#### Token Signing Procedure

Bunny Advanced Token Auth (path-style / directory tokens). HMAC payload is
folded in order — matching `BunnyCDN.TokenAuthentication` and `token-signer.ts`:

```
signature_path = token_path          # directory prefix, e.g. "/videos/"
signing_data   = "token_path=" + token_path
ip_bytes       = empty (no IP lock)

HMAC-SHA256 updates (in order):
  1. signature_path
  2. expires_at (decimal string)
  3. ip_bytes
  4. signing_data

token = "HS256-" + base64url(hmac_digest)   # +→-, /→_, strip =
```

#### Fixed Reference Vector

| Input | Value |
|-------|-------|
| `security_key` | `test-security-key-abc123` |
| `video_url` | `https://vz-123.b-cdn.net/videos/lesson.m3u8` |
| `token_path` | `/videos/` |
| `expires_at` | `2000000000` (2033-05-18; fixed future timestamp) |

| Output | Value |
|--------|-------|
| `token` | `HS256-WBqIz5Hj7Hl36wp-zxMHgjh3QUgwAGQ2nJPEluIyIzg` |
| `signed_url` | `https://vz-123.b-cdn.net/bcdn_token=HS256-WBqIz5Hj7Hl36wp-zxMHgjh3QUgwAGQ2nJPEluIyIzg&token_path=%2Fvideos%2F&expires=2000000000/videos/lesson.m3u8` |

Path-style URL shape (token embedded in path, not query string):

```
{origin}/bcdn_token={token}&token_path={urlencoded_path}&expires={expires}{pathname}
```

#### Token Path Computation

```
video_url = "https://vz-123.b-cdn.net/videos/lesson.m3u8"
path = "/videos/lesson.m3u8"
token_path = "/videos/"  (everything up to last slash)
```

#### Validation Rules

- `token` must match `HS256-[A-Za-z0-9_-]+` pattern
- `expires` must be a future Unix timestamp
- `tokenPath` must end with `/`
- `videoUrl` must be a valid Bunny CDN URL

---

### LessonVideoConfig

Represents the video configuration for a lesson (stored in database).

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `videoUrl` | string | Yes | — | Raw URL stored in database |
| `sourceType` | VideoSourceType | Yes | — | Detected source type |
| `requiresAuth` | boolean | Yes | — | Whether enrollment is required |
| `securityLevel` | SecurityLevel | Yes | — | Security protection level |

#### SecurityLevel Enum

| Value | Description |
|-------|-------------|
| `none` | No security (YouTube free courses) |
| `token-auth` | CDN Token Authentication (Bunny CDN paid courses) |
| `drm` | Digital Rights Media (future consideration) |

#### Validation Rules

- `videoUrl` must be a valid URL format
- `sourceType` is auto-detected from `videoUrl`
- `requiresAuth` is `true` only for `bunny-cdn` source type
- `securityLevel` is `token-auth` for `bunny-cdn`, `none` for `youtube`

---

### RateLimitWindow

Represents a rate limiting configuration.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `windowMs` | number | Yes | — | Time window in milliseconds |
| `maxRequests` | number | Yes | — | Maximum requests allowed in window |
| `algorithm` | RateLimitAlgorithm | Yes | — | Rate limiting algorithm |

#### RateLimitAlgorithm Enum

| Value | Description |
|-------|-------------|
| `sliding-window` | Sliding window (recommended) |
| `fixed-window` | Fixed window (simpler but allows bursts) |
| `token-bucket` | Token bucket (smoother but more complex) |

#### Default Rate Limits

| Action | Window | Max Requests | Purpose |
|--------|--------|--------------|---------|
| `token-request` | 1 minute | 5 | Prevent token brute-force |
| `progress-update` | 1 minute | 10 | Prevent progress spam |
| `lesson-completion` | 24 hours | 1 | Prevent duplicate point awards |

---

### RateLimitKey

Represents a rate limiting key (unique identifier for rate limiting).

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `userId` | string | Yes | — | User identifier |
| `lessonId` | string | Yes | — | Lesson identifier |
| `action` | string | Yes | — | Action being rate limited |

#### Key Format

```
{userId}:{lessonId}:{action}
```

Example: `user-123:lesson-456:token-request`

---

### RateLimitResult

Represents the result of a rate limit check.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `allowed` | boolean | Yes | — | Whether request is allowed |
| `remaining` | number | Yes | — | Remaining requests in window |
| `resetAt` | number | Yes | — | Unix timestamp when window resets |

---

### ErrorState

Represents an error state for video playback.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `code` | string | Yes | — | Error identifier |
| `message` | string | Yes | — | User-facing message |
| `retryable` | boolean | Yes | — | Whether automatic retry is appropriate |
| `retryAfter` | number | No | null | Seconds to wait before retry |

#### Error Codes

| Code | Message | Retryable |
|------|---------|-----------|
| `TOKEN_EXPIRED` | Session expired — reconnecting... | Yes |
| `TOKEN_INVALID` | Unable to play — please refresh | No |
| `NETWORK_ERROR` | Connection lost — retrying... | Yes |
| `CDN_UNAVAILABLE` | Video temporarily unavailable — please try again later | Yes |
| `ACCESS_DENIED` | Access denied — please enroll in this course | No |
| `UNKNOWN_ERROR` | Something went wrong — please refresh | Yes |

---

### RetryConfig

Represents retry configuration for error recovery.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `maxAttempts` | number | Yes | 3 | Maximum retry attempts |
| `backoffMs` | number | Yes | 1000 | Initial backoff in milliseconds |
| `delayMs` | number | Yes | 0 | Initial delay before first retry |

#### Backoff Strategy

Exponential backoff with jitter:
```
delay = backoffMs * 2^attempt + random(0, backoffMs)
```

---

### UserMessage

Represents a user-facing message for error states.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `message` | string | Yes | — | User-facing message |
| `severity` | MessageSeverity | Yes | — | Message severity level |
| `action` | string | No | null | Recommended user action |

#### MessageSeverity Enum

| Value | Description |
|-------|-------------|
| `info` | Informational message |
| `warning` | Warning message |
| `error` | Error message |
| `critical` | Critical error message |

---

## State Transitions

### VideoSource State Machine

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VideoSource State Machine                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐              │
│  │   Detected   │────►│   Unsigned   │────►│    Signed    │              │
│  │              │      │              │      │              │              │
│  │ URL pattern  │      │ Bunny CDN    │      │ Token added  │              │
│  │ matched      │      │ detected     │      │              │              │
│  └──────────────┘      └──────────────┘      └──────────────┘              │
│         │                       │                       │                   │
│         │                       │                       │                   │
│         ▼                       ▼                       ▼                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐              │
│  │   YouTube    │      │   Expired    │      │    Valid     │              │
│  │              │      │              │      │              │              │
│  │ No signing   │      │ Token past   │      │ Token within │              │
│  │ needed       │      │ expiry       │      │ expiry       │              │
│  └──────────────┘      └──────────────┘      └──────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Token Refresh State Machine

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Token Refresh State Machine                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐              │
│  │    Idle      │────►│  Requesting  │────►│    Valid     │              │
│  │              │      │              │      │              │              │
│  │ Player       │      │ Token API    │      │ Token        │              │
│  │ requests     │      │ called       │      │ received     │              │
│  │ video        │      │              │      │              │              │
│  └──────────────┘      └──────────────┘      └──────────────┘              │
│         │                       │                       │                   │
│         │                       │                       │                   │
│         │                       ▼                       ▼                   │
│         │                ┌──────────────┐      ┌──────────────┐              │
│         │                │   Retrying   │      │   Expired    │              │
│         │                │              │      │              │              │
│         │                │ 403 error    │      │ Token past   │              │
│         │                │ received     │      │ expiry       │              │
│         │                │              │      │              │              │
│         │                └──────────────┘      └──────────────┘              │
│         │                       │                       │                   │
│         │                       │                       │                   │
│         │                       ▼                       ▼                   │
│         │                ┌──────────────┐      ┌──────────────┐              │
│         │                │   Failed     │      │   Refreshing │              │
│         │                │              │      │              │              │
│         │                │ Max retries  │      │ Fresh token  │              │
│         │                │ exceeded     │      │ requested    │              │
│         │                │              │      │              │              │
│         │                └──────────────┘      └──────────────┘              │
│         │                                                       │           │
│         │                                                       │           │
│         ▼                                                       ▼           │
│  ┌──────────────┐                                      ┌──────────────┐    │
│  │   Error      │                                      │    Valid     │    │
│  │              │                                      │              │    │
│  │ User sees    │                                      │ Playback    │    │
│  │ error msg    │                                      │ resumes     │    │
│  └──────────────┘                                      └──────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (No Changes Required)

The existing database schema already supports the Bunny.net migration:

### lessons table (inferred from repository)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | varchar | Lesson title |
| `video_url` | varchar(500) | Raw video URL (YouTube or Bunny CDN) |
| `duration` | integer | Duration in seconds |
| `sort_index` | integer | Lesson order |
| `course_id` | uuid | Foreign key to courses |

**Note**: The `video_url` column already exists and can store both YouTube and Bunny CDN URLs. No schema migration required.

---

## Data Flow

### Video URL → Player

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Video URL Data Flow                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. DB: lessons.video_url                                                   │
│     │  (stores raw URL — no tokens)                                         │
│     ▼                                                                       │
│  2. Service: toLessonSummary()                                              │
│     │  Maps lesson.videoUrl → media.src                                     │
│     ▼                                                                       │
│  3. Server Component: LessonPageView                                        │
│     │  Passes allLessons[] to LessonClientBridge                            │
│     ▼                                                                       │
│  4. Client Component: LessonClientBridge                                    │
│     │  Reads currentLesson.media.src                                        │
│     ▼                                                                       │
│  5. VideoPlayer: toPlayerSrc(src)                                           │
│     │  Detects URL pattern → returns PlayerSrc                              │
│     ▼                                                                       │
│  6. MediaPlayer src={playerSrc}                                             │
│     │  YouTube: direct playback                                             │
│     │  Bunny CDN: token signing → signed URL → HLS playback                 │
│     ▼                                                                       │
│  7. MediaProvider                                                           │
│     Vidstack auto-detects format from URL/headers                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Token Generation Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Token Generation Data Flow                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Frontend: Detects Bunny CDN URL                                         │
│     │                                                                       │
│     ▼                                                                       │
│  2. Frontend: Request token from /api/bunny/token                           │
│     │  Query params: videoUrl (required), expires (optional)                │
│     │  Canonical client identifier = unsigned Bunny CDN videoUrl            │
│     │  expires default/behavior matches cdn-token-api.md (1h default)       │
│     ▼                                                                       │
│  3. API Route: Validate request                                             │
│     │  Check authentication (session required)                              │
│     │  Validate videoUrl (b-cdn.net, .m3u8/.mp4, not pre-signed)            │
│     │  Check rate limit (5 per user per minute; v1 subject = userId)        │
│     │  Enrollment is enforced at lesson page (Server Component), not here   │
│     ▼                                                                       │
│  4. Token Signing: Generate HMAC-SHA256                                     │
│     │  Load security key from env                                           │
│     │  Compute token_path from validated videoUrl                           │
│     │  Sign: HMAC(path → expires → ip → token_path=…) path-style            │
│     ▼                                                                       │
│  5. API Response: Return signed URL                                         │
│     │  { token, expires, signedUrl }                                        │
│     ▼                                                                       │
│  6. Frontend: Update MediaPlayer src                                        │
│     │  Set src={signedUrl} on MediaPlayer                                   │
│     ▼                                                                       │
│  7. HLS Player: Request manifest with token                                 │
│     │  GET /videos/lesson.m3u8?token=...&expires=...                        │
│     │  Bunny CDN validates token → returns manifest                         │
│     ▼                                                                       │
│  8. HLS Player: Request segments with same token                            │
│     │  GET /videos/segment0.ts?token=...&expires=...                        │
│     │  Bunny CDN validates token → returns segment                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model Complete

All entities, fields, relationships, and state transitions documented. Ready to proceed to contracts.
