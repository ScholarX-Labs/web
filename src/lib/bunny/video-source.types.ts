/**
 * Domain types for Bunny.net video infrastructure.
 *
 * All value objects are frozen (Object.freeze) to enforce immutability.
 * These types are shared between server-only token signing and client-side
 * source detection — no secrets are defined here.
 */

// ── Video Source ─────────────────────────────────────────────────────────────

export type VideoSourceType = "youtube" | "bunny-cdn" | "unknown";

export interface VideoSource {
  readonly url: string;
  readonly type: VideoSourceType;
  readonly isProtected: boolean;
  readonly signedUrl: string | null;
  readonly expiresAt: number | null;
}

export function createVideoSource(
  url: string,
  type: VideoSourceType,
): VideoSource {
  const source: VideoSource = {
    url,
    type,
    isProtected: type === "bunny-cdn",
    signedUrl: null,
    expiresAt: null,
  };
  return Object.freeze(source);
}

// ── CDN Token ────────────────────────────────────────────────────────────────

export interface CdnToken {
  readonly token: string;
  readonly expires: number;
  readonly tokenPath: string;
  readonly videoUrl: string;
}

export function createCdnToken(
  token: string,
  expires: number,
  tokenPath: string,
  videoUrl: string,
): CdnToken {
  const cdnToken: CdnToken = { token, expires, tokenPath, videoUrl };
  return Object.freeze(cdnToken);
}

// ── Signed Video URL ─────────────────────────────────────────────────────────

export interface SignedVideoUrl {
  readonly signedUrl: string;
  readonly token: string;
  readonly expires: number;
}

export function createSignedVideoUrl(
  signedUrl: string,
  token: string,
  expires: number,
): SignedVideoUrl {
  const signed: SignedVideoUrl = { signedUrl, token, expires };
  return Object.freeze(signed);
}

// ── Security ─────────────────────────────────────────────────────────────────

export type SecurityLevel = "none" | "token-auth" | "drm";

// ── Lesson Video Config ──────────────────────────────────────────────────────

export interface LessonVideoConfig {
  readonly videoUrl: string;
  readonly sourceType: VideoSourceType;
  readonly requiresAuth: boolean;
  readonly securityLevel: SecurityLevel;
}

export function createLessonVideoConfig(
  videoUrl: string,
  sourceType: VideoSourceType,
): LessonVideoConfig {
  const config: LessonVideoConfig = {
    videoUrl,
    sourceType,
    requiresAuth: sourceType === "bunny-cdn",
    securityLevel: sourceType === "bunny-cdn" ? "token-auth" : "none",
  };
  return Object.freeze(config);
}

// ── Error Types ──────────────────────────────────────────────────────────────

export type VideoErrorCode =
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "NETWORK_ERROR"
  | "CDN_UNAVAILABLE"
  | "ACCESS_DENIED"
  | "UNKNOWN_ERROR";

export interface VideoError {
  readonly code: VideoErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly retryAfterMs: number | null;
}

export function createVideoError(
  code: VideoErrorCode,
  overrides?: Partial<Pick<VideoError, "message" | "retryAfterMs">>,
): VideoError {
  const defaults: Record<VideoErrorCode, { message: string; retryable: boolean }> = {
    TOKEN_EXPIRED: { message: "Session expired — reconnecting...", retryable: true },
    TOKEN_INVALID: { message: "Unable to play — please refresh", retryable: false },
    NETWORK_ERROR: { message: "Connection lost — retrying...", retryable: true },
    CDN_UNAVAILABLE: { message: "Video temporarily unavailable — please try again later", retryable: true },
    ACCESS_DENIED: { message: "Access denied — please enroll in this course", retryable: false },
    UNKNOWN_ERROR: { message: "Something went wrong — please refresh", retryable: true },
  };

  const def = defaults[code];
  const error: VideoError = {
    code,
    message: overrides?.message ?? def.message,
    retryable: def.retryable,
    retryAfterMs: overrides?.retryAfterMs ?? null,
  };
  return Object.freeze(error);
}

// ── API Contract Types ───────────────────────────────────────────────────────

export interface BunnyTokenRequest {
  readonly videoUrl: string;
  readonly expires?: number;
}

export interface BunnyTokenSuccessResponse {
  readonly success: true;
  readonly data: {
    readonly token: string;
    readonly expires: number;
    readonly signedUrl: string;
  };
}

export interface BunnyTokenErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly numericCode: number;
    readonly statusCode: number;
    readonly message: string;
    readonly retryAfter?: number;
  };
}

export type BunnyTokenResponse = BunnyTokenSuccessResponse | BunnyTokenErrorResponse;
