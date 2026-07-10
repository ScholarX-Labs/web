/**
 * @file meteors.tsx
 * @description A premium ambient floating meteor animation component that distributes glowing trails across a target container.
 *
 * @usage_guidelines
 * - Creates a gorgeous shooting star / meteor effect inside cards, dashboards, or background wrappers.
 * - Utilizes Tailwind CSS custom keyframe animations defined in `@theme` for the 2D vector translations.
 * - Highly customisable (e.g. meteor counts, speeds, and delays).
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This component's meteors show subtle glows that complement dark backgrounds.
 * - Fading between modes via the "Fancy Dark Mode Toggle" adapts surrounding container borders and highlights.
 */

"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React from "react";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [meteorStyles, setMeteorStyles] = React.useState<Array<React.CSSProperties>>([]);

  React.useEffect(() => {
    const meteorCount = number || 20;
    const styles = new Array(meteorCount).fill(0).map((_, idx) => {
      const position = idx * (800 / meteorCount) - 400; // Spread across 800px range, centered
      return {
        top: "-40px", // Start above the container
        left: position + "px",
        animationDelay: Math.random() * 5 + "s", // Random delay between 0-5s
        animationDuration: Math.floor(Math.random() * (10 - 5) + 5) + "s", // Keep some randomness in duration
      };
    });
    setMeteorStyles(styles);
  }, [number]);

  if (meteorStyles.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {meteorStyles.map((style, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute h-0.5 w-0.5 rotate-[45deg] rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10]",
            "before:absolute before:top-1/2 before:h-[1px] before:w-[50px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-[#64748b] before:to-transparent before:content-['']",
            className,
          )}
          style={style}
        ></span>
      ))}
    </motion.div>
  );
};
