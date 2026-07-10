/**
 * @file encrypted-text.tsx
 * @description A high-performance, reusable React component that displays text with an organic matrix-style decrypting / scrambling effect.
 *
 * @usage_guidelines
 * - Ideal for headers, landing pages, interactive storytelling, and portfolio introductions.
 * - Works beautifully with Tailwind CSS for class-based styling of both encrypted and decrypted character states.
 * - Optimized with requestAnimationFrame for fluid 60fps rendering of gibberish characters.
 * - IntersectionObserver-powered (via Framer Motion's useInView) to only run the animation when visible.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle" 
 *   to toggle themes. This component listens to class changes on documentElement and will correctly
 *   reflect dark/light variant styles defined in `encryptedClassName` and `revealedClassName`.
 * - Use a "Fancy Dark Mode Toggle" (like a smooth-rotating sun/moon icon) to trigger theme switches
 *   safely without breaking or stuttering active text decryption animations.
 */

"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  /**
   * Time in milliseconds between revealing each subsequent real character.
   * Lower is faster. Defaults to 50ms per character.
   */
  revealDelayMs?: number;
  /** Optional custom character set to use for the gibberish effect. */
  charset?: string;
  /**
   * Time in milliseconds between gibberish flips for unrevealed characters.
   * Lower is more jittery. Defaults to 50ms.
   */
  flipDelayMs?: number;
  /** CSS class for styling the encrypted/scrambled characters */
  encryptedClassName?: string;
  /** CSS class for styling the revealed characters */
  revealedClassName?: string;
};

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

function generateRandomCharacter(charset: string): string {
  const index = Math.floor(Math.random() * charset.length);
  return charset.charAt(index);
}

function generateGibberishPreservingSpaces(
  original: string,
  charset: string,
): string {
  if (!original) return "";
  let result = "";
  for (let i = 0; i < original.length; i += 1) {
    const ch = original[i];
    result += ch === " " ? " " : generateRandomCharacter(charset);
  }
  return result;
}

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const [revealCount, setRevealCount] = useState<number>(0);
  const [scrambleChars, setScrambleChars] = useState<string[]>(
    text ? generateGibberishPreservingSpaces(text, charset).split("") : [],
  );
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFlipTimeRef = useRef<number>(0);
  const scrambleCharsRef = useRef<string[]>(scrambleChars);

  useEffect(() => {
    if (!isInView) return;

    // Reset state for a fresh animation whenever dependencies change
    const initial = text
      ? generateGibberishPreservingSpaces(text, charset)
      : "";
    const initialChars = initial.split("");
    scrambleCharsRef.current = initialChars;
    setTimeout(() => setScrambleChars(initialChars), 0);
    startTimeRef.current = performance.now();
    lastFlipTimeRef.current = startTimeRef.current;
    setTimeout(() => setRevealCount(0), 0);

    let isCancelled = false;

    const update = (now: number) => {
      if (isCancelled) return;

      const elapsedMs = now - startTimeRef.current;
      const totalLength = text.length;
      const currentRevealCount = Math.min(
        totalLength,
        Math.floor(elapsedMs / Math.max(1, revealDelayMs)),
      );

      setRevealCount(currentRevealCount);

      if (currentRevealCount >= totalLength) {
        return;
      }

      // Re-randomize unrevealed scramble characters on an interval
      const timeSinceLastFlip = now - lastFlipTimeRef.current;
      if (timeSinceLastFlip >= Math.max(0, flipDelayMs)) {
        const nextScrambleChars = [...scrambleCharsRef.current];
        for (let index = 0; index < totalLength; index += 1) {
          if (index >= currentRevealCount) {
            if (text[index] !== " ") {
              nextScrambleChars[index] = generateRandomCharacter(charset);
            } else {
              nextScrambleChars[index] = " ";
            }
          }
        }
        scrambleCharsRef.current = nextScrambleChars;
        setScrambleChars(nextScrambleChars);
        lastFlipTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInView, text, revealDelayMs, charset, flipDelayMs]);

  if (!text) return null;

  return (
    <motion.span
      ref={ref}
      className={cn(className)}
      aria-label={text}
    >
      {text.split("").map((char, index) => {
        const isRevealed = index < revealCount;
        const displayChar = isRevealed
          ? char
          : char === " "
            ? " "
            : (scrambleChars[index] ?? generateRandomCharacter(charset));

        return (
          <span
            key={index}
            className={cn(isRevealed ? revealedClassName : encryptedClassName)}
          >
            {displayChar}
          </span>
        );
      })}
    </motion.span>
  );
};
