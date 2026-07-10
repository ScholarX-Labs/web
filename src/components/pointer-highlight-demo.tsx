/**
 * @file pointer-highlight-demo.tsx
 * @description Demo showcase of the PointerHighlight component drawing a virtual outline box around text.
 *
 * @usage_guidelines
 * - Renders a collaboration highlight section using dynamic layout overlays.
 * - Utilizes Tailwind CSS v4.0 for standard page typography and grid layout.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

import { PointerHighlight } from "@/components/ui/pointer-highlight";

export default function PointerHighlightDemo() {
  return (
    <div className="mx-auto max-w-lg py-20 text-2xl font-bold tracking-tight md:text-4xl">
      The best way to grow is to{" "}
      <PointerHighlight>
        <span>collaborate</span>
      </PointerHighlight>
    </div>
  );
}
