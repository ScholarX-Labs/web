/**
 * @description Centralized animation timing constants for course counter components.
 * All durations are in milliseconds. Change here to affect all counter animations.
 * Aligns with the ScholarX animation tier system:
 *   Tier 1 (micro): 100–200ms
 *   Tier 2 (content): 200–350ms ← counter animations live here
 *   Tier 3 (major): 350–600ms
 */
export const COUNTER_ANIMATION = {
  DIGIT_DURATION_MS: 300,                  // Tier 2
  DIGIT_STAGGER_MS: 30,                    // Stagger between changing digit columns
  DIGIT_EASE: "easeOut" as const,
  REDUCED_MOTION_DURATION_MS: 150,         // Tier 1 — opacity only
  ACTIVITY_BADGE_DISMISS_MS: 2000,
  ACTIVITY_BADGE_ENTRANCE_MS: 200,         // Tier 2
  ACTIVITY_BADGE_EXIT_MS: 300,             // Tier 2
} as const;
