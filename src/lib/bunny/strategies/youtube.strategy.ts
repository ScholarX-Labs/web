import type { VideoSourceStrategy } from "./video-source.strategy";
import type { VideoSource } from "../video-source.types";
import { createVideoSource } from "../video-source.types";

/**
 * Detection strategy for YouTube video URLs.
 *
 * Matches URLs whose parsed hostname is a YouTube domain:
 * - https://www.youtube.com/watch?v=abc
 * - https://youtu.be/abc
 * - https://m.youtube.com/watch?v=abc
 * - https://www.youtube.com/embed/abc
 *
 * Rejects lookalike domains like youtube.com.evil or URLs with
 * youtube.com in query strings.
 */
export class YouTubeVideoSourceStrategy implements VideoSourceStrategy {
  readonly type = "youtube" as const;

  private static readonly YOUTUBE_HOSTS = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
  ]);

  private static isYouTubeHost(hostname: string): boolean {
    const lower = hostname.toLowerCase();
    if (YouTubeVideoSourceStrategy.YOUTUBE_HOSTS.has(lower)) return true;
    // Accept *.youtube.com subdomains (e.g. music.youtube.com)
    return lower.endsWith(".youtube.com") && lower.split(".").length >= 3;
  }

  matches(url: string): boolean {
    try {
      const { hostname } = new URL(url);
      return YouTubeVideoSourceStrategy.isYouTubeHost(hostname);
    } catch {
      return false;
    }
  }

  detect(url: string): VideoSource {
    return createVideoSource(url, "youtube");
  }

  requiresProtection(): boolean {
    return false;
  }
}
