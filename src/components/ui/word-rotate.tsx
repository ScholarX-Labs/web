/**
 * @file word-rotate.tsx
 * @description A premium vertical text rotation component using Framer Motion (motion/react).
 * Developed in accordance with Google Principal SWE guidelines.
 *
 * Design Guidelines & Theme Considerations:
 * - Rotates words vertically using customizable exit/entrance slide properties.
 * - Compatible with a "Fancy Dark Mode Toggle": automatically inherits text and color-based transitions.
 * - Adds guard clauses against empty arrays and out-of-bound indexes.
 *
 * Performance & React 19 Considerations:
 * - Manages clean timers inside lifecycle hooks to avoid memory leaks.
 * - Safely handles indexing bounds reactively.
 *
 * Usage:
 * ```tsx
 * import { WordRotate } from "@/components/ui/word-rotate";
 *
 * <WordRotate words={["Build", "Design", "Deploy"]} duration={3000} />
 * ```
 */

"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import type { MotionProps } from "motion/react"

import { cn } from "@/lib/utils"

export interface WordRotateProps {
  /**
   * List of words to rotate through.
   */
  words: string[]
  /**
   * Duration of each word display in milliseconds.
   * @default 2500
   */
  duration?: number
  /**
   * Customizable motion props from Motion for slide transitions.
   */
  motionProps?: MotionProps
  /**
   * Tailwind class styling for the outer wrapper div.
   */
  className?: string
}

const DEFAULT_MOTION_PROPS: MotionProps = {
  initial: { opacity: 0, y: -50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
  transition: { duration: 0.25, ease: "easeOut" },
}

export function WordRotate({
  words,
  duration = 2500,
  motionProps = DEFAULT_MOTION_PROPS,
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!words || words.length === 0) return

    const interval = setInterval(() => {
      setIndex((prevIndex) => {
        if (words.length === 0) return 0
        return (prevIndex + 1) % words.length
      })
    }, duration)

    return () => clearInterval(interval)
  }, [words, duration])

  if (!words || words.length === 0) {
    return null
  }

  const currentWord = words[index] ?? ""

  return (
    <div className="overflow-hidden py-2">
      <AnimatePresence mode="wait">
        <motion.h1
          key={currentWord}
          className={cn(className)}
          {...motionProps}
        >
          {currentWord}
        </motion.h1>
      </AnimatePresence>
    </div>
  )
}
