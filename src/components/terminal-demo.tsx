/**
 * @file terminal-demo.tsx
 * @description Demo showcase of the Terminal component sequence loading command lines.
 *
 * @usage_guidelines
 * - Renders a sequential command prompt simulation with typing animations and status reveals.
 * - Utilizes Tailwind CSS v4.0 for standard flex layouts, text sizing, and color overlays.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

import React from "react"
import { Terminal, TypingAnimation, AnimatedSpan } from "@/components/ui/terminal"

export default function TerminalDemo() {
  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center justify-center p-4">
      <Terminal>
        <TypingAnimation>pnpm dlx shadcn@latest init</TypingAnimation>
        <AnimatedSpan className="text-green-500">✔ Preflight checks.</AnimatedSpan>
        <AnimatedSpan className="text-green-500">✔ Validating Tailwind CSS.</AnimatedSpan>
        <TypingAnimation>Success! Project initialization completed.</TypingAnimation>
      </Terminal>
    </div>
  )
}
