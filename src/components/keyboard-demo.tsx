/**
 * @file keyboard-demo.tsx
 * @description Demo component showcasing the virtual Keyboard component in action.
 *
 * @usage_guidelines
 * - Renders the Keyboard component in a responsive container.
 * - Sound is enabled by default to trigger the audio sample slices when clicking or typing on the physical keyboard.
 * - Make sure the audio sprite asset `/sounds/sound.ogg` is hosted in your public directory.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. The keyboard background and keys use adaptive styling that responds perfectly to the `.dark` class.
 * - Keep the keyboard color contrast in sync by ensuring a consistent theme state is shared via the toggle.
 */

"use client";
import React from "react";
import { Keyboard } from "@/components/ui/keyboard";

export default function KeyboardDemo() {
  return (
    <div className="flex min-h-96 w-full items-center justify-center py-10 md:min-h-180">
      <Keyboard enableSound />
    </div>
  );
}
