"use client";

import { useReducedMotion, animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import type { AnimatedCounterProps } from "@/domain/courses/contracts/course-metrics.contract";
import { COUNTER_ANIMATION } from "./counter.constants";
import { cn } from "@/lib/utils";

function formatNumber(value: number, abbreviated: boolean): string {
  if (abbreviated && value >= 100_000) return `${Math.floor(value / 1000)}K`;
  if (abbreviated && value >= 10_000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString();
}

export function AnimatedCounter({
  value,
  label,
  suffix = "+",
  abbreviated = false,
  className,
  layout = "block",
}: AnimatedCounterProps & { layout?: "block" | "inline" }) {
  const shouldReduceMotion = useReducedMotion();
  const nodeRef = useRef<HTMLSpanElement>(null);
  const previousValueRef = useRef(0);
  const isInView = useInView(nodeRef, { once: true, margin: "0px 0px -50px 0px" });

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !isInView) return;

    if (shouldReduceMotion) {
      node.textContent = formatNumber(value, abbreviated);
      previousValueRef.current = value;
      return;
    }

    const controls = animate(previousValueRef.current, value, {
      duration: 3,
      ease: "easeOut",
      onUpdate(currentValue) {
        node.textContent = formatNumber(Math.floor(currentValue), abbreviated);
      },
      onComplete() {
        previousValueRef.current = value;
      }
    });

    return () => controls.stop();
  }, [value, abbreviated, shouldReduceMotion, isInView]);

  return (
    <div className={cn(layout === "inline" ? "inline-flex items-baseline gap-1" : "", className)} aria-live="polite" aria-atomic="true">
      <span className="sr-only">{formatNumber(value, abbreviated)}{suffix} {label}</span>
      <span className={cn("flex items-baseline gap-0 font-semibold", layout === "inline" ? "" : "")} aria-hidden="true">
        <span ref={nodeRef}>{formatNumber(previousValueRef.current, abbreviated)}</span>
        <span>{suffix}</span>
      </span>
      {layout === "inline" ? (
        <span aria-hidden="true">{label}</span>
      ) : (
        <p className="text-sm text-muted-foreground mt-1" aria-hidden="true">{label}</p>
      )}
    </div>
  );
}
