"use client";

import { useEffect, useCallback } from "react";
import { useUILayoutStore } from "@/store/ui-layout-store";

/**
 * useFocusMode — Auto‐activates Focus Mode when the browser enters fullscreen.
 *
 * Listens to the native `fullscreenchange` / `webkitfullscreenchange` events
 * and syncs with the UILayoutStore's `isFocusMode` flag.
 *
 * Usage: Call once inside LessonLayoutShell (or any persistent client component).
 */
export function useFocusMode(): void {
  const { setFocusMode } = useUILayoutStore();

  const handleFullscreenChange = useCallback(() => {
    const isFullscreen =
      !!document.fullscreenElement ||
      !!(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
    setFocusMode(isFullscreen);
  }, [setFocusMode]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [handleFullscreenChange]);
}
