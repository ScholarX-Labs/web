/**
 * @file hexagon-pattern-demo.tsx
 * @description Demo showcase of the HexagonPattern component presenting a geometric background honeycomb grid.
 *
 * @usage_guidelines
 * - Renders a geometric honeycomb grid layout using HexagonPattern and highlights specific hexagon coordinates.
 * - Utilizes Tailwind CSS v4.0 for flex styling, background positioning, and color schemes.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

import React from "react"
import { HexagonPattern } from "@/components/ui/hexagon-pattern"

export default function HexagonPatternDemo() {
  return (
    <div className="relative flex h-[300px] w-full max-w-lg items-center justify-center overflow-hidden rounded-2xl border bg-background p-20 md:shadow-xl">
      <p className="z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter text-black dark:text-white">
        Hexagon Pattern
      </p>
      <HexagonPattern
        radius={40}
        gap={4}
        x={0}
        y={0}
        hexagons={[
          [1, 1],
          [2, 2],
          [3, 1],
        ]}
        className="stroke-neutral-400/30 fill-neutral-400/10 dark:stroke-zinc-700/30 dark:fill-zinc-700/10 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
      />
    </div>
  )
}
