"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface Parallax3DWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function Parallax3DWrapper({ children, className }: Parallax3DWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for buttery transitions
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  // Map position to a 3D rotation (-10 to 10 degrees)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  // Calculate glare position
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);
  
  // Opacity of glare
  const opacity = useMotionValue(0);
  const glareOpacity = useSpring(opacity, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Normalize coordinates from -0.5 to 0.5
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseEnter = () => {
    opacity.set(1);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    opacity.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1200,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn("relative group transform-gpu", className)}
    >
      {/* Glare effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-50 rounded-[1.5rem]"
        style={{
          opacity: glareOpacity,
          background: "radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)",
          left: glareX,
          top: glareY,
          transform: "translate(-50%, -50%)",
          width: "200%",
          height: "200%",
          mixBlendMode: "overlay",
        }}
      />
      {children}
    </motion.div>
  );
}