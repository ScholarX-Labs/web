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
const motionComponents: Record<string, ElementType> = {
  div: motion.div,
  li: motion.li,
  span: motion.span,
  article: motion.article,
  section: motion.section,
  nav: motion.nav,
};

// Fallback component that creates the motion component once for strings not in the map
const createdComponents: Record<string, ElementType> = {};

export function StaggerItem({ children, as, ...props }: StaggerItemProps) {
  let Component: ElementType = motion.div;

  if (as) {
    if (typeof as === "string") {
      if (motionComponents[as]) {
        Component = motionComponents[as];
      } else {
        if (!createdComponents[as]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          createdComponents[as] = motion.create(as as any);
        }
        Component = createdComponents[as];
      }
    } else {
      // If it's a component type, we can't easily memoize it here without risk,
      // but usually 'as' is a string tag in this project.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Component = motion.create(as as any);
    }
  }

  return (
    // eslint-disable-next-line react-hooks/static-components
    <Component variants={staggerItemVariants} {...props}>
      {children}
    </Component>
  );
}
