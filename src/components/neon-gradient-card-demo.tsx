/**
 * @file neon-gradient-card-demo.tsx
 * @description Demo showcase of the NeonGradientCard component presenting a card with glowing neon gradient borders.
 *
 * @usage_guidelines
 * - Renders a NeonGradientCard displaying a custom heading and description.
 * - Utilizes Tailwind CSS v4.0 for standard flex layouts, text sizing, and color overlays.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

import React from "react"
import { NeonGradientCard } from "@/components/ui/neon-gradient-card"

export default function NeonGradientCardDemo() {
  return (
    <div className="relative mx-auto flex w-full max-w-sm items-center justify-center p-4">
      <NeonGradientCard className="items-center justify-center text-center">
        <span className="pointer-events-none z-10 h-full bg-gradient-to-br from-[#ff00aa] to-[#00FFF1] bg-clip-text text-center text-6xl font-bold leading-none tracking-tighter text-transparent dark:drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
          Neon Card
        </span>
      </NeonGradientCard>
    </div>
  )
}
