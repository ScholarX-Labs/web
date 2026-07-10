/**
 * @file pointer-demo.tsx
 * @description Demo showcase of the Pointer component rendering a custom animated cursor overlay.
 *
 * @usage_guidelines
 * - Renders a dashboard card that overlays a custom cursor indicator when hovered.
 * - Utilizes Tailwind CSS v4.0 for standard flex layouts, text sizing, and color overlays.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

import React from "react"
import { Pointer } from "@/components/ui/pointer"

export default function PointerDemo() {
  return (
    <div className="relative mx-auto flex h-[250px] w-full max-w-lg flex-col items-center justify-center overflow-hidden rounded-2xl border bg-slate-50/50 dark:bg-zinc-900/50 p-6 text-center select-none shadow-md">
      <Pointer>
        <div className="flex items-center space-x-2 rounded-full border bg-white/90 dark:bg-zinc-950/90 px-3 py-1 text-xs font-semibold shadow-lg backdrop-blur-sm text-neutral-800 dark:text-neutral-200">
          <span>✨ Custom Pointer</span>
        </div>
      </Pointer>
      <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
        Interactive Custom Cursor
      </h3>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Move your mouse over this card component area to experience a customized, animated pointer following your mouse cursor.
      </p>
    </div>
  )
}
