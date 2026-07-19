# Bunny.net Migration Analysis — ScholarX Video Infrastructure

## Executive Summary

ScholarX is migrating from YouTube to Bunny.net Stream to prevent content theft
via browser Inspect tools. After thorough analysis, the recommended approach is:

**Security**: CDN Token Authentication (HMAC-signed URLs) + Allowed Domains —
**NO MediaCage DRM** (Basic is incompatible with Vidstack, Enterprise is costly).

**Player**: Keep Vidstack (custom player) with Bunny CDN as the source.
The iframe approach is simpler but sacrifices custom UI, heatmap overlay,
and seek-from tracking.

**Decision required**: Vidstack (custom) vs Bunny iframe (simple).

---

## ARCHITECTURAL RULE — Dual Video Source Support (Non-Negotiable)

> **This rule is permanent. No migration, refactor, or optimization may violate it.**

### The Rule

ScholarX must **always** support two video sources simultaneously through the
**same Vidstack player**, with **zero security coupling** between them:

| Source | Used For | Security | Token Signing | Rollback |
|--------|----------|----------|---------------|----------|
| **YouTube** | Free courses (public preview) | None | None — URLs pass through as-is | Already live — no changes |
| **Bunny CDN** | Paid courses (enrolled users) | CDN Token Auth + Allowed Domains | Server-side HMAC signing | Change `video_url` back to YouTube URL |

### Why This Rule Exists

1. **Free courses stay on YouTube** — they're public, marketing-driven, and
   benefit from YouTube's SEO, discovery, and zero-cost hosting.

2. **Paid courses move to Bunny CDN** — they're protected, token-authenticated,
   and restricted to enrolled users.

3. **Rollback must be instant** — if Bunny CDN has issues (outage, pricing
   change, feature gap), an admin changes `lessons.video_url` from a Bunny CDN
   path to a YouTube URL, and playback works immediately with zero code deploy.

4. **No feature parity requirement** — YouTube lessons don't get CDN token
   signing. Bunny lessons don't get YouTube SEO. Each source runs its own
   security model independently.

### How It Works — The `toPlayerSrc()` Contract

The `toPlayerSrc()` function in `video-player.tsx` is the **single point of
routing**. It must detect the URL pattern and return the correct `PlayerSrc`:

```
URL contains youtube.com or youtu.be?
  ├─ YES → Return { src, type: "video/youtube" }
  │        (Vidstack YouTube provider — no token signing, no security)
  │
  └─ NO → URL contains b-cdn.net or .m3u8?
           ├─ YES → Return { src, type: "application/x-mpegURL" }
           │        (Vidstack HLS provider — CDN Token Auth required)
           │
           └─ NO → Return src as-is
                    (Fallback — Vidstack auto-detects)
```

### The Data Flow — Both Sources

```
                        ┌─────────────────────────────────┐
                        │     lessons.video_url (DB)       │
                        │  Stores RAW URL — no tokens      │
                        └──────────┬──────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
            YouTube URL                   Bunny CDN URL
            (free course)                 (paid course)
                    │                             │
                    ▼                             ▼
          toPlayerSrc()                 toPlayerSrc()
          detects YouTube               detects b-cdn.net
                    │                             │
                    ▼                             ▼
          { src, type:                  API signs URL with
            "video/youtube" }           CDN Token Auth
                    │                             │
                    ▼                             ▼
          Vidstack plays it             Vidstack plays signed
          directly — no signing         HLS URL — full security
                    │                             │
                    ▼                             ▼
          No progress restrictions      Progress tracking +
          No token validation           token validation
```

### The Rollback Contract

**To roll back a lesson from Bunny CDN to YouTube:**

1. Admin opens lesson editor in dashboard
2. Changes `video_url` from `https://vz-xxx.b-cdn.net/lesson.m3u8`
   to `https://www.youtube.com/watch?v=VIDEO_ID`
3. Saves — lesson now plays from YouTube immediately
4. No code deploy required. No server restart. No migration.

**To roll forward from YouTube to Bunny CDN:**

1. Upload video to Bunny Stream library
2. Get the CDN path (e.g., `https://vz-xxx.b-cdn.net/lesson.m3u8`)
3. Admin updates `video_url` in lesson editor
4. CDN Token Auth kicks in automatically — no code changes

### What Must NEVER Happen

- ❌ YouTube URLs must never be signed with CDN Token Auth
- ❌ Bunny CDN URLs must never be played without token signing
- ❌ The player must never refuse to play a valid YouTube URL
- ❌ The player must never play a Bunny CDN URL without a valid token
- ❌ Free course lessons must never require authentication to play
- ❌ Paid course lessons must ever be accessible without enrollment
- ❌ Rolling back a lesson source must never require code changes
- ❌ The `toPlayerSrc()` function must never hardcode a single source type

### Validation Checklist

Before any video-related code change, verify:

- [ ] Does this change affect YouTube playback? If yes, test free course lesson.
- [ ] Does this change affect Bunny CDN playback? If yes, test paid course lesson.
- [ ] Does this change break the rollback path? (changing `video_url` in DB)
- [ ] Does this change add security coupling between the two sources?
- [ ] Does this change require both sources to be present for either to work?

**If any answer is YES, the change violates this rule and must be redesigned.**

---

## Current Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Player UI | Vidstack (`@vidstack/react`) | ^1.12.13 |
| Player Layout | `DefaultVideoLayout` (Vidstack built-in) | bundled |
| Quality Picker | Custom `QualitySelector` using `useVideoQualityOptions` | — |
| Progress Tracking | `useLessonProgress` hook (localStorage + server sync) | — |
| Heatmap | `HeatmapTimeline` overlay (pause-event based) | — |
| Event Coordination | `LessonClientBridge` (wires player ↔ hooks) | — |

### Data Flow — How a Video URL Reaches the Player

```
DB: lessons.video_url  (varchar 500 — stores YouTube or direct URLs)
         │
         ▼
Service: toLessonSummary()  ← src/domain/courses/application/next-course-catalog.service.ts:91
         │  Maps lesson.videoUrl → media.src
         ▼
Server Component: LessonPageView  ← src/app/(platform)/.../lesson-page-view.tsx:47
         │  Passes allLessons[] to LessonClientBridge
         ▼
Client Component: LessonClientBridge  ← src/app/(platform)/.../lesson-client-bridge.tsx:46
         │  Reads currentLesson.media.src
         ▼
VideoPlayer  ← src/app/(platform)/.../video-player.tsx:75
         │  toPlayerSrc(src) converts URL → PlayerSrc
         ▼
<MediaPlayer src={playerSrc}>
         │
         ▼
<MediaProvider />  ← Vidstack auto-detects format from URL/headers
```

### The Critical Function — `toPlayerSrc()`

```ts
// video-player.tsx:67-73
const toPlayerSrc = (src: string): PlayerSrc => {
  if (/youtube\.com|youtu\.be/i.test(src)) {
    return { src, type: "video/youtube" };
  }
  return src;  // ← Everything else passes through as a raw string
};
```

This function currently only distinguishes YouTube from "everything else."
Bunny CDN URLs (e.g. `https://library.b-cdn.net/lesson.m3u8`) will fall through
as plain strings. Vidstack will attempt auto-detection from the URL extension.

### Events the Player Relies On

All from `video-player.tsx:133-177`, wired to `useLessonProgress`:

| Vidstack Event | ScholarX Handler | Purpose |
|---------------|-----------------|---------|
| `onTimeUpdate` | `onTimeUpdate` | Tracks watched %, updates heatmap |
| `onPause` | `onPause` | Records pause position for heatmap |
| `onSeeking` | `onSeeking` | Captures seek-from position |
| `onSeeked` | `onSeeked` | Records seek from→to for analytics |
| `onEnd` | `onEnded` | Marks lesson complete at 90%+ |
| `onDurationChange` | `setVideoDuration` | Sets total duration for % calc |
| `onProviderSetup` | YouTube cookie consent | YouTube-only, dead for Bunny |

These are all **standard HTML5 `<video>` events**. They fire identically
whether the source is a direct MP4, HLS stream, or DRM-protected HLS.
They will work with Bunny.net without changes.

---

## Bunny.net Security Features — Full Analysis

### 1. MediaCage Basic DRM

**Status: INCOMPATIBLE — Must NOT be enabled**

> **⚠️ Warning**: Bunny may auto-enable MediaCage Basic on new video libraries.
> Check the Security tab immediately after creating your library and disable it.

MediaCage Basic DRM uses Clear-Key encryption and is restricted to
**Embed View Only**. This means:

- It ONLY works with Bunny's own iframe embed player
- Third-party players like Vidstack are **explicitly blocked**
- The documentation states: "third-party video player will be disabled"
- Attempting to use Vidstack with MediaCage Basic = black screen

**What it does (for reference):**
- Encrypts video segments with Clear-Key encryption
- Prevents downloads by third-party software
- Only allows content through the embed player itself
- Free tier — no additional cost

**Clear-Key security limitation:**
- Keys are transferred to the client in clear (plaintext) format
- A sophisticated attacker can intercept and decrypt the keys
- This is NOT hardware DRM — it's software-only encryption
- Dynamic key generation (per-session) mitigates sharing, but not interception

**Why we can't use it:**
- ScholarX uses Vidstack (`@vidstack/react`) with `MediaPlayer` + `MediaProvider`
- MediaCage Basic blocks all non-Bunny players at the API level
- No workaround exists — this is a server-side restriction

**Verdict**: Disable MediaCage Basic DRM entirely in Bunny dashboard.

---

### 2. MediaCage Enterprise DRM (Widevine + FairPlay)

**Status: COMPATIBLE but COSTLY — Future consideration**

> **Key difference from Basic**: Enterprise uses hardware DRM (Widevine L1 +
> FairPlay) where decryption keys stay in the GPU secure enclave. Unlike Basic,
> keys are NOT sent to the client in clear format. This is the same DRM Netflix
> and Prime Video use.

MediaCage Enterprise offers real hardware DRM that works with custom players
like Vidstack.

**Requirements:**
- Widevine license service endpoint configuration in Vidstack
- FairPlay license service endpoint configuration in Vidstack
- Bunny MediaCage Enterprise subscription ($99/month)
- Per-license fees on top of the monthly cost

**What it provides:**
- Hardware-level decryption (GPU secure enclave)
- Screen recorders capture black frames
- Same DRM Netflix and Prime Video use
- Works with Vidstack's DRM support
- Keys never leave the secure hardware environment

**Why we're deferring it:**
- $99/month + per-license fees are significant for current stage
- CDN Token Auth + Allowed Domains provide adequate protection
- Can upgrade to Enterprise later when piracy justifies the cost

**Verdict**: Defer until piracy becomes a measurable revenue threat.

---

### 3. CDN Token Authentication — PRIMARY SECURITY LAYER

**Status: RECOMMENDED — Must be implemented**

This is the **main security layer** that replaces DRM for content protection.

**How it works:**
- Every CDN URL request must include a signed `token` and `expires` query parameter
- Requests without valid tokens are rejected with 403 Forbidden
- Tokens are HMAC-SHA256 signed using your Video Library API Key
- Tokens expire after a configurable time window

**Signing procedure:**
```
SHA256_HEX(token_security_key + video_id + expiration)
```

**Example signed URL:**
```
https://vz-yourlibrary.b-cdn.net/lesson.m3u8?token=5a5de480...&expires=1721380800
```

**Why this is the primary layer:**
- Protects ALL CDN URLs: `.m3u8`, `.ts` segments, `.mp4`, thumbnails
- Cannot be bypassed — server rejects unsigned requests
- Tokens are short-lived (1-5 minutes recommended)
- Prevents direct URL sharing and unauthorized access

**Implementation requirement:**
- **Server-side token generation** — Video Library API Key must never be in client code
- New API endpoint: `/api/bunny/token` that signs URLs on-demand
- Frontend requests signed URLs before passing to Vidstack

**Important**: CDN Token Authentication applies to ALL direct URLs — MP4
fallbacks, HLS playlists and segments, thumbnails, and previews.

#### Path-Style Tokens — Required for HLS

For HLS streams (`.m3u8` + `.ts` segments), you **must** use path-style tokens.
Query-string tokens only sign the exact URL, but HLS players request segment
files relative to the playlist path. Without path-style tokens, segment requests
return 403.

**How path-style tokens work:**
```
# Query string token (BROKEN for HLS) — only signs the playlist URL
https://vz-123.b-cdn.net/videos/lesson.m3u8?token=abc&expires=1234

# Path-style token (CORRECT for HLS) — signs the directory prefix
https://vz-123.b-cdn.net/bcdn_token=abc&expires=1234/token_path=/videos//videos/lesson.m3u8
```

The `token_path` parameter tells Bunny which directory prefix to validate.
All files under that prefix (playlist + segments) are covered by one token.

**Directory token computation:**
```ts
function computeTokenPath(videoUrl: string, cdnHost: string): string {
  // videoUrl: "https://vz-123.b-cdn.net/videos/lesson.m3u8"
  // cdnHost: "vz-123.b-cdn.net"
  const path = new URL(videoUrl).pathname;  // "/videos/lesson.m3u8"
  const dir = path.substring(0, path.lastIndexOf("/") + 1);  // "/videos/"
  return dir;  // This becomes the token_path
}
```

**Signing with directory tokens (Advanced Token Auth):**
```ts
import { createHmac } from "crypto";

function signHlsUrl(
  videoUrl: string,
  securityKey: string,
  expiresAt: number
): string {
  const url = new URL(videoUrl);
  const tokenPath = url.pathname.substring(0, url.pathname.lastIndexOf("/") + 1);

  // For path-style: sign with token_path
  const dataToSign = `${tokenPath}${expiresAt}`;
  const signature = createHmac("sha256", securityKey)
    .update(dataToSign)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const token = `HS256-${signature}`;
  // Embed token in path, not query string
  return `${url.origin}/bcdn_token=${token}&expires=${expiresAt}&token_path=${encodeURIComponent(tokenPath)}${url.pathname}`;
}
```

#### Token Refresh Strategy for Long Videos

**Problem**: If tokens expire in 5 minutes and a lesson is 30+ minutes,
the HLS manifest request will fail mid-playback when hls.js re-fetches
the playlist (typically every 6-12 seconds for live, or on seek/restart).

**Solutions (pick one):**

| Strategy | TTL | Pros | Cons |
|----------|-----|------|------|
| **Long initial TTL** | 1-2 hours | Simple, no refresh needed | Token valid for hours if leaked |
| **Refresh endpoint** | 5 min + refresh API | Short-lived tokens, more secure | Extra network request, complexity |
| **Server-side signing** | Per-request | Maximum security | Requires backend on every segment |

**Recommended**: Long initial TTL (1 hour) for simplicity. The token is
bound to the session anyway (via Allowed Domains + CDN Token Auth). If
you need tighter security later, add a refresh endpoint.

```ts
// In the token endpoint — use 1-hour TTL for video playback
const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour
```

#### Error Handling — CDN Token Auth Failures

When a CDN Token Auth request fails (403), the player should handle it
gracefully:

**What happens without handling:**
- hls.js shows a generic error or black screen
- User has no way to recover
- Progress tracking stops silently

**Recommended error handling:**

```ts
// In video-player.tsx — add error handler to MediaPlayer
<MediaPlayer
  src={playerSrc}
  onError={(event) => {
    const error = event.detail?.error;
    if (error?.code === 403 || error?.message?.includes("403")) {
      // Token expired or invalid — request new token
      refreshAndRetryPlayback();
    }
  }}
>
```

**Retry flow:**
1. Detect 403 error from hls.js or native player
2. Request fresh token from `/api/bunny/token`
3. Update `src` prop on `<MediaPlayer>` with new signed URL
4. Vidstack/hls.js will re-fetch the manifest automatically

**User-facing message**: Show "Session expired — reconnecting..." during
retry, and "Unable to play — please refresh" if retry fails.

---

### 4. Embed View Token Authentication

**Status: CONDITIONAL — Only applies if using Bunny iframe player**

This protects the **Bunny iframe embed** (`player.mediadelivery.net/embed/...`).

**If using Vidstack (custom player):**
- CDN Token Authentication already protects the video files
- Embed View Token is an **additional layer** that protects the embed endpoint
- Not strictly necessary if CDN Token Auth is enabled
- But provides defense-in-depth

**If using Bunny iframe player:**
- Embed View Token is **required** to prevent unauthorized embedding
- Signs the iframe URL with the same HMAC-SHA256 process
- Embed View Token authentication also protects MediaCage DRM license endpoint

**Signing procedure:**
```
SHA256_HEX(token_security_key + video_id + expiration)
```

**Example signed iframe URL:**
```
https://player.mediadelivery.net/embed/759/video-id?token=...&expires=...
```

**Verdict**: Enable regardless — it's free and adds defense-in-depth.

---

### 5. Allowed Domains

**Status: RECOMMENDED — Always enable**

Restricts which domains can embed or request your videos via Referer check.

**Required domains:**
- `yourdomain.com` (production)
- `localhost` (development)
- Any subdomains used for video delivery

**How it works:**
- Browser sends `Referer: https://yourdomain.com` with every request
- Bunny validates the Referer against your allowed list
- Requests from unknown domains get 403 Forbidden

**Verdict**: Enable and configure required domains.

---

### 6. Block Direct URL File Access

**Status: RECOMMENDED — Enable**

Blocks direct `.mp4` downloads while allowing HLS `.m3u8` streaming.

**Effect:**
- Users can't download raw video files via Network tab
- HLS streaming (`.m3u8` + `.ts` segments) still works
- Combined with CDN Token Auth, this makes downloading very difficult

**Verdict**: Enable.

---

## Architecture Decision: Vidstack vs Bunny iframe Player

### Overview

ScholarX has two options for the video player:

**Option A: Keep Vidstack (Custom Player)**
- Current approach, requires modifications for Bunny CDN
- Full control over UI, quality selection, heatmap overlay
- CDN Token Auth must be implemented server-side

**Option B: Switch to Bunny iframe Player**
- Simpler implementation (just an iframe + Player.js)
- Built-in DRM support with MediaCage
- No custom UI possible (player is Bunny's)
- Limited progress tracking

---

### Progress Tracking Comparison

| What we track | Vidstack (current) | Bunny iframe + Player.js |
|---|---|---|
| **Time updates** | `onTimeUpdate` → currentTime | `timeupdate` → `{ seconds, duration }` ✅ |
| **Completion** | `onEnd` | `ended` event ✅ |
| **Pause positions** | `onPause` → current time directly | `pause` event → call `getCurrentTime()` after ⚠️ |
| **Seek events** | `onSeeking` (from) + `onSeeked` (to) | `seeked` (to only) — **lose "from" position** ❌ |
| **Duration** | `onDurationChange` → duration | `getDuration()` callback ✅ |
| **Watch percentage** | computed from time/duration | same calculation ✅ |
| **Heatmap overlay** | custom `HeatmapTimeline` on timeline | **cannot overlay on iframe** ❌ |
| **Custom quality picker** | `QualitySelector` with `useVideoQualityOptions` | **not possible** — adaptive only or Bunny's UI |
| **Resume playback** | works (reads localStorage) | works (reads localStorage) |

### UI & Feature Comparison

| Feature | Vidstack (Custom) | Bunny iframe |
|---|---|---|
| **Custom controls** | Full control | ❌ Bunny's controls only |
| **Quality selection** | Custom picker with all resolutions | ⚠️ May not have manual quality picker |
| **Heatmap overlay** | ✅ `HeatmapTimeline` on timeline | ❌ Cannot overlay on iframe |
| **Ambilight glow effect** | ✅ Custom CSS/motion | ❌ No control over iframe styling |
| **Focus mode** | ✅ Custom implementation | ❌ Not possible |
| **Glass reflection styling** | ✅ Custom CSS | ❌ Not possible |
| **Responsive sizing** | Full control | ✅ Auto-fills iframe |
| **Keyboard shortcuts** | Custom mappings | ✅ Built-in |
| **Captions/subtitles** | Custom control | ✅ Built-in |
| **Playback speed** | Custom control | ✅ Built-in |
| **Fullscreen** | ✅ | ✅ |
| **Picture-in-Picture** | ✅ | ✅ |

### What You Gain with Bunny iframe

| Gain | Detail |
|---|---|
| **Simpler implementation** | Just an iframe, no Vidstack integration needed |
| **Built-in DRM** | MediaCage works natively with the iframe |
| **Less code to maintain** | Remove custom player components |
| **Consistent UI** | Bunny's player across all lessons |
| **Auto-adaptive quality** | Player handles quality switching automatically |
| **Built-in accessibility** | Screen readers, keyboard nav, ARIA labels |
| **30+ languages** | Player UI localization included |
| **Video chapters** | Built-in support |
| **Highlight moments** | Built-in feature |
| **Retention graph** | Built-in watch time heatmap |

### What You Lose with Bunny iframe

| Loss | Impact | Mitigation |
|---|---|---|
| **Seek "from" position** | Can't track where user seeked from | Accept limitation or use Vidstack |
| **Custom heatmap overlay** | Can't show pause heatmap on timeline | Accept limitation |
| **Custom player UI** | Ambilight, focus mode, glass effects gone | Accept Bunny's styling |
| **Custom quality picker** | No manual resolution selection | Bunny auto-selects (may be fine) |
| **Any control over appearance** | Player looks like Bunny's player | Can customize colors in Bunny dashboard |

### Bunny iframe Player Controls (Built-in)

The Bunny iframe player includes these controls out of the box:
- Play/Pause button
- Timeline/seek bar
- Volume control
- Fullscreen toggle
- Captions/subtitles
- Playback speed (0.5x to 4x)
- Jump forward/backward (10 seconds)
- Video chapters (if configured)
- Responsive design

### Player.js API Events (for progress tracking)

```js
// Load the library
<script src="//assets.mediadelivery.net/playerjs/playerjs-latest.min.js"></script>

// Create player instance
const player = new playerjs.Player("iframe-id");

// Available events for progress tracking
player.on("ready", () => { /* player ready */ });
player.on("timeupdate", (data) => { /* data: { seconds, duration } */ });
player.on("play", () => { /* video started */ });
player.on("pause", () => { /* video paused */ });
player.on("ended", () => { /* video finished */ });
player.on("seeked", () => { /* user seeked */ });
player.on("progress", (data) => { /* data: { percent } */ });
player.on("error", () => { /* error occurred */ });

// Available methods
player.getDuration((duration) => { /* total seconds */ });
player.getCurrentTime((seconds) => { /* current position */ });
player.setCurrentTime(50); // seek to 50s
player.play();
player.pause();
player.getVolume((vol) => { /* 0-100 */ });
player.setVolume(50);
player.getMuted((bool) => { /* muted state */ });
player.mute();
player.unmute();
```

**Important Player.js limitation**: `timeupdate` only gives `{ seconds, duration }`.
To get pause position, you must call `getCurrentTime()` after the `pause` event.

---

## Decision Matrix

### Choose Vidstack (Custom) if:
- Custom player UI is important to your brand
- You want heatmap overlay on timeline
- You need seek-from tracking for analytics
- You want custom quality selection
- You're willing to implement CDN Token Auth server-side

### Choose Bunny iframe if:
- Simplicity is the priority
- You don't need custom player styling
- Built-in DRM protection is desired
- You can live without heatmap overlay
- You want less code to maintain
- Built-in quality adaptation is acceptable

---

## Required Code Changes — Vidstack Approach

### 1. Update `toPlayerSrc()` in `video-player.tsx`

**Current:**
```ts
const toPlayerSrc = (src: string): PlayerSrc => {
  if (/youtube\.com|youtu\.be/i.test(src)) {
    return { src, type: "video/youtube" };
  }
  return src;
};
```

**Needed:**
```ts
const toPlayerSrc = (src: string): PlayerSrc => {
  if (/youtube\.com|youtu\.be/i.test(src)) {
    return { src, type: "video/youtube" };
  }

  // Bunny CDN HLS streams
  if (/b-cdn\.net|\.m3u8/i.test(src)) {
    return { src, type: "application/x-mpegURL" };
  }

  return src;
};
```

### 2. Implement Server-Side CDN Token Generation

**New endpoint: `src/app/api/bunny/token/route.ts`**
```ts
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const expires = Math.floor(Date.now() / 1000) + 300; // 5 minutes

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  const apiKey = process.env.BUNNY_VIDEO_LIBRARY_API_KEY!;
  const data = apiKey + videoId + expires;
  const token = createHmac("sha256", apiKey)
    .update(data)
    .digest("hex");

  return NextResponse.json({ token, expires });
}
```

**Usage in frontend:**
```ts
// Before passing src to Vidstack
const response = await fetch(`/api/bunny/token?videoId=${videoId}`);
const { token, expires } = await response.json();
const signedSrc = `${baseUrl}?token=${token}&expires=${expires}`;
```

### 3. Clean Up YouTube Code (Optional)

After migration, the YouTube detection in `toPlayerSrc()` and the
`onProviderSetup` YouTube cookie block become dead code.

### 4. Install `hls.js` (If Not Already Present)

Vidstack uses `hls.js` internally for HLS playback. Verify it's in `package.json`.

### 5. Add Allowed Domains in Bunny Dashboard

- Add production domain
- Add localhost for development

### 6. Implement Rate Limiting for Points/Awards Endpoint

When awarding points for video completion, rate-limit the endpoint to prevent
replay abuse (e.g., user replays the `ended` event to earn extra points).

**Recommended rate limits:**

| Limit | Window | Purpose |
|-------|--------|---------|
| 1 completion per user per lesson | 24 hours | Prevent duplicate point awards |
| 5 token requests per user per lesson | 1 minute | Prevent token brute-force |
| 10 progress updates per user per lesson | 1 minute | Prevent progress spam |

**Implementation:**
```ts
// In the points/awards API route
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(1, "24 h"), // 1 completion per 24h
  analytics: true,
});

export async function POST(request: Request) {
  const { userId, lessonId } = await request.json();

  const { success } = await ratelimit.limit(`${userId}:${lessonId}`);
  if (!success) {
    return NextResponse.json(
      { error: "Already completed" },
      { status: 429 }
    );
  }

  // Award points...
}
```

**Alternative without Redis**: Use a database table with a unique constraint
on `(user_id, lesson_id, award_type)` and check before inserting.

---

## Required Code Changes — Bunny iframe Approach

### 1. Replace Vidstack with iframe

**Remove:**
- `@vidstack/react` dependency
- `video-player.tsx` (or simplify to iframe wrapper)
- `quality-selector.tsx` (no custom quality picker)
- `heatmap-timeline.tsx` (cannot overlay on iframe)

**Add:**
- Player.js script tag
- iframe component with Bunny embed URL
- Progress tracking via Player.js events

### 2. Update Progress Tracking

**Current approach (Vidstack):**
```ts
// Direct events from Vidstack
onTimeUpdate(currentTime)    // immediate
onPause(currentTime)         // immediate
onSeeked(from, to)           // from + to
onEnded()                    // completion
```

**New approach (Bunny iframe + Player.js):**
```ts
// After iframe loads
player.on("timeupdate", (data) => {
  onTimeUpdate(data.seconds);
});

player.on("pause", () => {
  player.getCurrentTime((currentTime) => {
    onPause(currentTime);  // Must call getCurrentTime after pause
  });
});

player.on("ended", () => {
  onEnded();
});

// Note: seek events only give destination, not source
player.on("seeked", () => {
  player.getCurrentTime((currentTime) => {
    // Can only track "to", not "from"
    onSeeked(0, currentTime); // "from" unknown
  });
});
```

### 3. Generate Signed Embed URLs

```ts
// Server-side: generate embed URL with token
const embedUrl = `https://player.mediadelivery.net/embed/${libraryId}/${videoId}`;
const response = await fetch(`/api/bunny/embed-token?videoId=${videoId}`);
const { token, expires } = await response.json();
const signedEmbedUrl = `${embedUrl}?token=${token}&expires=${expires}`;
```

---

## Recommended Security Stack

```
Layer 1: CDN Token Authentication              ← PRIMARY (must implement)
   └── Protects: All CDN URLs (.m3u8, .ts, .mp4, thumbnails)
   └── Mechanism: HMAC-SHA256 signed URLs with expiration
   └── Implementation: Server-side token generation endpoint
   └── Covers: Unauthorized access, direct URL sharing

Layer 2: Allowed Domains                       ← ENABLE in Bunny dashboard
   └── Protects: Embedding from unauthorized domains
   └── Mechanism: Referer header validation
   └── Covers: Hotlinking, unauthorized re-embedding

Layer 3: Block Direct URL File Access           ← ENABLE in Bunny dashboard
   └── Protects: Raw .mp4 downloads
   └── Mechanism: Rejects direct file access
   └── Covers: Network tab downloads

Layer 4: Embed View Token Authentication       ← ENABLE (defense-in-depth)
   └── Protects: Iframe embed endpoint
   └── Mechanism: Signed embed URLs
   └── Only critical if using Bunny iframe player

Layer 5: MediaCage Enterprise DRM              ← FUTURE (when piracy justifies)
   └── Protects: Screen recording, advanced piracy
   └── Cost: $99/month + per-license fees
   └── Requires: Widevine/FairPlay license server config
   └── Only upgrade if piracy becomes measurable revenue threat
```

**Note**: MediaCage Basic DRM is intentionally EXCLUDED because it is
incompatible with Vidstack (our custom player). It only works with
Bunny's iframe player.

---

## Migration Checklist

### Phase 1: Bunny Dashboard Setup
- [ ] Create Bunny Stream video library
- [ ] Upload all lesson videos
- [ ] Enable CDN Token Authentication
- [ ] Enable Allowed Domains (production + localhost)
- [ ] Enable Block Direct URL File Access
- [ ] Enable Embed View Token Authentication
- [ ] **DO NOT enable MediaCage Basic DRM** (incompatible with Vidstack)
- [ ] Note Video Library API Key (for token signing)

### Phase 2: Server-Side Token Generation
- [ ] Create `/api/bunny/token` endpoint for CDN token signing
- [ ] Create `/api/bunny/embed-token` endpoint for embed token signing
- [ ] Store Video Library API Key in environment variables (server-only)
- [ ] Test token generation with Bunny CDN URLs

### Phase 3: Player Integration (Vidstack Approach)
- [ ] Update `toPlayerSrc()` to detect Bunny CDN URLs
- [ ] Test HLS playback with Vidstack
- [ ] Verify quality selector shows Bunny quality levels
- [ ] Verify progress tracking works (time, pause, seek, completion)
- [ ] Verify heatmap overlay renders
- [ ] Verify resume playback works
- [ ] Clean up YouTube-specific code

### Phase 4: Testing
- [ ] Test on Chrome (HLS playback)
- [ ] Test on Safari (HLS playback)
- [ ] Test on Firefox (HLS playback)
- [ ] Test on mobile browsers
- [ ] Verify CDN Token Auth blocks unsigned requests
- [ ] Verify Allowed Domains blocks unauthorized embeds
- [ ] Verify progress tracking persists across sessions
- [ ] Verify quality switching works
- [ ] Test token expiration and refresh

### Phase 5: Migration
- [ ] Update `lessons.video_url` values to Bunny CDN paths
- [ ] Remove or archive YouTube URLs
- [ ] Update admin lesson editor to accept Bunny CDN URLs
- [ ] Monitor for playback issues in production

---

## Advanced Anti-Piracy Measures — Analysis

### 1. Hardware-Based DRM (Widevine / FairPlay / PlayReady)

**What it is**: EME (Encrypted Media Extensions) decrypts video inside the
GPU's secure enclave. Screen recorders capture a black frame because the
decrypted pixels never leave protected memory.

**ScholarX status**: DEFERRED — Requires MediaCage Enterprise ($99/month).

**The known loophole**: Disabling "Hardware Acceleration" in browser settings
forces software rendering, which can bypass the black-screen protection.

**How real is the loophole?**
- Chrome: ~3% of users have hardware acceleration disabled (mostly old hardware)
- Disabling it also destroys playback performance (CPU decoding 1080p HLS = laggy)
- Widevine L3 (software) still encrypts — just with a weaker key
- The practical risk is low for ScholarX's audience

**Verdict**: Defer until piracy justifies the $99/month cost.

---

### 2. Forensic Dynamic Watermarking

**What it is**: An invisible or semi-visible overlay burned into the video
canvas showing the viewer's IP, email, username, and timestamp. If someone
records and leaks the content, the watermark traces it back to them.

**ScholarX status**: NOT IMPLEMENTED.

**Implementation options:**

| Approach | Effort | Effectiveness |
|----------|--------|---------------|
| **CSS overlay** (positioned over video) | Low | Low — removed by DevTools |
| **Canvas compositing** (render video + watermark to canvas) | Medium | Medium — stops casual inspection |
| **Bunny Stream built-in** (if available) | Low | Medium-High — server-side |
| **Vidstack plugin** (custom renderer) | Medium | Medium — client-side only |

**The hard truth**: Any client-side watermark can be removed by:
1. DevTools → delete the overlay element
2. Screen recording the video element directly (CSS overlay won't show)
3. Canvas-based approach is harder to strip but still bypassable

**Maximum effectiveness**: Server-side watermarking (Bunny Stream may offer
this) or canvas compositing where the video is rendered to a `<canvas>`
element instead of a native `<video>` element.

**Verdict**: Worth adding as a **deterrent**. Won't stop determined pirates,
but will stop 95% of casual sharing. Recommend CSS overlay as MVP, canvas
compositing as v2.

---

### 3. Tab Focus / Interactivity Tricks (Blur-on-Leave)

**What it is**: JavaScript listens for `visibilitychange`, `blur`, or
`mouseleave` events and pauses/blurs the video when the user switches
tabs or applications — disrupting screen recording software.

**ScholarX status**: PARTIALLY EXISTS — but only for data sync, not protection.

Current `visibilitychange` usage:
- `use-lesson-progress.ts:320-344` — flushes progress to localStorage on tab hide
- `lesson-client-bridge.tsx:198-208` — syncs progress to server on tab hide

Neither of these pauses or blurs the video. They're purely for data persistence.

**Effectiveness analysis:**

| Recorder Type | Blur-on-Leave Stops It? |
|--------------|------------------------|
| OBS Window Capture | No — captures the window directly |
| OBS Display Capture | No — captures the full screen |
| QuickTime / built-in recorder | Partially — pauses playback, user can resume |
| Browser extension recorder | Depends on extension |
| Physical camera pointed at screen | No |

**UX risk**: This is **extremely annoying** for legitimate students who
switch tabs to take notes, check documentation, or respond to messages.

**Verdict**: **Not recommended** for an educational platform.

---

### 4. Native Apps / Desktop Wrappers (Electron / Capacitor / Tauri)

**What it is**: Moving from browser to a native app that can use OS-level
security APIs (e.g., Android `FLAG_SECURE`, iOS screen capture detection).

**ScholarX status**: NOT IMPLEMENTED. Pure Next.js web app.

**When this makes sense:**
- If ScholarX reaches 10K+ paying users on mobile
- If piracy becomes a measurable revenue threat (>5% churn)
- If course content is ultra-premium ($500+ per course)

**Verdict**: **Overkill for now.** Revisit when there's clear business
justification and scale.

---

## Appendix: Bunny Stream Documentation References

| Topic | URL |
|-------|-----|
| Security Overview | https://docs.bunny.net/stream/security |
| Embed View Token Auth | https://docs.bunny.net/stream/token-authentication |
| CDN Token Auth | https://docs.bunny.net/cdn/security/token-authentication |
| Player (iframe) | https://docs.bunny.net/stream/player |
| Playback Control API | https://docs.bunny.net/stream/playback-api |
| Embedding Videos | https://docs.bunny.net/stream/embedding |
| Adaptive Bitrate | https://docs.bunny.net/stream/adaptive-bitrate |
| MediaCage DRM | https://docs.bunny.net/stream/drm |
| Security Options | https://docs.bunny.net/stream/security-options |
| Mobile SDK Token Auth | https://docs.bunny.net/stream/mobile-sdk-token-authentication |
