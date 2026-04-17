# ScholarX V2 — Desktop Card-to-Sheet Animation

## Pixel-Perfect Implementation Spec · Apple-Grade Motion

**Document Type:** Implementation Specification  
**Surface:** Desktop (≥ 1024px)  
**Scope:** Hover state → FLIP expansion → Sheet interior → Dismiss return  
**Reference Standard:** Apple App Store / Apple Music spatial interaction model  
**Status:** Implementation-Ready

---

## Table of Contents

1. [Card Anatomy Reference](#1-card-anatomy-reference)
2. [Hover State — Pixel Specification](#2-hover-state--pixel-specification)
3. [FLIP Architecture — How It Works](#3-flip-architecture--how-it-works)
4. [FLIP Implementation — Step by Step](#4-flip-implementation--step-by-step)
5. [Shared Element — Thumbnail Transition](#5-shared-element--thumbnail-transition)
6. [Catalog Backdrop — Dimming & Blur](#6-catalog-backdrop--dimming--blur)
7. [Sheet Entry — Chrome & Positioning](#7-sheet-entry--chrome--positioning)
8. [Sheet Interior — Content Stagger](#8-sheet-interior--content-stagger)
9. [Dismiss — FLIP Return](#9-dismiss--flip-return)
10. [Timing Orchestration — Full Timeline](#10-timing-orchestration--full-timeline)
11. [Reduced Motion — Complete Override](#11-reduced-motion--complete-override)
12. [Common Failure Modes & Fixes](#12-common-failure-modes--fixes)
13. [Full Code Implementation](#13-full-code-implementation)

---

## 1. Card Anatomy Reference

This section maps every visual element of the existing card design to its role
in the animation system. Every element that participates in the transition is
explicitly named and tracked.

```
┌─────────────────────────────────────────────────────────┐
│ CARD (role="article")                                   │
│ border-radius: 16px                                     │
│ overflow: hidden                                        │
│ background: #ffffff                                     │
│ box-shadow: 0 2px 12px rgba(0,0,0,0.08)                │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ THUMBNAIL ZONE (aspect-ratio: 16/9)                 │ │ ← FLIP origin element
│ │ overflow: hidden                                    │ │ ← view-transition-name set here
│ │                                                     │ │
│ │  [Category badge — top left]  [Heart — top right]  │ │ ← fade out during transition
│ │  [Urgency badge — top right]                        │ │ ← fade out during transition
│ │                                                     │ │
│ │  <img> course thumbnail                             │ │ ← shared element (morphs to hero)
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [Title — bold, 18px]                                   │ ← NOT part of transition
│  [Metadata row: level · lessons · students · type]      │ ← NOT part of transition
│  [Pricing: strikethrough · price · discount badge]      │ ← NOT part of transition
│  [Tag pills: #NestJS · #Microservices · #Node.js]       │ ← NOT part of transition
│                                                         │
│  ┌──────────────────────────────────────────┐  [★ 4.8] │
│  │ Enroll Now >                             │          │ ← morphs into sheet CTA
│  └──────────────────────────────────────────┘          │
│                                           Details >     │ ← this click triggers FLIP
└─────────────────────────────────────────────────────────┘
```

### Element Animation Roles

| Element                     | Role in Animation | Behavior                                                        |
| --------------------------- | ----------------- | --------------------------------------------------------------- |
| Card container              | FLIP source       | Provides origin `DOMRect`; stays in DOM but hidden behind sheet |
| Thumbnail `<img>`           | Shared element    | Morphs from card size → sheet hero size via View Transition     |
| Category badge              | Overlay badge     | Fades out (opacity 1→0) as FLIP begins; not present in sheet    |
| Urgency badge               | Overlay badge     | Fades out (opacity 1→0) as FLIP begins; not present in sheet    |
| Heart icon                  | Overlay icon      | Fades out (opacity 1→0) as FLIP begins                          |
| Card body (title/meta/tags) | Body content      | Fades out (opacity 1→0) as FLIP begins                          |
| Enroll Now button           | CTA               | Fades out; reappears as sheet sticky footer CTA                 |
| Details link                | Trigger           | Click captures rect; then fades out                             |

---

## 2. Hover State — Pixel Specification

The hover state is the first moment of interaction quality. It must feel
responsive, elegant, and not overly aggressive. Apple's standard: subtle lift
with intent-differentiating CTAs revealed.

### 2.1 Card Lift

```css
/* Base state — applied always */
.course-card {
  transform: scale(1) translateY(0);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition:
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    /* slight overshoot spring */ box-shadow 220ms ease-out;
  will-change: transform;
  cursor: pointer;
}

/* Hover state */
.course-card:hover {
  transform: scale(1.018) translateY(-3px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Active / pressed state */
.course-card:active {
  transform: scale(0.996) translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition-duration: 80ms;
}
```

**Why `cubic-bezier(0.34, 1.56, 0.64, 1)` for the spring:**  
This bezier has a slight overshoot past 1.0 in the output — the card briefly
scales to ~1.021 before settling at 1.018. This is the exact spring character
Apple uses on app icons and cards. It reads as "alive" rather than mechanical.

**Why `translateY(-3px)` in addition to scale:**  
Scale alone looks like a zoom. The Y lift creates a genuine elevation impression
because it moves the card toward the viewer in a spatial Z-axis metaphor. 3px
is the calibrated maximum — more than this reads as jumpy.

### 2.2 Hover CTA Reveal

Two action buttons materialize on hover: **Details** and **Enroll Now**. They
are positioned as an overlay on the lower portion of the thumbnail, not
replacing the existing card CTAs. This preserves the card layout during reveal.

```
HOVER OVERLAY LAYOUT:
┌─────────────────────────────────────────────────────────┐
│ THUMBNAIL                                               │
│                                                         │
│                                                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [blur scrim: rgba(0,0,0,0.45) + blur(8px)]      │   │
│  │                                                  │   │
│  │   ┌─────────────────────┐  ┌──────────────────┐  │   │
│  │   │  Details  →         │  │  Enroll Now  →   │  │   │
│  │   └─────────────────────┘  └──────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

```css
/* Hover overlay container */
.card-hover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 16px 16px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0.2) 70%,
    transparent 100%
  );

  /* Hidden state */
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 200ms ease-out,
    transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);

  display: flex;
  gap: 8px;
}

/* Revealed on card hover */
.course-card:hover .card-hover-overlay {
  opacity: 1;
  transform: translateY(0);
}

/* Details button */
.hover-cta-details {
  flex: 1;
  height: 38px;
  border-radius: 10px;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;

  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 180ms ease-out 0ms,
    /* Details: 0ms delay */ transform 180ms ease-out 0ms,
    background 120ms ease;
}

/* Enroll Now button */
.hover-cta-enroll {
  flex: 1;
  height: 38px;
  border-radius: 10px;
  border: none;
  background: #0891b2; /* Teal — matches existing card Enroll button */
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;

  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 180ms ease-out 60ms,
    /* Enroll: 60ms stagger delay */ transform 180ms ease-out 60ms,
    background 120ms ease;
}

/* Revealed on hover — both buttons */
.course-card:hover .hover-cta-details,
.course-card:hover .hover-cta-enroll {
  opacity: 1;
  transform: translateY(0);
}

/* Button hover states (within the already-hovering card) */
.hover-cta-details:hover {
  background: rgba(255, 255, 255, 0.28);
}
.hover-cta-enroll:hover {
  background: #0e7490;
}
```

### 2.3 Keyboard Hover Parity

The hover state must also trigger on keyboard focus so that mouse and keyboard
users get identical experiences.

```css
/* Treat focus-visible the same as hover for both card and CTAs */
.course-card:focus-within .card-hover-overlay {
  opacity: 1;
  transform: translateY(0);
}

.course-card:focus-within .hover-cta-details,
.course-card:focus-within .hover-cta-enroll {
  opacity: 1;
  transform: translateY(0);
}

/* Keyboard focus ring on the card */
.course-card:focus-visible {
  outline: 2px solid #0891b2;
  outline-offset: 2px;
}
```

---

## 3. FLIP Architecture — How It Works

FLIP is a technique invented at Google that makes expensive DOM transitions
feel instant. The name is an acronym for the four steps: **F**irst, **L**ast,
**I**nvert, **P**lay.

### 3.1 Why FLIP and Not CSS Transitions

CSS transitions animate from one CSS state to another. But our animation
requires the element to change its DOM position entirely — from a small card
in a grid to a large sheet in the viewport center. CSS cannot do this
natively without triggering layout, which is expensive and causes jank.

FLIP solves this by:

1. Capturing the **start position** (card rect)
2. Instantly placing the element in the **end position** (sheet rect)
3. Applying an **inverse transform** to make it appear at the start position
4. Animating the transform back to identity — which is GPU-only, no layout

The browser never triggers layout during the animation. It only composites
transforms and opacity, which run on the GPU at 60fps.

### 3.2 Visual Explanation

```
STEP 1 — FIRST: Measure card rect before any DOM change
─────────────────────────────────────────────────────────

  ┌────────────┐                ┌────────────┐
  │   Card A   │  ← measure     │   Card B   │
  │ x:120 y:80 │    DOMRect     │            │
  │ w:360 h:520│                │            │
  └────────────┘                └────────────┘

  firstRect = { x: 120, y: 80, width: 360, height: 520 }


STEP 2 — LAST: Mount sheet at its final position instantly
─────────────────────────────────────────────────────────

  Sheet is mounted. It appears at:
  { x: center, y: 4vh, width: 960px, height: 92vh }

  But we immediately apply an inverse transform to make it
  look like it's still at the card position:

  lastRect = sheet.getBoundingClientRect()
  dx = firstRect.x - lastRect.x   = 120 - center
  dy = firstRect.y - lastRect.y   = 80 - 4vh
  scaleX = firstRect.width  / lastRect.width   = 360 / 960
  scaleY = firstRect.height / lastRect.height  = 520 / 92vh

  sheet.style.transform = `
    translate(${dx}px, ${dy}px)
    scale(${scaleX}, ${scaleY})
  `
  sheet.style.transformOrigin = 'top left'


STEP 3 — INVERT: Apply inverse transform (user sees card position)
─────────────────────────────────────────────────────────
                              ↓ sheet is here in the DOM
  ┌────────────┐              ┌─────────────────────────────┐
  │  [sheet    │              │                             │
  │   appears  │  ← user      │        (sheet DOM)          │
  │   here via │    sees      │                             │
  │   transform│    this      │                             │
  └────────────┘              └─────────────────────────────┘


STEP 4 — PLAY: Animate transform back to identity
─────────────────────────────────────────────────────────

  sheet.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})` },
      { transform: 'translate(0, 0) scale(1, 1)' }
    ],
    { duration: 380, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }
  )

  The browser interpolates between these two transforms
  using GPU compositing only — zero layout triggers.
  The user sees the card smoothly expanding into the sheet.
```

### 3.3 Critical Constraint — Layout Lock

There is one failure mode that breaks the entire FLIP: **grid reflow between
steps 1 and 2**. If the catalog grid changes layout after `firstRect` is
captured but before the sheet mounts, the inverse transform will be wrong.

**Solution:** Lock the catalog grid layout the instant the click fires.

```typescript
// Lock: applied synchronously on click, before any state change
catalogGrid.style.contain = "layout";
catalogGrid.style.pointerEvents = "none";

// Unlock: applied in the sheet's onAnimationComplete callback
catalogGrid.style.contain = "auto";
catalogGrid.style.pointerEvents = "auto";
```

---

## 4. FLIP Implementation — Step by Step

### 4.1 The Click Handler (on CourseCard)

This is the most critical function in the entire animation system. Every
millisecond matters here. The sequence is precise and must not be reordered.

```typescript
// course-card.tsx

function handleDetailsClick(event: React.MouseEvent<HTMLButtonElement>) {
  // ─────────────────────────────────────────────────────────────────
  // STEP 0: Gate — allow Cmd+Click / Ctrl+Click to open in new tab
  // ─────────────────────────────────────────────────────────────────
  if (event.metaKey || event.ctrlKey) {
    // Do not intercept — let the browser handle it
    return;
  }

  // Prevent default link behavior
  event.preventDefault();
  event.stopPropagation();

  // ─────────────────────────────────────────────────────────────────
  // STEP 1: FIRST — Capture card rect SYNCHRONOUSLY
  //
  // getBoundingClientRect() must be called before ANY state changes.
  // State changes trigger React re-renders, which trigger layout,
  // which invalidates the rect we're trying to capture.
  //
  // This MUST be the first line after preventDefault().
  // ─────────────────────────────────────────────────────────────────
  const cardElement = event.currentTarget.closest(
    "[data-course-card]",
  ) as HTMLElement;
  const originRect = cardElement.getBoundingClientRect();

  // ─────────────────────────────────────────────────────────────────
  // STEP 2: Lock catalog layout
  //
  // Applied before React state update to prevent reflow between
  // rect capture and sheet mount.
  // ─────────────────────────────────────────────────────────────────
  const catalogGrid = document.querySelector(
    "[data-catalog-grid]",
  ) as HTMLElement;
  catalogGrid.style.contain = "layout";
  catalogGrid.style.pointerEvents = "none";

  // ─────────────────────────────────────────────────────────────────
  // STEP 3: Fade out card body content
  //
  // The card stays in the DOM (we don't remove it — we need it as
  // a spatial anchor for the FLIP). We fade out its content so it
  // doesn't compete visually with the expanding sheet.
  // ─────────────────────────────────────────────────────────────────
  cardElement.style.transition = "opacity 160ms ease-out";
  cardElement.style.opacity = "0.3";

  // ─────────────────────────────────────────────────────────────────
  // STEP 4: Open the sheet with the captured rect
  //
  // This triggers a React state update → sheet mounts in the DOM.
  // The rect we captured in STEP 1 is passed as the FLIP origin.
  // ─────────────────────────────────────────────────────────────────
  openSheet(slug, "details", originRect);
}
```

### 4.2 The FLIP Hook

```typescript
// hooks/use-flip-animation.ts

import { useCallback, useRef } from "react";

interface FlipPlayOptions {
  duration?: number;
  easing?: string;
  onComplete?: () => void;
}

interface FlipAnimationReturn {
  applyInverseFromRect: (element: HTMLElement, originRect: DOMRect) => void;
  play: (element: HTMLElement, options?: FlipPlayOptions) => Promise<void>;
  playReverse: (
    element: HTMLElement,
    targetRect: DOMRect,
    options?: FlipPlayOptions,
  ) => Promise<void>;
}

export function useFlipAnimation(): FlipAnimationReturn {
  const applyInverseFromRect = useCallback(
    (element: HTMLElement, originRect: DOMRect) => {
      // Measure where the sheet actually is in the DOM right now
      const currentRect = element.getBoundingClientRect();

      // Calculate the transform needed to make the sheet
      // appear at the card's position
      const dx = originRect.left - currentRect.left;
      const dy = originRect.top - currentRect.top;
      const scaleX = originRect.width / currentRect.width;
      const scaleY = originRect.height / currentRect.height;

      // Apply transform without transition — must be instant
      // We're setting the START state of the PLAY animation
      element.style.transition = "none";
      element.style.transformOrigin = "top left";
      element.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
      element.style.borderRadius = `${16 / scaleX}px`; // Compensate border-radius for scale

      // Trigger a reflow to ensure the transform is applied
      // before we start animating. Without this, the browser
      // may batch it with the animation and skip the start state.
      void element.offsetWidth;
    },
    [],
  );

  const play = useCallback(
    (element: HTMLElement, options: FlipPlayOptions = {}): Promise<void> => {
      const {
        duration = 380,
        easing = "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        onComplete,
      } = options;

      return new Promise<void>((resolve) => {
        // Set will-change before animation — creates GPU layer
        element.style.willChange = "transform, border-radius";

        const animation = element.animate(
          [
            {
              // Start: the inverse transform (card position)
              transform: element.style.transform,
              borderRadius: element.style.borderRadius,
            },
            {
              // End: identity transform (sheet position)
              transform: "translate(0px, 0px) scale(1, 1)",
              borderRadius: "20px", // Final sheet border radius
            },
          ],
          {
            duration,
            easing,
            fill: "forwards",
          },
        );

        animation.onfinish = () => {
          // Remove will-change after animation — releases GPU layer
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
        easing = "cubic-bezier(0.4, 0, 1, 1)", // ease-in for dismiss
        onComplete,
      } = options;

      const currentRect = element.getBoundingClientRect();
      const dx = targetRect.left - currentRect.left;
      const dy = targetRect.top - currentRect.top;
      const scaleX = targetRect.width / currentRect.width;
      const scaleY = targetRect.height / currentRect.height;

      return new Promise<void>((resolve) => {
        element.style.willChange = "transform, border-radius";

        const animation = element.animate(
          [
            {
              transform: "translate(0px, 0px) scale(1, 1)",
              borderRadius: "20px",
            },
            {
              transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
              borderRadius: "16px",
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
```

### 4.3 The Sheet Mount Effect

The FLIP must be triggered at exactly the right moment in the sheet's lifecycle:
after it is mounted and has its final dimensions in the DOM, but before the
browser has painted it to screen.

```typescript
// components/courses/course-detail-sheet.tsx

const sheetRef = useRef<HTMLDivElement>(null);
const { applyInverseFromRect, play } = useFlipAnimation();

useLayoutEffect(() => {
  // useLayoutEffect fires AFTER DOM mutation but BEFORE browser paint.
  // This is the only hook where we can safely apply the inverse
  // transform without the user seeing the "end state" flash.

  if (!sheetRef.current || !originRect) return;

  const element = sheetRef.current;

  // Apply inverse transform synchronously (no animation yet)
  applyInverseFromRect(element, originRect);

  // Play the FLIP animation on next frame
  // requestAnimationFrame ensures the browser has computed layout
  requestAnimationFrame(() => {
    play(element, {
      duration: 380,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      onComplete: () => {
        // Unlock catalog grid after FLIP completes
        const grid = document.querySelector(
          "[data-catalog-grid]",
        ) as HTMLElement;
        if (grid) {
          grid.style.contain = "auto";
          grid.style.pointerEvents = "auto";
        }
        // Push URL after animation completes
        router.push(`/courses/${slug}`, { scroll: false });
        // Trigger content stagger
        setFlipComplete(true);
      },
    });
  });
}, []); // Empty deps: runs once on mount
```

---

## 5. Shared Element — Thumbnail Transition

The thumbnail image in the card morphs into the full-width hero image in the
sheet. This is the most visually impressive part of the transition and the
detail that makes it feel genuinely Apple-quality.

### 5.1 View Transition API (Primary — Chrome 111+, Safari 18+)

```typescript
// adapters/shared-element-transition.adapter.ts

// On the card thumbnail:
// Apply a unique view-transition-name before navigation/sheet open
cardThumbnail.style.viewTransitionName = `course-thumb-${slug}`;

// On the sheet hero image:
// The same view-transition-name tells the browser these are the same element
sheetHero.style.viewTransitionName = `course-thumb-${slug}`;

// The View Transition API automatically morphs between the two
// positions, sizes, and border-radii — zero implementation needed.

// CSS to control the transition appearance:
// ::view-transition-old(course-thumb-*) and ::view-transition-new(course-thumb-*)
```

```css
/* Global CSS — controls the thumbnail morph animation */
::view-transition-old(course-thumb-NestJS),
::view-transition-old(course-thumb-UIUXDesign),
::view-transition-old(course-thumb-ReactPatterns) {
  /* The outgoing thumbnail state */
  animation: none;
}

::view-transition-new(course-thumb-NestJS),
::view-transition-new(course-thumb-UIUXDesign),
::view-transition-new(course-thumb-ReactPatterns) {
  /* The incoming hero state */
  animation: none;
}

/* Use a wildcard pattern to match all course thumbnails */
/* Note: wildcard not yet supported; enumerate or use JS to set CSS vars */
```

```typescript
// Practical implementation using CSS custom property approach:

// Before opening sheet
document.documentElement.style.setProperty(
  "--active-thumb-name",
  `course-thumb-${slug}`,
);
cardThumbnail.style.viewTransitionName = `course-thumb-${slug}`;
```

### 5.2 FLIP Fallback (Firefox + older browsers)

When the View Transition API is not available, we use a FLIP-based image
transition as fallback. The thumbnail position is animated from card rect to
sheet hero rect using the same mechanism as the sheet itself.

```typescript
// adapters/shared-element-transition.adapter.ts

function supportsViewTransitions(): boolean {
  return "startViewTransition" in document;
}

export async function transitionSharedElement(
  fromElement: HTMLElement, // Card thumbnail
  toElement: HTMLElement, // Sheet hero
  options: { duration: number; easing: string },
): Promise<void> {
  if (supportsViewTransitions()) {
    // Mark both elements
    fromElement.style.viewTransitionName = "shared-thumb";
    toElement.style.viewTransitionName = "shared-thumb";

    // View Transition handles the morph automatically
    await document.startViewTransition(() => {
      // DOM updates happen here
    }).finished;

    // Clean up
    fromElement.style.viewTransitionName = "";
    toElement.style.viewTransitionName = "";
  } else {
    // FLIP fallback: clone the from-element, position it at from-rect,
    // animate it to to-rect, then remove it
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const clone = fromElement.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.top = `${fromRect.top}px`;
    clone.style.left = `${fromRect.left}px`;
    clone.style.width = `${fromRect.width}px`;
    clone.style.height = `${fromRect.height}px`;
    clone.style.margin = "0";
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.borderRadius = "16px";
    document.body.appendChild(clone);

    // Hide the original elements during the transition
    fromElement.style.opacity = "0";
    toElement.style.opacity = "0";

    // Animate clone from from-rect to to-rect
    const animation = clone.animate(
      [
        {
          top: `${fromRect.top}px`,
          left: `${fromRect.left}px`,
          width: `${fromRect.width}px`,
          height: `${fromRect.height}px`,
          borderRadius: "16px",
        },
        {
          top: `${toRect.top}px`,
          left: `${toRect.left}px`,
          width: `${toRect.width}px`,
          height: `${toRect.height}px`,
          borderRadius: "0px",
        },
      ],
      { duration: options.duration, easing: options.easing, fill: "forwards" },
    );

    await animation.finished;

    // Reveal destination; remove clone
    toElement.style.opacity = "1";
    clone.remove();
  }
}
```

### 5.3 Image Loading During Transition

The card thumbnail is already loaded (it was visible in the grid). The sheet
hero is the same image URL — the browser will serve it from cache. This means
zero loading delay for the shared element transition.

```typescript
// In CourseDetailSheet, set the hero src to the same URL as the card thumbnail
// Do NOT use a higher-resolution image for the sheet hero —
// the transition will stutter as the new image loads.
// Load the high-res image only AFTER the transition completes.

const [heroSrc, setHeroSrc] = useState(thumbnailUrl); // Start with card-size image

// After FLIP completes, upgrade to full hero resolution
useEffect(() => {
  if (flipComplete && highResThumbnailUrl !== thumbnailUrl) {
    const img = new Image();
    img.onload = () => setHeroSrc(highResThumbnailUrl);
    img.src = highResThumbnailUrl;
  }
}, [flipComplete]);
```

---

## 6. Catalog Backdrop — Dimming & Blur

The catalog behind the sheet must recede — not disappear. The user's spatial
awareness of the grid is preserved through the dimmed/blurred catalog.

### 6.1 Visual Specification

```
BEFORE SHEET OPEN:
┌────────────────────────────────────────────────────────────────┐
│ [Card A]  [Card B]  [Card C]                                   │ opacity: 1.0
│ [Card D]  [Card E]  [Card F]                                   │ filter: none
└────────────────────────────────────────────────────────────────┘

AFTER SHEET OPEN:
┌────────────────────────────────────────────────────────────────┐
│ [Card A]  [Card B]  [Card C]   } opacity: 0.4                  │
│ [Card D]  [Card E]  [Card F]   } filter: blur(10px)            │
│          [SHEET OVERLAY]                                       │
└────────────────────────────────────────────────────────────────┘
```

### 6.2 Implementation

```typescript
// The backdrop is NOT a separate div overlay.
// It is a CSS transition applied directly to the catalog grid container.
// This approach:
// 1. Does not add DOM elements
// 2. Automatically handles partial grid visibility at edges
// 3. Is trivially reversible

// Two-layer approach:
// Layer 1: Catalog grid dims and blurs
// Layer 2: A click-capturing backdrop div sits between catalog and sheet
```

```css
/* data-catalog-grid — the catalog container element */
[data-catalog-grid] {
  transition:
    opacity 280ms ease-out,
    filter 280ms ease-out;
}

[data-catalog-grid][data-dimmed="true"] {
  opacity: 0.4;
  filter: blur(10px);
  pointer-events: none; /* Prevent interaction with dimmed cards */
  user-select: none;
}

/* Browser support gate for blur */
@supports not (filter: blur(1px)) {
  [data-catalog-grid][data-dimmed="true"] {
    /* Fallback: opacity only, no blur */
    opacity: 0.35;
    filter: none;
  }
}
```

```typescript
// Applied in the sheet open sequence
function dimCatalog() {
  const grid = document.querySelector("[data-catalog-grid]") as HTMLElement;
  grid?.setAttribute("data-dimmed", "true");
}

function undimCatalog() {
  const grid = document.querySelector("[data-catalog-grid]") as HTMLElement;
  grid?.removeAttribute("data-dimmed");

  // Restore faded card opacity
  const activeCard = document.querySelector(
    "[data-active-card]",
  ) as HTMLElement;
  if (activeCard) {
    activeCard.style.transition = "opacity 200ms ease-in";
    activeCard.style.opacity = "1";
    activeCard.removeAttribute("data-active-card");
  }
}
```

### 6.3 Backdrop Click Target

A transparent click-capturing div sits between the catalog and the sheet.
It is not visible but captures clicks to dismiss the sheet.

```tsx
{
  /* Rendered inside CourseDetailSheet, outside the sheet container */
}
<div
  aria-hidden="true"
  data-sheet-backdrop
  onClick={handleDismiss}
  style={{
    position: "fixed",
    inset: 0,
    zIndex: 99, // Below sheet (z-index: 100) but above catalog
    cursor: "default",
    WebkitTapHighlightColor: "transparent",
  }}
/>;
```

---

## 7. Sheet Entry — Chrome & Positioning

### 7.1 Sheet Visual Specification

```
SHEET DIMENSIONS:
─────────────────────────────────────────────────────────────────
Width:            min(960px, 92vw)
Max height:       92vh
Top offset:       4vh
Horizontal:       centered (left: 50%; transform: translateX(-50%))
Border radius:    20px (top) · 20px (bottom) — Apple sheet standard
Background:       #ffffff (light) / #1c1c1e (dark)
Box shadow:       0 32px 80px rgba(0, 0, 0, 0.28),
                  0 8px 24px rgba(0, 0, 0, 0.16),
                  0 0 0 0.5px rgba(0, 0, 0, 0.06)
z-index:          100
overflow:         hidden (during FLIP); auto (after FLIP completes)
─────────────────────────────────────────────────────────────────
```

```css
.course-detail-sheet {
  position: fixed;
  top: 4vh;
  left: 50%;
  transform: translateX(-50%); /* Overridden during FLIP */
  width: min(960px, 92vw);
  max-height: 92vh;
  border-radius: 20px;
  background: #ffffff;
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.28),
    0 8px 24px rgba(0, 0, 0, 0.16),
    0 0 0 0.5px rgba(0, 0, 0, 0.06);
  z-index: 100;
  overflow: hidden; /* Changed to 'auto' after FLIP completes */
  overscroll-behavior: contain;

  /* CRITICAL: overflow must be hidden during FLIP.
     If it's 'auto' during the scale-down inverse transform,
     the browser will show scrollbars at the smaller size.
     Set overflow to 'auto' only in the FLIP onComplete callback. */
}
```

### 7.2 Sheet Interior Layout

```
SHEET INTERIOR:
┌──────────────────────────────────────────────────────────────────┐
│ [HERO IMAGE — full width, aspect-ratio: 16/9]                    │
│  border-radius: 20px 20px 0 0                                    │
├──────────────────────────────────────────────────────────────────┤
│ SCROLLABLE BODY (padding: 32px)                                  │
│                                                                  │
│  [Close button — positioned absolute, top-right, over hero]      │
│                                                                  │
│  [Category badge] [Urgency badge]                                │ ← stagger item 1
│  [Title — 28px bold]                                             │ ← stagger item 2
│  [Subtitle — instructor name, 15px]                              │ ← stagger item 3
│  [Metadata row — rating · lessons · students · duration]         │ ← stagger item 4
│  ─────────────────────────────────────────────────────           │
│  [Learning outcomes section]                                     │ ← stagger item 5
│  [Curriculum accordion]                                          │ ← stagger item 6
│  [Instructor bio]                                                │ ← stagger item 7
│  [Tag pills]                                                     │ ← stagger item 8
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ STICKY FOOTER (position: sticky; bottom: 0)                      │
│  [Price display]  [Enroll Now button]                            │
└──────────────────────────────────────────────────────────────────┘
```

### 7.3 Close Button

```css
.sheet-close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;

  /* Apple-style frosted glass close button */
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Hidden initially; fades in after FLIP completes */
  opacity: 0;
  transition:
    opacity 160ms ease-out,
    background 120ms ease;
}

.sheet-close-button[data-visible="true"] {
  opacity: 1;
}

.sheet-close-button:hover {
  background: rgba(0, 0, 0, 0.6);
}
```

---

## 8. Sheet Interior — Content Stagger

Content inside the sheet stagger in only after the FLIP animation completes.
Staggering during FLIP is wrong — the scaled-down sheet content would be
readable at card size, which breaks the spatial metaphor.

### 8.1 Stagger Sequence

```
FLIP completes at t=380ms
   ↓
t=380ms + 0ms:   Badges reveal        (opacity 0→1 · translateY 8px→0 · 200ms)
t=380ms + 40ms:  Title reveals        (opacity 0→1 · translateY 8px→0 · 220ms)
t=380ms + 80ms:  Instructor reveals   (opacity 0→1 · translateY 8px→0 · 220ms)
t=380ms + 120ms: Metadata row reveals (opacity 0→1 · translateY 8px→0 · 220ms)
t=380ms + 160ms: Divider reveals      (opacity 0→1 · 180ms)
t=380ms + 200ms: Outcomes reveals     (opacity 0→1 · translateY 8px→0 · 240ms)
t=380ms + 240ms: Curriculum reveals   (opacity 0→1 · translateY 8px→0 · 240ms)
t=380ms + 280ms: Instructor bio       (opacity 0→1 · translateY 8px→0 · 240ms)
t=380ms + 0ms:   Sticky footer CTA    (opacity 0→1 · translateY 12px→0 · 280ms)
                                       ^ starts same time as first item
                                         but slides from below
```

### 8.2 StaggerContainer Implementation

```typescript
// components/animations/stagger-container.tsx

import { createContext, useContext, ReactNode } from 'react'

interface StaggerContextValue {
  isActive: boolean       // Controlled by parent — true after FLIP completes
  staggerDelay: number    // ms between items (default: 40)
  initialDelay: number    // ms before first item (default: 0)
  disabled: boolean       // True when prefers-reduced-motion
}

const StaggerContext = createContext<StaggerContextValue>({
  isActive: false,
  staggerDelay: 40,
  initialDelay: 0,
  disabled: false,
})

interface StaggerContainerProps {
  children: ReactNode
  isActive: boolean       // Pass `flipComplete` state here
  staggerDelay?: number
  initialDelay?: number
}

export function StaggerContainer({
  children,
  isActive,
  staggerDelay = 40,
  initialDelay = 0,
}: StaggerContainerProps) {
  const prefersReduced = useReducedMotion()

  return (
    <StaggerContext.Provider value={{
      isActive,
      staggerDelay,
      initialDelay,
      disabled: prefersReduced,
    }}>
      {children}
    </StaggerContext.Provider>
  )
}

// components/animations/stagger-item.tsx

let itemIndex = 0  // Reset per StaggerContainer

export function StaggerItem({
  children,
  index,      // Pass explicit index to avoid closure issues
  className,
}: {
  children: ReactNode
  index: number
  className?: string
}) {
  const { isActive, staggerDelay, initialDelay, disabled } = useContext(StaggerContext)
  const delay = disabled ? 0 : initialDelay + (index * staggerDelay)

  return (
    <div
      className={className}
      style={{
        opacity: isActive ? 1 : 0,
        transform: isActive && !disabled ? 'translateY(0)' : 'translateY(8px)',
        transition: isActive
          ? `opacity 220ms ease-out ${delay}ms, transform 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms`
          : 'none',
      }}
    >
      {children}
    </div>
  )
}
```

### 8.3 Data Loading State During Stagger

The sheet opens and plays its FLIP animation using only the data already
available from the card (slug, title, thumbnail). Full course detail is
fetched client-side and staggered in when it arrives.

```
TIMELINE:
t=0ms    Sheet mounts with card-level data (title, thumbnail)
t=0ms    FLIP plays using thumbnail as shared element
t=0ms    SWR fetch fires for full course detail
t=380ms  FLIP completes
t=380ms  Skeleton stagger items visible if data not yet arrived
t=?ms    Full course detail arrives
t=?ms    Content stagger plays replacing skeletons
```

```typescript
// Inside CourseDetailSheet after FLIP completes

const [flipComplete, setFlipComplete] = useState(false)
const { data: course, isLoading } = useCourseDetail(slug)

// Stagger activates when FLIP is done AND data has arrived
const staggerActive = flipComplete && !isLoading

return (
  <StaggerContainer isActive={staggerActive} staggerDelay={40}>
    <StaggerItem index={0}>
      {isLoading ? <TitleSkeleton /> : <CourseTitle title={course.title} />}
    </StaggerItem>
    {/* ... */}
  </StaggerContainer>
)
```

---

## 9. Dismiss — FLIP Return

The dismiss animation plays the FLIP in reverse. The sheet contracts back to
the exact position and size of the card that spawned it. This completes the
spatial loop and validates the "expansion" mental model.

### 9.1 Dismiss Trigger Sources

| Source             | Handler                                                 |
| ------------------ | ------------------------------------------------------- |
| Close button click | `handleDismiss()`                                       |
| Backdrop click     | `handleDismiss()`                                       |
| Escape key         | `handleDismiss()` — registered in `useEffect`           |
| Browser back       | `router.beforePopState` handler calls `handleDismiss()` |

### 9.2 Dismiss Sequence

```typescript
// components/courses/course-detail-sheet.tsx

async function handleDismiss() {
  if (isDismissing) return; // Prevent double-trigger
  setIsDismissing(true);

  // ─────────────────────────────────────────────────────────────────
  // STEP 1: Fade out sheet content immediately
  //
  // Content fades before the FLIP reverse plays.
  // This prevents the scaled-down sheet from showing readable text
  // at the wrong size.
  // ─────────────────────────────────────────────────────────────────
  setStaggerActive(false); // Stagger items fade out (reverse of enter)

  // ─────────────────────────────────────────────────────────────────
  // STEP 2: Lock overflow again
  //
  // Sheet may have been scrolled. Lock it before the FLIP reverse
  // to prevent scroll position showing during scale-down.
  // ─────────────────────────────────────────────────────────────────
  if (sheetRef.current) {
    sheetRef.current.style.overflow = "hidden";
    sheetRef.current.style.overflowY = "hidden";
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 3: Start backdrop undim simultaneously
  // ─────────────────────────────────────────────────────────────────
  undimCatalog(); // CSS transition handles the fade

  // ─────────────────────────────────────────────────────────────────
  // STEP 4: Play FLIP reverse — sheet contracts to card rect
  //
  // originRect was stored when the sheet was opened.
  // It points to exactly where the card is in the catalog.
  // ─────────────────────────────────────────────────────────────────
  if (sheetRef.current && originRect) {
    await playReverse(sheetRef.current, originRect, {
      duration: 280,
      easing: "cubic-bezier(0.4, 0, 1, 1)",
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 5: Restore card and close sheet
  // ─────────────────────────────────────────────────────────────────
  const activeCard = document.querySelector(
    "[data-active-card]",
  ) as HTMLElement;
  if (activeCard) {
    activeCard.style.transition = "opacity 160ms ease-in";
    activeCard.style.opacity = "1";
  }

  closeSheet(); // Zustand store: removes sheet from DOM
  router.push("/courses", { scroll: false });
}
```

### 9.3 Escape Key Registration

```typescript
useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && !isDismissing) {
      // If enrollment modal is open, close it first
      if (isEnrollModalOpen) {
        closeEnrollModal();
        return;
      }
      handleDismiss();
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isDismissing, isEnrollModalOpen, handleDismiss, closeEnrollModal]);
```

---

## 10. Timing Orchestration — Full Timeline

The complete timeline of a Details click from the card to the sheet and back.

```
EVENT: User clicks "Details" on a course card

t = 0ms     ─────────────────────────────────────────────────────────
            getBoundingClientRect() captured synchronously
            Catalog grid layout locked (contain: layout)
            Card body opacity → 0.3 (160ms transition starts)
            openSheet(slug, 'details', originRect) fires
            React state update queued

t = ~4ms    ─────────────────────────────────────────────────────────
            React re-renders
            CourseDetailSheet mounts in DOM
            Sheet positioned at final rect (top:4vh, centered)

t = ~4ms    ─────────────────────────────────────────────────────────
            useLayoutEffect fires (before browser paint)
            applyInverseFromRect() called
            Sheet transform = inverse of card rect (appears at card pos)
            void element.offsetWidth (force reflow)

t = ~5ms    ─────────────────────────────────────────────────────────
            requestAnimationFrame callback fires
            FLIP animation starts (380ms, spring easing)
            Backdrop dim animation starts (280ms, ease-out)
            SWR fetch fires for course detail
            Close button hidden (opacity: 0)

t = 160ms   ─────────────────────────────────────────────────────────
            Card body is fully faded to 0.3 opacity
            Card overlay badges have faded out

t = 280ms   ─────────────────────────────────────────────────────────
            Backdrop dim completes (catalog at opacity 0.4, blur(10px))

t = 380ms   ─────────────────────────────────────────────────────────
            FLIP animation completes
            Sheet overflow → auto (scroll enabled)
            Catalog grid layout unlocked
            Close button fades in (160ms)
            URL shallow push fires (/courses/${slug})
            flipComplete state → true
            will-change removed from sheet

t = 380ms   ─────────────────────────────────────────────────────────
            Focus moves to close button (accessibility)
            Enrollment modal auto-open check:
              if intent === 'enroll': open modal after 80ms

t = 380ms + ?ms  ──────────────────────────────────────────────────
            Course detail data arrives (SWR)
            Content stagger begins:
              +0ms   Badges
              +40ms  Title
              +80ms  Instructor
              +120ms Metadata
              +160ms Divider
              +200ms Learning outcomes
              +240ms Curriculum
              +280ms Instructor bio
            Sticky footer stagger plays simultaneously

════════════════════════════════════════════════════════════

EVENT: User dismisses (Escape / close / backdrop)

t = 0ms     ─────────────────────────────────────────────────────────
            isDismissing = true
            Content stagger reversed (items fade out)
            Sheet overflow → hidden

t = 0ms     ─────────────────────────────────────────────────────────
            undimCatalog() fires (280ms ease-in)
            FLIP reverse starts (280ms, ease-in)

t = 160ms   ─────────────────────────────────────────────────────────
            Sheet content fully faded
            Close button opacity → 0

t = 280ms   ─────────────────────────────────────────────────────────
            FLIP reverse completes (sheet at card position/size)
            Card opacity restored to 1 (160ms transition)
            closeSheet() fires (sheet removed from DOM)
            URL push back to /courses
            Focus returns to triggering card element

t = 440ms   ─────────────────────────────────────────────────────────
            Card fully restored at opacity 1
            Catalog fully undimmed
            All state reset
            Complete cycle finished
```

---

## 11. Reduced Motion — Complete Override

When `prefers-reduced-motion: reduce` is set, every transform is removed.
The experience degrades gracefully but remains fully functional.

### 11.1 What Changes

| Animation             | Normal                                     | Reduced Motion                            |
| --------------------- | ------------------------------------------ | ----------------------------------------- |
| Card hover scale      | `scale(1.018) translateY(-3px)` · 220ms    | No transform — instant                    |
| Card hover CTA reveal | `opacity 0→1` · `translateY 4px→0` · 160ms | `opacity 0→1` · 120ms only                |
| FLIP card→sheet       | `translate + scale` · 380ms                | Sheet appears instantly at final position |
| Backdrop blur         | `blur(0→10px)` · 280ms                     | `opacity 0→0.4` · 200ms                   |
| Sheet content stagger | `opacity + translateY` · 40ms delay        | `opacity only` · all items 0ms delay      |
| Dismiss FLIP reverse  | `translate + scale` · 280ms                | Sheet disappears instantly                |

### 11.2 Implementation

```typescript
// hooks/use-reduced-motion.ts

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
```

```typescript
// In useFlipAnimation — reduced motion path

const prefersReduced = useReducedMotion();

// Modified play function with reduced motion gate
const play = useCallback(
  (element: HTMLElement, options: FlipPlayOptions = {}): Promise<void> => {
    if (prefersReduced) {
      // Skip transform animation entirely
      // Reset any inverse transform that was applied
      element.style.transform = "";
      element.style.transformOrigin = "";
      element.style.transition = "opacity 120ms ease-out";
      element.style.opacity = "1";
      options.onComplete?.();
      return Promise.resolve();
    }

    // Normal FLIP path
    // ...
  },
  [prefersReduced],
);
```

```css
/* CSS fallback for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .course-card {
    transition: none !important;
  }

  .card-hover-overlay {
    transition: opacity 120ms ease-out !important;
    transform: none !important;
  }

  .hover-cta-details,
  .hover-cta-enroll {
    transition: opacity 100ms ease-out !important;
    transform: none !important;
  }

  [data-catalog-grid] {
    transition: opacity 200ms ease-out !important;
    filter: none !important; /* No blur in reduced motion */
  }
}
```

---

## 12. Common Failure Modes & Fixes

### Failure 1 — FLIP starts from the wrong position

**Symptom:** Sheet appears to fly in from the top-left corner instead of from the card.

**Cause:** `getBoundingClientRect()` was called after a React state update had
already triggered a re-render, which changed the card's position.

**Fix:**

```typescript
// WRONG — state update fires first
setState(...)
const rect = element.getBoundingClientRect()  // Stale position

// CORRECT — rect capture is the absolute first line
const rect = element.getBoundingClientRect()  // Accurate position
setState(...)
```

---

### Failure 2 — Sheet flashes at final size before FLIP plays

**Symptom:** User briefly sees the full-size sheet at the center before it
"snaps" to card size and begins animating.

**Cause:** `applyInverseFromRect` is being called in `useEffect` instead of
`useLayoutEffect`. `useEffect` fires after paint; `useLayoutEffect` fires
before paint.

**Fix:**

```typescript
// WRONG — fires after browser paint
useEffect(() => {
  applyInverseFromRect(sheetRef.current, originRect);
}, []);

// CORRECT — fires before browser paint
useLayoutEffect(() => {
  applyInverseFromRect(sheetRef.current, originRect);
}, []);
```

---

### Failure 3 — Border radius looks wrong during FLIP

**Symptom:** The sheet has a jarring square corner during the scale-down
inverse transform phase.

**Cause:** The sheet has `border-radius: 20px`. When scaled down by ~0.375x
(960px → 360px), the radius appears as `20px / 0.375 = 53px` — far too round.

**Fix:** Compensate the border-radius inversely during the FLIP:

```typescript
// In applyInverseFromRect:
const compensatedRadius = Math.round(16 / scaleX); // Card has 16px radius
element.style.borderRadius = `${compensatedRadius}px`;

// Animate border-radius back to 20px (sheet final radius) during FLIP play:
element.animate(
  [{ borderRadius: `${compensatedRadius}px` }, { borderRadius: "20px" }],
  { duration: 380, easing: "..." },
);
```

---

### Failure 4 — Scrollbars appear during FLIP

**Symptom:** Visible scrollbars flicker during the scale-down inverse
transform.

**Cause:** When the sheet is scaled down to card height (~520px), the browser
evaluates the overflow at the scaled size and shows scrollbars.

**Fix:** Keep `overflow: hidden` during FLIP. Set `overflow: auto` only in
the `onComplete` callback:

```typescript
animation.onfinish = () => {
  element.style.overflow = "auto"; // Only after FLIP is done
  element.style.overflowY = "auto";
};
```

---

### Failure 5 — Grid reflows during FLIP

**Symptom:** FLIP starts correctly but jumps partway through as the grid
re-renders and repositions cards.

**Cause:** The catalog grid is still reactive to layout changes while the
FLIP is running.

**Fix:** Apply `contain: layout` to the grid element synchronously on click,
before any state changes. Release in the FLIP `onComplete` callback.

---

### Failure 6 — View Transition API fires twice

**Symptom:** The thumbnail morphs correctly once, then snaps back.

**Cause:** Two elements have the same `view-transition-name` in the DOM
simultaneously. The API requires uniqueness.

**Fix:** Remove the `view-transition-name` from the card thumbnail
immediately after the transition fires:

```typescript
// After View Transition completes:
cardThumbnail.style.viewTransitionName = "";
// The sheet hero retains its name for the dismiss transition
```

---

### Failure 7 — Focus not returning to card on dismiss

**Symptom:** After dismissing the sheet, keyboard focus lands on `<body>`
instead of the card.

**Cause:** The card element reference was not stored before the sheet opened,
and it is looked up by DOM query on dismiss — but the card may not be focused.

**Fix:** Store a `ref` to the triggering element at click time and restore
focus explicitly in the dismiss handler:

```typescript
const triggeringElementRef = useRef<HTMLElement | null>(null);

// On click:
triggeringElementRef.current = event.currentTarget;

// On dismiss complete:
triggeringElementRef.current?.focus({ preventScroll: true });
triggeringElementRef.current = null;
```

---

## 13. Full Code Implementation

### 13.1 CourseCard — Complete Component

```typescript
// components/courses/course-card.tsx

'use client'

import { useRef, useCallback } from 'react'
import Image from 'next/image'
import { useSurfaceStrategy } from '@/hooks/use-surface-strategy'
import type { CourseCard as CourseCardType } from '@/types/course.types'

interface CourseCardProps extends CourseCardType {
  onDetailsClick: (slug: string, rect: DOMRect) => void
  onEnrollClick: (slug: string, rect: DOMRect) => void
}

export function CourseCard({
  slug,
  title,
  thumbnailUrl,
  instructorName,
  rating,
  enrollmentCount,
  level,
  price,
  isBestseller,
  onDetailsClick,
  onEnrollClick,
}: CourseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const triggeringRef = useRef<HTMLElement | null>(null)

  const captureRect = useCallback((): DOMRect | null => {
    return cardRef.current?.getBoundingClientRect() ?? null
  }, [])

  const handleDetailsClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.metaKey || event.ctrlKey) return

      event.preventDefault()
      event.stopPropagation()

      // STEP 1: Capture rect — must be first
      const rect = captureRect()
      if (!rect) return

      // STEP 2: Store triggering element for focus restoration
      triggeringRef.current = event.currentTarget

      // STEP 3: Dim the card
      if (cardRef.current) {
        cardRef.current.setAttribute('data-active-card', '')
        cardRef.current.style.transition = 'opacity 160ms ease-out'
        cardRef.current.style.opacity = '0.3'
      }

      // STEP 4: Open sheet
      onDetailsClick(slug, rect)
    },
    [slug, captureRect, onDetailsClick]
  )

  const handleEnrollClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.metaKey || event.ctrlKey) return

      event.preventDefault()
      event.stopPropagation()

      const rect = captureRect()
      if (!rect) return

      triggeringRef.current = event.currentTarget

      if (cardRef.current) {
        cardRef.current.setAttribute('data-active-card', '')
        cardRef.current.style.transition = 'opacity 160ms ease-out'
        cardRef.current.style.opacity = '0.3'
      }

      onEnrollClick(slug, rect)
    },
    [slug, captureRect, onEnrollClick]
  )

  return (
    <article
      ref={cardRef}
      data-course-card
      data-slug={slug}
      className="course-card"
      aria-label={`${title} — ${level} level`}
    >
      {/* Thumbnail zone */}
      <div className="card-thumbnail-zone">
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          style={{ objectFit: 'cover' }}
          data-course-thumbnail={slug}
          priority={false}
        />

        {/* Overlay badges — fade out during FLIP */}
        <div className="card-badges">
          {isBestseller && (
            <span className="badge badge-bestseller">Bestseller</span>
          )}
        </div>

        {/* Hover overlay with CTAs */}
        <div
          className="card-hover-overlay"
          role="group"
          aria-label="Course actions"
        >
          <button
            className="hover-cta-details"
            onClick={handleDetailsClick}
            aria-label={`View details for ${title}`}
          >
            Details →
          </button>
          <button
            className="hover-cta-enroll"
            onClick={handleEnrollClick}
            aria-label={`Enroll in ${title}`}
          >
            Enroll Now →
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-instructor">{instructorName}</p>
        {/* ... metadata, pricing, tags, CTA ... */}
      </div>
    </article>
  )
}
```

### 13.2 CourseDetailSheet — Complete Component

```typescript
// components/courses/course-detail-sheet.tsx

'use client'

import {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
} from 'react'
import { useRouter } from 'next/navigation'
import { useFlipAnimation } from '@/hooks/use-flip-animation'
import { useCourseDetail } from '@/hooks/use-course-detail'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { StaggerContainer, StaggerItem } from '@/components/animations'
import type { ClickIntent } from '@/types/animation.types'

interface CourseDetailSheetProps {
  slug: string
  intent: ClickIntent
  originRect: DOMRect
  onClose: () => void
  triggeringElement: HTMLElement | null
}

export function CourseDetailSheet({
  slug,
  intent,
  originRect,
  onClose,
  triggeringElement,
}: CourseDetailSheetProps) {
  const router = useRouter()
  const sheetRef = useRef<HTMLDivElement>(null)
  const { applyInverseFromRect, play, playReverse } = useFlipAnimation()
  const prefersReduced = useReducedMotion()
  const { data: course, isLoading } = useCourseDetail(slug)

  const [flipComplete, setFlipComplete] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)

  // ─────────────────────────────────────────────────────────────────
  // FLIP Enter
  // ─────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!sheetRef.current) return

    const element = sheetRef.current

    if (prefersReduced) {
      // No FLIP — just show the sheet
      setFlipComplete(true)
      element.focus()
      return
    }

    // Apply inverse transform before paint
    applyInverseFromRect(element, originRect)

    // Play on next frame
    requestAnimationFrame(() => {
      play(element, {
        duration: 380,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        onComplete: () => {
          // Unlock scroll
          element.style.overflow = 'auto'
          element.style.overflowY = 'auto'

          // Unlock catalog
          const grid = document.querySelector('[data-catalog-grid]') as HTMLElement
          grid?.style.setProperty('contain', 'auto')
          grid?.style.setProperty('pointer-events', 'auto')

          // Push URL
          router.push(`/courses/${slug}`, { scroll: false })

          // Activate content stagger
          setFlipComplete(true)

          // Move focus to close button
          const closeBtn = element.querySelector('[data-close-button]') as HTMLElement
          closeBtn?.focus()

          // Auto-open enrollment modal if intent=enroll
          if (intent === 'enroll') {
            setTimeout(() => setIsEnrollModalOpen(true), 80)
          }
        },
      })
    })
  }, [])   // Intentionally empty — runs once on mount

  // ─────────────────────────────────────────────────────────────────
  // Backdrop dim
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const grid = document.querySelector('[data-catalog-grid]') as HTMLElement
    grid?.setAttribute('data-dimmed', 'true')

    return () => {
      grid?.removeAttribute('data-dimmed')
    }
  }, [])

  // ─────────────────────────────────────────────────────────────────
  // Dismiss handler
  // ─────────────────────────────────────────────────────────────────
  const handleDismiss = useCallback(async () => {
    if (isDismissing) return
    setIsDismissing(true)

    // Fade content out
    setFlipComplete(false)

    if (sheetRef.current) {
      sheetRef.current.style.overflow = 'hidden'
    }

    // Undim catalog
    const grid = document.querySelector('[data-catalog-grid]') as HTMLElement
    grid?.removeAttribute('data-dimmed')

    // FLIP reverse
    if (sheetRef.current && !prefersReduced) {
      await playReverse(sheetRef.current, originRect, {
        duration: 280,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
      })
    }

    // Restore card
    const activeCard = document.querySelector('[data-active-card]') as HTMLElement
    if (activeCard) {
      activeCard.style.transition = 'opacity 160ms ease-in'
      activeCard.style.opacity = '1'
      activeCard.removeAttribute('data-active-card')
    }

    // Restore focus
    triggeringElement?.focus({ preventScroll: true })

    // Close
    onClose()
    router.push('/courses', { scroll: false })
  }, [isDismissing, prefersReduced, originRect, triggeringElement, onClose, router, playReverse])

  // ─────────────────────────────────────────────────────────────────
  // Escape key
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (isEnrollModalOpen) {
        setIsEnrollModalOpen(false)
        return
      }
      handleDismiss()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isEnrollModalOpen, handleDismiss])

  const staggerActive = flipComplete && !isLoading

  return (
    <>
      {/* Backdrop click target */}
      <div
        aria-hidden="true"
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99,
          cursor: 'default',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Course details: ${course?.title ?? slug}`}
        data-course-sheet
        style={{
          position: 'fixed',
          top: '4vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(960px, 92vw)',
          maxHeight: '92vh',
          overflow: 'hidden',  // set to 'auto' after FLIP
          borderRadius: '20px',
          background: '#ffffff',
          boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.16)',
          zIndex: 100,
          overscrollBehavior: 'contain',
        }}
      >
        {/* Hero image */}
        <div style={{ position: 'relative', aspectRatio: '16/9' }}>
          <img
            src={course?.thumbnailUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            data-course-sheet-hero={slug}
          />

          {/* Close button */}
          <button
            data-close-button
            onClick={handleDismiss}
            aria-label="Close course details"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              opacity: flipComplete ? 1 : 0,
              transition: 'opacity 160ms ease-out',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '32px', paddingBottom: '100px' }}>
          <StaggerContainer isActive={staggerActive} staggerDelay={40}>
            <StaggerItem index={0}>
              {isLoading
                ? <div style={{ height: 32, background: '#f0f0f0', borderRadius: 8, marginBottom: 12 }} />
                : <h2 style={{ fontSize: 28, fontWeight: 700 }}>{course?.title}</h2>
              }
            </StaggerItem>

            <StaggerItem index={1}>
              {isLoading
                ? <div style={{ height: 20, width: '60%', background: '#f0f0f0', borderRadius: 6 }} />
                : <p style={{ color: '#555', fontSize: 15 }}>{course?.instructorName}</p>
              }
            </StaggerItem>

            {/* Additional content sections with StaggerItem index 2-7 */}
          </StaggerContainer>
        </div>

        {/* Sticky footer */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            padding: '16px 32px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            borderTop: '0.5px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: flipComplete ? 1 : 0,
            transform: flipComplete ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 280ms ease-out, transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <div>
            {course?.price
              ? <span style={{ fontSize: 22, fontWeight: 700 }}>EGP {course.price}</span>
              : <span style={{ fontSize: 22, fontWeight: 700, color: '#0891b2' }}>Free</span>
            }
          </div>
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            style={{
              height: 48,
              padding: '0 32px',
              borderRadius: 24,
              border: 'none',
              background: '#0891b2',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Enroll Now →
          </button>
        </div>
      </div>
    </>
  )
}
```

---

## Quick Reference

### The 7 Rules for Apple-Grade FLIP

```
1. getBoundingClientRect() is ALWAYS the first line in the click handler.
   Before preventDefault. Before state updates. Before everything.

2. useLayoutEffect, not useEffect, for applying the inverse transform.
   useEffect fires after paint — the user will see a flash.

3. void element.offsetWidth after applying the inverse transform.
   This forces the browser to process the transform before the animation.

4. Lock the grid with contain:layout synchronously on click.
   Any reflow between rect capture and sheet mount breaks the FLIP.

5. Keep overflow:hidden during FLIP; set to auto in onComplete.
   Scaled-down overflow:auto shows scrollbars at wrong sizes.

6. Compensate border-radius in the inverse transform.
   16px radius at 0.375x scale appears as 42px — animate it back.

7. Store and restore focus explicitly.
   Never rely on the browser to return focus to the right element.
```

---

_End of Document_

**References:**

- [FLIP Technique — Paul Lewis](https://aerotwist.com/blog/flip-your-animations/)
- [View Transition API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Web Animations API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [prefers-reduced-motion — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
