"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { tapScale } from "@/lib/motion-variants";

export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required for icon-only buttons to meet accessibility standards */
  "aria-label"?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * AnimatedButton — Consistent tap-scale micro-interaction primitive.
 *
 * Wrap ANY interactive button with this component instead of using
 * raw `motion.button` with inline whileHover/whileTap props.
 *
 * Features:
 * - scale(1.02) on hover → scale(0.97) on press (Apple tactile feel)
 * - Spring transition stiffness:400, damping:28 for snappy response
 * - Forwards all native button props and refs
 *
 * Usage:
 *   <AnimatedButton aria-label="Share lesson" onClick={handleShare}>
 *     <Share2 className="w-4 h-4" />
 *   </AnimatedButton>
 */
export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={tapScale.whileHover}
      whileTap={tapScale.whileTap}
      transition={tapScale.transition}
      className={cn("transition-colors", className)}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
});

AnimatedButton.displayName = "AnimatedButton";
