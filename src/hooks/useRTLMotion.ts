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
    if (typeof xValue === "string" && xValue.endsWith("%")) {
      const numericPart = parseFloat(xValue);
      return isRTL ? `${-numericPart}%` : xValue;
    }
    return xValue;
  };

  /**
   * Helper to mirror motion variant keyframes or properties.
   * Iterates through a variants object and dynamically flips any 'x' offsets.
   */
  const rtlVariants = <T extends Record<string, any>>(variants: T): T => {
    const flipped = { ...variants };
    
    for (const state in flipped) {
      if (flipped[state] && typeof flipped[state] === "object") {
        const item = { ...flipped[state] };
        
        if ("x" in item) {
          if (typeof item.x === "number" || typeof item.x === "string") {
            item.x = getX(item.x);
          } else if (Array.isArray(item.x)) {
            item.x = item.x.map((val: any) => (typeof val === "number" || typeof val === "string" ? getX(val) : val));
          }
        }
        
        flipped[state] = item;
      }
    }
    
    return flipped;
  };

  return {
    isRTL,
    dir,
    getX,
    rtlVariants,
  };
}
