/**
 * @file dock-demo.tsx
 * @description Demo showcase of the Dock component presenting a premium, magnified navigation bar.
 *
 * @usage_guidelines
 * - Renders a sleek floating Dock bar with various interactive navigation icons.
 * - Utilizes Tailwind CSS v4.0 for flex layouts, colors, and border styles.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

import React from "react"
import { Home, Search, Settings, Mail, Bell, Globe } from "lucide-react"
import { Dock, DockIcon } from "@/components/ui/dock"

export default function DockDemo() {
  return (
    <div className="relative mx-auto flex h-[150px] w-full max-w-lg items-center justify-center rounded-2xl border bg-slate-50/50 dark:bg-zinc-900/50 p-4">
      <Dock direction="middle">
        <DockIcon>
          <Home className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        </DockIcon>
        <DockIcon>
          <Search className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        </DockIcon>
        <DockIcon>
          <Mail className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        </DockIcon>
        <DockIcon>
          <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        </DockIcon>
        <DockIcon>
          <Globe className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        </DockIcon>
        <DockIcon>
          <Settings className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        </DockIcon>
      </Dock>
    </div>
  )
}
