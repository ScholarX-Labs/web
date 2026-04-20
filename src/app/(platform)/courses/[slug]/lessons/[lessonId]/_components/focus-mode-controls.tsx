"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { X, Eye } from "lucide-react";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { AnimatedButton } from "@/components/ui/animated-button";
import { zIndex } from "@/lib/design-tokens";

/**
 * FocusModeControls — Auto-hiding minimal overlay for Focus Mode.
 *
 * Shows minimal controls (exit button + time display) when in Focus Mode.
 * Auto-hides after 2 seconds of cursor inactivity.
 * Re-appears on any mouse movement.
 * ESC key exits Focus Mode.
 */
export function FocusModeControls() {
  const { setFocusMode } = useUILayoutStore();
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2000);
  }, []);

  // ESC key exits Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusMode(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setFocusMode]);

  // mousemove shows controls
  useEffect(() => {
    document.addEventListener("mousemove", showControls);
    // Start hidden after 2s initial
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2000);
    return () => {
      document.removeEventListener("mousemove", showControls);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControls]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: controlsVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/10 bg-[#050812]/80 backdrop-blur-xl"
      style={{ zIndex: zIndex.overlay, pointerEvents: controlsVisible ? "auto" : "none" }}
    >
      {/* Focus Mode indicator */}
      <div className="flex items-center gap-2 text-xs text-white/50 font-medium">
        <Eye className="w-3.5 h-3.5 text-blue-400" />
        Focus Mode
      </div>

      <div className="h-4 w-px bg-white/10" />

      {/* Exit button */}
      <AnimatedButton
        onClick={() => setFocusMode(false)}
        aria-label="Exit Focus Mode"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        Exit (ESC)
      </AnimatedButton>
    </motion.div>
  );
}
