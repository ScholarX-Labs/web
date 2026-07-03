/**
 * @file dot-pattern.tsx
 * @description A premium background dot pattern component built with customizable SVGs and Framer Motion.
 * Developed in accordance with Google Principal SWE guidelines.
 *
 * Design Guidelines & Theme Considerations:
 * - Dot colors can be styled dynamically via text color utility classes.
 * - Supports an optional glowing effect where dots pulse with staggered random durations and delays.
 * - Compatible with a "Fancy Dark Mode Toggle": translucency and SVG opacity allow seamless transitions
 *   between light and dark themes.
 *
 * Performance & React 19 Considerations:
 * - Dimensions and dot positions are calculated within a resize side-effect to ensure layout accuracy 
 *   and avoid calling impure functions like `Math.random` during the render cycle.
 *
 * Usage:
 * ```tsx
 * import { DotPattern } from "@/components/ui/dot-pattern";
 *
 * <div className="relative overflow-hidden h-[500px]">
 *   <DotPattern glow={true} className="text-blue-500/20" />
 * </div>
 * ```
 */

"use client"

import React, { useEffect, useId, useRef, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
  glow?: boolean
}

interface Dot {
  x: number
  y: number
  delay: number
  duration: number
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}: DotPatternProps) {
  const id = useId()
  const containerRef = useRef<SVGSVGElement>(null)
  const [, setDimensions] = useState({ width: 0, height: 0 })
  const [dots, setDots] = useState<Dot[]>([])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect()
        setDimensions({ width: containerWidth, height: containerHeight })

        const cols = Math.ceil(containerWidth / width)
        const rows = Math.ceil(containerHeight / height)
        const numDots = cols * rows
        const newDots = Array.from({ length: numDots }, (_, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          return {
            x: col * width + cx + x,
            y: row * height + cy + y,
            delay: Math.random() * 5,
            duration: Math.random() * 3 + 2,
          }
        })
        setDots(newDots)
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [width, height, cx, cy, x, y])

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-neutral-400/80",
        className
      )}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      {dots.map((dot) => (
        <motion.circle
          key={`${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={cr}
          fill={glow ? `url(#${id}-gradient)` : "currentColor"}
          initial={glow ? { opacity: 0.4, scale: 1 } : {}}
          animate={
            glow
              ? {
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.5, 1],
                }
              : {}
          }
          transition={
            glow
              ? {
                  duration: dot.duration,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: dot.delay,
                  ease: "easeInOut",
                }
              : {}
          }
        />
      ))}
    </svg>
  )
}
