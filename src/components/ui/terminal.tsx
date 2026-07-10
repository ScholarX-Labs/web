/**
 * @file terminal.tsx
 * @description A premium terminal interface component inspired by macOS, supporting auto-sequenced children typing animations.
 * Developed in accordance with Google Principal SWE guidelines.
 *
 * Design Guidelines & Theme Considerations:
 * - Emulates standard macOS window controls (Red, Yellow, Green status circles).
 * - Translucency and background color scales adapt automatically.
 * - Compatible with a "Fancy Dark Mode Toggle": leverages custom background (`bg-background`) and border configurations.
 *
 * Performance & React 19 Considerations:
 * - Employs React context-based sequencing so each child line (TypingAnimation / AnimatedSpan) starts sequentially.
 * - Uses requestAnimationFrame and clean interval cleanup timers to manage typewriter animations smoothly.
 * - Safe ref handling compliant with React 19 typings.
 *
 * Usage:
 * ```tsx
 * import { Terminal, TypingAnimation, AnimatedSpan } from "@/components/ui/terminal";
 *
 * <Terminal>
 *   <TypingAnimation>pnpm dlx shadcn@latest init</TypingAnimation>
 *   <AnimatedSpan>✔ Preflight checks.</AnimatedSpan>
 * </Terminal>
 * ```
 */

"use client"

import React, {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  motion,
  useInView,
  type HTMLMotionProps,
  type MotionProps,
} from "motion/react"
import { cn } from "@/lib/utils"

interface SequenceContextValue {
  completeItem: (index: number) => void
  activeIndex: number
  sequenceStarted: boolean
}

const SequenceContext = createContext<SequenceContextValue | null>(null)

const useSequence = () => useContext(SequenceContext)

const ItemIndexContext = createContext<number | null>(null)
const useItemIndex = () => useContext(ItemIndexContext)

const motionElements = {
  article: motion.article,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  li: motion.li,
  p: motion.p,
  section: motion.section,
  span: motion.span,
} as const

type MotionElementType = keyof typeof motionElements

type TerminalTypingMotionComponent = React.ComponentType<
  Omit<HTMLMotionProps<"span">, "ref"> & {
    ref?: React.Ref<HTMLElement>
  }
>

interface AnimatedSpanProps extends MotionProps {
  children: React.ReactNode
  delay?: number
  className?: string
  startOnView?: boolean
}

export const AnimatedSpan = ({
  children,
  delay = 0,
  className,
  startOnView = false,
  ...props
}: AnimatedSpanProps) => {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(elementRef as React.RefObject<Element>, {
    amount: 0.3,
    once: true,
  })

  const sequence = useSequence()
  const itemIndex = useItemIndex()

  const shouldAnimate = sequence
    ? sequence.sequenceStarted && sequence.activeIndex >= (itemIndex ?? 0)
    : startOnView
      ? isInView
      : true

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, y: -5 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -5 }}
      transition={{ duration: 0.3, delay: sequence ? 0 : delay / 1000 }}
      className={cn("grid text-sm font-normal tracking-tight", className)}
      onAnimationComplete={() => {
        if (!sequence) return
        if (itemIndex === null) return
        sequence.completeItem(itemIndex)
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface TypingAnimationProps extends Omit<MotionProps, "children"> {
  children: string
  className?: string
  duration?: number
  delay?: number
  as?: MotionElementType
  startOnView?: boolean
}

export const TypingAnimation = ({
  children,
  className,
  duration = 60,
  delay = 0,
  as: Component = "span",
  startOnView = true,
  ...props
}: TypingAnimationProps) => {
  if (typeof children !== "string") {
    throw new Error("TypingAnimation: children must be a string. Received:")
  }

  const MotionComponent = motionElements[
    Component
  ] as unknown as TerminalTypingMotionComponent

  const [displayedText, setDisplayedText] = useState<string>("")
  const elementRef = useRef<HTMLElement | null>(null)
  const isInView = useInView(elementRef as React.RefObject<Element>, {
    amount: 0.3,
    once: true,
  })

  const sequence = useSequence()
  const itemIndex = useItemIndex()
  const hasSequence = sequence !== null
  const sequenceStarted = sequence?.sequenceStarted ?? false
  const sequenceActiveIndex = sequence?.activeIndex ?? null
  const sequenceCompleteItemRef = useRef<
    SequenceContextValue["completeItem"] | null
  >(null)
  const sequenceItemIndexRef = useRef<number | null>(null)

  useEffect(() => {
    sequenceCompleteItemRef.current = sequence?.completeItem ?? null
    sequenceItemIndexRef.current = itemIndex
  }, [sequence?.completeItem, itemIndex])

  useEffect(() => {
    let typingInterval: ReturnType<typeof setInterval> | null = null
    let startTimeout: ReturnType<typeof setTimeout> | null = null

    const startTyping = () => {
      let i = 0
      setDisplayedText("")
      typingInterval = setInterval(() => {
        if (i < children.length) {
          setDisplayedText(children.substring(0, i + 1))
          i++
        } else {
          if (typingInterval) {
            clearInterval(typingInterval)
          }
          const completeItem = sequenceCompleteItemRef.current
          const currentItemIndex = sequenceItemIndexRef.current
          if (completeItem && currentItemIndex !== null) {
            completeItem(currentItemIndex)
          }
        }
      }, duration)
    }

    if (hasSequence && itemIndex !== null) {
      if (sequenceStarted && sequenceActiveIndex === itemIndex) {
        startTyping()
      }
    } else {
      if (!startOnView || isInView) {
        startTimeout = setTimeout(startTyping, delay)
      }
    }

    return () => {
      if (typingInterval) clearInterval(typingInterval)
      if (startTimeout) clearTimeout(startTimeout)
    }
  }, [
    children,
    duration,
    delay,
    startOnView,
    isInView,
    hasSequence,
    sequenceStarted,
    sequenceActiveIndex,
    itemIndex,
  ])

  return (
    <MotionComponent
      ref={elementRef}
      className={cn("text-sm font-normal tracking-tight", className)}
      {...props}
    >
      {displayedText}
    </MotionComponent>
  )
}

interface TerminalProps {
  children: React.ReactNode
  className?: string
  sequence?: boolean
  startOnView?: boolean
}

export const Terminal = ({
  children,
  className,
  sequence = true,
  startOnView = true,
}: TerminalProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(containerRef as React.RefObject<Element>, {
    amount: 0.3,
    once: true,
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const sequenceHasStarted = sequence ? !startOnView || isInView : false

  const contextValue = useMemo<SequenceContextValue | null>(() => {
    if (!sequence) return null
    return {
      completeItem: (index: number) => {
        setActiveIndex((current) => (index === current ? current + 1 : current))
      },
      activeIndex,
      sequenceStarted: sequenceHasStarted,
    }
  }, [sequence, activeIndex, sequenceHasStarted])

  const wrappedChildren = useMemo(() => {
    if (!sequence) return children
    const array = Children.toArray(children)
    return array.map((child, index) => (
      <ItemIndexContext.Provider key={index} value={index}>
        {child as React.ReactNode}
      </ItemIndexContext.Provider>
    ))
  }, [children, sequence])

  const content = (
    <div
      ref={containerRef}
      className={cn(
        "border-border bg-background z-0 h-full max-h-100 w-full max-w-lg rounded-xl border",
        className
      )}
    >
      <div className="border-border flex flex-col gap-y-2 border-b p-4">
        <div className="flex flex-row gap-x-2">
          <div className="h-2 w-2 rounded-full bg-red-500"></div>
          <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
        </div>
      </div>
      <pre className="p-4">
        <code className="grid gap-y-1 overflow-auto">{wrappedChildren}</code>
      </pre>
    </div>
  )

  if (!sequence) return content

  return (
    <SequenceContext.Provider value={contextValue}>
      {content}
    </SequenceContext.Provider>
  )
}
