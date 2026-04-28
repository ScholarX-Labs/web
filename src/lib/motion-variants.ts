/**
 * ScholarX Motion Variants
 *
 * Centralized Framer Motion animation presets.
 * All components MUST import from here — no inline variant objects allowed.
 *
 * Rules:
 * - Do not define `initial/animate/exit` objects inside component files.
 * - Use `transition` presets from this file for consistent spring physics.
 * - `<MotionConfig reducedMotion="user">` in LessonLayoutShell handles
 *   accessibility — all variants respect it automatically.
 *
 * Usage:
 *   import { fadeSlideUp, staggerContainer } from '@/lib/motion-variants';
 *   <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" />
 */

import type { Variants, Transition } from "framer-motion";

// ─── Shared Transition Configs ────────────────────────────────────────────────

const springStable: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 24,
};

const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 28,
};

const springPhysical: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 18, // Slight overshoot for physicality
};

// ─── Fade + Slide Up ──────────────────────────────────────────────────────────
// Used for: Metadata blocks, stat badges, content stagger children.

export const fadeSlideUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: springStable },
};

// ─── Fade Slide In (Directional — Lesson Transition) ─────────────────────────
// Used with AnimatePresence key={lessonId} for lesson-to-lesson navigation.
// "Content flows forward, not reloads."

export const fadeSlideIn = {
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -20 },
  transition: { duration: 0.25, ease: "easeOut" as const },
} as const;

// ─── Spring Panel (Overlay Slide-In) ─────────────────────────────────────────
// Used for: Notes panel, Resources sheet, floating sidebar on mobile.
// Has slight overshoot for premium physical feel.

export const springPanel: Variants = {
  hidden:  { x: 400, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: springPhysical },
  exit:    { x: 400, opacity: 0, transition: { ...springPhysical, stiffness: 200 } },
};

// ─── Stagger Container ────────────────────────────────────────────────────────
// Parent variant — staggers children with 50ms delay between each.

export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

// ─── Stagger Item ─────────────────────────────────────────────────────────────
// Child of staggerContainer — slides in from right slightly.

export const staggerItem: Variants = {
  hidden:  { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: springStable },
};

// ─── Tap Scale (Button Micro-Interaction) ─────────────────────────────────────
// Applied to ALL interactive elements for tactile feedback.
// Scale down 3% on press, scale up 2% on hover.

export const tapScale = {
  whileHover: { scale: 1.02 },
  whileTap:   { scale: 0.97 },
  transition: springSnappy,
} as const;

// ─── Focus Mode Transition ────────────────────────────────────────────────────
// Used to animate secondary UI (header, sidebar) in/out during Focus Mode.
// Fast fade with pointer-events toggling for clean interaction cutoff.

export const focusModeTransition: Variants = {
  visible: {
    opacity: 1,
    pointerEvents: "auto" as const,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  hidden: {
    opacity: 0,
    pointerEvents: "none" as const,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

// ─── Item Fade (Generic) ──────────────────────────────────────────────────────
// Lightweight opacity-only fade for tab content transitions.

export const itemFade: Variants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

// ─── Scale Fade (Modal / Dropdown Entry) ─────────────────────────────────────
// Used for dropdowns, context menus, and compact overlays.

export const scaleFade: Variants = {
  hidden:  { opacity: 0, scale: 0.95, y: -8 },
  visible: { opacity: 1, scale: 1,    y:  0, transition: springSnappy },
  exit:    { opacity: 0, scale: 0.95, y: -8, transition: { duration: 0.15 } },
};

// ─── Apple-Caliber Focus Orchestration ───────────────────────────────────────

/** 
 * Apple Physics: High stiffness, precise damping. 
 * Mimics the responsive-yet-stable feel of macOS/iOS. 
 */
export const springApple: Transition = {
  type: "spring",
  stiffness: 80,
  damping: 20,
  mass: 1.1,
};

/**
 * Sidebar Compression: "Drops off the flank"
 * Animates width to 0 while sliding and fading for a cinematic exit.
 */
export const sidebarFocusVariants: Variants = {
  visible: {
    width: "var(--sidebar-width, 380px)",
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: springApple,
  },
  hidden: {
    width: 0,
    opacity: 0,
    x: 40,
    filter: "blur(12px)",
    transition: {
      ...springApple,
      width: { duration: 0.6, ease: [0.32, 0.72, 0, 1] }, // Smoother width collapse
      opacity: { duration: 0.3 },
    },
  },
};

/**
 * Metadata Fade: Clears the stage for the video.
 */
export const metaFocusVariants: Variants = {
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: springApple,
  },
  hidden: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    overflow: "hidden",
    filter: "blur(20px)",
    display: "none",
    transition: {
      ...springApple,
      height: { duration: 0.6 },
      opacity: { duration: 0.3 },
      display: { delay: 0.6 } // Wait for exit animation
    },
  },
};
/**
 * Dock Dock: macOS-style floating control
 */
export const dockVariants: Variants = {
  hidden: { 
    y: 100, 
    opacity: 0, 
    scale: 0.8,
    filter: "blur(10px)"
  },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    filter: "blur(0px)",
    transition: {
      ...springApple,
      delay: 0.4 // Wait for page entry
    }
  },
  exit: { 
    y: 100, 
    opacity: 0, 
    transition: { duration: 0.3 }
  }
};

// ─── Home Page Specific Transitions ──────────────────────────────────────────

/**
 * Hero Entrance: Staggered entrance for the hero section (badge, headline, subline, CTAs).
 */
export const heroEntrance: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Section Reveal: Generic fade-and-slide up for full sections when they enter view.
 */
export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 80, damping: 20, mass: 1 } 
  },
};

/**
 * Directional Slides: For split-panel layouts like Services section.
 */
export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: springApple },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: springApple },
};

// ─── Impact Section Variants ──────────────────────────────────────────────────

/**
 * Stat Card Reveal: Scale and fade in with spring physics.
 */
export const statCardReveal: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 20,
      mass: 1
    } 
  },
};

/**
 * Stat Icon Reveal: Pop-in effect for the icon.
 */
export const statIconReveal: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    rotate: 0,
    transition: { 
      type: "spring", 
      stiffness: 260, 
      damping: 20,
      delay: 0.2
    } 
  },
};

/**
 * Stat Icon Floating: Continuous subtle movement.
 */
export const statIconFloating: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

