"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { Drawer } from "@/components/ui/drawer-sheet";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { NotesPanelOverlay } from "./notes-panel-overlay";
import { ResourcesBottomSheet } from "./resources-bottom-sheet";
import { FocusModeControls } from "./focus-mode-controls";

interface LessonLayoutShellProps {
  children: React.ReactNode;
  lessonKey?: string;
}

export function LessonLayoutShell({ children, lessonKey }: LessonLayoutShellProps) {
  const { isDrawerOpen, setDrawerOpen, isFocusMode, isNotesOverlayOpen, isResourcesSheetOpen } = useUILayoutStore();
  const [mounted, setMounted] = useState(false);

  // Wire fullscreen → auto Focus Mode
  useFocusMode();

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ backgroundColor: "#050812", minHeight: "100vh" }}>{children}</div>;
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="relative min-h-[100dvh] w-full selection:bg-blue-500/30 overflow-x-hidden"
        style={{
          backgroundColor: "#050812",
          paddingTop: "2rem", // Extra space for the floating island header
        }}
      >
        {/* Cinematic Screen Grain Overlay */}
        <div 
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay"
          style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
        />

        <LayoutGroup>
          <Drawer
            open={isDrawerOpen}
            onOpenChange={setDrawerOpen}
            shouldScaleBackground
          >
            {/* Lesson-to-lesson directional transition wrapper */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lessonKey}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="contents"
              >
                {children}
              </motion.div>
            </AnimatePresence>

            {/* ── Overlay Layers ──────────────────────────────────────────── */}
            {/* Notes Panel (slide-in) */}
            <AnimatePresence>
              {isNotesOverlayOpen && <NotesPanelOverlay />}
            </AnimatePresence>

            {/* Resources Bottom Sheet */}
            <AnimatePresence>
              {isResourcesSheetOpen && <ResourcesBottomSheet />}
            </AnimatePresence>

            {/* Focus Mode Controls */}
            <AnimatePresence>
              {isFocusMode && <FocusModeControls />}
            </AnimatePresence>
          </Drawer>
        </LayoutGroup>
      </div>
    </MotionConfig>
  );
}
