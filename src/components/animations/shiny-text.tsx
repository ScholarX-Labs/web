"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 3,
  className,
}: ShinyTextProps) {
  const animationDuration = `${speed}s`;

  return (
    <motion.div
      className={cn(
        "inline-block font-medium",
        disabled ? "" : "bg-clip-text text-transparent opacity-90",
        className,
      )}
      style={
        disabled
          ? {}
          : ({
              backgroundImage:
                "linear-gradient(120deg, transparent 40%, var(--shiny-color, rgba(255,255,255,0.8)) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundColor: "currentColor", // Fills the un-shined part with the actual text color defined in className
              animationDuration: animationDuration,
            } as React.CSSProperties)
      }
      animate={
        disabled ? {} : { backgroundPosition: ["100% 50%", "-100% 50%"] }
      }
      transition={
        disabled
          ? {}
          : {
              repeat: Infinity,
              duration: speed,
              ease: "linear",
            }
      }
    >
      {text}
    </motion.div>
  );
}
