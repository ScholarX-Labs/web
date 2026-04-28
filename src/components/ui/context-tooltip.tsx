"use client";

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

// ─── Re-export Radix primitives for composition ───────────────────────────────
export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot     = TooltipPrimitive.Root;
export const TooltipTrigger  = TooltipPrimitive.Trigger;

// ─── Styled Content ───────────────────────────────────────────────────────────
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Glassmorphic styling
        "z-[60] px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/80",
        "bg-[#0d1225]/90 backdrop-blur-xl border border-white/10",
        "shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
        // Animation
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

// ─── Convenience Wrapper ──────────────────────────────────────────────────────
export interface ContextTooltipProps {
  /** Tooltip text content */
  content: string;
  children: React.ReactNode;
  /** Tooltip side relative to trigger. Default: "top" */
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  /** Delay in ms before tooltip shows. Default: 400 */
  delayDuration?: number;
}

/**
 * ContextTooltip — Glassmorphic tooltip convenience wrapper.
 *
 * Wraps any element with an accessible, glassmorphic tooltip.
 * Used on all icon-only buttons to meet WCAG accessibility standards.
 *
 * Usage:
 *   <ContextTooltip content="Share lesson">
 *     <AnimatedButton aria-label="Share lesson">
 *       <Share2 className="w-4 h-4" />
 *     </AnimatedButton>
 *   </ContextTooltip>
 */
export function ContextTooltip({
  content,
  children,
  side = "top",
  delayDuration = 400,
  className,
}: ContextTooltipProps) {
  // NOTE: TooltipProvider was intentionally removed from this per-instance wrapper.
  // Wrap your application root (e.g., in `app/layout.tsx`) with a single
  // `TooltipProvider` to configure global options like `delayDuration` or
  // `skipDelayDuration`. This avoids creating a provider per tooltip instance.
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className={className}>{content}</TooltipContent>
    </TooltipRoot>
  );
}
