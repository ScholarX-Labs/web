"use client";

import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface CourseGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CourseGrid({ children, className }: CourseGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const desktopColumns = isXl ? 4 : 3;
  const hasActiveCard = hoveredIndex !== null;

  const getRippleDelay = (index: number) => {
    if (!isDesktop || prefersReducedMotion) return 0;

    const row = Math.floor(index / desktopColumns);
    const col = index % desktopColumns;
    return row * 0.08 + col * 0.045;
  };

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
          <motion.div
            className={cn(
              "relative group block h-full p-0 transition-[opacity,transform,filter] duration-300 ease-out motion-reduce:transition-opacity motion-reduce:duration-200 motion-reduce:transform-none motion-reduce:filter-none",
              hasActiveCard && hoveredIndex !== idx
                ? "opacity-65 scale-[0.985]"
                : "opacity-100 scale-100",
            )}
            initial={
              isDesktop && !prefersReducedMotion
                ? { opacity: 0, y: 16, scale: 0.985, filter: "blur(6px)" }
                : false
            }
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{
              duration: isDesktop && !prefersReducedMotion ? 0.55 : 0.2,
              delay: getRippleDelay(idx),
              ease: [0.32, 0.72, 0, 1],
            }}
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
          </motion.div>
        );
      })}
    </div>
  );
}
