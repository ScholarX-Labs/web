"use client";

import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { ReactNode } from "react";

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10, filter: "blur(5px)" },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    filter: "blur(5px)",
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } 
  },
};

interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

export function PageTransition({ children, ...props }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}
