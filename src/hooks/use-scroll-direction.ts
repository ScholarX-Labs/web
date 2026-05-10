"use client";

import { useState, useEffect, useRef } from "react";

type ScrollDirection = "up" | "down";

export function useScrollDirection(
  threshold = 10,
): { direction: ScrollDirection; isAtTop: boolean; scrollY: number } {
  const [direction, setDirection] = useState<ScrollDirection>("up");
  const [isAtTop, setIsAtTop] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const prevScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - prevScrollY.current;

      setIsAtTop(currentY < 10);

      if (Math.abs(delta) > threshold) {
        setDirection(delta > 0 ? "down" : "up");
      }

      prevScrollY.current = currentY;
      setScrollY(currentY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return { direction, isAtTop, scrollY };
}
