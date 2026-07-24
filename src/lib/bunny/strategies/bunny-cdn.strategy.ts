import type { VideoSourceStrategy } from "./video-source.strategy";
import type { VideoSource } from "../video-source.types";
import { createVideoSource } from "../video-source.types";

/**
 * Detection strategy for Bunny CDN video URLs.
 *
 * Only matches URLs whose parsed hostname ends with `.b-cdn.net`:
 * - https://vz-123.b-cdn.net/videos/lesson.m3u8
 * - https://library.b-cdn.net/lesson.m3u8
 * - https://vz-123.b-cdn.net/videos/lesson.mp4
 *
 * External HLS URLs (*.m3u8 on other hosts) are NOT Bunny CDN and
 * must NOT trigger token-auth or protection — they are unprotected fallback streams.
 * Lookalike domains like b-cdn.net.evil.com are rejected.
 */
export class BunnyCdnVideoSourceStrategy implements VideoSourceStrategy {
  readonly type = "bunny-cdn" as const;

  private static readonly BUNNY_SUFFIX = ".b-cdn.net";

  private static isBunnyHost(hostname: string): boolean {
    const lower = hostname.toLowerCase();
    return lower === "b-cdn.net" || lower.endsWith(BunnyCdnVideoSourceStrategy.BUNNY_SUFFIX);
  }

  matches(url: string): boolean {
    try {
      const { hostname } = new URL(url);
      return BunnyCdnVideoSourceStrategy.isBunnyHost(hostname);
    } catch {
      return false;
    }
  }

  detect(url: string): VideoSource {
    return createVideoSource(url, "bunny-cdn");
  }

  requiresProtection(): boolean {
    return true;
  }
}
