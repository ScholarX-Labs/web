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
