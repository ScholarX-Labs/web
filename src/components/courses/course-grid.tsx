"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CourseGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CourseGrid({ children, className }: CourseGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hasActiveCard = hoveredIndex !== null;

  return (
    <div
      data-catalog-grid
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 transition-[opacity,filter] duration-300 ease-out data-[dimmed=true]:opacity-40 data-[dimmed=true]:blur-[10px] data-[dimmed=true]:pointer-events-none",
        className,
      )}
    >
      {React.Children.map(children, (child, idx) => {
        if (!React.isValidElement(child)) return child;

        return (
          <div
            className={cn(
              "relative group block h-full p-0 transition-[opacity,transform,filter] duration-300 ease-out motion-reduce:transition-opacity motion-reduce:duration-200 motion-reduce:transform-none motion-reduce:filter-none",
              hasActiveCard && hoveredIndex !== idx
                ? "opacity-65 scale-[0.985]"
                : "opacity-100 scale-100",
            )}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocusCapture={() => setHoveredIndex(idx)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setHoveredIndex(null);
              }
            }}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className="absolute -inset-4 bg-primary/5 dark:bg-primary/10 backdrop-blur-3xl border border-primary/5 block rounded-[2rem] -z-10"
                  layoutId="courseGridHoverBackground"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
            <div className="relative z-10 h-full">{child}</div>
          </div>
        );
      })}
    </div>
  );
}
