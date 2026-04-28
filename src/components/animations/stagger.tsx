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

// Pre-define motion components for common tags to avoid static-components error
const MotionLi = motion.li;
const MotionDiv = motion.div;
const MotionSpan = motion.span;
const MotionArticle = motion.article;
const MotionSection = motion.section;

export function StaggerItem({ children, as, ...props }: StaggerItemProps) {
  // Use pre-defined components for common tags
  if (as === "li") {
    return (
      <MotionLi variants={staggerItemVariants} {...(props as any)}>
        {children}
      </MotionLi>
    );
  }
  
  if (as === "span") {
    return (
      <MotionSpan variants={staggerItemVariants} {...(props as any)}>
        {children}
      </MotionSpan>
    );
  }

  if (as === "article") {
    return (
      <MotionArticle variants={staggerItemVariants} {...(props as any)}>
        {children}
      </MotionArticle>
    );
  }

  if (as === "section") {
    return (
      <MotionSection variants={staggerItemVariants} {...(props as any)}>
        {children}
      </MotionSection>
    );
  }

  // Default to div
  return (
    <MotionDiv variants={staggerItemVariants} {...(props as any)}>
      {children}
    </MotionDiv>
  );
}
