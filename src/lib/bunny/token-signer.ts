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
      return new URL(videoUrl);
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
   * data_to_sign = token_path + expires_at
   * token = "HS256-" + base64url_encode(hmac)
   */
  private sign(tokenPath: string, expiresAt: number): string {
    const dataToSign = `${tokenPath}${expiresAt}`;
    const signature = createHmac("sha256", this.securityKey)
      .update(dataToSign)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return `HS256-${signature}`;
  }

  /**
   * Build the complete signed URL with Bunny's query-string format.
   *
   * Format: https://host/bcdn_token=<token>&expires=<expires>&token_path=<path><pathname>
   */
  private buildSignedUrl(
    url: URL,
    token: string,
    expiresAt: number,
    tokenPath: string,
  ): string {
    const encodedTokenPath = encodeURIComponent(tokenPath);
    return `${url.origin}/bcdn_token=${token}&expires=${expiresAt}&token_path=${encodedTokenPath}${url.pathname}`;
  }
}
