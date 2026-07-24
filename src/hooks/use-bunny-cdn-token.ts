"use client";

/**
 * Hook for managing Bunny CDN token lifecycle.
 *
 * Detects whether a video URL requires CDN token authentication,
 * fetches a signed URL on mount, and handles automatic refresh
 * on 403 errors with exponential backoff.
 *
 * @module use-bunny-cdn-token
 * @see specs/018-bunny-net-video-migration/plan.md §7 Layer 5
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { VideoSourceDetector } from "@/lib/bunny/video-source-detector";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UseBunnyCdnTokenResult {
  /** The signed URL to pass to the player, or null if not ready. */
  signedUrl: string | null;
  /** Whether a token fetch is in progress. */
  isLoading: boolean;
  /** Error state if token fetch/refresh failed permanently. */
  error: string | null;
  /** Call this when Vidstack fires a 403 error to trigger token refresh. */
  onTokenExpired: () => void;
}

interface TokenResponse {
  success: boolean;
  data?: {
    token: string;
    expires: number;
    signedUrl: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;
const TOKEN_REFRESH_MARGIN_MS = 30_000; // Refresh 30s before expiry

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useBunnyCdnToken(lessonId: string, videoSrc: string): UseBunnyCdnTokenResult {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const retriesRef = useRef(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Detect source type
  const source = VideoSourceDetector.default.detect(videoSrc);
  const requiresToken = source.type === "bunny-cdn";

  // ── Schedule Proactive Refresh ─────────────────────────────────────────

  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const expiresMs = expiresAt * 1000;
    const refreshIn = Math.max(0, expiresMs - Date.now() - TOKEN_REFRESH_MARGIN_MS);

    refreshTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        window.dispatchEvent(new CustomEvent("bunny-token-proactive-refresh"));
      }
    }, refreshIn);
  }, []);

  // ── Fetch Token ──────────────────────────────────────────────────────────

  const fetchToken = useCallback(
    async (isRetry = false): Promise<boolean> => {
      if (!requiresToken) return true;

      try {
        if (!isRetry) setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ lessonId });
        const response = await fetch(`/api/bunny/token?${params.toString()}`);

        if (!response.ok) {
          const body: TokenResponse = await response.json().catch(() => ({
            success: false,
            error: { code: "NETWORK_ERROR", message: "Failed to parse response" },
          }));

          if (response.status === 429) {
            setError("Too many requests — please wait a moment");
            if (mountedRef.current) setIsLoading(false);
            return false;
          }

          console.error("[BUNNY] Token fetch failed:", body.error?.message);
          if (mountedRef.current) setIsLoading(false);
          return false;
        }

        const body: TokenResponse = await response.json();
        if (!body.success || !body.data) {
          console.error("[BUNNY] Token response missing data");
          if (mountedRef.current) setIsLoading(false);
          return false;
        }

        if (!mountedRef.current) return false;

        setSignedUrl(body.data.signedUrl);
        setIsLoading(false);
        retriesRef.current = 0;

        // Schedule proactive refresh before expiry
        scheduleRefresh(body.data.expires);

        return true;
      } catch (err) {
        console.error("[BUNNY] Token fetch error:", err);
        if (mountedRef.current) setIsLoading(false);
        return false;
      }
    },
    [lessonId, videoSrc, requiresToken, scheduleRefresh],
  );

  // ── Token Expired Handler (called by Vidstack onError 403) ───────────────

  const onTokenExpired = useCallback(() => {
    if (retriesRef.current >= MAX_RETRIES) {
      setError("Unable to play — please refresh the page");
      setIsLoading(false);
      return;
    }

    retriesRef.current++;
    const delayMs = BACKOFF_BASE_MS * Math.pow(2, retriesRef.current - 1);

    // Add jitter: random 0-1s
    const jitter = Math.random() * BACKOFF_BASE_MS;
    const totalDelay = delayMs + jitter;

    setError("Session expired — reconnecting...");

    setTimeout(() => {
      if (mountedRef.current) {
        void fetchToken(true);
      }
    }, totalDelay);
  }, [fetchToken]);

  // ── Initial Fetch + Proactive Refresh Listener ────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    if (!requiresToken) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial token fetch is a legitimate sync effect
    void fetchToken(false);

    // Listen for proactive refresh events
    const handleProactiveRefresh = () => {
      if (mountedRef.current) {
        void fetchToken(true);
      }
    };
    window.addEventListener("bunny-token-proactive-refresh", handleProactiveRefresh);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("bunny-token-proactive-refresh", handleProactiveRefresh);
      if (refreshTimerRef.current !== null) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [videoSrc, requiresToken, fetchToken]);

  // ── Derived State ─────────────────────────────────────────────────────────

  return useMemo(
    () => ({
      signedUrl: requiresToken ? signedUrl : videoSrc,
      isLoading: requiresToken ? isLoading : false,
      error,
      onTokenExpired,
    }),
    [requiresToken, signedUrl, videoSrc, isLoading, error, onTokenExpired],
  );
}
