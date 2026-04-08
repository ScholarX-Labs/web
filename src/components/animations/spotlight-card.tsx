"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  tiltEnabled?: boolean;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor,
  tiltEnabled = true,
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [opacity, setOpacity] = useState(0);

  const glareX = useMotionValue(0);
  const glareY = useMotionValue(0);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  // Smooth springs for tracking the cursor dynamically
  const springGlareX = useSpring(glareX, {
    stiffness: 150,
    damping: 20,
    mass: 0.8,
  });
  const springGlareY = useSpring(glareY, {
    stiffness: 150,
    damping: 20,
    mass: 0.8,
  });
  const springTiltX = useSpring(tiltX, {
    stiffness: 150,
    damping: 20,
    mass: 0.8,
  });
  const springTiltY = useSpring(tiltY, {
    stiffness: 150,
    damping: 20,
    mass: 0.8,
  });

  // 3D Apple-style Glass Tilt: tilt values go from -0.5 to 0.5
  const rotateX = useTransform(springTiltY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springTiltX, [-0.5, 0.5], [-6, 6]);

  // Glare position using standard coordinates (pixels) to match the original Spotlight scale
  const bgImage = useMotionTemplate`radial-gradient(800px circle at ${springGlareX}px ${springGlareY}px, var(--spotlight-color, rgba(255,255,255,0.08)), transparent 40%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    // Set raw pixel coordinates for the glare
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glareX.set(x);
    glareY.set(y);

    // Set normalized coordinates for the tilt (-0.5 to 0.5)
    tiltX.set(x / rect.width - 0.5);
    tiltY.set(y / rect.height - 0.5);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
    tiltX.set(0);
    tiltY.set(0);
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => {
    setOpacity(0);
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={
        tiltEnabled
          ? {
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
              transformPerspective: 1400,
            }
          : {}
      }
      className={cn(
        "relative flex h-full w-full overflow-hidden rounded-[1.5rem] bg-card shadow-lg transition-shadow duration-500",
        className,
      )}
      {...props}
    >
      <div
        className="relative z-10 w-full h-full flex flex-col"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>

      <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          opacity,
          background: bgImage,
          mixBlendMode: "screen",
          transition: "opacity 300ms ease",
        }}
      />
    </motion.div>
  );
}
