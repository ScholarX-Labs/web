/**
 * @file lens-demo.tsx
 * @description Demo showcase of the Lens component presenting interactive magnification over a visual card.
 *
 * @usage_guidelines
 * - Renders a dashboard card containing rich gradients, buttons, and text, wrapped inside a Lens for zoom effects.
 * - Utilizes Tailwind CSS v4.0 for standard flex layouts, text sizing, and color overlays.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

import React from "react"
import { Lens } from "@/components/ui/lens"

export default function LensDemo() {
  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center justify-center p-4">
      <Lens zoomFactor={1.4} lensSize={150} lensColor="currentColor">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 dark:from-indigo-500/10 dark:to-purple-500/10 p-8 shadow-lg">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              ScholarX Labs
            </div>
            <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
              Magnify Your Potential
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Hover over this card to interactively zoom in on our UI layout, text elements, and premium design details using a virtual magnifying glass.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              React 19 & Tailwind v4
            </span>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-indigo-700">
              Explore Demo
            </button>
          </div>
        </div>
      </Lens>
    </div>
  )
}
