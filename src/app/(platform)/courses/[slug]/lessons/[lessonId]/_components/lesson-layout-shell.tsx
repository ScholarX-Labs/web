"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig } from "framer-motion";
import { Drawer } from "@/components/ui/drawer-sheet";
import { useUILayoutStore } from "@/store/ui-layout-store";

export function LessonLayoutShell({ children }: { children: React.ReactNode }) {
  const { isDrawerOpen, setDrawerOpen } = useUILayoutStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        {/* 
          shouldScaleBackground triggers the Vaul effect shrinking the underlying container.
          We wrap the entire layout context to ensure transitions fire universally.
        */}
        <Drawer
          open={isDrawerOpen}
          onOpenChange={setDrawerOpen}
          shouldScaleBackground
        >
          {children}
        </Drawer>
      </LayoutGroup>
    </MotionConfig>
  );
}
