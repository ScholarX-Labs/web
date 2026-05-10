"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HamburgerIconProps {
  open: boolean;
  onToggle: () => void;
  className?: string;
}

const spring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 22,
  mass: 0.7,
};

const lineVariants = {
  closed: (i: number) => ({
    rotate: 0,
    y: 0,
    opacity: 1,
    transition: {
      ...spring,
      delay: i === 1 ? 0.04 : 0,
    },
  }),
  open: (i: number) => ({
    rotate: i === 1 ? 0 : i === 0 ? 45 : -45,
    y: i === 1 ? 0 : i === 0 ? 6 : -6,
    opacity: i === 1 ? 0 : 1,
    transition: {
      ...spring,
      delay: i === 1 ? 0 : 0.03,
    },
  }),
};

export default function HamburgerIcon({ open, onToggle, className }: HamburgerIconProps) {
  return (
    <motion.button
      onClick={onToggle}
      aria-label={open ? "Close menu" : "Open menu"}
      className={cn(
        "relative h-10 w-10 rounded-full flex items-center justify-center shrink-0",
        "bg-muted/30 hover:bg-muted/60",
        "border border-border/40 dark:border-white/[0.08]",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        className,
      )}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
    >
      <div className="relative h-4 w-5 flex flex-col items-center justify-center gap-[5px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-[2px] w-full rounded-full bg-foreground/80 origin-center"
            custom={i}
            variants={lineVariants}
            initial={false}
            animate={open ? "open" : "closed"}
          />
        ))}
      </div>
    </motion.button>
  );
}
