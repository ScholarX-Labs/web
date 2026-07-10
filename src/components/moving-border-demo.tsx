/**
 * @file moving-border-demo.tsx
 * @description Demo showcase of the MovingBorder button component.
 *
 * @usage_guidelines
 * - Renders the premium Button component with custom border radius and dynamic glowing borders.
 * - Uses Tailwind CSS v4.0 for dark mode state styling classes.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

"use client";
import React from "react";
import { Button } from "@/components/ui/moving-border";

export default function MovingBorderDemo() {
  return (
    <div>
      <Button
        borderRadius="1.75rem"
        className="bg-white dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800"
      >
        Borders are cool
      </Button>
    </div>
  );
}
