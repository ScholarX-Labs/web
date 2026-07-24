# Bunny.net Video Infrastructure Migration — Production-Grade Implementation Plan

**Branch**: `018-bunny-net-video-migration` | **Date**: 2026-07-24
**Spec**: [spec.md](./spec.md) | **Analysis**: [BUNNY-NET-MIGRATION-ANALYSIS.md](../../docs/video-infrastructure/BUNNY-NET-MIGRATION-ANALYSIS.md)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architectural Rule — Permanent Dual Source Invariant](#2-architectural-rule--permanent-dual-source-invariant)
3. [Full Architecture & Data Flow](#3-full-architecture--data-flow)
4. [Class Design & OOP Architecture](#4-class-design--oop-architecture)
5. [Design Patterns Catalogue](#5-design-patterns-catalogue)
6. [SOLID Principles Mapping](#6-solid-principles-mapping)
7. [Proposed File Changes — Layer by Layer](#7-proposed-file-changes--layer-by-layer)
8. [API Contract](#8-api-contract)
9. [Security Architecture](#9-security-architecture)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [File Change Summary](#11-file-change-summary)
12. [Architecture Invariants Matrix](#12-architecture-invariants-matrix)
13. [Testing Strategy](#13-testing-strategy)
14. [Environment & Configuration](#14-environment--configuration)
15. [Verification Plan](#15-verification-plan)

---

## 1. Executive Summary

ScholarX migrates paid-course video from YouTube to Bunny.net Stream to prevent content theft. The system must **permanently** support two simultaneous video sources through one Vidstack player with **zero security coupling**:

- **YouTube** → Free courses: public, no auth, no token, raw URL passthrough
- **Bunny CDN** → Paid courses: HMAC-SHA256 path-style CDN Token Auth, enrolled users only

Security is **entirely server-side**. The Video Library API Key never leaves the server. All existing premium UI/UX (ambilight glow, heatmap overlay, quality selector, focus mode, seek-from tracking, resume playback) is preserved **unchanged** — Vidstack HLS events are identical to YouTube events.

**Performance targets**: token generation < 100ms p95, video start ≤ 2s, supports 10K+ concurrent streams.

---

## 2. Architectural Rule — Permanent Dual Source Invariant

> **This rule is permanent. No migration, refactor, or optimization may ever violate it.**
> Source: [BUNNY-NET-MIGRATION-ANALYSIS.md §ARCHITECTURAL RULE](../../docs/video-infrastructure/BUNNY-NET-MIGRATION-ANALYSIS.md)

| Source | Used For | Security | Token Signing | Rollback |
|--------|----------|----------|---------------|----------|
| **YouTube** | Free courses (public preview, SEO) | None | None — raw URL passthrough | Already live — no changes ever needed |
| **Bunny CDN** | Paid courses (enrolled users only) | CDN Token Auth + Allowed Domains | Server-side HMAC-SHA256 (path-style) | Change `video_url` to YouTube URL — instant, zero deploy |

### What Must NEVER Happen

- ❌ YouTube URLs must never be signed with CDN Token Auth
- ❌ Bunny CDN URLs must never be played without a valid signed token
- ❌ The player must never refuse a valid YouTube URL
- ❌ Free course lessons must never require authentication to play
- ❌ Rolling back a lesson's video source must never require code changes
- ❌ `toPlayerSrc()` must never hardcode a single source type
- ❌ The `BUNNY_VIDEO_LIBRARY_API_KEY` must never appear in any client bundle

### The Rollback Contract

```
Admin: change lessons.video_url from Bunny CDN URL → YouTube URL
Result: lesson plays from YouTube immediately
Time: < 1 minute | Code deploy: NONE | Server restart: NONE
```

---

## 3. Full Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DUAL VIDEO SOURCE ARCHITECTURE                           │
│                                                                             │
│  PostgreSQL: lessons.video_url                                              │
│  ─────────────────────────────                                              │
│  Stores RAW URL only — tokens NEVER stored in DB                           │
│       │                                                                     │
│       ▼                                                                     │
│  toLessonSummary()  [next-course-catalog.service.ts]                        │
│  Maps lesson.videoUrl → LessonSummary.media.src  (passthrough, unchanged)  │
│       │                                                                     │
│       ▼                                                                     │
│  LessonPageView  [Server Component — enforces enrollment]                   │
│  Passes allLessons[] to LessonClientBridge                                  │
│       │                                                                     │
│       ▼                                                                     │
│  LessonClientBridge  [Client Component]                                     │
│  Reads currentLesson.media.src (raw URL)                                    │
│       │                                                                     │
│       ├── VideoSourceDetector.detect(rawUrl)                                │
│       │      ├── "youtube"   → skip token fetch, resolvedUrl = rawUrl       │
│       │      ├── "bunny-cdn" → useBunnyCdnToken() → /api/bunny/token        │
│       │      └── "unknown"   → skip token fetch, resolvedUrl = rawUrl       │
│       │                                                                     │
│       ▼                                                                     │
│  <VideoPlayerSkeleton />  ← renders while token is loading                  │
│  <VideoErrorDisplay />    ← renders on unrecoverable error                  │
│  <VideoPlayer src={resolvedUrl} />  ← renders when ready                    │
│       │                                                                     │
│       ▼                                                                     │
│  VideoPlayer  [video-player.tsx]                                            │
│  toPlayerSrc(resolvedUrl):                                                  │
│    ├── /youtube|youtu\.be/  → { src, type: "video/youtube" }               │
│    ├── /b-cdn\.net|\.m3u8/  → { src, type: "application/x-mpegURL" } (HLS)│
│    └── other               → src (Vidstack auto-detect)                    │
│       │                                                                     │
│       ▼                                                                     │
│  Vidstack <MediaPlayer> + <MediaProvider>                                   │
│  hls.js handles HLS internally — same events as YouTube:                    │
│  onTimeUpdate, onPause, onSeeked, onEnded, onDurationChange                 │
│                                                                             │
│  ─────────────── SERVER SIDE (api/bunny/token/route.ts) ─────────────────  │
│                                                                             │
│  Client: GET /api/bunny/token?videoUrl=...                                  │
│       │                                                                     │
│       ├── 1. BunnyTokenAuthGuard.authenticate(headers)  → 401 if no session│
│       ├── 2. BunnyTokenRequestValidator.validate(params) → 400 if invalid  │
│       ├── 3. VideoSourceDetector.detect(videoUrl)        → 400 if not bunny│
│       ├── 4. BunnyTokenRateLimiter.check(userId)         → 429 if exceeded │
│       ├── 5. BunnyCdnTokenSigner.sign(videoUrl, expires) → SignedVideoUrl  │
│       └── 6. Return { success: true, data: { token, expires, signedUrl } } │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Class Design & OOP Architecture

This section defines every class, interface, and abstraction boundary. All classes follow **SOLID** principles with explicit dependency injection.

---

### 4.1 Domain Types — `src/lib/bunny/video-source.types.ts`

All domain types in one file. Zero `any`. Fully readonly value objects.

```typescript
// ── Source Type Discriminated Union ────────────────────────────────────────
export type VideoSourceType = "youtube" | "bunny-cdn" | "unknown";

// ── Value Objects (immutable) ───────────────────────────────────────────────

/** Represents a detected video source. Produced by VideoSourceDetector. */
export interface VideoSource {
  readonly url: string;
  readonly type: VideoSourceType;
  readonly isProtected: boolean; // true ONLY for "bunny-cdn"
  readonly requiresTokenAuth: boolean; // alias of isProtected for clarity
}

/** A short-lived CDN authentication token for one HLS directory. */
export interface CdnToken {
  readonly token: string;      // "HS256-<base64url>" — Bunny Advanced Token Auth format
  readonly expires: number;    // Unix timestamp in seconds
  readonly tokenPath: string;  // "/videos/" — HLS directory prefix (covers all .ts segments)
  readonly videoUrl: string;   // Original unsigned CDN URL
  readonly issuedAt: number;   // Unix timestamp when token was generated
}

/** A fully signed CDN URL ready for Vidstack playback. */
export interface SignedVideoUrl {
  readonly signedUrl: string;  // Complete path-style signed URL for Vidstack src prop
  readonly token: CdnToken;
  readonly expiresInSeconds: number; // TTL remaining at time of creation
}

/** Configuration derived from env for the Bunny integration. */
export interface BunnyCdnConfig {
  readonly securityKey: string;      // BUNNY_CDN_TOKEN_KEY
  readonly cdnHostname: string;      // BUNNY_CDN_HOSTNAME — e.g. vz-123.b-cdn.net
  readonly defaultTtlSeconds: number; // Default: 3600 (1 hour)
  readonly maxTtlSeconds: number;     // Max: 86400 (24 hours)
  readonly minTtlSeconds: number;     // Min: 300 (5 minutes)
}

// ── Error Domain ────────────────────────────────────────────────────────────

export type VideoErrorCode =
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "TOKEN_FETCH_FAILED"
  | "NETWORK_ERROR"
  | "CDN_UNAVAILABLE"
  | "ACCESS_DENIED"
  | "RATE_LIMITED"
  | "CONFIGURATION_ERROR"
  | "UNKNOWN_ERROR";

export interface VideoErrorState {
  readonly code: VideoErrorCode;
  readonly message: string;      // User-facing, non-technical
  readonly technicalMessage: string; // For logging — never shown to users
  readonly retryable: boolean;
  readonly retryAfterMs?: number;
}

// ── API Contract Types ──────────────────────────────────────────────────────

/** Matches the existing ScholarX API success envelope pattern. */
export interface BunnyTokenApiSuccess {
  readonly success: true;
  readonly data: {
    readonly token: string;
    readonly expires: number;
    readonly signedUrl: string;
  };
}

/** Matches the existing ScholarX API error envelope pattern. */
export interface BunnyTokenApiError {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly numericCode: number;
    readonly statusCode: number;
    readonly message: string;
    readonly retryAfter?: number;
  };
}

export type BunnyTokenApiResponse = BunnyTokenApiSuccess | BunnyTokenApiError;

// ── Rate Limiting ───────────────────────────────────────────────────────────

export interface RateLimitRule {
  readonly id: string;
  readonly windowSeconds: number;
  readonly maxRequests: number;
  readonly failureMode: "fail-open" | "fail-closed";
}
```

---

### 4.2 VideoSourceStrategy Interface — Strategy Pattern Contract

```typescript
// src/lib/bunny/strategies/video-source.strategy.ts

import type { VideoSourceType } from "../video-source.types";

/**
 * VideoSourceStrategy — Contract for all video source detection strategies.
 *
 * OCP: Each strategy is a closed, independently testable unit.
 * Adding a new source = implementing this interface + registering with VideoSourceDetector.
 * The detector dispatch logic NEVER changes.
 *
 * ISP: The interface is minimal — exactly two methods, nothing more.
 */
export interface VideoSourceStrategy {
  /** The source type this strategy identifies. */
  readonly type: VideoSourceType;

  /**
   * Returns true if this strategy claims ownership of the given URL.
   * Must be pure — no side effects, no async.
   */
  matches(url: string): boolean;

  /**
   * Returns true if URLs of this type require CDN Token Auth.
   * Drives the isProtected and requiresTokenAuth fields on VideoSource.
   */
  requiresProtection(): boolean;
}
```

---

### 4.3 Concrete Strategies

```typescript
// src/lib/bunny/strategies/youtube.strategy.ts

import type { VideoSourceStrategy } from "./video-source.strategy";

/**
 * YouTubeVideoSourceStrategy
 *
 * Covers all YouTube URL formats:
 *   - https://www.youtube.com/watch?v=...
 *   - https://youtu.be/...
 *   - https://m.youtube.com/...
 *   - https://youtube.com/...
 *
 * INVARIANT: requiresProtection() ALWAYS returns false.
 * YouTube URLs must NEVER be signed with CDN Token Auth.
 */
export class YouTubeVideoSourceStrategy implements VideoSourceStrategy {
  readonly type = "youtube" as const;
  private static readonly PATTERN = /youtube\.com|youtu\.be/i;

  matches(url: string): boolean {
    return YouTubeVideoSourceStrategy.PATTERN.test(url);
  }

  requiresProtection(): boolean {
    return false; // Invariant: YouTube is always unprotected
  }
}
```

```typescript
// src/lib/bunny/strategies/bunny-cdn.strategy.ts

import type { VideoSourceStrategy } from "./video-source.strategy";

/**
 * BunnyCdnVideoSourceStrategy
 *
 * Covers all Bunny CDN URL formats:
 *   - https://vz-xxx.b-cdn.net/videos/lesson.m3u8  (primary)
 *   - https://cdn.example.com/lesson.m3u8           (by extension)
 *   - https://vz-xxx.b-cdn.net/videos/lesson.mp4   (MP4 fallback)
 *
 * INVARIANT: requiresProtection() ALWAYS returns true.
 * Bunny CDN URLs must NEVER be played without a signed token.
 */
export class BunnyCdnVideoSourceStrategy implements VideoSourceStrategy {
  readonly type = "bunny-cdn" as const;
  private static readonly PATTERN = /b-cdn\.net|\.m3u8/i;

  matches(url: string): boolean {
    return BunnyCdnVideoSourceStrategy.PATTERN.test(url);
  }

  requiresProtection(): boolean {
    return true; // Invariant: Bunny CDN always requires CDN Token Auth
  }
}
```

---

### 4.4 VideoSourceDetector Class — Strategy Dispatcher

```typescript
// src/lib/bunny/video-source-detector.ts

import type { VideoSource } from "./video-source.types";
import type { VideoSourceStrategy } from "./strategies/video-source.strategy";
import { YouTubeVideoSourceStrategy } from "./strategies/youtube.strategy";
import { BunnyCdnVideoSourceStrategy } from "./strategies/bunny-cdn.strategy";

/**
 * VideoSourceDetector
 *
 * THE single routing decision point for all video URLs in ScholarX.
 * Uses the Strategy Pattern to detect which video infrastructure owns a URL.
 *
 * SRP: Detects sources only. No signing, no fetching, no side effects.
 * OCP: New sources registered via constructor injection — no modification required.
 * DIP: Depends on the VideoSourceStrategy interface, not on concrete strategies.
 *
 * INVARIANTS (enforced by strategy implementations):
 *   - YouTube → isProtected=false, requiresTokenAuth=false
 *   - Bunny CDN → isProtected=true, requiresTokenAuth=true
 *   - Unknown → isProtected=false, requiresTokenAuth=false
 */
export class VideoSourceDetector {
  /** Default detector with YouTube + Bunny CDN strategies (registered in priority order). */
  static readonly default = new VideoSourceDetector([
    new YouTubeVideoSourceStrategy(),
    new BunnyCdnVideoSourceStrategy(),
  ]);

  constructor(
    /**
     * Ordered list of strategies. First match wins.
     * More specific strategies (shorter pattern match window) go first.
     */
    private readonly strategies: readonly VideoSourceStrategy[],
  ) {}

  /**
   * Detects the video source type for a given URL.
   *
   * @param url - Raw URL from lessons.video_url (DB). May be YouTube, Bunny CDN, or other.
   * @returns VideoSource with type, isProtected, and requiresTokenAuth fields.
   */
  detect(url: string): VideoSource {
    if (!url || typeof url !== "string") {
      return this.buildSource(url ?? "", "unknown", false);
    }

    for (const strategy of this.strategies) {
      if (strategy.matches(url)) {
        return this.buildSource(url, strategy.type, strategy.requiresProtection());
      }
    }

    return this.buildSource(url, "unknown", false);
  }

  private buildSource(
    url: string,
    type: VideoSource["type"],
    isProtected: boolean,
  ): VideoSource {
    return Object.freeze({
      url,
      type,
      isProtected,
      requiresTokenAuth: isProtected,
    });
  }
}
```

---

### 4.5 BunnyCdnTokenSigner Class — HMAC-SHA256 Signing

```typescript
// src/lib/bunny/token-signer.ts
// ⚠️  SERVER-ONLY — imports node:crypto. Never import in Client Components.

import { createHmac } from "node:crypto";
import type { BunnyCdnConfig, CdnToken, SignedVideoUrl } from "./video-source.types";

/**
 * BunnyCdnTokenSigner
 *
 * Encapsulates all HMAC-SHA256 token signing logic for Bunny CDN Advanced Token Auth.
 * This class is the ONLY place in the codebase where securityKey touches crypto.
 *
 * SRP: Signs tokens only. No HTTP calls, no validation, no business rules.
 * DIP: Accepts config via constructor injection — testable without real Bunny credentials.
 *
 * TOKEN SIGNING PROCEDURE (Bunny Advanced Token Auth — path-style):
 *   1. tokenPath = directory prefix of the .m3u8 pathname
 *      "/videos/lesson.m3u8" → "/videos/"
 *      (covers ALL .ts segments under this prefix with one token)
 *   2. dataToSign  = tokenPath + expiresAt (Unix seconds, as string)
 *   3. signature   = HMAC-SHA256(securityKey, dataToSign) → base64url-encoded
 *   4. token       = "HS256-" + signature
 *   5. signedUrl   = {origin}/bcdn_token={token}&expires={expires}
 *                         &token_path={encodedPath}{pathname}
 *
 * WHY PATH-STYLE TOKENS ARE REQUIRED FOR HLS:
 *   Query-string tokens sign only the exact .m3u8 URL.
 *   hls.js then fetches .ts segments at relative paths — these are NOT signed.
 *   Bunny rejects segment requests with 403. Path-style tokens sign the directory
 *   so ALL files under that prefix pass authentication.
 */
export class BunnyCdnTokenSigner {
  constructor(private readonly config: BunnyCdnConfig) {}

  /**
   * Signs a Bunny CDN video URL and returns both the CdnToken and the complete signed URL.
   *
   * @param videoUrl  - Unsigned Bunny CDN URL (e.g. https://vz-123.b-cdn.net/v/lesson.m3u8)
   * @param expiresAt - Optional Unix timestamp (seconds). Defaults to now + defaultTtlSeconds.
   *                    Clamped to [minTtlSeconds, maxTtlSeconds] from config.
   * @returns         - { signedUrl, token } ready for Vidstack
   * @throws          - RangeError if videoUrl cannot be parsed as a URL
   */
  sign(videoUrl: string, expiresAt?: number): SignedVideoUrl {
    const url = new URL(videoUrl); // throws RangeError on invalid URL
    const now = Math.floor(Date.now() / 1000);
    const expires = this.clampExpiry(expiresAt ?? now + this.config.defaultTtlSeconds, now);
    const tokenPath = this.computeTokenPath(url.pathname);
    const token = this.computeToken(tokenPath, expires);

    const cdnToken: CdnToken = Object.freeze({
      token,
      expires,
      tokenPath,
      videoUrl,
      issuedAt: now,
    });

    return Object.freeze({
      signedUrl: this.buildSignedUrl(url, token, expires, tokenPath),
      token: cdnToken,
      expiresInSeconds: expires - now,
    });
  }

  /**
   * Checks if a token has expired (with a 30-second clock-skew buffer).
   * Use this before passing a cached token to Vidstack.
   */
  isExpired(token: CdnToken): boolean {
    const SKEW_BUFFER_SECONDS = 30;
    return token.expires <= Math.floor(Date.now() / 1000) + SKEW_BUFFER_SECONDS;
  }

  // ── Private Signing Logic ─────────────────────────────────────────────────

  /**
   * Extracts the directory prefix from the pathname.
   * "/videos/lesson.m3u8" → "/videos/"
   * "/lesson.m3u8"        → "/"
   */
  private computeTokenPath(pathname: string): string {
    const lastSlash = pathname.lastIndexOf("/");
    return lastSlash >= 0 ? pathname.substring(0, lastSlash + 1) : "/";
  }

  /**
   * Computes the HMAC-SHA256 token from tokenPath + expires.
   * Output: "HS256-<base64url>" (no padding, URL-safe characters only)
   */
  private computeToken(tokenPath: string, expires: number): string {
    const dataToSign = `${tokenPath}${expires}`;
    const signature = createHmac("sha256", this.config.securityKey)
      .update(dataToSign)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""); // Remove base64 padding
    return `HS256-${signature}`;
  }

  /**
   * Builds the path-style signed URL.
   * Format: {origin}/bcdn_token={token}&expires={expires}&token_path={path}{pathname}
   *
   * Note: token parameters are in the PATH, not query string.
   * This is the "Advanced Token Auth" format required for HLS.
   */
  private buildSignedUrl(
    url: URL,
    token: string,
    expires: number,
    tokenPath: string,
  ): string {
    return (
      `${url.origin}/bcdn_token=${token}` +
      `&expires=${expires}` +
      `&token_path=${encodeURIComponent(tokenPath)}` +
      url.pathname
    );
  }

  /**
   * Clamps expiresAt to the configured [minTtlSeconds, maxTtlSeconds] window.
   */
  private clampExpiry(expiresAt: number, now: number): number {
    const min = now + this.config.minTtlSeconds;
    const max = now + this.config.maxTtlSeconds;
    return Math.max(min, Math.min(max, expiresAt));
  }
}
```

---

### 4.6 BunnyTokenService Class — Application Service

```typescript
// src/lib/bunny/token.service.ts
// ⚠️  SERVER-ONLY

import type { BunnyCdnConfig, SignedVideoUrl } from "./video-source.types";
import { BunnyCdnTokenSigner } from "./token-signer";
import { VideoSourceDetector } from "./video-source-detector";

export class BunnyVideoTokenError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "BunnyVideoTokenError";
  }
}

/**
 * BunnyTokenService
 *
 * Application service layer between the route handler and domain logic.
 * Orchestrates detection → validation → signing.
 *
 * SRP: Orchestrates signing use-case only. Auth and rate limiting are route-layer concerns.
 * DIP: Depends on injected BunnyCdnTokenSigner and VideoSourceDetector — not concrete crypto.
 *
 * Usage: Instantiated once per request in the route handler.
 */
export class BunnyTokenService {
  constructor(
    private readonly signer: BunnyCdnTokenSigner,
    private readonly detector: VideoSourceDetector,
  ) {}

  /**
   * Factory method — creates a BunnyTokenService from a BunnyCdnConfig.
   * Used by the route handler to avoid constructor chaining.
   */
  static fromConfig(config: BunnyCdnConfig): BunnyTokenService {
    return new BunnyTokenService(
      new BunnyCdnTokenSigner(config),
      VideoSourceDetector.default,
    );
  }

  /**
   * Signs a video URL after verifying it is a Bunny CDN source.
   *
   * @throws BunnyVideoTokenError if the URL is not a Bunny CDN URL
   * @throws RangeError if the URL is malformed
   */
  generateSignedUrl(videoUrl: string, expiresAt?: number): SignedVideoUrl {
    const source = this.detector.detect(videoUrl);

    if (source.type !== "bunny-cdn") {
      throw new BunnyVideoTokenError(
        `URL is not a Bunny CDN URL: ${videoUrl}`,
        "INVALID_CDN_URL",
        400,
      );
    }

    return this.signer.sign(videoUrl, expiresAt);
  }
}
```

---

### 4.7 Client-Side Hook — `useBunnyCdnToken`

```typescript
// src/hooks/use-bunny-cdn-token.ts
// "use client"

/**
 * useBunnyCdnToken
 *
 * React hook managing the complete CDN token lifecycle for a video URL.
 * Encapsulates: source detection → token fetching → expiry monitoring → retry with backoff.
 *
 * SRP: Manages token lifecycle only. UI rendering decisions belong to the caller.
 * Template Method: Fetch flow is a fixed sequence: detect → sign → play → on-error → refresh.
 *
 * Behavior by source type:
 *   "youtube"   → resolvedUrl = rawUrl immediately (no fetch, isLoading = false always)
 *   "bunny-cdn" → fetches /api/bunny/token, resolvedUrl = signedUrl on success
 *   "unknown"   → resolvedUrl = rawUrl (Vidstack auto-detects format)
 *
 * Token refresh flow (onTokenExpired):
 *   Triggered by VideoPlayer when Vidstack fires onError with 403 code.
 *   Applies exponential backoff: attempt 1=1s, attempt 2=2s, attempt 3=4s.
 *   After maxRetries failures → unrecoverable error state.
 */

interface UseBunnyCdnTokenOptions {
  /** Raw video URL from lessons.video_url. Never a signed URL. */
  readonly rawUrl: string;
  /** Maximum token refresh attempts on 403 error. Default: 3. */
  readonly maxRetries?: number;
}

interface UseBunnyCdnTokenResult {
  /** URL to pass as VideoPlayer src prop. null while loading. */
  readonly resolvedUrl: string | null;
  /** True while token fetch is in flight. Always false for YouTube URLs. */
  readonly isLoading: boolean;
  /** Non-null when an unrecoverable error has occurred. */
  readonly error: VideoErrorState | null;
  /** The detected source (for conditional rendering in bridge). */
  readonly source: VideoSource;
  /**
   * Call this from VideoPlayer's onTokenExpired prop when Vidstack fires a 403 error.
   * Applies exponential backoff and re-fetches a fresh token.
   */
  readonly onTokenExpired: () => Promise<void>;
  /** Call this from the retry button in VideoErrorDisplay. */
  readonly refresh: () => Promise<void>;
}
```

**Internal fetch logic** (`fetchSignedUrl` — module-private):

```typescript
// Error codes → user-facing messages (no technical jargon)
const ERROR_MESSAGES: Record<VideoErrorCode, string> = {
  TOKEN_EXPIRED:        "Session expired — reconnecting...",
  TOKEN_INVALID:        "Unable to play — please refresh the page",
  TOKEN_FETCH_FAILED:   "Video connection failed — retrying...",
  NETWORK_ERROR:        "Connection lost — check your internet and try again",
  CDN_UNAVAILABLE:      "Video temporarily unavailable — please try again later",
  ACCESS_DENIED:        "Access denied — you must be enrolled in this course",
  RATE_LIMITED:         "Too many requests — please wait a moment",
  CONFIGURATION_ERROR:  "Video service error — please contact support",
  UNKNOWN_ERROR:        "Something went wrong — please refresh the page",
};

// HTTP status → VideoErrorCode + retryable flag mapping
// 401 / 403 → ACCESS_DENIED, retryable=false
// 429       → RATE_LIMITED, retryable=true, retryAfterMs from header
// 500+      → CDN_UNAVAILABLE, retryable=true
// network   → NETWORK_ERROR, retryable=true
```

---

### 4.8 Zod Validation Schema — API Route

```typescript
// src/app/api/bunny/token/schemas.ts

import { z } from "zod";

/**
 * BunnyTokenRequestSchema
 *
 * Validates all incoming query parameters for GET /api/bunny/token.
 * Defense-in-depth: validates even after VideoSourceDetector check.
 *
 * videoUrl validations:
 *   - Must be a parseable URL
 *   - Must contain b-cdn.net in the host (Bunny CDN domain guard)
 *   - Must NOT already contain bcdn_token= (pre-signed URL guard)
 *   - Extension must be .m3u8 or .mp4 (known video formats only)
 *
 * expires validations (optional):
 *   - Must be a future Unix timestamp
 *   - Minimum: 5 minutes from now (300s)
 *   - Maximum: 24 hours from now (86400s)
 *   - Clamping is also applied server-side in BunnyCdnTokenSigner
 */
export const BunnyTokenRequestSchema = z.object({
  videoUrl: z
    .string({ required_error: "videoUrl is required" })
    .url("videoUrl must be a valid URL")
    .refine(
      (url) => /b-cdn\.net/i.test(new URL(url).hostname),
      "videoUrl must be a Bunny CDN URL (hostname must include b-cdn.net)",
    )
    .refine(
      (url) => !url.includes("bcdn_token="),
      "videoUrl must not be pre-signed (remove existing bcdn_token parameter)",
    )
    .refine(
      (url) => /\.(m3u8|mp4)$/i.test(new URL(url).pathname),
      "videoUrl must point to a video file (.m3u8 or .mp4)",
    ),
  expires: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .refine(
      (v) => v === undefined || v > Math.floor(Date.now() / 1000) + 300,
      "expires must be at least 5 minutes in the future",
    )
    .refine(
      (v) => v === undefined || v < Math.floor(Date.now() / 1000) + 86400,
      "expires must be at most 24 hours in the future",
    ),
});

export type BunnyTokenRequest = z.infer<typeof BunnyTokenRequestSchema>;
```

---

## 5. Design Patterns Catalogue

| Pattern | Class / File | Purpose |
|---------|-------------|---------|
| **Strategy** | `VideoSourceStrategy` / `YouTubeVideoSourceStrategy` / `BunnyCdnVideoSourceStrategy` | Pluggable source detection — new sources added without changing dispatcher |
| **Template Method** | `useBunnyCdnToken` hook | Fixed fetch→play→error→refresh sequence; steps overridable via config |
| **Factory Method** | `BunnyTokenService.fromConfig()` | Encapsulates construction of signer + detector from config |
| **Value Object** | `VideoSource`, `CdnToken`, `SignedVideoUrl` | Immutable (`Object.freeze`) domain values — no accidental mutation |
| **Null Object** | `FallbackDistributedRateLimiter` (existing) | Redis unavailable → allow-all, zero code changes |
| **Chain of Responsibility** | Route handler middleware chain (auth → validate → rate-limit → sign) | Each step independently rejectable |
| **Observer** | Vidstack `onError`, `onTimeUpdate`, `onPause`, `onSeeked`, `onEnded` | Player events propagate to progress hooks |
| **Proxy** | `useBunnyCdnToken` hook | Intercepts raw URL, injects signed URL transparently |
| **Port & Adapter** | `DistributedRateLimiter` (existing) | Rate limiter port swappable between Redis / fallback |

---

## 6. SOLID Principles Mapping

### Single Responsibility Principle

| Class / File | Single Responsibility |
|---|---|
| `YouTubeVideoSourceStrategy` | Detect YouTube URLs only |
| `BunnyCdnVideoSourceStrategy` | Detect Bunny CDN URLs only |
| `VideoSourceDetector` | Dispatch to the correct strategy only |
| `BunnyCdnTokenSigner` | Compute HMAC-SHA256 tokens only |
| `BunnyTokenService` | Orchestrate signing use-case only |
| `BunnyTokenRequestSchema` | Validate token request inputs only |
| `useBunnyCdnToken` | Manage client-side token lifecycle only |
| `VideoPlayerSkeleton` | Render loading state only |
| `VideoErrorDisplay` | Render error state only |
| `route.ts` | Handle HTTP protocol concerns only |

### Open/Closed Principle

- Adding a new video source (e.g., Vimeo) = implement `VideoSourceStrategy` + register with `VideoSourceDetector` constructor
- `VideoSourceDetector.detect()` is closed — never modified
- `toPlayerSrc()` in `video-player.tsx` is open for extension via regex branch — adding new `PlayerSrc` type requires adding one `if` block

### Liskov Substitution Principle

- `FallbackDistributedRateLimiter` satisfies the `DistributedRateLimiter` port — identical interface, different behavior (allow-all vs Redis)
- All `VideoSourceStrategy` implementations are fully interchangeable

### Interface Segregation Principle

- `VideoSourceStrategy` has exactly 2 methods: `matches()` and `requiresProtection()` — nothing else
- `DistributedRateLimiter` port (existing) has `check()` and `peek()` — nothing else
- `UseBunnyCdnTokenResult` exposes only what the bridge needs

### Dependency Inversion Principle

- `BunnyCdnTokenSigner` receives `BunnyCdnConfig` — not `process.env` directly
- `BunnyTokenService` receives `BunnyCdnTokenSigner` and `VideoSourceDetector` — not `createHmac` directly
- `VideoSourceDetector` receives `VideoSourceStrategy[]` — not concrete strategy instances in the class body
- Route handler calls `BunnyTokenService` — not `createHmac` directly

---

## 7. Proposed File Changes — Layer by Layer

---

### Layer 0 — Environment Configuration

#### [MODIFY] [env.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/config/env.ts)

Add to `envSchema` using the existing `optionalString` pattern (consistent with Redis/Azure vars):

```typescript
// Bunny.net Stream — SERVER ONLY, never prefix with NEXT_PUBLIC_
BUNNY_CDN_TOKEN_KEY: optionalString,          // URL Token Authentication Key from Pull Zone Security tab
BUNNY_VIDEO_LIBRARY_API_KEY: optionalString,  // Stream Library API Key (for backend management)
BUNNY_CDN_HOSTNAME: optionalString,           // e.g. vz-123.b-cdn.net — CDN pull zone hostname
BUNNY_VIDEO_LIBRARY_ID: optionalString,       // Video library ID — for embed token support (v2)
```

**Validation gate** — add to the existing `validateEnv` function:
- `BUNNY_VIDEO_LIBRARY_API_KEY` must not contain whitespace (copied incorrectly)
- `BUNNY_CDN_HOSTNAME` must match `/^vz-[a-z0-9-]+\.b-cdn\.net$/` if present
- Both are optional at startup — required only when a Bunny CDN URL is actually served

**Security guard** in `env.ts`:
```typescript
// Runtime assertion — prevents accidental exposure of signing key
if (
  Object.keys(process.env).some((k) => k.startsWith("NEXT_PUBLIC_BUNNY"))
) {
  throw new Error(
    "[SECURITY] Bunny API key must never be a NEXT_PUBLIC_ variable. " +
    "Remove the NEXT_PUBLIC_ prefix immediately.",
  );
}
```

---

### Layer 1 — Core Domain Library `src/lib/bunny/`

Pure TypeScript — **zero Next.js dependencies** — fully unit-testable in isolation from the framework.

```
src/lib/bunny/
├── video-source.types.ts          # All domain types (Value Objects, Error types, API contracts)
├── strategies/
│   ├── video-source.strategy.ts   # VideoSourceStrategy interface
│   ├── youtube.strategy.ts        # YouTubeVideoSourceStrategy class
│   └── bunny-cdn.strategy.ts      # BunnyCdnVideoSourceStrategy class
├── video-source-detector.ts       # VideoSourceDetector class (Strategy dispatcher)
├── token-signer.ts                # BunnyCdnTokenSigner class (server-only)
├── token.service.ts               # BunnyTokenService class (server-only)
├── token-signer.test.ts           # Unit tests for BunnyCdnTokenSigner
└── video-source-detector.test.ts  # Unit tests for VideoSourceDetector + strategies
```

> All classes detailed in [§4 Class Design](#4-class-design--oop-architecture).

---

### Layer 2 — API Route `src/app/api/bunny/token/`

```
src/app/api/bunny/token/
├── route.ts    # GET handler — thin: auth → validate → rate-limit → sign → respond
└── schemas.ts  # BunnyTokenRequestSchema (Zod) — detailed in §4.8
```

#### [NEW] [route.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/api/bunny/token/route.ts)

**Design**: thin route handler. All business logic lives in `src/lib/bunny/`. The handler is a Chain of Responsibility: each step can reject the request; if all pass, a signed URL is returned.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { env } from "@/config/env";
import { checkDistributedRateLimit } from "@/lib/rate-limit/rate-limit.factory";
import { BunnyTokenService, BunnyVideoTokenError } from "@/lib/bunny/token.service";
import { BunnyTokenRequestSchema } from "./schemas";
import type { BunnyCdnConfig } from "@/lib/bunny/video-source.types";

// ── Rate Limit Rule (matches existing codebase pattern) ───────────────────
const BUNNY_TOKEN_RATE_LIMIT = {
  id: "bunny-cdn-token",
  windowSeconds: 60,
  maxRequests: 5,
  failureMode: "fail-open",
} as const;

// ── Error Numeric Codes (matches existing ScholarX API error codes) ────────
const ERROR_CODES = {
  BAD_REQUEST:          { code: "BAD_REQUEST",          numericCode: 9005 },
  UNAUTHORIZED:         { code: "UNAUTHORIZED",          numericCode: 9002 },
  ACCESS_DENIED:        { code: "ACCESS_DENIED",         numericCode: 9003 },
  RATE_LIMIT_EXCEEDED:  { code: "RATE_LIMIT_EXCEEDED",   numericCode: 9004 },
  INTERNAL_SERVER_ERROR:{ code: "INTERNAL_SERVER_ERROR", numericCode: 9999 },
} as const;

export async function GET(request: NextRequest): Promise<NextResponse> {
  // ── Step 1: Authentication ──────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return errorResponse(401, ERROR_CODES.UNAUTHORIZED, "Authentication required");
  }

  // ── Step 2: Input Validation ────────────────────────────────────────────
  const { searchParams } = request.nextUrl;
  const parseResult = BunnyTokenRequestSchema.safeParse({
    videoUrl: searchParams.get("videoUrl"),
    expires: searchParams.get("expires") ?? undefined,
  });

  if (!parseResult.success) {
    const message = parseResult.error.errors[0]?.message ?? "Invalid request parameters";
    return errorResponse(400, ERROR_CODES.BAD_REQUEST, message);
  }

  const { videoUrl, expires } = parseResult.data;

  // ── Step 3: Rate Limiting ───────────────────────────────────────────────
  // Uses existing Redis sliding-window infrastructure (fail-open on Redis failure)
  const rateLimitDecision = await checkDistributedRateLimit(
    BUNNY_TOKEN_RATE_LIMIT,
    session.user.id, // subject = userId (not userId:lessonId — simpler in v1)
  );

  if (!rateLimitDecision.allowed) {
    const retryAfter = !rateLimitDecision.allowed
      ? rateLimitDecision.retryAfterSeconds
      : undefined;
    const response = errorResponse(
      429,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      "Too many requests. Please try again later.",
      retryAfter,
    );
    if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
    return response;
  }

  // ── Step 4: Token Signing ───────────────────────────────────────────────
  const securityKey = env.BUNNY_VIDEO_LIBRARY_API_KEY;
  const cdnHostname = env.BUNNY_CDN_HOSTNAME;

  if (!securityKey || !cdnHostname) {
    console.error("[bunny/token] Missing required environment variables", {
      hasKey: Boolean(securityKey),
      hasHostname: Boolean(cdnHostname),
    });
    return errorResponse(
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Video service configuration error",
    );
  }

  const config: BunnyCdnConfig = {
    securityKey,
    cdnHostname,
    defaultTtlSeconds: 3600,  // 1 hour — covers typical lesson length
    maxTtlSeconds: 86400,     // 24 hours — hard cap
    minTtlSeconds: 300,       // 5 minutes — minimum security window
  };

  try {
    const service = BunnyTokenService.fromConfig(config);
    const { signedUrl, token } = service.generateSignedUrl(videoUrl, expires);

    return NextResponse.json({
      success: true,
      data: {
        token: token.token,
        expires: token.expires,
        signedUrl,
      },
    });
  } catch (error) {
    if (error instanceof BunnyVideoTokenError) {
      return errorResponse(
        error.statusCode as 400 | 500,
        error.statusCode === 400 ? ERROR_CODES.BAD_REQUEST : ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message,
      );
    }
    console.error("[bunny/token] Unexpected error during token signing", error);
    return errorResponse(500, ERROR_CODES.INTERNAL_SERVER_ERROR, "Internal server error");
  }
}

// ── Response Builder ──────────────────────────────────────────────────────

function errorResponse(
  status: number,
  errorCode: { code: string; numericCode: number },
  message: string,
  retryAfter?: number,
): NextResponse {
  const body = {
    success: false as const,
    error: {
      code: errorCode.code,
      numericCode: errorCode.numericCode,
      statusCode: status,
      message,
      ...(retryAfter !== undefined ? { retryAfter } : {}),
    },
  };
  return NextResponse.json(body, { status });
}
```

> **v1 Design Decision**: Rate limit subject is `userId` (not `userId:lessonId`). This is safe because the lesson page Server Component already enforces enrollment. Adding `lessonId` to the subject in v2 allows tighter per-lesson limits.

---

### Layer 3 — Client Hook `src/hooks/use-bunny-cdn-token.ts`

Full implementation strategy (implementation matches §4.7 interface):

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { VideoSourceDetector } from "@/lib/bunny/video-source-detector";
import type {
  VideoSource,
  VideoErrorCode,
  VideoErrorState,
  BunnyTokenApiResponse,
} from "@/lib/bunny/video-source.types";

// Module-level detector singleton (Strategy Pattern - shared across hook instances)
const detector = VideoSourceDetector.default;

// ── Exponential Backoff Configuration ──────────────────────────────────────
const BACKOFF_BASE_MS = 1000;    // 1s first retry
const BACKOFF_MAX_MS = 30_000;   // 30s cap for very long retry sequences
const DEFAULT_MAX_RETRIES = 3;   // After 3 failures → unrecoverable state

// ── User-Facing Error Messages ──────────────────────────────────────────────
// Maps error codes to non-technical messages (no stack traces, no HTTP codes)
```

**Key implementation decisions**:

1. **`useEffect` for initial fetch** (not `hasFetchedRef`): aligns with `use-lesson-progress.ts` conventions. Dependency array: `[rawUrl]` — re-fetches when lesson changes.

2. **Abort controller**: each `doFetch` call creates an `AbortController`. On unmount or `rawUrl` change, previous in-flight request is cancelled. Prevents state updates on unmounted component.

3. **Proactive expiry check**: before returning `resolvedUrl`, check `BunnyCdnTokenSigner.isExpired(cachedToken)`. If expired, re-fetch silently before player touches the URL.

4. **Retry guard**: `isFetchingRef.current` prevents concurrent fetches. Combined with `AbortController`, eliminates race conditions.

---

### Layer 4 — Component Modifications

#### [MODIFY] [video-player.tsx](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player.tsx)

**Exactly two surgical changes. Zero other lines touched.**

**Change 1** — `toPlayerSrc()` function (lines 67–73):

```diff
 const toPlayerSrc = (src: string): PlayerSrc => {
+  // YouTube — uses Vidstack YouTube provider. No CDN Token Auth, no signing.
   if (/youtube\.com|youtu\.be/i.test(src)) {
     return { src, type: "video/youtube" };
   }
-  return src;
+  // Bunny CDN HLS — path-style signed URL received from useBunnyCdnToken.
+  // Vidstack routes to its hls.js provider automatically for this MIME type.
+  if (/b-cdn\.net|\.m3u8/i.test(src)) {
+    return { src, type: "application/x-mpegURL" };
+  }
+  // Fallback — Vidstack auto-detects format from URL extension or server headers.
+  return src;
 };
```

**Change 2** — Add `onTokenExpired` prop and wire `onError`:

```diff
 interface VideoPlayerProps {
   title: string;
   src: string;
   thumbnails?: string;
   heatmapBuckets?: number[];
   onTimeUpdate: (currentTime: number) => void;
   onPause: (currentTime: number) => void;
   onSeeked: (from: number, to: number) => void;
   onEnded: () => void;
   onDurationChange: (duration: number) => void;
+  /** Called by Vidstack's onError when hls.js receives a 403 from Bunny CDN. */
+  /** The caller (lesson-client-bridge) should trigger useBunnyCdnToken.onTokenExpired(). */
+  onTokenExpired?: () => void;
 }
```

```diff
 <MediaPlayer
   ref={ref}
   title={title}
   src={playerSrc}
   playsInline
   className="w-full aspect-video"
+  onError={(event) => {
+    // Detect Bunny CDN 403 — token expired or invalid.
+    // The exact event shape depends on @vidstack/react version;
+    // verify against installed ^1.12.13 types during implementation.
+    const detail = (event as MediaErrorEvent & { detail?: { code?: number; message?: string } }).detail;
+    const is403 = detail?.code === 403 || detail?.message?.includes("403");
+    if (is403) {
+      onTokenExpired?.();
+    }
+  }}
   onProviderSetup={handleProviderSetup}
```

#### [MODIFY] [lesson-client-bridge.tsx](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-client-bridge.tsx)

Minimal changes to the lesson video rendering block (around lines 274–310):

```diff
+import { useBunnyCdnToken } from "@/hooks/use-bunny-cdn-token";
+import { VideoPlayerSkeleton } from "./_components/video-player-skeleton";
+import { VideoErrorDisplay } from "./_components/video-error-display";

 // Inside the lesson rendering block:
 const mediaSrc = currentLesson?.media?.src ?? "";

+// Token lifecycle — transparent to all surrounding bridge logic.
+// YouTube URLs → resolvedUrl = mediaSrc immediately, isLoading = false.
+// Bunny CDN URLs → resolvedUrl = signedUrl after /api/bunny/token fetch.
+const {
+  resolvedUrl,
+  isLoading: isTokenLoading,
+  error: tokenError,
+  onTokenExpired,
+} = useBunnyCdnToken({ rawUrl: mediaSrc });
+
+if (isTokenLoading) {
+  return <VideoPlayerSkeleton />;
+}
+
+if (tokenError && !tokenError.retryable) {
+  return (
+    <VideoErrorDisplay
+      message={tokenError.message}
+      // No onRetry for unrecoverable errors (ACCESS_DENIED, TOKEN_INVALID after max retries)
+    />
+  );
+}

 return (
   <VideoPlayer
     ref={playerRef}
     key={lessonId}
     title={lessonTitle}
-    src={mediaSrc}
+    src={resolvedUrl ?? ""}   // Signed URL for Bunny CDN; raw URL for YouTube
+    onTokenExpired={onTokenExpired}
     thumbnails={thumbnails}
     heatmapBuckets={heatmapBuckets}
     onTimeUpdate={onTimeUpdate}
     onPause={onPause}
     onSeeked={onSeeked}
     onEnded={onEnded}
     onDurationChange={setVideoDuration}
   />
 );
```

---

### Layer 5 — Premium UI Components

#### [NEW] [video-player-skeleton.tsx](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player-skeleton.tsx)

```typescript
"use client";

/**
 * VideoPlayerSkeleton
 *
 * Loading state placeholder shown while useBunnyCdnToken fetches the signed URL.
 * Matches VideoPlayer's exact container dimensions, border-radius, box-shadow,
 * and ambilight aesthetic — zero cumulative layout shift (CLS = 0).
 *
 * Glassmorphism elements:
 *  - Ambilight pulse glow (bg-blue-600/10, blur-[80px]) — matches video-player.tsx
 *  - Glass top-edge highlight (via-white/30) — matches video-player.tsx
 *  - Spinner (border-t-blue-400/50, animate-spin) — ScholarX brand accent
 *  - Skeleton shimmer (bg-white/5, animate-pulse) — perceived performance
 */
export function VideoPlayerSkeleton(): JSX.Element {
  return (
    <div className="group relative w-full" role="status" aria-label="Loading video">
      {/* Atmospheric ambilight pulse — identical to VideoPlayer's ambilight */}
      <div className="pointer-events-none absolute -inset-6 z-0 hidden lg:block">
        <div className="absolute inset-0 rounded-[3rem] bg-blue-600/10 blur-[80px] animate-pulse" />
      </div>

      {/* Container — identical sizing to VideoPlayer */}
      <div
        className="relative w-full rounded-2xl lg:rounded-3xl border border-white/10 overflow-hidden"
        style={{ aspectRatio: "16 / 9", boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8)" }}
      >
        {/* Glass top-edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent z-20" />

        {/* Shimmer skeleton body */}
        <div className="w-full h-full bg-white/5 animate-pulse flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white/30">
            <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-blue-400/50 animate-spin" />
            <span className="text-sm font-medium tracking-wide">Loading video...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### [NEW] [video-error-display.tsx](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-error-display.tsx)

```typescript
"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface VideoErrorDisplayProps {
  /** User-facing error message from VideoErrorState.message. Non-technical. */
  readonly message: string;
  /** If provided, renders a "Try again" button. Only pass for retryable errors. */
  readonly onRetry?: () => void;
}

/**
 * VideoErrorDisplay
 *
 * Glassmorphism error card rendered when token fetch fails unrecoverably.
 * Same container sizing as VideoPlayer (16:9, same border/shadow) — no layout shift.
 * ScholarX dark aesthetic with red error accent.
 *
 * Accessibility:
 *  - role="alert" announces the error to screen readers immediately
 *  - retry button has explicit aria-label
 */
export function VideoErrorDisplay({
  message,
  onRetry,
}: VideoErrorDisplayProps): JSX.Element {
  return (
    <div
      className="relative w-full rounded-2xl lg:rounded-3xl border border-white/10 overflow-hidden"
      style={{ aspectRatio: "16 / 9", boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8)" }}
      role="alert"
    >
      {/* Glass top-edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="w-full h-full bg-white/5 backdrop-blur-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-8 max-w-sm">

          {/* Error icon */}
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" aria-hidden="true" />
          </div>

          {/* User-facing message — no technical details */}
          <p className="text-white/70 text-sm leading-relaxed">{message}</p>

          {/* Retry button — only shown for retryable errors */}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              aria-label="Retry video playback"
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-white/10 hover:bg-white/20
                         border border-white/10
                         text-white/80 text-sm font-medium
                         transition-all duration-200
                         hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Layer 6 — Tests

#### [NEW] `src/lib/bunny/token-signer.test.ts`

```typescript
// Tests for BunnyCdnTokenSigner class
// Runner: node --import tsx --test (existing project convention)

describe("BunnyCdnTokenSigner.sign()", () => {
  // ── Core Signing ────────────────────────────────────────────────────────
  it("produces path-style signed URL containing bcdn_token=HS256-");
  it("signed URL contains &expires= parameter");
  it("signed URL contains &token_path= parameter");
  it("signed URL ends with the original pathname");
  it("token always starts with HS256-");

  // ── Path Computation ────────────────────────────────────────────────────
  it("computes directory prefix: /videos/lesson.m3u8 → /videos/");
  it("computes root prefix: /lesson.m3u8 → /");
  it("computes nested prefix: /a/b/c/lesson.m3u8 → /a/b/c/");

  // ── Determinism ─────────────────────────────────────────────────────────
  it("produces identical token for same (url, key, expires) inputs");
  it("produces different tokens for different keys");
  it("produces different tokens for different expires values");

  // ── Expiry Clamping ─────────────────────────────────────────────────────
  it("clamps expires below minTtlSeconds to minTtlSeconds");
  it("clamps expires above maxTtlSeconds to maxTtlSeconds");
  it("defaults expires to now + defaultTtlSeconds when omitted");

  // ── Error Handling ──────────────────────────────────────────────────────
  it("throws RangeError for non-URL videoUrl");
});

describe("BunnyCdnTokenSigner.isExpired()", () => {
  it("returns true for token with expires = 1000 (past)");
  it("returns true for token expiring within 30 seconds (clock-skew buffer)");
  it("returns false for token expiring in 60+ seconds");
});
```

#### [NEW] `src/lib/bunny/video-source-detector.test.ts`

```typescript
// Tests for VideoSourceDetector class and all strategy classes

describe("VideoSourceDetector.detect()", () => {
  // ── YouTube Detection ───────────────────────────────────────────────────
  it("detects https://www.youtube.com/watch?v=abc → type='youtube'");
  it("detects https://youtu.be/abc → type='youtube'");
  it("detects https://m.youtube.com/watch?v=abc → type='youtube'");

  // ── Bunny CDN Detection ─────────────────────────────────────────────────
  it("detects https://vz-123.b-cdn.net/videos/lesson.m3u8 → type='bunny-cdn'");
  it("detects https://cdn.example.com/lesson.m3u8 → type='bunny-cdn' (by extension)");
  it("detects pre-signed Bunny CDN URL → type='bunny-cdn'");

  // ── Unknown / Fallback ──────────────────────────────────────────────────
  it("returns type='unknown' for https://example.com/video.mp4");
  it("returns type='unknown' for empty string");
  it("returns type='unknown' for null/undefined (graceful degradation)");

  // ── INVARIANT TESTS — These MUST never regress ──────────────────────────
  it("INVARIANT: YouTube URLs always have isProtected=false");
  it("INVARIANT: YouTube URLs always have requiresTokenAuth=false");
  it("INVARIANT: Bunny CDN URLs always have isProtected=true");
  it("INVARIANT: Bunny CDN URLs always have requiresTokenAuth=true");
  it("INVARIANT: unknown URLs always have isProtected=false");

  // ── Value Object Immutability ───────────────────────────────────────────
  it("returned VideoSource is frozen (Object.isFrozen)");
});

describe("YouTubeVideoSourceStrategy", () => {
  it("matches youtube.com URLs");
  it("matches youtu.be URLs");
  it("does not match b-cdn.net URLs");
  it("requiresProtection() always returns false");
});

describe("BunnyCdnVideoSourceStrategy", () => {
  it("matches b-cdn.net hostname URLs");
  it("matches .m3u8 extension URLs");
  it("does not match youtube.com URLs");
  it("requiresProtection() always returns true");
});
```

#### [NEW] `tests/integration/api/bunny-token-route.test.ts`

```typescript
// Integration tests for GET /api/bunny/token
// Mocks: auth.api.getSession, checkDistributedRateLimit, env

describe("GET /api/bunny/token", () => {
  // ── Authentication ──────────────────────────────────────────────────────
  it("returns 401 UNAUTHORIZED when session is null");
  it("returns 401 UNAUTHORIZED when session has no user.id");

  // ── Input Validation ────────────────────────────────────────────────────
  it("returns 400 BAD_REQUEST when videoUrl is missing");
  it("returns 400 BAD_REQUEST when videoUrl is not a valid URL");
  it("returns 400 BAD_REQUEST when videoUrl has non-b-cdn.net hostname");
  it("returns 400 BAD_REQUEST when videoUrl already contains bcdn_token=");
  it("returns 400 BAD_REQUEST when videoUrl extension is not .m3u8 or .mp4");
  it("returns 400 BAD_REQUEST when expires is in the past");
  it("returns 400 BAD_REQUEST when expires is > 24 hours in the future");

  // ── Rate Limiting ───────────────────────────────────────────────────────
  it("returns 429 RATE_LIMIT_EXCEEDED with Retry-After header when limit exceeded");
  it("proceeds normally when Redis is unavailable (fail-open mode)");

  // ── Successful Signing ──────────────────────────────────────────────────
  it("returns 200 with success=true for valid Bunny CDN URL");
  it("response contains token starting with HS256-");
  it("response signedUrl contains bcdn_token= in path");
  it("response signedUrl contains token_path= parameter");
  it("response expires is a future Unix timestamp");

  // ── Configuration Errors ────────────────────────────────────────────────
  it("returns 500 when BUNNY_VIDEO_LIBRARY_API_KEY is missing");
  it("returns 500 when BUNNY_CDN_HOSTNAME is missing");

  // ── Error Envelope Format ───────────────────────────────────────────────
  it("error responses match { success: false, error: { code, numericCode, statusCode, message } } shape");
  it("429 response includes retryAfter field in error body");
});
```

---

## 8. API Contract

### `GET /api/bunny/token`

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/bunny/token` |
| **Authentication** | Session cookie (Better Auth) — required |
| **Rate Limit** | 5 requests / 60 seconds / user (sliding window, Redis-backed, fail-open) |

**Request Query Parameters**:

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| `videoUrl` | string (URL) | Yes | Must be valid URL; hostname includes `b-cdn.net`; extension `.m3u8` or `.mp4`; no `bcdn_token=` present |
| `expires` | number (Unix seconds) | No | Future timestamp; min now+5m, max now+24h |

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "token": "HS256-5a5de480abc123...",
    "expires": 1721380800,
    "signedUrl": "https://vz-123.b-cdn.net/bcdn_token=HS256-5a5de480abc123&expires=1721380800&token_path=%2Fvideos%2F/videos/lesson.m3u8"
  }
}
```

**Error Responses**:

| Status | Code | Numeric | Condition |
|--------|------|---------|-----------|
| 401 | `UNAUTHORIZED` | 9002 | No valid session |
| 400 | `BAD_REQUEST` | 9005 | Invalid `videoUrl` or `expires` |
| 429 | `RATE_LIMIT_EXCEEDED` | 9004 | 5 req/min exceeded. `Retry-After` header set. |
| 500 | `INTERNAL_SERVER_ERROR` | 9999 | Missing env vars or unexpected signing error |

---

## 9. Security Architecture

```
SECURITY LAYER STACK — ordered by enforcement priority

Layer 1: Session Authentication  [route.ts — auth.api.getSession()]
├── Who: Authenticated users only
├── What: Must have active Better Auth session cookie
├── Failure: 401 Unauthorized
└── Note: Enrollment check at lesson page level (Server Component guard)

Layer 2: Input Validation  [schemas.ts — BunnyTokenRequestSchema]
├── Who: Zod schema validates all query params before use
├── What: URL format, b-cdn.net hostname, no pre-signed URLs, valid extension
├── Failure: 400 Bad Request with specific message
└── Note: Defense-in-depth after VideoSourceDetector check

Layer 3: Rate Limiting  [route.ts — checkDistributedRateLimit()]
├── Who: Per-user sliding window (5 req / 60 seconds)
├── What: Prevents brute-force token generation and abuse
├── Failure: 429 Too Many Requests with Retry-After header
└── Infrastructure: Existing Redis sliding-window via DistributedRateLimiter port

Layer 4: CDN Token Authentication  [token-signer.ts — BunnyCdnTokenSigner]
├── Who: Bunny CDN validates HMAC-SHA256 signature on every video request
├── What: Path-style tokens; 1h TTL by default; covers all .ts HLS segments
├── Failure: Bunny CDN returns 403; Vidstack fires onError; hook auto-refreshes
└── Key: BUNNY_VIDEO_LIBRARY_API_KEY never leaves server process

Layer 5: Allowed Domains  [Bunny dashboard — Referer check]
├── Who: Browser sends Referer header with every CDN request
├── What: Bunny validates Referer against allowed domain list
├── Failure: 403 from Bunny CDN on requests from unlisted domains
└── Config: Add production domain + localhost in Bunny Stream → Security

Layer 6: Block Direct URL File Access  [Bunny dashboard]
├── Who: Blocks direct .mp4 downloads (Network tab)
├── What: Prevents raw file download even with a valid token
├── Failure: 403 from Bunny CDN for direct file access
└── HLS: .m3u8 + .ts streaming still allowed

Layer 7: NEXT_PUBLIC_ Guard  [env.ts — startup assertion]
└── Runtime check: throws on startup if any NEXT_PUBLIC_BUNNY* var exists
    This catches accidental exposure of signing key in client bundles.
```

**Future (v2)**: MediaCage Enterprise DRM (Widevine + FairPlay) when piracy justifies $99/month cost.

---

## 10. Error Handling Strategy

```
ERROR TAXONOMY — complete decision tree

Network/Fetch Errors:
├── Timeout          → NETWORK_ERROR, retryable=true, backoff=exponential
├── DNS failure      → NETWORK_ERROR, retryable=true
└── Fetch exception  → NETWORK_ERROR, retryable=true

HTTP 4xx Errors:
├── 401             → ACCESS_DENIED, retryable=false (must re-login)
├── 403             → ACCESS_DENIED, retryable=false (not enrolled or token invalid)
│   NOTE: 403 from /api/bunny/token ≠ 403 from Bunny CDN during playback
│   Bunny CDN 403 during playback → token expiry → trigger onTokenExpired()
└── 429             → RATE_LIMITED, retryable=true, retryAfterMs from header

HTTP 5xx Errors:
└── 500+            → CDN_UNAVAILABLE, retryable=true

Token Expiry during Playback:
├── Vidstack fires onError (detail.code=403 or detail.message includes "403")
├── VideoPlayer calls onTokenExpired() prop
├── useBunnyCdnToken: retriesRef++
│   ├── Attempt 1: wait 1s  → re-fetch → update resolvedUrl → Vidstack re-initializes
│   ├── Attempt 2: wait 2s  → re-fetch → ...
│   ├── Attempt 3: wait 4s  → re-fetch → ...
│   └── After 3 failures: TOKEN_INVALID, retryable=false → VideoErrorDisplay
└── User sees: "Session expired — reconnecting..." during retry

Configuration Errors (never shown to user):
├── Missing BUNNY_VIDEO_LIBRARY_API_KEY → logged + 500 returned
└── Missing BUNNY_CDN_HOSTNAME         → logged + 500 returned
```

---

## 11. File Change Summary

| File | Status | Change |
|------|--------|--------|
| [env.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/config/env.ts) | **MODIFY** | Add 3 Bunny env vars; add NEXT_PUBLIC_ guard |
| [video-source.types.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/lib/bunny/video-source.types.ts) | **NEW** | All domain types, value objects, error types, API contracts |
| [video-source.strategy.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/lib/bunny/strategies/video-source.strategy.ts) | **NEW** | Strategy interface (ISP-compliant, 2 methods only) |
| [youtube.strategy.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/lib/bunny/strategies/youtube.strategy.ts) | **NEW** | `YouTubeVideoSourceStrategy` class |
| [bunny-cdn.strategy.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/lib/bunny/strategies/bunny-cdn.strategy.ts) | **NEW** | `BunnyCdnVideoSourceStrategy` class |
| [video-source-detector.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/lib/bunny/video-source-detector.ts) | **NEW** | `VideoSourceDetector` class + `VideoSourceDetector.default` singleton |
| [video-source-detector.test.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/lib/bunny/video-source-detector.test.ts) | **NEW** | Unit + invariant tests for detector and both strategies |
| [token-signer.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/lib/bunny/token-signer.ts) | **NEW** | `BunnyCdnTokenSigner` class (server-only, node:crypto) |
| [token-signer.test.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/lib/bunny/token-signer.test.ts) | **NEW** | Unit tests for signing, path computation, expiry, clamping |
| [token.service.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/lib/bunny/token.service.ts) | **NEW** | `BunnyTokenService` class + `BunnyVideoTokenError` |
| [schemas.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/api/bunny/token/schemas.ts) | **NEW** | `BunnyTokenRequestSchema` (Zod — request validation) |
| [route.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/api/bunny/token/route.ts) | **NEW** | GET handler: auth → validate → rate-limit → sign → respond |
| [use-bunny-cdn-token.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/hooks/use-bunny-cdn-token.ts) | **NEW** | Token lifecycle hook: detect → fetch → refresh → backoff |
| [video-player.tsx](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player.tsx) | **MODIFY** | `toPlayerSrc()` HLS branch + `onTokenExpired` prop + `onError` 403 handler |
| [lesson-client-bridge.tsx](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-client-bridge.tsx) | **MODIFY** | Import + wire `useBunnyCdnToken`; conditional skeleton/error/player rendering |
| [video-player-skeleton.tsx](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player-skeleton.tsx) | **NEW** | Glassmorphism loading skeleton (zero CLS, ambilight pulse) |
| [video-error-display.tsx](file:///c:/Users/dell/Documents/ScholarX/V2/web/src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-error-display.tsx) | **NEW** | Glassmorphism error card (accessible, retry button) |
| [bunny-token-route.test.ts](file:///c:/Users/dell/Documents/ScholarX/V2/web/tests/integration/api/bunny-token-route.test.ts) | **NEW** | Integration tests (12 scenarios) |

**Confirmed unchanged** (HLS events are identical to YouTube events in Vidstack):

| File | Why Unchanged |
|------|---------------|
| `heatmap-timeline.tsx` | HLS `onPause` events fire identically — no diff from YouTube |
| `quality-selector.tsx` | Vidstack exposes HLS quality levels via same `useVideoQualityOptions` API |
| `use-lesson-progress.ts` | HTML5 video events (`timeupdate`, `pause`, `seeked`, `ended`) unchanged |
| `next-course-catalog.service.ts` | `toLessonSummary()` passthrough — no video-source-specific logic |
| `courses-db.schema.ts` | `video_url` column (varchar 500) already exists — zero DB migration |
| All sidebar, tabs, notes, resources | No dependency on video source type |

---

## 12. Architecture Invariants Matrix

Every change to video-related code must be validated against this matrix:

| Invariant | Where Enforced | Test Coverage |
|-----------|---------------|---------------|
| YouTube URLs always `isProtected=false` | `YouTubeVideoSourceStrategy.requiresProtection()` | Invariant test in `video-source-detector.test.ts` |
| YouTube URLs never signed with CDN Token Auth | `useBunnyCdnToken`: skips fetch when `source.type !== "bunny-cdn"` | Hook unit test |
| Bunny CDN URLs always `isProtected=true` | `BunnyCdnVideoSourceStrategy.requiresProtection()` | Invariant test in `video-source-detector.test.ts` |
| Bunny CDN URLs never played unsigned | `useBunnyCdnToken`: `resolvedUrl = null` until `signedUrl` received | Hook unit test |
| Player never refuses valid YouTube URL | `toPlayerSrc()` YouTube branch always returns first | No regression test needed (YouTube path unchanged) |
| Free lessons never require authentication | YouTube source → `useBunnyCdnToken` skips fetch entirely | Integration test on lesson page |
| Rollback: zero code deploy | Raw URL in DB; `VideoSourceDetector.detect()` routes at runtime | Manual verification |
| Zero `any` in video code paths | TypeScript strict mode + all types in `video-source.types.ts` | `pnpm typecheck` |
| API key never in client bundle | `token-signer.ts` uses `node:crypto` (server-only) | Bundle analysis |
| Value Objects are immutable | `Object.freeze()` on all `VideoSource`, `CdnToken`, `SignedVideoUrl` instances | Unit test: `Object.isFrozen()` assertion |
| NEXT_PUBLIC_ guard | Startup assertion in `env.ts` | — |

---

## 13. Testing Strategy

### Test Pyramid

```
         ▲ E2E / Manual (few, expensive)
         │  - Bunny CDN video loads + quality levels visible
         │  - HLS heatmap renders from pause events
         │  - Token expiry → auto-refresh → resumes
         │  - Rollback: Bunny → YouTube in DB → plays immediately
         │
        ▲▲▲ Integration (moderate)
        │  - GET /api/bunny/token: 12 scenarios (auth, validation, rate-limit, signing, errors)
        │
      ▲▲▲▲▲ Unit (many, fast)
      │  - BunnyCdnTokenSigner: signing determinism, path computation, expiry, clamping
      │  - VideoSourceDetector: all URL patterns, INVARIANT tests, immutability
      │  - YouTubeVideoSourceStrategy: URL matching, requiresProtection=false
      │  - BunnyCdnVideoSourceStrategy: URL matching, requiresProtection=true
```

### Automated Test Commands

```bash
# Unit tests — pure TypeScript, no Next.js
node --import tsx --test src/lib/bunny/token-signer.test.ts
node --import tsx --test src/lib/bunny/video-source-detector.test.ts

# Integration tests — mocked auth + Redis
node --import tsx --test tests/integration/api/bunny-token-route.test.ts

# Type checking — zero new type errors allowed
pnpm typecheck

# Linting — zero new violations allowed
pnpm lint
```

---

## 14. Environment & Configuration

### Required Environment Variables

```bash
# .env.local — SERVER ONLY — never prefix with NEXT_PUBLIC_

# Bunny Pull Zone URL Token Authentication Key (signing key)
# Found in: Bunny Dashboard → Pull Zones → Security → Token Authentication Key
BUNNY_CDN_TOKEN_KEY=your_token_auth_key_here

# Bunny Stream Video Library API Key (for backend management)
# Found in: Bunny Dashboard → Stream → Your Library → API
BUNNY_VIDEO_LIBRARY_API_KEY=your_library_api_key_here

# Bunny CDN pull zone hostname for your video library
# Format: vz-{id}.b-cdn.net
BUNNY_CDN_HOSTNAME=vz-XXXXX.b-cdn.net

# Bunny Stream video library ID (for embed token support in v2)
# Found in: Bunny Dashboard → Stream → Your Library → Library ID
BUNNY_VIDEO_LIBRARY_ID=your_library_id_here
```

### Bunny Dashboard Configuration Checklist

- [ ] Create Bunny Stream video library (if not yet created)
- [ ] Upload all paid course lesson videos to the library
- [ ] **Enable CDN Token Authentication** (Pull Zones → Security → Token Authentication → Enable)
- [ ] **Enable Allowed Domains** — add production domain + localhost
- [ ] **Enable Block Direct URL File Access**
- [ ] **Enable Embed View Token Authentication** (defense-in-depth)
- [ ] **DO NOT enable MediaCage Basic DRM** — incompatible with Vidstack (blocks third-party players)
- [ ] Copy the URL Token Authentication Key into `BUNNY_CDN_TOKEN_KEY`
- [ ] Copy the Video Library API Key into `BUNNY_VIDEO_LIBRARY_API_KEY`
- [ ] Note the CDN hostname (`vz-xxx.b-cdn.net`) for `BUNNY_CDN_HOSTNAME`

---

## 15. Verification Plan

### Manual Verification Checklist (QA Gate)

**YouTube Regression (free courses must be unaffected):**
- [ ] Free lesson (YouTube URL in DB): video loads, no `/api/bunny/token` call in Network tab
- [ ] Heatmap overlay renders on YouTube pause events
- [ ] Quality selector works on YouTube
- [ ] Focus mode works on YouTube
- [ ] Resume playback works across page refresh (YouTube)
- [ ] Unauthenticated user on free lesson: no 401 errors at all

**Bunny CDN (paid courses, new behaviour):**
- [ ] Paid lesson (Bunny CDN URL in DB): `/api/bunny/token` called before video plays
- [ ] Network tab: request URL contains `bcdn_token=HS256-` in path
- [ ] HLS quality levels visible in quality selector (Bunny adaptive bitrate)
- [ ] Heatmap overlay renders from HLS pause events
- [ ] Focus mode works with Bunny CDN source
- [ ] Resume playback works across page refresh (Bunny)
- [ ] `curl` direct CDN URL (no token) → 403 Forbidden
- [ ] `curl` direct CDN URL with valid token → 200 OK

**Token Lifecycle:**
- [ ] Simulate token expiry (modify `expires` to past timestamp via mock) → Vidstack 403 → hook detects → re-fetches → playback resumes seamlessly
- [ ] After 3 failed refreshes → `VideoErrorDisplay` rendered with "Unable to play — please refresh the page"
- [ ] 6th token request within 60s → 429 with `Retry-After` header

**Rollback Verification (critical):**
- [ ] Change DB `video_url` from Bunny CDN URL to YouTube URL → lesson plays from YouTube immediately, zero redeploy
- [ ] Change DB `video_url` from YouTube URL to Bunny CDN URL → token generated automatically, zero redeploy

**Performance:**
- [ ] Token generation time < 100ms p95 (measure in browser Network tab)
- [ ] Video start time from token request to first frame ≤ 2 seconds
- [ ] `VideoPlayerSkeleton` shows while token loads (no blank space / CLS)
