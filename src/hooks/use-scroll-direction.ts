"use client";

import { useState, useEffect, useRef } from "react";

type ScrollDirection = "up" | "down";

export function useScrollDirection(
  threshold = 10,
): { direction: ScrollDirection; isAtTop: boolean } {
  const [direction, setDirection] = useState<ScrollDirection>("up");
  const [isAtTop, setIsAtTop] = useState(true);
  const prevScrollY = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const updateScrollState = () => {
      frameRef.current = null;
      const currentY = window.scrollY;
      const delta = currentY - prevScrollY.current;

      setIsAtTop((previous) => {
        const next = currentY < 10;
        return previous === next ? previous : next;
      });

      if (Math.abs(delta) > threshold) {
        const nextDirection = delta > 0 ? "down" : "up";
        setDirection((previous) =>
          previous === nextDirection ? previous : nextDirection,
        );
      }

      prevScrollY.current = currentY;
    };

    const handleScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(updateScrollState);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [threshold]);

  return { direction, isAtTop };
}
