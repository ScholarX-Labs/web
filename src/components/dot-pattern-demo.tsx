/**
 * @file dot-pattern-demo.tsx
 * @description Demo showcase of the DotPattern component presenting an animated, glowing background grid.
 *
 * @usage_guidelines
 * - Renders a card component overlaying the animated DotPattern.
 * - Utilizes Tailwind CSS v4.0 for standard flex layouts, text sizing, and color overlays.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

import React from "react"
import { DotPattern } from "@/components/ui/dot-pattern"

export default function DotPatternDemo() {
  return (
    <div className="relative flex h-[300px] w-full max-w-lg items-center justify-center overflow-hidden rounded-2xl border bg-background p-20 md:shadow-xl">
      <p className="z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter text-black dark:text-white">
        Dot Pattern
      </p>
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        glow={true}
        className="fill-neutral-400/80 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
      />
    </div>
  )
}
