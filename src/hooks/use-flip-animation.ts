"use client";

import { useCallback } from "react";

interface FlipPlayOptions {
  duration?: number;
  easing?: string;
  onComplete?: () => void;
}

interface FlipAnimationApi {
  applyInverseFromRect: (element: HTMLElement, originRect: DOMRect) => void;
  play: (element: HTMLElement, options?: FlipPlayOptions) => Promise<void>;
  playReverse: (
    element: HTMLElement,
    targetRect: DOMRect,
    options?: FlipPlayOptions,
  ) => Promise<void>;
}

export function useFlipAnimation(): FlipAnimationApi {
  const applyInverseFromRect = useCallback(
    (element: HTMLElement, originRect: DOMRect) => {
      const currentRect = element.getBoundingClientRect();

      const dx = originRect.left - currentRect.left;
      const dy = originRect.top - currentRect.top;
      const scaleX = originRect.width / currentRect.width;
      const scaleY = originRect.height / currentRect.height;

      const safeScaleX = Math.max(scaleX, 0.2);
      const compensatedRadius = Math.round(16 / safeScaleX);

      element.style.transition = "none";
      element.style.transformOrigin = "top left";
      element.style.transform = `translate(${dx}px, ${dy}px) scale(${safeScaleX}, ${Math.max(scaleY, 0.2)})`;
      element.style.borderRadius = `${compensatedRadius}px`;
      element.style.overflow = "hidden";

      // Force style flush so the next animation frame starts from the inverse state.
      void element.offsetWidth;
    },
    [],
  );

  const play = useCallback(
    (element: HTMLElement, options: FlipPlayOptions = {}) => {
      const {
        duration = 380,
        easing = "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        onComplete,
      } = options;

      return new Promise<void>((resolve) => {
        element.style.willChange = "transform, border-radius";

        const animation = element.animate(
          [
            {
              transform: element.style.transform,
              borderRadius: element.style.borderRadius,
            },
            {
              transform: "translate(0px, 0px) scale(1, 1)",
              borderRadius: "28px",
            },
          ],
          {
            duration,
            easing,
            fill: "forwards",
          },
        );

        animation.onfinish = () => {
          element.style.willChange = "auto";
          element.style.transform = "";
          element.style.transformOrigin = "";
          element.style.borderRadius = "";
          onComplete?.();
          resolve();
        };
      });
    },
    [],
  );

  const playReverse = useCallback(
    (
      element: HTMLElement,
      targetRect: DOMRect,
      options: FlipPlayOptions = {},
    ): Promise<void> => {
      const {
        duration = 280,
        easing = "cubic-bezier(0.4, 0, 1, 1)",
        onComplete,
      } = options;

      const currentRect = element.getBoundingClientRect();
      const dx = targetRect.left - currentRect.left;
      const dy = targetRect.top - currentRect.top;
      const scaleX = Math.max(targetRect.width / currentRect.width, 0.2);
      const scaleY = Math.max(targetRect.height / currentRect.height, 0.2);
      const compensatedRadius = Math.round(16 / scaleX);

      return new Promise<void>((resolve) => {
        element.style.willChange = "transform, border-radius";

        const animation = element.animate(
          [
            {
              transform: "translate(0px, 0px) scale(1, 1)",
              borderRadius: "28px",
            },
            {
              transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
              borderRadius: `${compensatedRadius}px`,
            },
          ],
          {
            duration,
            easing,
            fill: "forwards",
          },
        );

        animation.onfinish = () => {
          element.style.willChange = "auto";
          onComplete?.();
          resolve();
        };
      });
    },
    [],
  );

  return { applyInverseFromRect, play, playReverse };
}
