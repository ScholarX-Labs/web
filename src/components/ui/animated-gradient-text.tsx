/**
 * @file animated-gradient-text.tsx
 * @description A premium React component that renders text with a moving gradient effect.
 * Developed in accordance with Google Principal SWE guidelines.
 *
 * Design Guidelines & Theme Considerations:
 * - This component functions best when paired with contrasting background tones to ensure readability.
 * - Gradients dynamically shift across a defined color range using standard background-position animations.
 * - When using a "Fancy Dark Mode Toggle", developers must ensure the parent containers react seamlessly 
 *   to active class variations on the `document.documentElement` (i.e., `.dark` modifier). Since gradients 
 *   utilize alpha/transparency (e.g. `/50`), high-contrast overlays are automatically adjusted.
 *
 * Usage:
 * ```tsx
 * import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
 *
 * <AnimatedGradientText speed={1.5} colorFrom="#ffaa40" colorTo="#9c40ff">
 *   Your Animated Text Here
 * </AnimatedGradientText>
 * ```
 */

import React from "react";
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedGradientTextProps extends ComponentPropsWithoutRef<"span"> {
  speed?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  ...props
}: AnimatedGradientTextProps) {
  return (
    <span
      style={
        {
          "--bg-size": `${speed * 300}%`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as React.CSSProperties
      }
      className={cn(
        "inline animate-gradient bg-gradient-to-r from-[var(--color-from)] via-[var(--color-to)] to-[var(--color-from)] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
