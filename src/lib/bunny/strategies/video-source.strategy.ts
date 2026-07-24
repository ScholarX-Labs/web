import type { VideoSource, VideoSourceType } from "../video-source.types";

/**
 * Strategy interface for detecting video source type from a URL.
 *
 * Each strategy implements `matches()` to check if a URL belongs to its source,
 * and `detect()` to create the corresponding VideoSource value object.
 *
 * @see specs/018-bunny-net-video-migration/plan.md §7 Layer 3
 */
export interface VideoSourceStrategy {
  /** The source type this strategy handles. */
  readonly type: VideoSourceType;

  /**
   * Check whether this strategy can handle the given URL.
   * Must be a pure function with no side effects.
   */
  matches(url: string): boolean;

  /**
   * Create a VideoSource value object for a matching URL.
   * Called only when `matches()` returns true.
   */
  detect(url: string): VideoSource;

  /**
   * Whether this source type requires token authentication.
   * YouTube = false, Bunny CDN = true, Unknown = false.
   */
  requiresProtection(): boolean;
}
