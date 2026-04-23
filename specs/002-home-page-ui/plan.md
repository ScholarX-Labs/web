# Implementation Plan: Premium Home Page Redesign

**Branch**: `002-home-page-ui` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-home-page-ui/spec.md`

---

## Summary

Replace the current minimal home page placeholder (`src/app/page.tsx`) with a world-class, Apple-caliber marketing landing page for ScholarX. The implementation uses **Framer Motion** (already installed, v12.35.2) as the primary animation library for entrance animations, stagger reveals, and physics-based micro-interactions, plus **GSAP with ScrollTrigger** (new dependency) exclusively in the Hero section for smooth, non-scroll-jacked parallax depth layers. The design follows a **light-mode primary** system with **selective dark-frosted panels** on the Hero and bottom CTA sections only — matching Apple's HIG convention of light-first with cinematic dark contrasts for dramatic impact zones. All content is fully static via a `home-data.ts` constants file.

---

## Technical Context

**Language/Version**: TypeScript 5.x + React 18, Next.js 14+ (App Router)  
**Primary Dependencies**: Framer Motion v12.35.2 (installed), GSAP free tier (to install), Tailwind CSS v4, shadcn/ui, Lucide React  
**Storage**: N/A — fully static content, no database  
**Testing**: TypeScript compile check (`tsc --noEmit`), ESLint, visual browser verification  
**Target Platform**: Web (Next.js SSR/SSG, deployed via Vercel)  
**Performance Goals**: Lighthouse ≥ 90 desktop + mobile, 60 fps animations  
**Constraints**: No scroll-jacking; GSAP isolated to HeroSection only; all Framer Motion variants centralized in `motion-variants.ts`; no inline variant objects in components  
**Scale/Scope**: 1 page, 5 section components, 1 constants file, ~300–400 LOC total

---

## Constitution Check

*GATE: Must pass before implementation. All items verified against `constitution.md` v1.0.0.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SOLID / Architecture | ✅ PASS | Each section is a single-responsibility component; `home-data.ts` separates data from presentation |
| II. Type Safety | ✅ PASS | All interfaces in `data-model.md` fully typed; no `any`; Lucide icon types enforced |
| III. Testing | ✅ PASS | TypeScript type checking is the primary validation layer; visual + Lighthouse testing per SC-001–004 |
| IV. Premium UX | ✅ PASS | Framer Motion + GSAP hybrid; design-tokens; GlassPanel; Parallax3DWrapper; reduced-motion support |
| V. Performance | ✅ PASS | GSAP dynamic import in `useEffect`; `transform-gpu`; `whileInView once`; static content = zero TTI delay |

**No violations. No complexity tracking required.**

---

## Project Structure

### Documentation (this feature)

```text
specs/002-home-page-ui/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── home-page-contract.md   ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── page.tsx                          [MODIFY] Home page entry (Server Component)
│       └── layout.tsx                    [NO CHANGE] Root layout
├── components/
│   ├── home/                             [NEW DIRECTORY]
│   │   ├── hero-section.tsx              [NEW] Dark frosted hero + GSAP parallax
│   │   ├── features-section.tsx          [NEW] Feature card stagger grid
│   │   ├── services-section.tsx          [NEW] Why/Who panels
│   │   ├── impact-section.tsx            [NEW] Animated counter metrics
│   │   └── home-cta-section.tsx          [NEW] Bottom CTA dark panel
│   ├── animations/                       [NO CHANGE] Reuse existing
│   └── ui/
│       └── glass-panel.tsx               [NO CHANGE] Reuse existing
└── lib/
    ├── home-data.ts                      [NEW] Static content constants
    ├── motion-variants.ts                [MODIFY] Add heroEntrance, sectionReveal, counterNumber variants
    └── design-tokens.ts                  [NO CHANGE]
```

**Structure Decision**: Single Next.js App Router project. All home feature code lives under `src/components/home/` with a single data constants file. No new routes, no new layouts.

---

## Phase 0: Research — COMPLETE ✅

See [`research.md`](./research.md) for full findings. Key resolutions:

| Unknown | Resolution |
|---------|-----------|
| GSAP installed? | No — `npm install gsap` required |
| Auth sign-up route | `/auth/signup` (not `/auth/sign-up` as spec noted) |
| Existing animation assets | `StaggerContainer`, `Parallax3DWrapper`, `GlassPanel`, `motion-variants.ts` — all reusable |
| Design token availability | Complete: radius, zIndex, shadow, vibe all available |
| Hero content source | Static `home-data.ts` constants — no API |

---

## Phase 1: Design & Contracts — COMPLETE ✅

### 1.1 Data Model → [`data-model.md`](./data-model.md)

Five TypeScript interfaces defined:
- `FeatureCard` — 4–6 feature cards (icon, title, description, accentClass)
- `ValueProposition` — "Why Choose" bullet items
- `PersonaCard` — "Who We Help" audience segments (exactly 3)
- `ImpactMetric` — Animated counter (value, suffix, label, colorClass)
- `HomePageData` — Root export shape consumed by all sections

### 1.2 UI Contract → [`contracts/home-page-contract.md`](./contracts/home-page-contract.md)

Defines:
- Route contract (`/` → SSR Server Component shell)
- Component signatures (all sections: no props, self-contained)
- Animation contract per layer (library, trigger, behavior)
- Accessibility requirements per section
- Responsive layout breakpoints
- Performance targets (Lighthouse ≥ 90, 60fps)

### 1.3 Quickstart → [`quickstart.md`](./quickstart.md)

Developer onboarding: setup, key files, conventions, auth route correction.

---

## Proposed Implementation — Section by Section

### Step 1: Install GSAP

```bash
npm install gsap
```

---

### Step 2: `src/lib/home-data.ts` [NEW]

Single export `HOME_DATA: HomePageData` constant. Sections:
- `hero`: badge, headline array, subline, dual CTAs
- `features`: 6 feature cards (ScholarX-relevant: e.g., Expert Instructors, Structured Learning, Community, Certificates, Project-Based, AI Search)
- `services.whyChoose`: 4 value propositions
- `services.whoWeHelp`: 3 personas
- `impact`: 4 metrics (e.g., 12,000+ Learners, 80+ Courses, 50+ Instructors, 15+ Countries)
- `cta`: bottom section content

---

### Step 3: `src/lib/motion-variants.ts` [MODIFY]

Add three new exported variants after existing ones:

```typescript
// Hero entrance — staggers badge → headline → subline → CTAs
export const heroEntrance: Variants = { hidden: {...}, visible: {...} }

// Section reveal — used by all non-hero sections on whileInView
export const sectionReveal: Variants = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: springApple } }

// Services panel — directional slide for left/right panels
export const slideFromLeft: Variants = { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0, transition: springApple } }
export const slideFromRight: Variants = { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0, transition: springApple } }
```

---

### Step 4: `src/components/home/hero-section.tsx` [NEW]

**Architecture**:
- `"use client"` + `useEffect` for GSAP initialization
- `useRef` on hero container, text column, orb elements, bg gradient
- On mount: dynamic `import('gsap')` + `import('gsap/ScrollTrigger')`, register plugin, create timeline with independent parallax rates
- Framer Motion `motion.div` on badge, headline words, subline, CTA row — `heroEntrance` variant, staggered
- `MotionConfig reducedMotion="user"` wraps the whole hero
- Dark frosted surface: `bg-[#0a0f1e]/90 backdrop-blur-[60px]`
- Three ambient glow orbs: `bg-primary/30 blur-3xl rounded-full absolute` — positioned top-left, top-right, bottom-center
- Dual CTA: Next.js `<Link>` — primary filled button + secondary ghost/outline

**GSAP parallax setup**:
```typescript
gsap.to(textRef.current, { y: -60, ease: 'none', scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1 } });
gsap.to(orb1Ref.current, { y: -200, ease: 'none', scrollTrigger: { ... scrub: 1.5 } });
gsap.to(orb2Ref.current, { y: -80, ease: 'none', scrollTrigger: { ... scrub: 0.8 } });
gsap.to(bgGradientRef.current, { y: -120, ease: 'none', scrollTrigger: { ... scrub: 1.2 } });
```

---

### Step 5: `src/components/home/features-section.tsx` [NEW]

- Light surface section (`bg-background`)
- Section heading via `motion.div` + `sectionReveal`, `whileInView once`
- `StaggerContainer` wrapping card grid
- Each `StaggerItem` contains `Parallax3DWrapper` > `GlassCard` (light variant)
- Icon in colored accent circle, bold title, body text
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

---

### Step 6: `src/components/home/services-section.tsx` [NEW]

- Light surface section with subtle gradient background
- Two-column layout on desktop (`lg:grid-cols-2`)
- Left column: "Why Choose ScholarX" — `slideFromLeft` + stagger list items
- Right column: "Who We Help" — `slideFromRight` + `PersonaCard` grid
- `PersonaCard`: light `GlassCard`-inspired surface, icon, label, description

---

### Step 7: `src/components/home/impact-section.tsx` [NEW]

```typescript
// Counter hook pattern:
const count = useMotionValue(0);
const springCount = useSpring(count, { stiffness: 60, damping: 15 });
const rounded = useTransform(springCount, (v) => Math.round(v));
// On inView: count.set(metric.value)
```

- `useInView` hook (Framer Motion) to trigger counter
- 4 stat cards in a row — `StaggerContainer` stagger 80ms
- Large number in brand accent color + suffix + label
- Light section with subtle radial gradient backdrop

---

### Step 8: `src/components/home/home-cta-section.tsx` [NEW]

- Mirrors hero aesthetic: dark frosted panel `bg-[#0a0f1e]/85 backdrop-blur-[40px]`
- Centered headline + subline
- Single "Get Started" CTA → `/auth/signup`
- Ambient glow orb centered behind panel
- `sectionReveal` + `scale: 0.98 → 1` entrance

---

### Step 9: `src/app/page.tsx` [MODIFY]

```typescript
import { MotionConfig } from 'framer-motion';
// Section imports via next/dynamic for HeroSection (ssr: false for GSAP)
import dynamic from 'next/dynamic';
const HeroSection = dynamic(() => import('@/components/home/hero-section'), { ssr: false });
import { FeaturesSection } from '@/components/home/features-section';
// ... etc

export const metadata: Metadata = { title: '...', description: '...' };

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <main>
        <HeroSection />
        <FeaturesSection />
        <ServicesSection />
        <ImpactSection />
        <HomeCTASection />
      </main>
    </MotionConfig>
  );
}
```

---

## Constitution Check (Post-Design Re-evaluation)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. SOLID | ✅ PASS | 5 focused components, 1 data file, no cross-cutting concerns |
| II. Type Safety | ✅ PASS | All entities fully typed, GSAP imports dynamically (avoids SSR typing issues) |
| III. Testing | ✅ PASS | TypeScript build + Lighthouse CI |
| IV. Premium UX | ✅ PASS | GSAP parallax + Framer stagger + 3D tilt + reduced-motion compliance |
| V. Performance | ✅ PASS | `next/dynamic` for HeroSection, static page render, `will-change: transform` on parallax layers |

**No violations.**

---

## Verification Plan

### Automated Tests
- `npx tsc --noEmit` — zero TypeScript errors
- `npx next build` — clean production build, no warnings
- ESLint: `npx eslint src/components/home/ src/lib/home-data.ts`

### Visual Verification (Browser)
1. Load `http://localhost:3000` — verify hero renders with dark frosted panel
2. Scroll down slowly — verify parallax depth layers (text, orbs, background) move at different rates without scroll-jacking
3. Scroll through Features — verify `StaggerContainer` stagger fires once per session, 3D tilt on hover
4. Scroll through Services — verify left/right directional slide entrances
5. Scroll through Impact — verify counters animate from 0 to final values on first view
6. Click "Get Started" — verify navigation to `/auth/signup`
7. Click "Explore Courses" — verify navigation to `/courses`
8. Resize to 375px (mobile) — verify no horizontal scroll, single-column layout
9. Open DevTools > Rendering > Emulate CSS `prefers-reduced-motion: reduce` — verify all animations disabled / instant

### Performance
- Run Lighthouse in Chrome DevTools on `/` — target ≥ 90 performance score
- Check Chrome DevTools Performance tab — verify 60fps during scroll
