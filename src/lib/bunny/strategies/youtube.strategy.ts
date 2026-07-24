import type { VideoSourceStrategy } from "./video-source.strategy";
import type { VideoSource } from "../video-source.types";
import { createVideoSource } from "../video-source.types";

/**
 * Detection strategy for YouTube video URLs.
 *
 * Matches URLs containing `youtube.com` or `youtu.be` in any format:
 * - https://www.youtube.com/watch?v=abc
 * - https://youtu.be/abc
 * - https://m.youtube.com/watch?v=abc
 * - https://www.youtube.com/embed/abc
 */
export class YouTubeVideoSourceStrategy implements VideoSourceStrategy {
  readonly type = "youtube" as const;

  private static readonly PATTERN = /youtube\.com|youtu\.be/i;

  matches(url: string): boolean {
    return YouTubeVideoSourceStrategy.PATTERN.test(url);
  }

  detect(url: string): VideoSource {
    return createVideoSource(url, "youtube");
  }

  requiresProtection(): boolean {
    return false;
  }
}
