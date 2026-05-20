# Opportunities Page Design System

## Core Aesthetic: Apple-Inspired Minimalist Precision
Focus on high-quality typography, intentional whitespace, and smooth, meaningful motion.

## Color Palette
- **Primary:** #1E40AF (Professional Blue)
- **Accent:** #55AAD4 (ScholarX Sky Blue)
- **Success/Apply:** #22C55E (Vibrant Green)
- **Background:** #F8FAFC (Clean Slate) / #FFFFFF
- **Card Background:** Glassmorphism (bg-white/80 backdrop-blur-md)
- **Text:** #1E293B (Slate 800) for body, #0F172A (Slate 900) for headings.

## Typography
- **Headings:** Outfit (already in project) or Inter. Medium to Bold weights.
- **Body:** Inter. 14px-16px. Normal weight.
- **Micro-copy:** Inter. 12px. Medium weight.

## Motion & Animations (World-Class)
- **Entrance:** Staggered Y-axis fade-in for cards (20px translate, 0.4s duration, ease-out).
- **Hero Reveal:** Text elements slide up with opacity (30px translate, 0.6s duration).
- **Interactive Cards:**
  - Hover: scale: 1.02, shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1).
  - Tap: scale: 0.98.
- **Search Bar:** Focus expands slightly and adds a subtle primary-colored outer glow.
- **Buttons:** Magnetic pull effect on hover (optional/advanced), smooth transition for color fills.

## Component Specs

### Opportunity Card
- **Border Radius:** 20px (xl)
- **Padding:** 24px (p-6)
- **Shadow:** Small default, Medium on hover.
- **Badge Style:** Pill-shaped, semi-transparent background with high-contrast text.

### Search Input
- **Shape:** Full rounded (rounded-full)
- **Height:** 56px
- **Shadow:** Inner shadow on focus or subtle outer glow.

## UX Guidelines
- **Cursor:** Always `cursor-pointer` on interactive elements.
- **Feedback:** Immediate visual feedback on all clicks.
- **Accessibility:** 
  - Respect `prefers-reduced-motion`.
  - Maintain contrast ratios >= 4.5:1.
  - Logical tab order.
