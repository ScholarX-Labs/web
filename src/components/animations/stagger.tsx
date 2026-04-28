"use client";

import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { ReactNode, ElementType } from "react";

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

export function StaggerContainer({ children, ...props }: StaggerContainerProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  as?: ElementType;
}

// Map common tags to their motion equivalents to avoid creating components during render
const motionComponents: Record<string, any> = {
  div: motion.div,
  li: motion.li,
  span: motion.span,
  article: motion.article,
  section: motion.section,
  nav: motion.nav,
};

export function StaggerItem({ children, as, ...props }: StaggerItemProps) {
  const Component = as && typeof as === "string" ? motionComponents[as] || motion.create(as) : motion.div;
  
  return (
    <Component variants={staggerItemVariants} {...props}>
      {children}
    </Component>
  );
}
