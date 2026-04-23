# Research: Premium Home Page Redesign
**Branch**: `002-home-page-ui` | **Phase**: 0 — Research | **Date**: 2026-04-23

---

## 1. Animation Library — Framer Motion

**Decision**: Use Framer Motion v12.35.2 as the primary animation library (already installed).

**Rationale**: Already deeply integrated — centralized variant system at `src/lib/motion-variants.ts`, reusable components at `src/components/animations/`. Constitution mandates that all variant objects import from `motion-variants.ts`; no inline variant objects in component files.

**Existing assets to reuse**:
- `motion-variants.ts`: `fadeSlideUp`, `staggerContainer`, `springApple`, `tapScale`, `scaleFade`, `dockVariants`
- `components/animations/stagger.tsx`: `StaggerContainer`, `StaggerItem`
- `components/animations/parallax-3d-card.tsx`: `Parallax3DWrapper` (hover tilt + glare)
- `components/animations/shiny-text.tsx`: Animated sheen text
- `components/animations/spotlight-card.tsx`: Spotlight cursor effect
- `components/ui/glass-panel.tsx`: `GlassPanel`, `GlassCard`, `FloatingPanel`

**New variants needed** (to add to `motion-variants.ts`):
- `heroEntrance` — Staggered entrance for hero headline, subline, CTAs (load-triggered, once)
- `counterNumber` — useSpring-driven number morph for Impact metrics
- `sectionReveal` — Fade + slight upward shift for full sections (whileInView, once)

---

## 2. Animation Library — GSAP + ScrollTrigger

**Decision**: Install GSAP (free tier) for hero parallax scroll-through.

**Rationale**: GSAP's ScrollTrigger plugin is the industry standard for smooth, GPU-accelerated scroll-linked animations. Framer Motion's `useScroll`/`useTransform` is viable but GSAP outperforms it for multi-layer parallax at 60fps.

**Installation**: `npm install gsap` (free tier includes ScrollTrigger)

**Usage scope**: EXCLUSIVELY in `HeroSection` component. No other component will import GSAP. This isolation keeps the dependency surface minimal and bundle-split friendly.

**Pattern**: Dynamic import (`import gsap from 'gsap'` + `import { ScrollTrigger } from 'gsap/ScrollTrigger'`) inside `useEffect` to prevent SSR errors. Hero registers on mount, kills on unmount.

**Alternatives considered**:
- Framer Motion `useScroll` + `useTransform`: Viable but less performant for 3+ independent parallax layers at high scroll velocity.
- CSS `animation-timeline: scroll()`: Browser support ~80% (2026), lacks Safari parity — rejected.

---

## 3. Auth Route — Sign-Up URL Correction

**Decision**: Hero "Get Started" CTA navigates to `/auth/signup` (not `/auth/sign-up` as noted in spec).

**Rationale**: The actual Next.js route is `src/app/auth/signup/` — confirmed by directory listing. The spec had a minor typo. All CTAs will use the correct route.

**Note**: The spec's FR-008 will be implemented as: "Get Started" → `/auth/signup`.

---

## 4. Existing Design System

**Decision**: Full reuse of existing token and component system — no parallel style definitions.

**Tokens** (`src/lib/design-tokens.ts`):
- `zIndex`: base(0), content(10), sidebar(20), overlay(40), modal(50), toast(60)
- `radius`: video(24px), card(16px), button(12px), pill(9999px)
- `shadow`: ambient, elevated, floating, inner
- `vibe`: primary(blue), accent(violet), surface

**CSS Variables** (`:root` in `globals.css`):
- `--color-hero-blue: #3399cc` — ScholarX brand blue
- `--color-hero-orange: #ff6a3a` — Accent/warm CTA color
- `--color-hero-heading: #1a2b49` — Deep navy for headings
- `--color-hero-body: #4a5568` — Body text gray
- `--primary`: oklch(0.61 0.11 222) — Tailwind primary
- `--font-sans`: Inter (loaded in layout)

**Surface strategy for light-mode-primary + dark-frosted-hero**:
- Hero: `bg-[#0a0f1e]` + `backdrop-blur` dark panel (reuse `FloatingPanel` pattern)
- Non-hero sections: `bg-background` (white) with `border` + `shadow.floating`
- Feature cards: `GlassCard` adapted for light surface (light glass tint)

---

## 5. Content Architecture

**Decision**: All content in `src/lib/home-data.ts` — zero API calls.

**Section content map**:
| Section | Content |
|---------|---------|
| Hero | Headline, subline, badge text, CTA labels + routes |
| Features | 4–6 feature cards (icon, title, description) |
| Services — "Why Choose ScholarX" | 3–4 value proposition points |
| Services — "Who We Help" | 3 personas (learners, instructors, partners) |
| Impact | 4 metrics (learners, courses, instructors, countries) |
| CTA Block | Headline, subline, CTA button |

---

## 6. Component Architecture

**Decision**: Server Component page shell (`page.tsx`) imports Client Component sections.

**Rationale**: Each section is a `"use client"` component (needs Framer Motion / GSAP / event handlers). The page itself can be a Server Component to keep SEO metadata server-rendered.

**Folder**: `src/components/home/`

| File | Role |
|------|------|
| `hero-section.tsx` | GSAP parallax + Framer entrance + dark frosted panel |
| `features-section.tsx` | Stagger card grid + Parallax3DWrapper per card |
| `services-section.tsx` | "Why Choose" + "Who We Help" with AnimatePresence tabs |
| `impact-section.tsx` | `useSpring` counter animation + whileInView trigger |
| `home-cta-section.tsx` | Bottom dark-frosted CTA panel |

---

## 7. Performance & Bundle Considerations

**GSAP bundle impact**: gsap core (~30KB gzip) — acceptable given Lighthouse 90+ target.
**Mitigation**: Hero section component uses `next/dynamic` with `ssr: false` to prevent hydration mismatch and allow tree-shaking. GSAP ScrollTrigger only loads when HeroSection mounts in browser.

**Framer Motion tree-shaking**: v12+ auto-tree-shakes unused features. Only import specific hooks (`useScroll`, `useSpring`, `useTransform`, `motion`, `AnimatePresence`).

**`will-change: transform`**: Applied to animated layers in hero (CSS class `transform-gpu`) — prevents layout repaints during scroll.

**`prefers-reduced-motion`**: MotionConfig wrapper with `reducedMotion="user"` at page level. GSAP checks `window.matchMedia('(prefers-reduced-motion: reduce)')` in `useEffect`.

---

## 8. Accessibility

**Contrast**: All light-mode sections use `--color-hero-heading` (#1a2b49) on white — exceeds WCAG AA (contrast ratio ~13:1). Dark hero uses white text on `#0a0f1e` — ~16:1.

**Focus management**: All CTA buttons use native `<button>` / Next.js `<Link>` for keyboard tab order. No custom focus traps.

**Motion**: `MotionConfig reducedMotion="user"` at `page.tsx` level covers all Framer Motion children. GSAP check in `HeroSection` `useEffect`.

---

*All NEEDS CLARIFICATION resolved. Proceed to Phase 1.*
