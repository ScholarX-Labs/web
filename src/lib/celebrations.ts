import confetti from "canvas-confetti";

interface CelebrationOptions {
  particleCount?: number;
  spread?: number;
  origin?: { y: number };
  colors?: string[];
}

/**
 * Triggers a high-performance confetti celebration using canvas-confetti.
 * Designed for "Certificate Earned" or "Course Completed" moments.
 */
export const triggerCelebration = (options: CelebrationOptions = {}) => {
  const {
    particleCount = 150,
    spread = 70,
    origin = { y: 0.6 },
    colors = ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"],
  } = options;

  // Fire a burst of confetti
  confetti({
    particleCount,
    spread,
    origin,
    colors,
    zIndex: 9999,
  });

  // Optional: fire a second burst for more "volume"
  setTimeout(() => {
    confetti({
      particleCount: particleCount / 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: particleCount / 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
  }, 150);
};
