"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { springApple, dockVariants } from "@/lib/motion-variants";
import { AnimatedButton } from "@/components/ui/animated-button";
import { createPortal } from "react-dom";

interface FocusToggleFloatingProps {
  variant?: "header" | "floating";
}

/**
 * FocusToggleFloating — A high-fidelity, "Glass on Water" dock control.
 */
export function FocusToggleFloating({ variant = "floating" }: FocusToggleFloatingProps) {
  const { isFocusMode, toggleFocusMode } = useUILayoutStore();
  const [mounted, setMounted] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = React.useCallback(() => {
    setIsVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (variant === "floating" && isFocusMode) {
      timeoutRef.current = setTimeout(() => setIsVisible(false), 3000);
    }
  }, [variant, isFocusMode]);

  React.useEffect(() => {
    setMounted(true);
    resetTimer();

    if (variant === "floating" && isFocusMode) {
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("keydown", resetTimer);
      window.addEventListener("touchstart", resetTimer);
    }

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [variant, isFocusMode, resetTimer]);

  if (!mounted) return null;

  const content = (
    <motion.div
      layoutId="focus-toggle"
      initial="hidden"
      animate={isVisible ? "visible" : { opacity: 0, y: 20, scale: 0.95, pointerEvents: "none" }}
      exit="exit"
      variants={dockVariants}
      className={cn(
        "z-[60]",
        variant === "floating" 
          ? "fixed bottom-12 left-1/2 -translate-x-1/2" 
          : "relative"
      )}
    >
      <AnimatedButton
        onClick={toggleFocusMode}
        className={cn(
          "group relative flex items-center gap-3 transition-all duration-700",
          variant === "floating"
            ? "px-6 py-3.5 rounded-[2rem] border border-white/10 backdrop-blur-2xl shadow-2xl bg-blue-500/10 border-blue-500/30 text-blue-300 ring-1 ring-blue-500/20"
            : "px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/70"
        )}
        style={{
          boxShadow: variant === "floating"
            ? "0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1), 0 0 20px rgba(59,130,246,0.1)"
            : "none"
        }}
      >
        {/* Apple-style light reflection (Top highlight) */}
        {variant === "floating" && (
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        )}
        
        <div className="relative flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={isFocusMode ? "exit" : "focus"}
              initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
              transition={springApple}
            >
              {isFocusMode ? (
                <EyeOff className={cn(variant === "floating" ? "w-4 h-4" : "w-3.5 h-3.5")} />
              ) : (
                <Eye className={cn(variant === "floating" ? "w-4 h-4" : "w-3.5 h-3.5")} />
              )}
            </motion.div>
          </AnimatePresence>

          <span className={cn(
            "font-bold tracking-tight",
            variant === "floating" ? "text-sm text-blue-300" : "text-[11px]"
          )}>
            {isFocusMode ? "Exit Focus" : "Focus Mode"}
          </span>
        </div>

        {/* Ambient Glow (Hover) */}
        {variant === "floating" && (
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-md pointer-events-none" />
        )}
      </AnimatedButton>
    </motion.div>
  );

  return variant === "floating" ? createPortal(content, document.body) : content;
}
