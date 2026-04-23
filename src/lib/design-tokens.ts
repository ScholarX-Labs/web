/**
 * ScholarX Design Tokens
 *
 * Single source of truth for all visual design decisions.
 * Consumed by UI components via inline `style` props for dynamic values,
 * and by Tailwind's `theme.extend` for static utility generation.
 *
 * Usage:
 *   import { zIndex, radius, shadow, duration } from '@/lib/design-tokens';
 *   <div style={{ zIndex: zIndex.overlay, borderRadius: radius.card }} />
 */

// ─── Z-Index Elevation Layers ───────────────────────────────────────────────
// Strict layering: base → content → sidebar → overlay → modal → toast
// No component should use a z-index value outside this system.

export const zIndex = {
  base:    0,   // Background meshes, decorative elements
  content: 10,  // Video player, main content area
  sidebar: 20,  // Curriculum sidebar (desktop floating panel)
  overlay: 40,  // Notes panel, resources sheet, focus mode controls
  modal:   50,  // Dialogs, fullscreen overlays, sticky header
  toast:   60,  // Toast notifications, resume prompt banner
} as const;

export type ZIndexKey = keyof typeof zIndex;

// ─── Corner Radius Hierarchy ──────────────────────────────────────────────────
// video (largest) → card → button → pill (smallest)
// Enforces Apple-style visual depth: primary containers feel "bigger".

export const radius = {
  video:  '1.5rem',  // 24px — VideoPlayer outer container
  card:   '1rem',    // 16px — GlassCard, FloatingPanel, sidebar
  button: '0.75rem', // 12px — Buttons, icon controls, tabs
  pill:   '9999px',  // Badges, progress tracks, active indicators
} as const;

export type RadiusKey = keyof typeof radius;

// ─── Shadow System ────────────────────────────────────────────────────────────
// All shadows are soft and diffuse — no sharp drop shadows (Apple principle).
// Named by semantic meaning, not visual appearance.

export const shadow = {
  // Multi-layered "Atmospheric" shadows for Apple-style depth
  ambient:  '0 0 100px -30px rgba(59,130,246,0.35), 0 0 40px -15px rgba(59,130,246,0.2)',
  elevated: '0 30px 90px -15px rgba(0,0,0,0.7), 0 10px 30px -5px rgba(0,0,0,0.4)',
  floating: '0 8px 30px -5px rgba(0,0,0,0.2), 0 2px 10px -2px rgba(0,0,0,0.1)',
  inner:    'inset 0 1px 0 0 rgba(255,255,255,0.08)',
} as const;

export type ShadowKey = keyof typeof shadow;

// ─── Vibe: Ambient Glow Tokens ──────────────────────────────────────────────
// Purpose-built for Ambilight and background halos.
export const vibe = {
  primary: 'rgba(59, 130, 246, 0.4)', // Vibrant Blue
  accent:  'rgba(139, 92, 246, 0.3)', // Soft Violet
  surface: 'rgba(255, 255, 255, 0.03)',
} as const;

// ─── Duration Budget ──────────────────────────────────────────────────────────
// Millisecond values for animation timing.
// Use `duration.normal` as the default; reserve `duration.slow` for complex
// layout transitions like Focus Mode.

export const duration = {
  instant: 50,   // ms — Immediate feedback (button press glow)
  fast:    150,  // ms — Tab switches, badge transitions
  normal:  250,  // ms — Lesson-to-lesson transitions, panel opens
  slow:    400,  // ms — Focus Mode collapse/expand
} as const;

export type DurationKey = keyof typeof duration;
