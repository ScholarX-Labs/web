/**
 * Framer Motion animation variants for AI Search page
 * Apple-level premium animations with physics-based easing
 */

import { Variants } from "framer-motion";

// Hero Section Animations
export const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

export const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.23, 1, 0.32, 1], // cubic-bezier easing (smooth)
    },
  },
};

export const searchCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1],
      delay: 0.2,
    },
  },
};

// Results Container Animation
export const resultsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Individual Card Animations
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1],
    },
  },
  hover: {
    y: -8,
    boxShadow: "0 20px 60px rgba(51, 153, 204, 0.15)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.2 },
  },
};

// Button Animations
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// Chip/Tag Animations
export const chipVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  hover: {
    backgroundColor: "var(--scholar-blue)",
    color: "#fff",
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.95,
  },
};

// Loading Skeleton
export const skeletonVariants: Variants = {
  animate: {
    backgroundPosition: ["200% center", "-200% center"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Empty State Animation
export const emptyStateVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

// Floating Animation for Elements
export const floatingVariants: Variants = {
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Badge/Tag Pulse
export const pulseVariants: Variants = {
  animate: {
    opacity: [1, 0.8, 1],
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Icon Rotate Animation
export const rotateVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Smooth Page Transition
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.3 },
  },
};

// =====================================================
// LOADING STATE ANIMATIONS
// =====================================================

// Orb base variants — used by AIThinkingOrb via AnimatePresence
export const orbContainerVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
  },
};

// Orb breathing pulse for THINKING stage
export const orbPulseVariants: Variants = {
  animate: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Orb morphing for REMODELING stage
export const orbMorphVariants: Variants = {
  animate: {
    borderRadius: ["50%", "35%", "50%"],
    scaleX: [1, 1.3, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Stage text variants — cross-fade between stages
export const stageTextVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.2 },
  },
};

// Progress bar variants
export const progressBarVariants: Variants = {
  initial: { width: "0%" },
  animate: (progress: number) => ({
    width: `${progress * 100}%`,
    transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
  }),
};

// Shimmer card entrance + exit variants
export const shimmerCardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay,
      ease: [0.23, 1, 0.32, 1],
    },
  }),
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.3 },
  },
};

// Sparkle burst for DONE stage particles
export const sparkleBurstVariants: Variants = {
  initial: { scale: 0, opacity: 1, x: 0, y: 0 },
  animate: (angle: number) => {
    const distance = 40;
    const rad = (angle * Math.PI) / 180;
    return {
      scale: [0, 1.2, 0],
      opacity: [1, 1, 0],
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
    };
  },
};
