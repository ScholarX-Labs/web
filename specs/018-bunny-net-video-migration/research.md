# Research: Bunny.net Video Infrastructure Migration

**Feature**: 018-bunny-net-video-migration
**Date**: 2026-07-24
**Status**: Complete

---

## Research Summary

All technical decisions have been resolved through codebase exploration and analysis of the `BUNNY-NET-MIGRATION-ANALYSIS.md` document. No NEEDS CLARIFICATION items remain.

---

## Decision 1: Player Architecture — Vidstack (Custom) vs Bunny iframe

**Decision**: Vidstack (custom player)

**Rationale**:
- Current codebase uses Vidstack ^1.12.13 with extensive customizations
- Preserves all existing features: heatmap overlay, quality selector, ambilight glow, focus mode, seek-from tracking
- Full control over player UI and event handling
- Progress tracking works identically with HLS as with YouTube

**Alternatives Considered**:
- **Bunny iframe player**: Simpler implementation, built-in DRM, but sacrifices custom UI, heatmap overlay, quality selector, seek-from tracking, and all Apple-caliber styling. Not acceptable for premium UX requirements.

**Tradeoffs**:
- Requires server-side CDN Token Auth implementation (vs built-in with iframe)
- Must handle token refresh logic (vs automatic with iframe)
- More code to maintain (vs simpler iframe approach)

---

## Decision 2: Security Stack — CDN Token Auth + Allowed Domains

**Decision**: CDN Token Authentication + Allowed Domains (no MediaCage DRM)

**Rationale**:
- CDN Token Auth protects all CDN URLs (.m3u8, .ts segments, .mp4, thumbnails)
- HMAC-SHA256 signed tokens with expiration prevent URL sharing
- Allowed Domains restricts embedding to approved origins
- No additional cost (vs MediaCage Enterprise at $99/month)
- Adequate protection for current piracy threat level

**Alternatives Considered**:
- **MediaCage Basic DRM**: Incompatible with Vidstack (only works with Bunny iframe)
- **MediaCage Enterprise DRM**: Compatible but costly ($99/month + per-license fees). Defer until piracy justifies investment.
- **Forensic watermarking**: Future consideration for content tracing
- **Tab focus/blur**: Not recommended for educational platform (UX hostile)

**Tradeoffs**:
- Cannot prevent screen recording (vs Enterprise DRM)
- Tokens valid for 1 hour (vs shorter with Enterprise DRM)
- Client-side watermarking possible but bypassable

---

## Decision 3: Token Strategy — 1-Hour TTL with Auto-Refresh

**Decision**: 1-hour initial token TTL with automatic refresh on 403 errors

**Rationale**:
- Most lessons are under 1 hour (typical: 15-30 minutes)
- Long TTL minimizes token refresh requests (better performance)
- Auto-refresh on 403 provides seamless experience for longer lessons
- Token bound to session via Allowed Domains + CDN Token Auth

**Alternatives Considered**:
- **Short TTL (5 minutes)**: More secure but requires refresh endpoint and complex client logic
- **Per-request signing**: Maximum security but requires backend on every segment request
- **Session-based tokens**: No expiration but cannot revoke access

**Tradeoffs**:
- Token valid for hours if leaked (mitigated by Allowed Domains)
- Extra network request on 403 (mitigated by auto-refresh)
- Cannot instantly revoke access (must wait for token expiration)

---

## Decision 4: HLS Path-Style Tokens

**Decision**: Use path-style tokens for HLS streams (not query-string tokens)

**Rationale**:
- HLS players request segments relative to playlist path
- Query-string tokens only sign the exact URL (breaks segment requests)
- Path-style tokens sign the directory prefix (covers playlist + all segments)
- Single token covers entire video (playlist + segments)

**Alternatives Considered**:
- **Query-string tokens**: Simpler but breaks HLS segment requests
- **Per-segment tokens**: Maximum security but impractical (thousands of requests)
- **Server-side signing**: Maximum security but requires backend on every request

**Tradeoffs**:
- More complex token generation (must compute token_path)
- Token covers entire directory (not just specific file)
- Cannot restrict access to specific segments

---

## Decision 5: Token Refresh Flow

**Decision**: Automatic token refresh on 403 errors with exponential backoff

**Rationale**:
- Expired tokens are common during long lessons (1-hour TTL)
- Automatic refresh provides seamless experience
- Exponential backoff prevents request storms
- User-facing messages during retry provide transparency

**Alternatives Considered**:
- **Manual refresh**: Requires user intervention (bad UX)
- **Pre-emptive refresh**: Complex timing logic (may refresh unnecessarily)
- **No refresh**: Token expiration breaks playback (unacceptable)

**Tradeoffs**:
- Extra network request on 403 (mitigated by caching)
- User sees "Session expired — reconnecting..." message (brief interruption)
- Retry logic adds complexity (mitigated by simple implementation)

---

## Decision 6: Rate Limiting Strategy

**Decision**: Sliding window rate limiting with Redis backing store

**Rationale**:
- Prevents token brute-force attacks (5 tokens/min per user+lesson)
- Prevents progress spam (10 updates/min per user+lesson)
- Prevents duplicate point awards (1 completion per 24h per user+lesson)
- Redis already available in stack (ioredis ^5.10.1)

**Alternatives Considered**:
- **Database-based rate limiting**: Simpler but slower (not suitable for high-throughput)
- **Fixed window**: Simpler but allows burst attacks at window boundaries
- **Token bucket**: More complex but smoother rate limiting

**Tradeoffs**:
- Redis dependency (already in stack)
- Sliding window more complex than fixed window
- Requires Redis connection management

---

## Decision 7: Error Handling Strategy

**Decision**: Graceful degradation with user-friendly messages and automatic retry

**Rationale**:
- Non-technical users need clear, actionable error messages
- Automatic retry reduces friction (most errors are transient)
- Manual refresh button provides escape hatch for persistent errors
- Error states are temporary (not fatal)

**Alternatives Considered**:
- **Technical error messages**: Confusing for users
- **No retry**: Requires manual intervention for transient errors
- **Silent failure**: Users don't know what happened

**Tradeoffs**:
- Extra UI for error states (brief interruption)
- Retry logic adds complexity (mitigated by simple implementation)
- Cannot handle all error scenarios (some require manual intervention)

---

## Decision 8: Admin Editor Integration

**Decision**: No changes to admin lesson editor — accepts both YouTube and Bunny CDN URLs

**Rationale**:
- Current editor already accepts any URL in `videoUrl` field
- No validation changes required (both formats are valid)
- Admin workflow remains identical (copy-paste URL)
- Rollback is instant (change URL back to YouTube)

**Alternatives Considered**:
- **URL type selector**: Adds UI complexity (unnecessary)
- **URL validation**: May reject valid URLs (fragile)
- **Migration tool**: Out of scope (admin manual update)

**Tradeoffs**:
- Admin must know which URL format to use (training required)
- No visual indicator of current source type (could add later)
- No bulk migration tool (manual update per lesson)

---

## Decision 9: Progress Tracking Compatibility

**Decision**: No changes to progress tracking — HLS events identical to YouTube

**Rationale**:
- Vidstack fires identical HTML5 video events for HLS and YouTube
- `onTimeUpdate`, `onPause`, `onSeeked`, `onEnd` all work identically
- Heatmap overlay works with HLS pause events
- Resume playback works across sessions (localStorage)

**Alternatives Considered**:
- **Custom HLS event handling**: Unnecessary (Vidstack abstracts this)
- **Fallback to YouTube events**: Not needed (same events)
- **Progress tracking per source**: Over-engineering (same logic)

**Tradeoffs**:
- No source-specific progress tracking (not needed)
- No HLS-specific optimizations (Vidstack handles this)
- No source-specific analytics (could add later)

---

## Decision 10: Dual-Source Architecture

**Decision**: Permanent dual-source support with zero security coupling

**Rationale**:
- Free courses stay on YouTube (SEO, discovery, zero-cost hosting)
- Paid courses move to Bunny CDN (protected, token-authenticated)
- Rollback must be instant (change URL in DB, no code deploy)
- No feature parity requirement (each source runs independently)

**Alternatives Considered**:
- **Single source (Bunny only)**: Loses YouTube SEO for free courses
- **Single source (YouTube only)**: No content protection for paid courses
- **Gradual migration**: Complex (must support both indefinitely anyway)

**Tradeoffs**:
- Must maintain two code paths (YouTube + Bunny CDN)
- Must test both sources for all features
- Must document dual-source rules for developers

---

## Research Complete

All decisions documented with rationale, alternatives, and tradeoffs. No unresolved items remain. Ready to proceed to Phase 1: Design & Contracts.
