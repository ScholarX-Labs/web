import type { VideoSourceStrategy } from "./video-source.strategy";
import type { VideoSource } from "../video-source.types";
import { createVideoSource } from "../video-source.types";

/**
 * Detection strategy for Bunny CDN video URLs.
 *
 * Matches URLs containing `b-cdn.net` in the hostname OR ending with `.m3u8` extension:
 * - https://vz-123.b-cdn.net/videos/lesson.m3u8
 * - https://library.b-cdn.net/lesson.m3u8
 * - https://vz-123.b-cdn.net/videos/lesson.mp4
 * - https://example.com/videos/lesson.m3u8 (by extension)
 */
export class BunnyCdnVideoSourceStrategy implements VideoSourceStrategy {
  readonly type = "bunny-cdn" as const;

  private static readonly HOSTNAME_PATTERN = /b-cdn\.net/i;
  private static readonly HLS_EXTENSION_PATTERN = /\.m3u8$/i;

  matches(url: string): boolean {
    return (
      BunnyCdnVideoSourceStrategy.HOSTNAME_PATTERN.test(url) ||
      BunnyCdnVideoSourceStrategy.HLS_EXTENSION_PATTERN.test(url)
    );
  }

  detect(url: string): VideoSource {
    return createVideoSource(url, "bunny-cdn");
  }

  requiresProtection(): boolean {
    return true;
  }
}
