/**
 * @file encrypted-text-demo-2.tsx
 * @description Demo showcase of the EncryptedText component displaying a decryption effect.
 *
 * @usage_guidelines
 * - Demonstrates how to pass custom styling variables (for light and dark modes) to style the decrypted vs encrypted phases.
 * - Uses Tailwind CSS v4.0 for standard styling.
 * 
 * @dark_mode_notes
 * - Uses `revealedClassName="dark:text-white text-black"` and `encryptedClassName="text-neutral-500"` to show different colors in light vs dark mode.
 * - For a perfect storytelling portfolio, pair this with a "Fancy Dark Mode Toggle" in the header to allow users to smoothly switch themes and see the component shift colors dynamically.
 */

import { EncryptedText } from "@/components/ui/encrypted-text";
import React from "react";

export default function EncryptedTextDemoSecond() {
  return (
    <p className="mx-auto max-w-lg py-10 text-left">
      <EncryptedText
        text="Welcome to the Matrix, Neo."
        encryptedClassName="text-neutral-500"
        revealedClassName="dark:text-white text-black"
        revealDelayMs={50}
      />
    </p>
  );
}
