# Quickstart: Premium Home Page (`002-home-page-ui`)

## Prerequisites

```bash
# Install GSAP (only new dependency)
npm install gsap
```

Framer Motion v12.35.2 is already installed.

## Running the Dev Server

```bash
npm run dev
# Navigate to http://localhost:3000
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Home page entry (Server Component) |
| `src/lib/home-data.ts` | All static content constants |
| `src/components/home/hero-section.tsx` | GSAP parallax hero |
| `src/components/home/features-section.tsx` | Feature card grid |
| `src/components/home/services-section.tsx` | Why/Who sections |
| `src/components/home/impact-section.tsx` | Animated counters |
| `src/components/home/home-cta-section.tsx` | Bottom CTA panel |
| `src/lib/motion-variants.ts` | Centralized Framer Motion variants |
| `src/lib/design-tokens.ts` | Design tokens (z-index, radius, shadow) |
| `src/components/ui/glass-panel.tsx` | GlassPanel, GlassCard, FloatingPanel |
| `src/components/animations/stagger.tsx` | StaggerContainer, StaggerItem |
| `src/components/animations/parallax-3d-card.tsx` | Parallax3DWrapper |

## Adding New Motion Variants

All new Framer Motion variants MUST be added to `src/lib/motion-variants.ts` — never defined inline in components. GSAP configuration lives exclusively in `hero-section.tsx`.

## Reduced Motion

Framer Motion: Wrap page sections in `<MotionConfig reducedMotion="user">` in `page.tsx`.
GSAP: Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before registering ScrollTrigger.

## Auth Route

Sign-up CTA links to `/auth/signup` (NOT `/auth/sign-up`).
