/**
 * Detects video source type from a URL using the Strategy pattern.
 *
 * The detector iterates through registered strategies in order:
 * YouTube → Bunny CDN → fallback (unknown).
 *
 * All returned VideoSource objects are frozen value objects.
 *
 * @module video-source-detector
 * @see specs/018-bunny-net-video-migration/plan.md §7 Layer 3
 */

import type { VideoSourceStrategy } from "./strategies/video-source.strategy";
import type { VideoSource } from "./video-source.types";
import { createVideoSource } from "./video-source.types";
import { YouTubeVideoSourceStrategy } from "./strategies/youtube.strategy";
import { BunnyCdnVideoSourceStrategy } from "./strategies/bunny-cdn.strategy";

export class VideoSourceDetector {
  private readonly strategies: VideoSourceStrategy[];

  constructor(strategies?: VideoSourceStrategy[]) {
    // Default strategy order: YouTube first (fast regex), then Bunny CDN
    this.strategies = strategies ?? [
      new YouTubeVideoSourceStrategy(),
      new BunnyCdnVideoSourceStrategy(),
    ];
  }

  /**
   * Detect the video source type for a given URL.
   *
   * @param url - The raw video URL from the database
   * @returns A frozen VideoSource value object
   */
  detect(url: string | null | undefined): VideoSource {
    if (!url || typeof url !== "string") {
      return createVideoSource(url ?? "", "unknown");
    }

    for (const strategy of this.strategies) {
      if (strategy.matches(url)) {
        return strategy.detect(url);
      }
    }

    return createVideoSource(url, "unknown");
  }

  /**
   * Check whether a URL requires CDN token authentication.
   *
   * @param url - The raw video URL
   * @returns true if the URL is a Bunny CDN URL (requires signing)
   */
  requiresTokenAuth(url: string): boolean {
    for (const strategy of this.strategies) {
      if (strategy.matches(url)) {
        return strategy.requiresProtection();
      }
    }
    return false;
  }

  /**
   * Convenience singleton with default strategies.
   * Import this for most use cases.
   */
  static readonly default = new VideoSourceDetector();
}
