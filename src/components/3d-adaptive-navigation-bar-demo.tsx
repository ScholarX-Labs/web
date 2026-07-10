/**
 * @file 3d-adaptive-navigation-bar-demo.tsx
 * @description Demo showcase of the PillBase 3D navigation component.
 *
 * @usage_guidelines
 * - Renders a stylized presentation block housing the PillBase nav bar.
 * - Utilizes Tailwind CSS for adaptive page layout and theme-responsive color gradients.
 *
 * @dark_mode_notes
 * - Responsive color styling supports "Fancy Dark Mode Toggle" operations seamlessly.
 */

import React from "react"
import { PillBase } from "@/components/ui/3d-adaptive-navigation-bar"

export default function Demo() {
  return (
    <div className="relative mx-auto flex h-[250px] w-full max-w-lg flex-col items-center justify-center rounded-2xl border border-border bg-slate-50/50 dark:bg-zinc-900/50 p-6 text-center select-none shadow-md transition-colors duration-300">
      <div className="relative flex items-center justify-center p-4">
        <PillBase />
      </div>
      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        Hover over the pill to expand and display all navigation links!
      </p>
    </div>
  )
}
