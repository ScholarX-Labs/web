"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { zIndex, radius, shadow } from "@/lib/design-tokens";

// Override children to be strictly ReactNode (prevents MotionValue conflict)
type GlassPanelProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: React.ReactNode;
};

// ─── Base GlassPanel ──────────────────────────────────────────────────────────
/**
 * GlassPanel — Base glassmorphic surface.
 * Use when: you need a generic frosted-glass backdrop with no padding defaults.
 * Token: zIndex.content (base level)
 * Radius: inherits from className
 */
export const GlassPanel = React.forwardRef<
  HTMLDivElement,
  GlassPanelProps
>(({ className, children, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative bg-white/[0.03] dark:bg-black/30 backdrop-blur-[40px]",
        "border border-white/10 dark:border-white/[0.07]",
        "overflow-hidden",
        className
      )}
      style={{
        boxShadow: `${shadow.floating}, ${shadow.inner}`,
        ...props.style,
      }}
      {...props}
    >
      {/* Subtle inner light reflection — mimics visionOS depth effect */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/10 mix-blend-overlay" />
      {children}
    </motion.div>
  );
});
GlassPanel.displayName = "GlassPanel";

// ─── GlassCard ───────────────────────────────────────────────────────────────
/**
 * GlassCard — Card-level glassmorphic container.
 * Use when: displaying content cards, stat blocks, info panels.
 * Token: radius.card (16px)
 * Elevation: mid-depth
 */
export const GlassCard = React.forwardRef<
  HTMLDivElement,
  GlassPanelProps
>(({ className, children, style, ...props }, ref) => {
  return (
    <GlassPanel
      ref={ref}
      className={cn("p-5", className)}
      style={{ borderRadius: radius.card, ...style }}
      {...props}
    >
      {children}
    </GlassPanel>
  );
});
GlassCard.displayName = "GlassCard";

// ─── FloatingPanel ────────────────────────────────────────────────────────────
/**
 * FloatingPanel — High-elevation overlay panel.
 * Use when: rendering slide-in panels (Notes, Resources), high-priority overlays.
 * Token: zIndex.overlay, radius.video (24px), shadow.elevated
 */
export const FloatingPanel = React.forwardRef<
  HTMLDivElement,
  GlassPanelProps
>(({ className, children, style, ...props }, ref) => {
  return (
    <GlassPanel
      ref={ref}
      className={cn(
        "bg-[#0a0f1e]/80 dark:bg-[#060b18]/85",
        className
      )}
      style={{
        borderRadius: radius.video,
        boxShadow: shadow.elevated,
        zIndex: zIndex.overlay,
        ...style,
      }}
      {...props}
    >
      {children}
    </GlassPanel>
  );
});
FloatingPanel.displayName = "FloatingPanel";
