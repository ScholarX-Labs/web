# Data Model: Premium Home Page Redesign
**Branch**: `002-home-page-ui` | **Phase**: 1 — Design | **Date**: 2026-04-23

---

## Overview

The home page is a **fully static, presentation-only** feature. There is no database schema, no API data-fetching, and no state persistence. This document defines the **TypeScript data shapes** that populate each section via `src/lib/home-data.ts`.

---

## Entities

### 1. `FeatureCard`

Represents a single item in the Features section grid.

```typescript
interface FeatureCard {
  /** Unique identifier for React key */
  id: string;
  /** Icon name from lucide-react or inline SVG component */
  icon: React.ComponentType<{ className?: string }>;
  /** Short card title (≤ 5 words) */
  title: string;
  /** One-sentence description (≤ 20 words) */
  description: string;
  /** Optional: accent color class for icon container (Tailwind) */
  accentClass?: string;
}
```

**Constraints**:
- 4–6 cards. Grid renders 2-col mobile, 3-col desktop.
- `icon` must be a Lucide React component (already in dependency tree).

---

### 2. `ValueProposition`

Represents a "Why Choose ScholarX" bullet in the Services section.

```typescript
interface ValueProposition {
  id: string;
  /** Lucide icon */
  icon: React.ComponentType<{ className?: string }>;
  /** Bold short heading */
  heading: string;
  /** Supporting sentence */
  body: string;
}
```

**Constraints**: 3–4 items. Staggered list layout.

---

### 3. `PersonaCard`

Represents a target audience segment in the "Who We Help" subsection.

```typescript
interface PersonaCard {
  id: string;
  /** Emoji or Lucide icon */
  icon: React.ComponentType<{ className?: string }> | string;
  /** Persona label */
  label: string;
  /** 1–2 sentence description */
  description: string;
}
```

**Constraints**: Exactly 3 personas. Horizontal card row on desktop, vertical stack on mobile.

---

### 4. `ImpactMetric`

A single animated counter stat in the Impact section.

```typescript
interface ImpactMetric {
  id: string;
  /** Final numeric value the counter animates to */
  value: number;
  /** Suffix rendered after the number (e.g. "+", "K+", "%") */
  suffix: string;
  /** Stat label below the number */
  label: string;
  /** Optional color class for the number text */
  colorClass?: string;
}
```

**Constraints**: Exactly 4 metrics. Counter springs from 0 → value when section enters viewport (triggered once). Animation uses Framer Motion `useSpring` + `useMotionValue`.

---

### 5. `HomePageData` (Root Export)

The single exported constant from `home-data.ts`, consumed by each section component.

```typescript
interface HomePageData {
  hero: {
    badge: string;               // e.g. "Now in Beta"
    headline: string[];          // Split array — each string is an animated word/line
    subline: string;
    primaryCTA: { label: string; href: string };
    secondaryCTA: { label: string; href: string };
  };
  features: FeatureCard[];
  services: {
    whyChoose: ValueProposition[];
    whoWeHelp: PersonaCard[];
  };
  impact: ImpactMetric[];
  cta: {
    headline: string;
    subline: string;
    buttonLabel: string;
    buttonHref: string;
  };
}
```

---

## State Transitions

All state is **UI-only** (no persistence):

| State | Owner | Trigger | Transition |
|-------|-------|---------|------------|
| Hero layer y-offset | GSAP ScrollTrigger | Scroll position | text layer, orb layer, bg gradient move at independent rates |
| Hero entrance | Framer Motion `heroEntrance` variant | Component mount | Stagger: badge → headline → subline → CTAs |
| Feature card hover | Framer Motion + Parallax3DWrapper | Mouse enter/leave | 3D tilt + glare overlay |
| Impact counter | Framer Motion `useSpring` | `whileInView` enters viewport | 0 → value spring (once) |
| Section reveal | Framer Motion `sectionReveal` variant | `whileInView` | fade + translateY (once) |

---

## Data Volume

- `home-data.ts` file: ~80–120 LOC (constants only, no logic)
- Zero runtime data fetching
- Zero `Suspense` boundaries
- Zero loading/error states required

---

## Validation Rules

- All `id` fields: non-empty string, unique within their array
- `hero.headline`: 1–4 strings (each renders on its own line / animates independently)
- `impact[].value`: positive integer > 0
- `impact[].suffix`: string, max 3 chars
- CTA `href` values: `/auth/signup` and `/courses` — validated at build time via TypeScript
