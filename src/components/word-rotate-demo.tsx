/**
 * @file word-rotate-demo.tsx
 * @description Demo showcase of the WordRotate component animating text rotation vertically.
 *
 * @usage_guidelines
 * - Renders a stylized statement using WordRotate to cycle through key ScholarX functions.
 * - Utilizes Tailwind CSS for border definitions, shadow alignments, and text overrides.
 *
 * @dark_mode_notes
 * - Integrates with a "Fancy Dark Mode Toggle" by leveraging standard `text-neutral-800` / `dark:text-neutral-100` styling.
 */

import React from "react"
import { WordRotate } from "@/components/ui/word-rotate"

export default function WordRotateDemo() {
  const words = [
    "Find Scholarships",
    "Discover Courses",
    "Build Profiles",
    "Query Opportunities",
  ]

  return (
    <div className="relative mx-auto flex h-[250px] w-full max-w-lg flex-col items-center justify-center rounded-2xl border bg-slate-50/50 dark:bg-zinc-900/50 p-6 text-center select-none shadow-md">
      <div className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
        <span className="text-3xl font-bold tracking-tight text-neutral-600 dark:text-neutral-400">
          ScholarX can
        </span>
        <WordRotate
          words={words}
          duration={2000}
          className="text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400"
        />
      </div>
      <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        Rotating dynamically through application workflows every 2 seconds.
      </p>
    </div>
  )
}
