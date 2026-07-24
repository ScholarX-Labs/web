# Contract: Video Source Routing

**Feature**: 018-bunny-net-video-migration
**Date**: 2026-07-24
**Status**: Complete

---

## Overview

Contract for detecting video source type from URL and routing playback accordingly.

**Component**: `VideoPlayer` (`video-player.tsx`)
**Function**: `toPlayerSrc(src: string): PlayerSrc`
**Location**: `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/video-player.tsx`

---

## Interface

### Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `src` | string | Yes | Raw video URL from database |

### Output

| Property | Type | Description |
|----------|------|-------------|
| `src` | string | URL to pass to Vidstack player |
| `type` | PlayerSrcType | MIME type hint for Vidstack |

### PlayerSrcType Enum

| Value | Description |
|-------|-------------|
| `"video/youtube"` | YouTube video provider |
| `"application/x-mpegURL"` | HLS stream provider |
| `"string"` | Raw URL passthrough (Vidstack auto-detect) |

---

## Detection Rules

### Rule 1: YouTube Detection

**Pattern**: URL contains `youtube.com` or `youtu.be`

**Examples**:
- `https://www.youtube.com/watch?v=jNQXAC9IVRw` → YouTube
- `https://youtu.be/jNQXAC9IVRw` → YouTube
- `https://www.youtube.com/embed/jNQXAC9IVRw` → YouTube
- `https://m.youtube.com/watch?v=jNQXAC9IVRw` → YouTube

**Action**: Return `{ src, type: "video/youtube" }`

**Security**: No token signing required

---

### Rule 2: Bunny CDN Detection

**Pattern**: URL contains `b-cdn.net` OR URL has `.m3u8` extension

**Examples**:
- `https://vz-123.b-cdn.net/videos/lesson.m3u8` → Bunny CDN (HLS)
- `https://library.b-cdn.net/lesson.m3u8` → Bunny CDN (HLS)
- `https://vz-123.b-cdn.net/videos/lesson.mp4` → Bunny CDN (MP4)
- `https://example.com/videos/lesson.m3u8` → Bunny CDN (HLS by extension)

**Action**: Return `{ src, type: "application/x-mpegURL" }`

**Security**: Token signing required before playback

---

### Rule 3: Fallback Detection

**Pattern**: No pattern match

**Examples**:
- `https://example.com/video.mp4` → Unknown
- `https://cdn.example.com/video.webm` → Unknown
- `video.mp4` → Unknown

**Action**: Return `src` as raw string

**Security**: No token signing (Vidstack auto-detects format)

---

## Implementation

### Current Implementation

```typescript
const toPlayerSrc = (src: string): PlayerSrc => {
  if (/youtube\.com|youtu\.be/i.test(src)) {
    return { src, type: "video/youtube" };
  }
  return src;
};
```

### Required Implementation

```typescript
const toPlayerSrc = (src: string): PlayerSrc => {
  // Rule 1: YouTube detection
  if (/youtube\.com|youtu\.be/i.test(src)) {
    return { src, type: "video/youtube" };
  }
  
  // Rule 2: Bunny CDN detection
  if (/b-cdn\.net|\.m3u8/i.test(src)) {
    return { src, type: "application/x-mpegURL" };
  }
  
  // Rule 3: Fallback
  return src;
};
```

---

## Token Refresh Flow

### State Machine

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Token Refresh Flow                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Player mounts with Bunny CDN URL                                        │
│     │                                                                       │
│     ▼                                                                       │
│  2. Request token from /api/bunny/token                                     │
│     │  { videoUrl, expires }                                                │
│     ▼                                                                       │
│  3. Receive signed URL                                                      │
│     │  { token, expires, signedUrl }                                        │
│     ▼                                                                       │
│  4. Set MediaPlayer src={signedUrl}                                         │
│     │                                                                       │
│     ▼                                                                       │
│  5. HLS playback begins                                                     │
│     │                                                                       │
│     ├──► Success: Playback continues                                        │
│     │                                                                       │
│     └──► 403 Error (token expired)                                          │
│           │                                                                 │
│           ▼                                                                 │
│        6. Detect 403 error code                                             │
│           │                                                                 │
│           ▼                                                                 │
│        7. Request fresh token from /api/bunny/token                         │
│           │                                                                 │
│           ▼                                                                 │
│        8. Update MediaPlayer src={newSignedUrl}                             │
│           │                                                                 │
│           ▼                                                                 │
│        9. HLS playback resumes                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error Handling

| Error Code | Action | User Message |
|------------|--------|--------------|
| 403 | Auto-refresh token | "Session expired — reconnecting..." |
| 401 | Redirect to login | "Please log in to continue" |
| 429 | Wait and retry | "Too many requests — please wait" |
| 500 | Retry with backoff | "Something went wrong — retrying..." |
| Network | Retry with backoff | "Connection lost — retrying..." |

### Retry Strategy

- Maximum 3 retry attempts
- Exponential backoff: 1s, 2s, 4s
- Jitter: random 0-1s added to each delay
- User message updates on each retry
- Final error message after max retries

---

## Quality Selector Integration

### HLS Quality Levels

Bunny CDN provides multiple quality levels in HLS manifest:

```text
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.m3u8
```

### Quality Selector Behavior

- **Auto mode**: Vidstack selects optimal quality based on bandwidth
- **Manual mode**: User selects specific quality level
- **Quality change**: Seamless (no playback interruption)
- **Quality persistence**: Selected quality persists across navigation

### Quality Selector UI

- Shows current quality (e.g., "Auto", "1080p", "720p")
- Dropdown with all available qualities
- HD badge for 720p+ qualities
- Works identically with YouTube and Bunny CDN

---

## Heatmap Overlay Integration

### Heatmap Data Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Heatmap Data Flow                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Player fires onPause event                                              │
│     │  currentTime: number                                                  │
│     ▼                                                                       │
│  2. useLessonProgress hook                                                  │
│     │  Updates pauseEvents array                                            │
│     ▼                                                                       │
│  3. computeHeatmapBuckets()                                                 │
│     │  Divides video into 20 segments                                       │
│     │  Counts pauses per segment                                            │
│     │  Normalizes to 0-1 range                                               │
│     ▼                                                                       │
│  4. HeatmapTimeline component                                               │
│     │  Renders SVG overlay on timeline                                      │
│     │  Blue bars with opacity = engagement density                          │
│     ▼                                                                       │
│  5. User sees heatmap overlay                                               │
│     Ghost state on idle, visible on hover                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Heatmap Compatibility

- **YouTube**: onPause events fire normally → heatmap works
- **Bunny CDN**: onPause events fire normally → heatmap works
- **No changes required**: Heatmap logic is source-agnostic

---

## Progress Tracking Integration

### Event Mapping

| Vidstack Event | Handler | Purpose |
|---------------|---------|---------|
| `onTimeUpdate` | `onTimeUpdate` | Track watched %, update heatmap |
| `onPause` | `onPause` | Record pause position for heatmap |
| `onSeeking` | `onSeeking` | Capture seek-from position |
| `onSeeked` | `onSeeked` | Record seek from→to for analytics |
| `onEnd` | `onEnded` | Mark lesson complete at 90%+ |
| `onDurationChange` | `setVideoDuration` | Set total duration for % calc |

### Event Compatibility

- **YouTube**: All events fire normally
- **Bunny CDN**: All events fire normally (HTML5 video events)
- **No changes required**: Event handling is source-agnostic

---

## Contract Complete

Video source routing contract fully specified with detection rules, token refresh flow, and integration points for quality selector, heatmap, and progress tracking.
