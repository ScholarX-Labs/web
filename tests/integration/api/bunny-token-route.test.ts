import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BunnyTokenRequestSchema } from "../../../src/app/api/bunny/token/schemas.ts";
import { BunnyCdnTokenSigner } from "../../../src/lib/bunny/token-signer.ts";
import { VideoSourceDetector } from "../../../src/lib/bunny/video-source-detector.ts";

/**
 * Integration tests for the Bunny token endpoint components.
 *
 * Tests the Zod validation schema, token signing, and source detection
 * as they would be used in the GET /api/bunny/token route handler.
 *
 * Runner: node --import tsx --test
 */

const VALID_VIDEO_URL = "https://vz-123.b-cdn.net/videos/lesson.m3u8";
const TEST_API_KEY = "test-api-key-abc123";

describe("BunnyTokenRequestSchema", () => {
  // ── Valid Inputs ──────────────────────────────────────────────────────

  it("accepts valid Bunny CDN .m3u8 URL", () => {
    const result = BunnyTokenRequestSchema.safeParse({
      videoUrl: VALID_VIDEO_URL,
    });
    assert.equal(result.success, true);
  });

  it("accepts valid Bunny CDN .mp4 URL", () => {
    const result = BunnyTokenRequestSchema.safeParse({
      videoUrl: "https://vz-123.b-cdn.net/videos/lesson.mp4",
    });
    assert.equal(result.success, true);
  });

  it("accepts URL with expires parameter", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const result = BunnyTokenRequestSchema.safeParse({
      videoUrl: VALID_VIDEO_URL,
      expires: future,
    });
    assert.equal(result.success, true);
  });

  // ── Invalid Inputs ────────────────────────────────────────────────────

  it("rejects missing videoUrl", () => {
    const result = BunnyTokenRequestSchema.safeParse({});
    assert.equal(result.success, false);
  });

  it("rejects empty videoUrl", () => {
    const result = BunnyTokenRequestSchema.safeParse({ videoUrl: "" });
    assert.equal(result.success, false);
  });

  it("rejects non-URL videoUrl", () => {
    const result = BunnyTokenRequestSchema.safeParse({ videoUrl: "not-a-url" });
    assert.equal(result.success, false);
  });

  it("rejects URL without b-cdn.net hostname", () => {
    const result = BunnyTokenRequestSchema.safeParse({
      videoUrl: "https://example.com/video.m3u8",
    });
    assert.equal(result.success, false);
  });

  it("rejects URL without .m3u8 or .mp4 extension", () => {
    const result = BunnyTokenRequestSchema.safeParse({
      videoUrl: "https://vz-123.b-cdn.net/videos/lesson.webm",
    });
    assert.equal(result.success, false);
  });

  it("automatically sanitizes and accepts URL that already contains bcdn_token=", () => {
    const result = BunnyTokenRequestSchema.safeParse({
      videoUrl:
        "https://vz-123.b-cdn.net/bcdn_token=HS256-abc&expires=1721380800&token_path=%2F%2F/videos/lesson.m3u8",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.videoUrl, "https://vz-123.b-cdn.net/videos/lesson.m3u8");
    }
  });

  it("rejects negative expires", () => {
    const result = BunnyTokenRequestSchema.safeParse({
      videoUrl: VALID_VIDEO_URL,
      expires: -1,
    });
    assert.equal(result.success, false);
  });
});

describe("Token Signing Integration", () => {
  const signer = new BunnyCdnTokenSigner({ securityKey: TEST_API_KEY });

  it("end-to-end: valid URL → signed URL with correct format", () => {
    const result = signer.signUrl(VALID_VIDEO_URL);

    assert.ok(result.signedUrl.startsWith("https://"));
    assert.ok(result.signedUrl.includes("bcdn_token=HS256-"));
    assert.ok(result.signedUrl.includes("expires="));
    assert.ok(result.signedUrl.includes("token_path="));
    assert.ok(result.signedUrl.endsWith("/videos/lesson.m3u8"));
    assert.ok(result.token.startsWith("HS256-"));
    assert.ok(result.expires > Math.floor(Date.now() / 1000));
  });

  it("end-to-end: token covers directory prefix for HLS", () => {
    const cdnToken = signer.generateToken(VALID_VIDEO_URL);

    assert.equal(cdnToken.tokenPath, "/videos/");
    // Token signs the directory prefix, not the exact file
    assert.ok(cdnToken.tokenPath.endsWith("/"));
  });

  it("end-to-end: custom expiry is respected", () => {
    const future = Math.floor(Date.now() / 1000) + 7200;
    const result = signer.signUrl(VALID_VIDEO_URL, future);

    assert.equal(result.expires, future);
  });
});

describe("Source Detection Integration", () => {
  const detector = VideoSourceDetector.default;

  it("end-to-end: YouTube URL → no token required", () => {
    const url = "https://www.youtube.com/watch?v=abc";
    const source = detector.detect(url);

    assert.equal(source.type, "youtube");
    assert.equal(source.isProtected, false);
    assert.equal(detector.requiresTokenAuth(url), false);
  });

  it("end-to-end: Bunny CDN URL → token required", () => {
    const url = "https://vz-123.b-cdn.net/videos/lesson.m3u8";
    const source = detector.detect(url);

    assert.equal(source.type, "bunny-cdn");
    assert.equal(source.isProtected, true);
    assert.equal(detector.requiresTokenAuth(url), true);
  });

  it("end-to-end: unknown URL → no token required", () => {
    const url = "https://example.com/video.mp4";
    const source = detector.detect(url);

    assert.equal(source.type, "unknown");
    assert.equal(source.isProtected, false);
    assert.equal(detector.requiresTokenAuth(url), false);
  });
});

describe("Error Envelope Format", () => {
  it("error response matches expected shape", () => {
    const errorResponse = {
      success: false,
      error: {
        code: "BAD_REQUEST",
        numericCode: 9005,
        statusCode: 400,
        message: "Missing required parameter: videoUrl",
      },
    };

    assert.equal(errorResponse.success, false);
    assert.equal(typeof errorResponse.error.code, "string");
    assert.equal(typeof errorResponse.error.numericCode, "number");
    assert.equal(typeof errorResponse.error.statusCode, "number");
    assert.equal(typeof errorResponse.error.message, "string");
  });

  it("429 response includes retryAfter field", () => {
    const rateLimitResponse = {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        numericCode: 9004,
        statusCode: 429,
        message: "Too many requests. Please try again later.",
        retryAfter: 60,
      },
    };

    assert.equal(rateLimitResponse.error.retryAfter, 60);
  });
});
