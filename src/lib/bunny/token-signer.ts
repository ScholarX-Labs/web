/**
 * Server-only HMAC-SHA256 token signer for Bunny CDN Token Authentication.
 *
 * Uses path-style signing: the directory prefix of the video URL is signed,
 * so a single token covers the .m3u8 playlist AND all .ts segment files.
 *
 * @module token-signer
 * @see specs/018-bunny-net-video-migration/plan.md §7 Layer 2
 */

import { createHmac } from "node:crypto";
import type { CdnToken, SignedVideoUrl } from "./video-source.types";
import { createCdnToken, createSignedVideoUrl } from "./video-source.types";

// ── Configuration ────────────────────────────────────────────────────────────

export interface TokenSignerConfig {
  /** HMAC signing key — the Bunny Stream Video Library API Key. */
  securityKey: string;
  /** Default token time-to-live in seconds. Defaults to 3600 (1 hour). */
  defaultTtlSeconds?: number;
  /** Minimum allowed TTL in seconds. Defaults to 300 (5 minutes). */
  minTtlSeconds?: number;
  /** Maximum allowed TTL in seconds. Defaults to 86400 (24 hours). */
  maxTtlSeconds?: number;
  /** Clock-skew buffer in seconds for expiry checks. Defaults to 30. */
  clockSkewBufferSeconds?: number;
}

const DEFAULTS = {
  defaultTtlSeconds: 3600,
  minTtlSeconds: 300,
  maxTtlSeconds: 86400,
  clockSkewBufferSeconds: 30,
} as const;

// ── Token Signer ─────────────────────────────────────────────────────────────

export class BunnyCdnTokenSigner {
  private readonly securityKey: string;
  private readonly defaultTtl: number;
  private readonly minTtl: number;
  private readonly maxTtl: number;
  private readonly clockSkewBuffer: number;

  constructor(config: TokenSignerConfig) {
    if (!config.securityKey || config.securityKey.length === 0) {
      throw new RangeError("securityKey must be a non-empty string");
    }
    this.securityKey = config.securityKey;
    this.defaultTtl = config.defaultTtlSeconds ?? DEFAULTS.defaultTtlSeconds;
    this.minTtl = config.minTtlSeconds ?? DEFAULTS.minTtlSeconds;
    this.maxTtl = config.maxTtlSeconds ?? DEFAULTS.maxTtlSeconds;
    this.clockSkewBuffer = config.clockSkewBufferSeconds ?? DEFAULTS.clockSkewBufferSeconds;
  }

  /**
   * Generate a CDN token for the given video URL and expiry time.
   *
   * @param videoUrl - The raw Bunny CDN video URL (e.g. https://vz-123.b-cdn.net/videos/lesson.m3u8)
   * @param expiresAt - Unix timestamp (seconds) when the token expires. Clamped to min/max TTL.
   * @returns CdnToken value object (frozen)
   * @throws {RangeError} If videoUrl is not a valid URL
   */
  generateToken(videoUrl: string, expiresAt?: number): CdnToken {
    const url = this.parseVideoUrl(videoUrl);
    const clampedExpiry = this.clampExpiry(expiresAt);
    const tokenPath = this.computeTokenPath(url.pathname);
    const token = this.sign(tokenPath, clampedExpiry);

    return createCdnToken(token, clampedExpiry, tokenPath, videoUrl);
  }

  /**
   * Sign a video URL and return the complete signed URL with query-string token.
   *
   * @param videoUrl - The raw Bunny CDN video URL
   * @param expiresAt - Unix timestamp (seconds) when the token expires
   * @returns SignedVideoUrl value object (frozen)
   */
  signUrl(videoUrl: string, expiresAt?: number): SignedVideoUrl {
    const url = this.parseVideoUrl(videoUrl);
    const clampedExpiry = this.clampExpiry(expiresAt);
    const tokenPath = this.computeTokenPath(url.pathname);
    const token = this.sign(tokenPath, clampedExpiry);

    const signedUrl = this.buildSignedUrl(url, token, clampedExpiry, tokenPath);

    return createSignedVideoUrl(signedUrl, token, clampedExpiry);
  }

  /**
   * Check whether a token has expired (with clock-skew buffer).
   *
   * @param expires - Unix timestamp (seconds) when the token expires
   * @returns true if expired or expiring within the clock-skew buffer
   */
  isExpired(expires: number): boolean {
    const nowSec = Math.floor(Date.now() / 1000);
    return expires <= nowSec + this.clockSkewBuffer;
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  private parseVideoUrl(videoUrl: string): URL {
    try {
      const url = new URL(videoUrl);
      url.searchParams.delete("token");
      url.searchParams.delete("expires");
      url.searchParams.delete("token_path");
      url.searchParams.delete("bcdn_token");
      url.pathname = url.pathname.replace(/^\/bcdn_token=[^/]+\//, "/");
      return url;
    } catch {
      throw new RangeError(`Invalid video URL: ${videoUrl}`);
    }
  }

  /**
   * Clamp the expiry to the configured min/max TTL range.
   * If expiresAt is omitted, default to now + defaultTtl.
   */
  private clampExpiry(expiresAt?: number): number {
    const nowSec = Math.floor(Date.now() / 1000);
    const requested = expiresAt ?? nowSec + this.defaultTtl;

    if (requested < nowSec + this.minTtl) {
      return nowSec + this.minTtl;
    }
    if (requested > nowSec + this.maxTtl) {
      return nowSec + this.maxTtl;
    }
    return requested;
  }

  /**
   * Compute the directory prefix for path-style HLS token signing.
   *
   * Examples:
   *   /videos/lesson.m3u8  → /videos/
   *   /lesson.m3u8         → /
   *   /a/b/c/lesson.m3u8   → /a/b/c/
   */
  computeTokenPath(pathname: string): string {
    const lastSlash = pathname.lastIndexOf("/");
    return lastSlash >= 0 ? pathname.substring(0, lastSlash + 1) : "/";
  }

  /**
   * HMAC-SHA256 signature using Bunny.net's specified format.
   *
   * data_to_sign = signaturePath + expiresAt + (ipBytes) + signingData
   * token = "HS256-" + base64url_encode(hmac)
   */
  private sign(tokenPath: string, expiresAt: number): string {
    // For path-based directory tokens, token_path is both the signaturePath
    // AND it must be included in the alphabetically sorted query parameters (signingData).
    const signaturePath = tokenPath;
    const signingData = `token_path=${tokenPath}`;

    const hmac = createHmac("sha256", this.securityKey);
    hmac.update(signaturePath);
    hmac.update(expiresAt.toString());
    hmac.update(Buffer.alloc(0)); // Empty IP bytes
    hmac.update(signingData);
    
    const signature = hmac.digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return `HS256-${signature}`;
  }

  /**
   * Build the complete signed URL with Bunny's path-based format.
   *
   * Format: https://host/bcdn_token=<token>&token_path=<encoded_path>&expires=<expires><pathname>
   */
  private buildSignedUrl(
    url: URL,
    token: string,
    expiresAt: number,
    tokenPath: string,
  ): string {
    const encodedTokenPath = encodeURIComponent(tokenPath);
    // Note: bcdn_token must be the first parameter in the path block.
    // The exact query-string order in the path doesn't strictly matter for the CDN parsing,
    // but we follow Bunny's reference implementation pattern.
    return `${url.origin}/bcdn_token=${token}&token_path=${encodedTokenPath}&expires=${expiresAt}${url.pathname}`;
  }
}
