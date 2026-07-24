import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VideoSourceDetector } from "./video-source-detector.js";
import { YouTubeVideoSourceStrategy } from "./strategies/youtube.strategy.js";
import { BunnyCdnVideoSourceStrategy } from "./strategies/bunny-cdn.strategy.js";

describe("VideoSourceDetector.detect()", () => {
  const detector = new VideoSourceDetector();

  // ── YouTube Detection ───────────────────────────────────────────────────

  it("detects https://www.youtube.com/watch?v=abc → type='youtube'", () => {
    const source = detector.detect("https://www.youtube.com/watch?v=abc");
    assert.equal(source.type, "youtube");
  });

  it("detects https://youtu.be/abc → type='youtube'", () => {
    const source = detector.detect("https://youtu.be/abc");
    assert.equal(source.type, "youtube");
  });

  it("detects https://m.youtube.com/watch?v=abc → type='youtube'", () => {
    const source = detector.detect("https://m.youtube.com/watch?v=abc");
    assert.equal(source.type, "youtube");
  });

  it("detects https://www.youtube.com/embed/abc → type='youtube'", () => {
    const source = detector.detect("https://www.youtube.com/embed/abc");
    assert.equal(source.type, "youtube");
  });

  // ── Bunny CDN Detection ─────────────────────────────────────────────────

  it("detects https://vz-123.b-cdn.net/videos/lesson.m3u8 → type='bunny-cdn'", () => {
    const source = detector.detect("https://vz-123.b-cdn.net/videos/lesson.m3u8");
    assert.equal(source.type, "bunny-cdn");
  });

  it("detects https://cdn.example.com/lesson.m3u8 → type='bunny-cdn' (by extension)", () => {
    const source = detector.detect("https://cdn.example.com/lesson.m3u8");
    assert.equal(source.type, "bunny-cdn");
  });

  it("detects pre-signed Bunny CDN URL → type='bunny-cdn'", () => {
    const url = "https://vz-123.b-cdn.net/bcdn_token=HS256-abc&expires=1721380800&token_path=%2Fvideos%2F/videos/lesson.m3u8";
    const source = detector.detect(url);
    assert.equal(source.type, "bunny-cdn");
  });

  // ── Unknown / Fallback ──────────────────────────────────────────────────

  it("returns type='unknown' for https://example.com/video.mp4", () => {
    const source = detector.detect("https://example.com/video.mp4");
    assert.equal(source.type, "unknown");
  });

  it("returns type='unknown' for empty string", () => {
    const source = detector.detect("");
    assert.equal(source.type, "unknown");
  });

  it("returns type='unknown' for null (graceful degradation)", () => {
    const source = detector.detect(null as unknown as string);
    assert.equal(source.type, "unknown");
  });

  it("returns type='unknown' for undefined (graceful degradation)", () => {
    const source = detector.detect(undefined as unknown as string);
    assert.equal(source.type, "unknown");
  });

  // ── INVARIANT TESTS — These MUST never regress ──────────────────────────

  it("INVARIANT: YouTube URLs always have isProtected=false", () => {
    const ytUrls = [
      "https://www.youtube.com/watch?v=abc",
      "https://youtu.be/abc",
      "https://m.youtube.com/watch?v=abc",
    ];
    for (const url of ytUrls) {
      const source = detector.detect(url);
      assert.equal(source.isProtected, false, `YouTube URL ${url} should have isProtected=false`);
    }
  });

  it("INVARIANT: YouTube URLs always have requiresTokenAuth=false", () => {
    const ytUrls = [
      "https://www.youtube.com/watch?v=abc",
      "https://youtu.be/abc",
    ];
    for (const url of ytUrls) {
      assert.equal(detector.requiresTokenAuth(url), false, `YouTube URL ${url} should not require token auth`);
    }
  });

  it("INVARIANT: Bunny CDN URLs always have isProtected=true", () => {
    const bunnyUrls = [
      "https://vz-123.b-cdn.net/videos/lesson.m3u8",
      "https://library.b-cdn.net/lesson.m3u8",
      "https://cdn.example.com/lesson.m3u8",
    ];
    for (const url of bunnyUrls) {
      const source = detector.detect(url);
      assert.equal(source.isProtected, true, `Bunny CDN URL ${url} should have isProtected=true`);
    }
  });

  it("INVARIANT: Bunny CDN URLs always have requiresTokenAuth=true", () => {
    const bunnyUrls = [
      "https://vz-123.b-cdn.net/videos/lesson.m3u8",
      "https://library.b-cdn.net/lesson.m3u8",
    ];
    for (const url of bunnyUrls) {
      assert.equal(detector.requiresTokenAuth(url), true, `Bunny CDN URL ${url} should require token auth`);
    }
  });

  it("INVARIANT: unknown URLs always have isProtected=false", () => {
    const unknownUrls = [
      "https://example.com/video.mp4",
      "https://cdn.example.com/video.webm",
    ];
    for (const url of unknownUrls) {
      const source = detector.detect(url);
      assert.equal(source.isProtected, false, `Unknown URL ${url} should have isProtected=false`);
    }
  });

  // ── Value Object Immutability ───────────────────────────────────────────

  it("returned VideoSource is frozen (Object.isFrozen)", () => {
    const source = detector.detect("https://www.youtube.com/watch?v=abc");
    assert.ok(Object.isFrozen(source), "VideoSource should be frozen");
  });

  it("returned VideoSource for Bunny CDN is frozen", () => {
    const source = detector.detect("https://vz-123.b-cdn.net/videos/lesson.m3u8");
    assert.ok(Object.isFrozen(source), "VideoSource should be frozen");
  });
});

describe("YouTubeVideoSourceStrategy", () => {
  const strategy = new YouTubeVideoSourceStrategy();

  it("matches youtube.com URLs", () => {
    assert.equal(strategy.matches("https://www.youtube.com/watch?v=abc"), true);
  });

  it("matches youtu.be URLs", () => {
    assert.equal(strategy.matches("https://youtu.be/abc"), true);
  });

  it("does not match b-cdn.net URLs", () => {
    assert.equal(strategy.matches("https://vz-123.b-cdn.net/videos/lesson.m3u8"), false);
  });

  it("does not match .m3u8 extension URLs", () => {
    assert.equal(strategy.matches("https://example.com/lesson.m3u8"), false);
  });

  it("requiresProtection() always returns false", () => {
    assert.equal(strategy.requiresProtection(), false);
  });
});

describe("BunnyCdnVideoSourceStrategy", () => {
  const strategy = new BunnyCdnVideoSourceStrategy();

  it("matches b-cdn.net hostname URLs", () => {
    assert.equal(strategy.matches("https://vz-123.b-cdn.net/videos/lesson.m3u8"), true);
  });

  it("matches .m3u8 extension URLs", () => {
    assert.equal(strategy.matches("https://example.com/lesson.m3u8"), true);
  });

  it("does not match youtube.com URLs", () => {
    assert.equal(strategy.matches("https://www.youtube.com/watch?v=abc"), false);
  });

  it("does not match regular .mp4 URLs", () => {
    assert.equal(strategy.matches("https://example.com/video.mp4"), false);
  });

  it("requiresProtection() always returns true", () => {
    assert.equal(strategy.requiresProtection(), true);
  });
});
