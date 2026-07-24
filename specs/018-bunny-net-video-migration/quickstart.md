# Quickstart: Bunny.net Video Infrastructure Migration

**Feature**: 018-bunny-net-video-migration
**Date**: 2026-07-24
**Status**: Complete

---

## Prerequisites

- Node.js 20+
- pnpm 10.33.0
- PostgreSQL database
- Redis instance
- Bunny.net account with Stream video library

---

## Environment Variables

Add these to your `.env.local`:

```bash
# Bunny.net Stream
BUNNY_VIDEO_LIBRARY_ID=your-library-id
BUNNY_VIDEO_LIBRARY_API_KEY=your-api-key
BUNNY_CDN_HOSTNAME=vz-123.b-cdn.net

# Rate Limiting (Redis)
REDIS_URL=redis://localhost:6379
```

**Security Notes**:
- `BUNNY_VIDEO_LIBRARY_API_KEY` is server-only (never expose to client)
- `REDIS_URL` is server-only
- Never commit these values to version control

---

## Setup Steps

### 1. Bunny.net Dashboard Configuration

1. Log in to [Bunny.net Dashboard](https://dashboard.bunny.net/)
2. Navigate to **Stream** → **Video Libraries**
3. Select your video library (or create one)
4. Go to **Security** tab
5. Configure:
   - ✅ **CDN Token Authentication**: Enabled
   - ✅ **Allowed Domains**: Add `yourdomain.com` and `localhost`
   - ✅ **Block Direct URL File Access**: Enabled
   - ✅ **Embed View Token Authentication**: Enabled
   - ❌ **MediaCage Basic DRM**: Disabled (incompatible with Vidstack)
6. Note your **Video Library API Key** (for token signing)

### 2. Install Dependencies

```bash
# No new dependencies required
# Vidstack ^1.12.13 already includes HLS support via bundled hls.js
pnpm install
```

### 3. Database Schema

No schema changes required. The existing `lessons.video_url` column already supports both YouTube and Bunny CDN URLs.

### 4. Environment Validation

```bash
# Validate environment variables
pnpm validate:env
```

---

## Development Workflow

### Testing Video Source Detection

```typescript
// Test toPlayerSrc() function
import { toPlayerSrc } from "./video-player";

// YouTube URLs
toPlayerSrc("https://www.youtube.com/watch?v=jNQXAC9IVRw");
// → { src: "https://...", type: "video/youtube" }

// Bunny CDN URLs
toPlayerSrc("https://vz-123.b-cdn.net/videos/lesson.m3u8");
// → { src: "https://...", type: "application/x-mpegURL" }

// Unknown URLs
toPlayerSrc("https://example.com/video.mp4");
// → "https://example.com/video.mp4"
```

### Testing Token Generation

```bash
# Start development server
pnpm dev

# Test token endpoint (requires authentication)
curl "http://localhost:3000/api/bunny/token?videoUrl=https://vz-123.b-cdn.net/videos/lesson.m3u8"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "token": "HS256-...",
#     "expires": 1721380800,
#     "signedUrl": "https://vz-123.b-cdn.net/bcdn_token=..."
#   }
# }
```

### Testing Video Playback

1. Upload a test video to Bunny Stream
2. Note the CDN URL (e.g., `https://vz-123.b-cdn.net/videos/test.m3u8`)
3. Create a lesson with this URL in the database
4. Navigate to the lesson page
5. Verify:
   - Video plays correctly
   - Quality selector shows available levels
   - Heatmap overlay renders on pause
   - Progress tracking works (pause, seek, completion)
   - Resume playback works across sessions

---

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific test files
node --import tsx --test src/lib/bunny/token-signing.test.ts
node --import tsx --test src/lib/bunny/video-source-detector.test.ts
node --import tsx --test src/app/\(platform\)/courses/\[slug\]/lessons/\[lessonId\]/_components/to-player-src.test.ts
```

### Integration Tests

```bash
# Run API tests
pnpm test:api

# Run specific integration test
node --import tsx --test src/app/api/bunny/token/route.test.ts
```

### Type Checking

```bash
# Run TypeScript compiler
pnpm typecheck
```

### Linting

```bash
# Run ESLint
pnpm lint
```

---

## Common Tasks

### Adding a New Video Source

1. Add detection pattern to `toPlayerSrc()` in `video-player.tsx`
2. Add token signing logic if needed
3. Update `video-source-detector.ts` with new pattern
4. Add unit tests for new detection
5. Update this quickstart with new examples

### Debugging Token Issues

1. Check token expiration: `new Date(expires * 1000).toISOString()`
2. Verify token signature: Compare with Bunny.net dashboard
3. Check Allowed Domains: Ensure your domain is listed
4. Check rate limiting: Look for 429 responses in network tab

### Debugging Playback Issues

1. Check browser console for HLS errors
2. Verify token is valid (not expired)
3. Check network tab for 403 responses
4. Verify video URL is correct (no typos)
5. Test with different browsers (Chrome, Safari, Firefox)

---

## Deployment

### Environment Variables (Production)

Set these in your deployment platform (Vercel, Cloudflare, etc.):

```bash
BUNNY_VIDEO_LIBRARY_ID=your-library-id
BUNNY_VIDEO_LIBRARY_API_KEY=your-api-key
BUNNY_CDN_HOSTNAME=vz-123.b-cdn.net
REDIS_URL=redis://your-redis-instance:6379
```

### Bunny.net Dashboard (Production)

1. Add production domain to Allowed Domains
2. Verify CDN Token Authentication is enabled
3. Test video playback on production
4. Monitor for 403 errors in logs

### Rollback Procedure

If Bunny CDN has issues:

1. Open admin lesson editor
2. Change `video_url` from Bunny CDN path to YouTube URL
3. Save — lesson plays from YouTube immediately
4. No code deploy required

---

## Quick Reference

### URL Patterns

| Source | Pattern | Example |
|--------|---------|---------|
| YouTube | `youtube.com` or `youtu.be` | `https://www.youtube.com/watch?v=jNQXAC9IVRw` |
| Bunny CDN | `b-cdn.net` or `.m3u8` | `https://vz-123.b-cdn.net/videos/lesson.m3u8` |
| Unknown | No match | `https://example.com/video.mp4` |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/bunny/token` | GET | Generate CDN token |

### Rate Limits

| Action | Limit | Window |
|--------|-------|--------|
| Token request | 5 | 1 minute |
| Progress update | 10 | 1 minute |
| Lesson completion | 1 | 24 hours |

---

## Quickstart Complete

Ready for development. See `plan.md` for full implementation details.
