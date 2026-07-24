import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { BunnyCdnTokenSigner } from "./token-signer.js";

const TEST_SECURITY_KEY = "test-security-key-abc123";
const TEST_VIDEO_URL = "https://vz-123.b-cdn.net/videos/lesson.m3u8";

describe("BunnyCdnTokenSigner", () => {
  let signer: BunnyCdnTokenSigner;

  beforeEach(() => {
    signer = new BunnyCdnTokenSigner({ securityKey: TEST_SECURITY_KEY });
  });

  describe("constructor", () => {
    it("throws RangeError for empty security key", () => {
      assert.throws(
        () => new BunnyCdnTokenSigner({ securityKey: "" }),
        RangeError,
      );
    });
  });

  describe("generateToken()", () => {
    it("produces token starting with HS256-", () => {
      const cdnToken = signer.generateToken(TEST_VIDEO_URL);
      assert.ok(cdnToken.token.startsWith("HS256-"), `Token should start with HS256-, got: ${cdnToken.token}`);
    });

    it("produces token with valid base64url characters after prefix", () => {
      const cdnToken = signer.generateToken(TEST_VIDEO_URL);
      const payload = cdnToken.token.replace("HS256-", "");
      assert.ok(/^[A-Za-z0-9_-]+$/.test(payload), `Token payload should be base64url, got: ${payload}`);
    });

    it("tokenPath ends with /", () => {
      const cdnToken = signer.generateToken(TEST_VIDEO_URL);
      assert.ok(cdnToken.tokenPath.endsWith("/"), `tokenPath should end with /, got: ${cdnToken.tokenPath}`);
    });

    it("computes directory prefix: /videos/lesson.m3u8 → /videos/", () => {
      const cdnToken = signer.generateToken(TEST_VIDEO_URL);
      assert.equal(cdnToken.tokenPath, "/videos/");
    });

    it("computes root prefix: /lesson.m3u8 → /", () => {
      const cdnToken = signer.generateToken("https://vz-123.b-cdn.net/lesson.m3u8");
      assert.equal(cdnToken.tokenPath, "/");
    });

    it("computes nested prefix: /a/b/c/lesson.m3u8 → /a/b/c/", () => {
      const cdnToken = signer.generateToken("https://vz-123.b-cdn.net/a/b/c/lesson.m3u8");
      assert.equal(cdnToken.tokenPath, "/a/b/c/");
    });

    it("produces identical token for same (url, key, expires) inputs", () => {
      const fixedExpiry = 1721380800;
      const t1 = signer.generateToken(TEST_VIDEO_URL, fixedExpiry);
      const t2 = signer.generateToken(TEST_VIDEO_URL, fixedExpiry);
      assert.equal(t1.token, t2.token);
      assert.equal(t1.tokenPath, t2.tokenPath);
    });

    it("produces different tokens for different keys", () => {
      const signer2 = new BunnyCdnTokenSigner({ securityKey: "different-key-xyz" });
      const fixedExpiry = 1721380800;
      const t1 = signer.generateToken(TEST_VIDEO_URL, fixedExpiry);
      const t2 = signer2.generateToken(TEST_VIDEO_URL, fixedExpiry);
      assert.notEqual(t1.token, t2.token);
    });

    it("produces different tokens for different expires values", () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const t1 = signer.generateToken(TEST_VIDEO_URL, nowSec + 600);
      const t2 = signer.generateToken(TEST_VIDEO_URL, nowSec + 700);
      assert.notEqual(t1.token, t2.token);
    });

    it("defaults expires to now + defaultTtlSeconds when omitted", () => {
      const cdnToken = signer.generateToken(TEST_VIDEO_URL);
      const nowSec = Math.floor(Date.now() / 1000);
      // Should be approximately now + 3600 (default TTL)
      assert.ok(cdnToken.expires > nowSec + 3500, `expires should be ~now+3600, got ${cdnToken.expires}`);
      assert.ok(cdnToken.expires <= nowSec + 3700, `expires should be ~now+3600, got ${cdnToken.expires}`);
    });

    it("clamps expires below minTtlSeconds to minTtlSeconds", () => {
      const nowSec = Math.floor(Date.now() / 1000);
      // Request expiry 10 seconds from now (below 300s min)
      const cdnToken = signer.generateToken(TEST_VIDEO_URL, nowSec + 10);
      assert.ok(cdnToken.expires >= nowSec + 295, `expires should be clamped to ~min+now, got ${cdnToken.expires}`);
      assert.ok(cdnToken.expires <= nowSec + 305, `expires should be clamped to ~min+now, got ${cdnToken.expires}`);
    });

    it("clamps expires above maxTtlSeconds to maxTtlSeconds", () => {
      const nowSec = Math.floor(Date.now() / 1000);
      // Request expiry 30 days from now (above 86400s max)
      const cdnToken = signer.generateToken(TEST_VIDEO_URL, nowSec + 30 * 86400);
      assert.ok(cdnToken.expires >= nowSec + 86395, `expires should be clamped to ~max+now, got ${cdnToken.expires}`);
      assert.ok(cdnToken.expires <= nowSec + 86405, `expires should be clamped to ~max+now, got ${cdnToken.expires}`);
    });

    it("throws RangeError for non-URL videoUrl", () => {
      assert.throws(
        () => signer.generateToken("not-a-url"),
        RangeError,
      );
    });

    it("returns frozen CdnToken value object", () => {
      const cdnToken = signer.generateToken(TEST_VIDEO_URL);
      assert.ok(Object.isFrozen(cdnToken), "CdnToken should be frozen");
    });

    it("CdnToken contains original videoUrl", () => {
      const cdnToken = signer.generateToken(TEST_VIDEO_URL);
      assert.equal(cdnToken.videoUrl, TEST_VIDEO_URL);
    });
  });

  describe("signUrl()", () => {
    it("returns signedUrl containing bcdn_token=", () => {
      const result = signer.signUrl(TEST_VIDEO_URL);
      assert.ok(result.signedUrl.includes("bcdn_token="), `signedUrl should contain bcdn_token=, got: ${result.signedUrl}`);
    });

    it("returns signedUrl containing expires= parameter", () => {
      const result = signer.signUrl(TEST_VIDEO_URL);
      assert.ok(result.signedUrl.includes("expires="), `signedUrl should contain expires=, got: ${result.signedUrl}`);
    });

    it("returns signedUrl containing token_path= parameter", () => {
      const result = signer.signUrl(TEST_VIDEO_URL);
      assert.ok(result.signedUrl.includes("token_path="), `signedUrl should contain token_path=, got: ${result.signedUrl}`);
    });

    it("signedUrl ends with the original pathname", () => {
      const result = signer.signUrl(TEST_VIDEO_URL);
      assert.ok(
        result.signedUrl.endsWith("/videos/lesson.m3u8"),
        `signedUrl should end with /videos/lesson.m3u8, got: ${result.signedUrl}`,
      );
    });

    it("returns frozen SignedVideoUrl value object", () => {
      const result = signer.signUrl(TEST_VIDEO_URL);
      assert.ok(Object.isFrozen(result), "SignedVideoUrl should be frozen");
    });
  });

  describe("isExpired()", () => {
    it("returns true for token with expires = 1000 (past)", () => {
      assert.equal(signer.isExpired(1000), true);
    });

    it("returns true for token expiring within 30 seconds (clock-skew buffer)", () => {
      const nowSec = Math.floor(Date.now() / 1000);
      assert.equal(signer.isExpired(nowSec + 10), true);
    });

    it("returns false for token expiring in 60+ seconds", () => {
      const nowSec = Math.floor(Date.now() / 1000);
      assert.equal(signer.isExpired(nowSec + 120), false);
    });
  });
});
