"use client";

import { useLocale } from "next-intl";

/**
 * useRTLMotion
 * 
 * A hook that detects the current locale's layout direction and provides
 * helpers to mirror Framer Motion x-axis values or variants dynamically.
 */
export function useRTLMotion() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  /**
   * Helper to mirror x-axis translation offsets for RTL.
   * If LTR: returns the original value.
   * If RTL: multiplies the value by -1 to mirror the direction.
   */
  const getX = (xValue: number | string) => {
    if (typeof xValue === "number") {
      return isRTL ? -xValue : xValue;
    }
    if (typeof xValue === "string") {
      const match = xValue.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
      if (match) {
        const [, num, unit] = match;
        return isRTL ? `${-parseFloat(num)}${unit}` : xValue;
      }
    }
    return xValue;
  };

  /**
   * Helper to mirror motion variant keyframes or properties.
   * Iterates through a variants object and dynamically flips any 'x' offsets.
   */
  const rtlVariants = <T extends Record<string, unknown>>(variants: T): T => {
    const flipped = { ...variants } as Record<string, unknown>;
    
    for (const state in flipped) {
      const stateValue = flipped[state];
      if (stateValue && typeof stateValue === "object" && !Array.isArray(stateValue)) {
        const item = { ...stateValue } as Record<string, unknown>;
        
        if ("x" in item) {
          const xVal = item.x;
          if (typeof xVal === "number" || typeof xVal === "string") {
            item.x = getX(xVal);
          } else if (Array.isArray(xVal)) {
            item.x = xVal.map((val: unknown) => (typeof val === "number" || typeof val === "string" ? getX(val) : val));
          }
        }
        
        flipped[state] = item;
      }
    }
    
    return flipped as T;
  };

  return {
    isRTL,
    dir,
    getX,
    rtlVariants,
  };
}
