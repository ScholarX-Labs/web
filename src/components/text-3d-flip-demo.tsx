/**
 * @file text-3d-flip-demo.tsx
 * @description Demo showcase of the Text3DFlip component animating letters on hover.
 *
 * @usage_guidelines
 * - Renders multiple Text3DFlip elements showing top and center stagger rotations.
 * - Utilizes Tailwind CSS v4.0 for standard flex layouts, text sizing, and color overlays.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

import React from "react"
import Text3DFlip from "@/components/ui/text-3d-flip"

export default function Text3DFlipDemo() {
  return (
    <div className="relative mx-auto flex h-[250px] w-full max-w-lg flex-col items-center justify-center space-y-4 rounded-2xl border bg-slate-50/50 dark:bg-zinc-900/50 p-6 text-center select-none shadow-md">
      <Text3DFlip
        className="text-4xl font-bold text-neutral-800 dark:text-neutral-100 cursor-pointer"
        rotateDirection="top"
        staggerFrom="center"
      >
        Stay hungry, stay foolish
      </Text3DFlip>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Hover over the text above to see each letter flip in 3D staggered from the center!
      </p>
    </div>
  )
}
