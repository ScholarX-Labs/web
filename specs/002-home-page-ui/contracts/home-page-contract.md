# UI Contract: Premium Home Page
**Feature**: `002-home-page-ui` | **Type**: UI Component Contract | **Date**: 2026-04-23

---

## Route Contract

| Route | Page Component | Render Strategy |
|-------|---------------|-----------------|
| `/` | `src/app/page.tsx` | Server Component (metadata server-rendered, section children are Client Components) |

---

## Section Component Contracts

### `<HeroSection />`

```typescript
// No props — fully self-contained, reads from home-data.ts
export function HeroSection(): JSX.Element
```

**Renders**:
- Full-viewport dark frosted panel (`bg-[#0a0f1e]`, `backdrop-blur-[60px]`)
- Ambient glow orbs (3 floating blobs, GSAP y-offset at different parallax rates)
- Badge chip (e.g. "Powered by the Community")
- Headline (multi-line, Framer Motion stagger on mount)
- Subline text (fade-in after headline)
- Dual CTA row: Primary "Get Started" button + Secondary "Explore Courses" ghost link
- Scroll indicator chevron (animated bounce, fades out on scroll)

**Animation contract**:
| Layer | Library | Trigger | Behavior |
|-------|---------|---------|----------|
| Badge, headline, subline, CTAs | Framer Motion `heroEntrance` | Mount | Stagger 80ms each, `springApple` physics |
| Background gradient blob | GSAP ScrollTrigger | Scroll | y: 0 → -120px at parallax factor 0.3 |
| Hero text column | GSAP ScrollTrigger | Scroll | y: 0 → -60px at parallax factor 0.15 |
| Floating orb 1 | GSAP ScrollTrigger | Scroll | y: 0 → -200px at factor 0.5 |
| Floating orb 2 | GSAP ScrollTrigger | Scroll | y: 0 → -80px at factor 0.2 |
| All layers (reduced motion) | — | `prefers-reduced-motion` | GSAP disabled; Framer Motion respects `MotionConfig` |

**Accessibility**:
- `aria-label="ScholarX hero section"` on section element
- Both CTAs are `<Link>` (native anchor, keyboard-navigable)
- Orbs are `aria-hidden="true"`

---

### `<FeaturesSection />`

```typescript
export function FeaturesSection(): JSX.Element
```

**Renders**:
- Section heading + subheading
- Grid of 4–6 `FeatureCard` items (`StaggerContainer` > `StaggerItem`)
- Each card: `Parallax3DWrapper` > `GlassCard` (adapted light surface) > icon + title + description

**Animation contract**:
| Element | Library | Trigger | Behavior |
|---------|---------|---------|----------|
| Section heading | Framer Motion `sectionReveal` | `whileInView`, once | fade + y: 20 → 0 |
| Card grid | `StaggerContainer` | `whileInView`, once | 100ms stagger per card |
| Individual card | `Parallax3DWrapper` | Mouse move | 3D tilt ±7°, glare overlay |
| Card hover | Framer Motion `tapScale` | hover | scale 1.02 |

---

### `<ServicesSection />`

```typescript
export function ServicesSection(): JSX.Element
```

**Renders**:
- Two-panel layout (desktop side-by-side, mobile stacked):
  - Left: "Why Choose ScholarX" — icon list with `ValueProposition` items
  - Right: "Who We Help" — `PersonaCard` grid

**Animation contract**:
| Element | Library | Trigger | Behavior |
|---------|---------|---------|----------|
| Left panel | Framer Motion `fadeSlideUp` | `whileInView`, once | from left (x: -30 → 0) |
| Right panel | Framer Motion `fadeSlideUp` | `whileInView`, once | from right (x: 30 → 0), 150ms delay |
| Each value prop item | `staggerContainer` + `staggerItem` | `whileInView`, once | bottom-up 60ms stagger |

---

### `<ImpactSection />`

```typescript
export function ImpactSection(): JSX.Element
```

**Renders**:
- Section badge + heading
- Row of 4 `ImpactMetric` stat blocks
- Each stat: animated counter number + suffix + label

**Animation contract**:
| Element | Library | Trigger | Behavior |
|---------|---------|---------|----------|
| Section | Framer Motion `sectionReveal` | `whileInView`, once | fade |
| Counter number | Framer Motion `useSpring` | `useInView` (once) | 0 → value over 1.5s, spring |
| Stat cards | `StaggerContainer` | `whileInView`, once | 80ms stagger |

**Reduced motion**: Counter jumps directly to final value (no spring animation).

---

### `<HomeCTASection />`

```typescript
export function HomeCTASection(): JSX.Element
```

**Renders**:
- Dark frosted glass panel matching hero aesthetic
- Headline + subline
- Single primary CTA button → `/auth/signup`

**Animation contract**:
| Element | Library | Trigger | Behavior |
|---------|---------|---------|----------|
| Panel | Framer Motion `sectionReveal` | `whileInView`, once | fade + scale from 0.98 |
| CTA button | `tapScale` | hover/tap | scale micro-interaction |

---

## Page Metadata Contract

```typescript
// src/app/page.tsx
export const metadata: Metadata = {
  title: "ScholarX — Premium Learning Platform",
  description: "Discover world-class courses crafted by industry experts. Join thousands of learners on ScholarX.",
  openGraph: {
    title: "ScholarX — Premium Learning Platform",
    description: "Discover world-class courses crafted by industry experts.",
    type: "website",
  },
};
```

---

## Responsive Layout Contract

| Viewport | Layout behavior |
|----------|----------------|
| Mobile (`< 768px`) | Single column sections, hero 100vh, cards stack vertically |
| Tablet (`768–1024px`) | 2-col feature grid, services panels stacked |
| Desktop (`> 1024px`) | 3-col feature grid, services side-by-side, full parallax |

**No horizontal scrolling** at any breakpoint (SC-004).

---

## Performance Contract

| Metric | Target | Strategy |
|--------|--------|----------|
| Lighthouse Performance (desktop) | ≥ 90 | GSAP dynamic import, image optimization, static rendering |
| Lighthouse Performance (mobile) | ≥ 90 | Reduced parallax layers on mobile, `will-change: transform` on GPU layers |
| Animation frame rate | 60 fps | `transform-gpu` class, GSAP `force3D: true`, no layout-triggering props |
| GSAP bundle load | Non-blocking | `import('gsap')` inside `useEffect` — does not block initial paint |
