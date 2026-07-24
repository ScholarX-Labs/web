# Specification: Bunny.net Video Infrastructure Migration

**Feature**: Bunny.net Video Infrastructure Migration
**Short Name**: `bunny-net-video-migration`
**Created**: 2026-07-24
**Status**: Draft
**Decision Record**: Vidstack (custom player) approach — preserves heatmap overlay, quality selector, ambilight effects, focus mode, seek-from tracking, and all custom UI. CDN Token Authentication + Allowed Domains security stack only (no MediaCage DRM).

---

## 1. Overview

ScholarX is migrating its paid course video infrastructure from YouTube to Bunny.net Stream to prevent content theft via browser developer tools. The platform must support **two video sources simultaneously** through the same custom player with **zero security coupling** between them:

- **YouTube** — free courses (public preview, SEO-driven, zero-cost hosting)
- **Bunny CDN** — paid courses (protected, token-authenticated, enrolled-user-only)

This migration preserves all existing player features (custom UI, heatmap overlay, quality selection, focus mode, seek tracking) while adding server-side content protection for premium video content.

---

## 2. Problem Statement

### Current State

All course videos currently use YouTube URLs stored in the database. While YouTube works well for free/public content, paid course videos are vulnerable to:

- **Browser Inspect Tool theft**: Users can right-click, inspect network requests, and extract direct video URLs
- **URL sharing**: Paid content URLs can be shared with non-enrolled users
- **Download tools**: Browser extensions can download YouTube videos directly
- **No access control**: Once a URL is known, anyone can watch regardless of enrollment status

### Impact

- **Revenue loss**: Premium course content can be accessed without payment
- **Content theft**: Instructors' proprietary content can be redistributed
- **Brand damage**: Uncontrolled distribution undermines course value proposition
- **No audit trail**: Cannot track who accessed what content and when

### Root Cause

YouTube is designed for public content distribution. It lacks:
- Per-request token authentication for video segments
- Domain-level embedding restrictions
- Server-side access control for paid content
- HMAC-signed URLs with expiration

---

## 3. Goals & Success Criteria

### Primary Goals

| Goal | Success Metric | Measurement |
|------|---------------|-------------|
| **Content Protection** | Paid videos cannot be accessed without enrollment | Security audit: unsigned CDN requests return 403 |
| **Zero Downtime Migration** | No playback interruption during migration | Monitoring: 0 playback errors during migration window |
| **Feature Parity** | All existing player features work with Bunny CDN | QA checklist: heatmap, quality selector, focus mode, seek tracking all functional |
| **Instant Rollback** | A lesson can switch from Bunny CDN back to YouTube in < 1 minute | Operational test: admin changes URL, playback works immediately |
| **Performance** | Video start time ≤ YouTube baseline | User testing: time-to-first-frame ≤ 2 seconds |
| **Scalability** | System supports 10,000+ concurrent video streams | Load test: no degradation at 10K concurrent |

### Secondary Goals

| Goal | Success Metric |
|------|---------------|
| **Admin Simplicity** | Admin can update a lesson's video source in < 30 seconds via existing UI |
| **Developer Experience** | New video source detection requires < 10 lines of code |
| **Type Safety** | Zero `any` types in video-related code paths |
| **Error Recovery** | Expired tokens auto-refresh without user intervention |

---

## 4. Architectural Rule — Dual Video Source Support (Non-Negotiable)

> **This rule is permanent. No migration, refactor, or optimization may violate it.**

### The Rule

ScholarX must **always** support two video sources simultaneously through the same player, with **zero security coupling** between them:

| Source | Used For | Security | Token Signing | Rollback |
|--------|----------|----------|---------------|----------|
| **YouTube** | Free courses (public preview) | None | None — URLs pass through as-is | Already live — no changes |
| **Bunny CDN** | Paid courses (enrolled users) | CDN Token Auth + Allowed Domains | Server-side HMAC signing | Change `video_url` back to YouTube URL |

### Why This Rule Exists

1. **Free courses stay on YouTube** — they're public, marketing-driven, and benefit from YouTube's SEO, discovery, and zero-cost hosting
2. **Paid courses move to Bunny CDN** — they're protected, token-authenticated, and restricted to enrolled users
3. **Rollback must be instant** — if Bunny CDN has issues, an admin changes `lessons.video_url` from a Bunny CDN path to a YouTube URL, and playback works immediately with zero code deploy
4. **No feature parity requirement** — YouTube lessons don't get CDN token signing; Bunny lessons don't get YouTube SEO. Each source runs its own security model independently

### Invariants

- YouTube URLs must never be signed with CDN Token Auth
- Bunny CDN URLs must never be played without token signing
- The player must never refuse to play a valid YouTube URL
- The player must never play a Bunny CDN URL without a valid token
- Free course lessons must never require authentication to play
- Paid course lessons must never be accessible without enrollment
- Rolling back a lesson source must never require code changes
- The source detection function must never hardcode a single source type

---

## 5. User Scenarios & Testing

### Scenario 1: Enrolled Student Watches Paid Course

**Actor**: Enrolled student
**Flow**:
1. Student navigates to a paid course lesson page
2. Player requests a signed video URL from the server
3. Server generates a time-limited, HMAC-signed token for the Bunny CDN URL
4. Player receives signed URL and begins HLS playback
5. Progress tracking events (time update, pause, seek, completion) fire normally
6. If token expires mid-playback, player automatically requests a fresh token and resumes

**Expected Outcome**: Seamless playback with all features (heatmap, quality selector, resume) working identically to YouTube lessons

**Edge Cases**:
- Token expires during playback → auto-refresh without interruption
- Network failure during token request → retry with exponential backoff
- Student pauses for 30+ minutes → token may expire, refresh on resume

### Scenario 2: Admin Updates Lesson Video Source

**Actor**: Course administrator
**Flow**:
1. Admin opens lesson editor in dashboard
2. Admin replaces video URL field with new Bunny CDN URL
3. Admin saves changes
4. Next student playback uses new source with CDN token authentication

**Expected Outcome**: Video source changes instantly, no code deploy required

**Edge Cases**:
- Invalid Bunny CDN URL → clear error message in player
- URL missing video library prefix → graceful fallback with user-friendly error

### Scenario 3: Emergency Rollback

**Actor**: Course administrator
**Flow**:
1. Admin identifies Bunny CDN issue (outage, pricing change, feature gap)
2. Admin opens lesson editor
3. Admin changes `video_url` from Bunny CDN path to YouTube URL
4. Admin saves — lesson now plays from YouTube immediately

**Expected Outcome**: Rollback completes in < 1 minute, no code changes, no server restart

### Scenario 4: Free Course Preview

**Actor**: Any visitor (authenticated or not)
**Flow**:
1. Visitor navigates to a free course lesson
2. Player detects YouTube URL
3. Player uses YouTube provider directly (no token signing)
4. Video plays with standard YouTube controls

**Expected Outcome**: Free content plays without any authentication or token requirements

### Scenario 5: Concurrent Access and Token Sharing

**Actor**: Multiple users accessing same paid lesson
**Flow**:
1. User A and User B both access the same paid lesson
2. Each receives their own signed token with unique expiration
3. The signed URL is a bearer credential: anyone who possesses it can use it until expiry
4. Bunny Allowed Domains restrict the embedding origin but do not prevent URL reuse from the same or an allowed origin
5. If IP locking is needed, the implementation must bind the client IP into the HMAC signature and enable Bunny Advanced Token Authentication IP validation; this is not currently implemented

**Expected Outcome**: Each user gets independent, time-limited access tokens. Because tokens are bearer credentials without IP binding, a shared URL remains usable by others until it expires.

---

## 6. Functional Requirements

### FR-1: Dual Source Detection

The system must automatically detect whether a video URL is a YouTube URL or a Bunny CDN URL and route playback accordingly.

**Acceptance Criteria**:
- YouTube URLs (containing `youtube.com` or `youtu.be`) are routed to the YouTube provider
- Bunny CDN URLs (hostname containing `b-cdn.net`) are routed to the HLS provider with token authentication
- External HLS URLs (`.m3u8` on non-Bunny hosts) are routed as unprotected fallback streams
- All other URLs are passed through as fallback
- Detection must work with both `youtube.com/watch?v=` and `youtu.be/` formats
- Detection must work with both `vz-xxx.b-cdn.net` and `library.b-cdn.net` CDN hosts

### FR-2: Server-Side Token Generation

The system must generate time-limited, HMAC-signed tokens for Bunny CDN URLs on the server side. The Pull Zone token-authentication key (`BUNNY_CDN_TOKEN_AUTH_KEY`) must never be exposed to client code.

**Acceptance Criteria**:
- Token generation endpoint exists and is accessible to authenticated users
- Tokens are HMAC-SHA256 signed using the Pull Zone URL token-authentication key (`BUNNY_CDN_TOKEN_AUTH_KEY`), NOT the Video Library API key
- Tokens include an expiration timestamp (recommended: 1 hour TTL)
- Tokens use path-style authentication for HLS streams (covers playlist + segments)
- The signing key is stored in environment variables, never in client bundles
- Token generation takes < 100ms

### FR-3: Path-Style Token Authentication for HLS

For HLS streams (.m3u8 + .ts segments), the system must use path-style tokens that sign the directory prefix, not just the exact URL.

**Acceptance Criteria**:
- Path-style tokens cover the entire video directory (playlist + all segments)
- Segment requests use the same token as the playlist request
- Token format follows Bunny.net specification: `bcdn_token=<token>&expires=<expires>&token_path=<path>`
- Both `.m3u8` playlist files and `.ts` segment files are accessible with the same token

### FR-4: Token Refresh Strategy

The system must handle token expiration gracefully during long video playback sessions.

**Acceptance Criteria**:
- Initial token TTL is 1 hour (long enough for most lessons)
- If a 403 error occurs during playback, the player automatically requests a fresh token
- Token refresh happens transparently without user intervention
- If refresh fails after 3 attempts, the user sees a clear error message
- User-facing messages: "Session expired — reconnecting..." during retry, "Unable to play — please refresh" if retry fails

### FR-5: Progress Tracking Preservation

All existing progress tracking features must work identically with Bunny CDN as they do with YouTube.

**Acceptance Criteria**:
- Time update events fire correctly with HLS playback
- Pause position is captured accurately
- Seek events (both "from" and "to" positions) are tracked
- Lesson completion triggers at 90%+ watched
- Heatmap overlay renders correctly from pause events
- Resume playback works across sessions
- Progress syncs to server on completion and on page hide

### FR-6: Quality Selector Compatibility

The custom quality selector must work with Bunny CDN's adaptive bitrate streams.

**Acceptance Criteria**:
- Quality selector displays available quality levels from Bunny CDN
- Manual quality selection overrides adaptive bitrate
- Auto-quality mode is available and works correctly
- Quality changes happen without playback interruption
- Selected quality persists across lesson navigation

### FR-7: Security Stack

The system must implement a layered security approach for paid course content.

**Acceptance Criteria**:
- **Layer 1**: CDN Token Authentication — all CDN URLs require signed tokens
- **Layer 2**: Allowed Domains — only approved domains can embed/request videos
- **Layer 3**: Block Direct URL File Access — raw .mp4 downloads are blocked
- **Layer 4**: Embed View Token Authentication — iframe embeds are signed
- All security layers are configurable via Bunny dashboard
- Security failures return clear 403 responses with appropriate error messages

### FR-8: Rate Limiting

The system must prevent abuse of token generation and progress tracking endpoints.

**Acceptance Criteria**:
- Token requests are limited to 5 per user per lesson per minute
- Progress updates are limited to 10 per user per lesson per minute
- Lesson completions are limited to 1 per user per lesson per 24 hours
- Rate limit violations return 429 status with retry-after header
- Rate limiting uses sliding window algorithm

### FR-9: Admin Lesson Editor Integration

The existing admin lesson editor must support Bunny CDN URLs without modification to the editing workflow.

**Acceptance Criteria**:
- Video URL field accepts both YouTube and Bunny CDN URLs
- No validation changes required — both URL formats are valid
- Save operation works identically for both source types
- Admin can see which source type is currently configured (visual indicator)

### FR-10: Error Handling & User Experience

The system must handle all error states gracefully with clear user communication.

**Acceptance Criteria**:
- Invalid/expired tokens show "Session expired — reconnecting..." message
- Network failures show "Connection lost — retrying..." message
- CDN outages show "Video temporarily unavailable — please try again later"
- All error messages are non-technical and user-friendly
- Error states include automatic retry where appropriate
- Critical errors include a manual "Refresh" button

---

## 7. Key Entities

### Video Source

| Property | Type | Description |
|----------|------|-------------|
| `url` | string | Raw video URL (YouTube or Bunny CDN) |
| `type` | enum | `"youtube"` \| `"bunny-cdn"` \| `"unknown"` |
| `isProtected` | boolean | Whether the source requires token signing |
| `signedUrl` | string | URL with HMAC token (Bunny CDN only) |
| `expiresAt` | number | Token expiration timestamp (Bunny CDN only) |

### CDN Token

| Property | Type | Description |
|----------|------|-------------|
| `token` | string | HMAC-SHA256 signed token |
| `expires` | number | Unix timestamp when token expires |
| `tokenPath` | string | Directory prefix for HLS path-style auth |
| `videoUrl` | string | Original unsigned video URL |

### Lesson Video Config

| Property | Type | Description |
|----------|------|-------------|
| `videoUrl` | string | Raw URL stored in database |
| `videoSource` | enum | Detected source type |
| `requiresAuth` | boolean | Whether enrollment is required |
| `securityLevel` | enum | `"none"` \| `"token-auth"` \| `"drm"` |

### Error State

| Property | Type | Description |
|----------|------|-------------|
| `code` | string | Error identifier |
| `message` | string | User-facing message |
| `retryable` | boolean | Whether automatic retry is appropriate |
| `retryAfter` | number | Seconds to wait before retry (optional) |

---

## 8. Assumptions

1. **Bunny Stream video library is created** — The migration assumes a Bunny Stream video library exists with videos uploaded and organized
2. **Video Library API Key is available** — The API key for HMAC signing is stored in environment variables
3. **HLS transcoding is enabled** — Bunny Stream is configured to transcode uploaded videos to HLS format
4. **Vidstack supports HLS** — The current Vidstack version (^1.12.13) includes HLS support via bundled hls.js
5. **Existing progress tracking works with HLS** — All Vidstack events (onTimeUpdate, onPause, onSeeked, onEnd) fire identically for HLS as for YouTube
6. **1-hour token TTL is acceptable** — Most lessons are under 1 hour; longer lessons will need token refresh
7. **Path-style tokens are required for HLS** — Query-string tokens only sign the exact URL, not the directory containing segments
8. **Admin will update video URLs manually** — The migration does not include an automated YouTube-to-Bunny migration tool

---

## 9. Dependencies

### External Dependencies

| Dependency | Purpose | Risk Level |
|------------|---------|------------|
| Bunny.net Stream | Video hosting and CDN delivery | Low — established service |
| Bunny.net CDN Token Auth | Security layer for video access | Low — well-documented feature |
| Bunny.net Allowed Domains | Embedding restriction | Low — standard Referer check |

### Internal Dependencies

| Dependency | Purpose | Impact |
|------------|---------|--------|
| Vidstack player | Video playback engine | Must verify HLS compatibility |
| `useLessonProgress` hook | Progress tracking | Must work with HLS events |
| `LessonClientBridge` | Server sync | Must handle token refresh flow |
| `next-course-catalog.service` | Video URL mapping | Must pass through raw URLs correctly |
| Admin lesson editor | URL management | Must accept Bunny CDN URLs |

---

## 10. Out of Scope

The following are explicitly **not** part of this specification:

- **MediaCage Basic DRM** — Incompatible with Vidstack (only works with Bunny iframe player)
- **MediaCage Enterprise DRM** — Deferred until piracy justifies $99/month cost
- **Bunny iframe player** — Would sacrifice custom UI, heatmap, quality selector, focus mode
- **Forensic dynamic watermarking** — Future consideration for content tracing
- **Tab focus / blur-on-leave** — Not recommended for educational platform (UX hostile)
- **Native apps / desktop wrappers** — Overkill for current scale
- **Automated YouTube-to-Bunny migration** — Admin manually updates URLs
- **Video upload workflow** — Assumes videos are already uploaded to Bunny Stream
- **Multi-CDN failover** — Single CDN provider (Bunny.net) only

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bunny.net outage blocks all paid content | Low | High | Instant rollback to YouTube via URL change |
| Token generation endpoint becomes bottleneck | Low | Medium | Cache tokens for 5 minutes per user+lesson |
| HLS playback incompatible with Vidstack | Very Low | High | Test early; Vidstack has native HLS support |
| Token expiration during long lesson | Medium | Low | 1-hour TTL + automatic refresh on 403 |
| CDN URL format changes | Very Low | Medium | URL detection uses flexible regex patterns |
| Rate limiting blocks legitimate users | Low | Medium | Generous limits (5 tokens/min, 10 progress/min) |

---

## 12. Open Questions

None — all architectural decisions have been made:
- **Player choice**: Vidstack (custom) — preserves all features
- **Security stack**: CDN Token Auth + Allowed Domains — no DRM
- **Token strategy**: 1-hour TTL with auto-refresh — balances security and simplicity
- **Dual-source rule**: Permanent — YouTube for free, Bunny for paid
