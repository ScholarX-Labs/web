# Course Detail And Enrollment UX Strategy

## ScholarX V2 · Sprint 2 Motion System Pass

## Executive Summary

This plan defines a production-grade implementation for the course detail and
enrollment journey with a focus on motion quality, intent clarity, and
conversion reliability.

The strategy is intentionally progressive:

- Keep route navigation predictable and resilient
- Add premium in-page motion choreography
- Differentiate user intent with URL-driven state
- Preserve accessibility, type safety, and performance at every layer

## Problem Statement

Current journey quality is below product ambition in three areas:

- Interaction intent is not explicit between exploratory and committed clicks
- Motion quality lacks continuity and hierarchy on the detail surface
- Enrollment confirmation does not yet feel ceremonial and stateful

## Product Principles

### Progressive Disclosure

Reveal information in a clear hierarchy:

- Hero and trust signals
- Learning outcomes
- Curriculum depth
- Instructor authority
- Enrollment decision

### Intent Differentiation

Support both user paths on one route:

- Details path for evaluation
- Enroll path for immediate commitment

### Spatial Continuity

A card click should feel like an expansion into detail context, not a hard
context reset.

### Zero Dead Ends

All states must have designed outcomes:

- Unauthenticated
- Already enrolled
- Free course
- Paid course
- Error and retry

## Sprint 2 Scope

- View transition bridge as progressive enhancement
- In-page stagger choreography for hero and content sections
- Sticky CTA tuning with threshold-driven reveal and smooth exit
- Intent-aware auto-open behavior for enrollment entry
- Reduced-motion and fallback behavior

## Sprint 2 Non-Goals

- Cross-route animation as a hard dependency
- Payment architecture redesign
- Reworking backend domain contracts
- Full visual redesign outside the course detail and enrollment touchpoints

## Architecture And Design Model

### Route Model

- Canonical route: /courses/[slug]
- Intentful route variant: /courses/[slug]?intent=enroll

### State Model

- URL state owns entry intent
- Global enrollment store owns modal open and flow state
- Server-derived subscription state owns primary CTA branch

### Rendering Model

- Server component handles data hydration and personalization
- Client components handle motion orchestration and interaction logic
- Animation utilities are shared, typed, and isolated from business rules

### Progressive Enhancement Model

- If view transition support is available, use shared transition naming
- If unavailable, render standard navigation with no behavior degradation
- Motion is additive, never required for completion

## SOLID Alignment

### Single Responsibility

- Each visual section component owns one UI concern
- Motion wrappers own animation concerns only
- Enrollment modal owns enrollment interaction shell only

### Open Closed

- Motion primitives support extension through variants and props
- Enrollment flow supports free, paid, and application branches without
  rewriting core modal shell

### Liskov Substitution

- Polymorphic animated wrappers preserve semantic element behavior and typing

### Interface Segregation

- Keep component props minimal and purpose-specific
- Avoid oversized shared prop contracts across unrelated sections

### Dependency Inversion

- UI components depend on typed service contracts and state selectors
- Avoid hard coupling between animation internals and API implementations

## Design Patterns

- Strategy pattern for enrollment flow branch selection:
  free, paid-direct, paid-with-form
- Adapter pattern for transition support fallback behavior
- Composition pattern for stagger container and stagger item primitives
- Container and Presentational split for data orchestration versus visual output

## Functional Requirements

### FR-1 Intent Aware Entry

- Details click navigates to /courses/[slug]
- Enroll click navigates to /courses/[slug]?intent=enroll
- Enroll intent auto-opens enrollment modal after page settle
- Auto-open must not block initial content paint

### FR-2 Hero Motion System

- Hero image and metadata reveal with subtle staggered timing
- No layout shifts during reveal
- Respect reduced-motion preference

### FR-3 Content Section Choreography

- Learning outcomes, curriculum, and instructor sections use shared stagger
  primitives
- Timing remains consistent across breakpoints
- Sections remain readable without motion

### FR-4 Sticky CTA Behavior

- Sticky CTA appears after primary CTA leaves viewport threshold
- Entry and exit use transform-based animation
- No flashing, jumping, or duplicate call-to-action confusion

### FR-5 Enrollment Modal Experience

- Modal opens from explicit user intent or URL intent state
- Free flow supports one-click enrollment with optimistic feedback
- Success state transitions to a confirmation ceremony
- Existing enrollment state maps primary CTA to Resume Learning

### FR-6 Accessibility And Input Safety

- Full keyboard support for modal and CTA paths
- Focus management is deterministic on open and close
- Motion reduced when user preference indicates reduced motion

## Performance Requirements

- Animate transform and opacity where possible
- Avoid scroll handlers that trigger excessive re-renders
- Keep motion configuration memoizable and reusable
- Preserve fast initial render and interaction readiness

## Type Safety Requirements

- No untyped motion contract surfaces
- Enrollment and course models remain strictly typed end to end
- Avoid any except for constrained third-party boundaries with documented reason

## Component Ownership Plan

- app/(platform)/courses/[slug]/page.tsx:
  server data composition and intent read
- app/(platform)/courses/[slug]/\_components/course-hero.tsx:
  visual hero, trust metadata, top-level CTA
- app/(platform)/courses/[slug]/\_components/course-sticky-cta.tsx:
  scroll threshold CTA behavior
- app/(platform)/courses/[slug]/\_components/course-curriculum.tsx:
  staged reveal of learning and module blocks
- components/courses/enroll-modal.tsx:
  enrollment decision surface
- components/courses/enrollment-success.tsx:
  confirmation ceremony surface
- components/animations/\*:
  reusable motion tokens and primitives
- stores/enrollment.store.ts:
  UI state orchestration for enrollment interactions

## Delivery Phases

### Phase 1 Foundation

- Confirm route intent contract
- Confirm typed flow states and modal control boundaries
- Validate reduced-motion support strategy

### Phase 2 Motion Primitives

- Finalize shared stagger and transition utilities
- Standardize timing and easing tokens
- Add smoke coverage for no-motion fallback behavior

### Phase 3 Detail Surface Choreography

- Apply hero and content section choreography
- Tune sticky CTA thresholds and transitions
- Verify mobile and desktop interaction parity

### Phase 4 Enrollment Ceremony

- Polish success sequence and state handoff
- Ensure Resume Learning swap after enrollment
- Validate refresh and cache invalidation behavior

### Phase 5 Hardening

- TypeScript, lint, and interaction QA passes
- Accessibility pass with keyboard and reduced-motion checks
- Regression pass on listing-to-detail-to-enroll journey

## Acceptance Criteria

- Intent entry is deterministic and URL-driven
- Enrollment intent reliably opens modal without blocking initial render
- In-page motion is cohesive, lightweight, and reduced-motion aware
- Sticky CTA behavior is smooth and threshold accurate
- No route change depends on unsupported transition APIs
- Enrollment success state updates CTA and user direction reliably
- Build passes with clean typing and no obvious performance regressions

## Validation Matrix

### Functional

- Details click path renders detail page without modal auto-open
- Enroll click path renders detail page with modal auto-open
- Already enrolled users land on Resume Learning CTA path

### Accessibility

- Modal focus trap and escape behavior verified
- Reduced-motion preference disables non-essential animations

### Performance

- No visual jank while scrolling sticky CTA threshold
- No animation-induced content shift in hero and sections

### Reliability

- Enrollment success refreshes dependent surfaces consistently
- Error states provide actionable retry and fallback guidance

## Risk Register And Mitigation

- Risk: Animation complexity causes regressions
  Mitigation: Keep primitives centralized and coverage focused
- Risk: Intent auto-open feels abrupt
  Mitigation: Delay open until initial page settle with bounded timing
- Risk: Browser transition support inconsistency
  Mitigation: Keep standard navigation as baseline behavior

## Decisions Required

- Paid course checkout architecture: inline versus external redirect
- Application form semantics for requiresForm:
  approval workflow versus pre-payment intake
- Success ceremony depth:
  lightweight animation only versus richer celebratory effects

## Prioritized Implementation Backlog (P0 To P3)

This backlog consolidates the motion polish suggestions into an execution order
that protects spatial continuity first, then adds delight safely.

### P0 Critical (Must Ship First)

- Preserve true FLIP origin behavior per clicked card:
  use measured `getBoundingClientRect()` as the only start point so left,
  center, and right cards naturally expand from different physical origins.
- Add deterministic focus restoration on dismiss:
  store the triggering card element on open and return focus to it after reverse
  FLIP completes.
- Keep layout lock and unlock sequencing strict:
  apply `contain: layout` and interaction lock synchronously on click, release
  only after entry animation completes.
- Enforce reduced-motion parity for all newly added effects:
  remove non-essential transforms and stagger delays when reduced motion is
  enabled.

### P1 High Impact (Primary UX Upgrade)

- Implement thumbnail shared-element transition fallback:
  when View Transition API is unavailable, animate a cloned thumbnail from card
  to sheet hero and back on dismiss.
- Add hover CTA overlay on card thumbnail:
  reveal Details and Enroll CTAs with blur scrim and micro-stagger on hover and
  keyboard focus.
- Introduce sheet interior stagger orchestration after FLIP completion:
  sequence badges, title, metadata, and content sections only after container
  expansion finishes.

### P2 Visual Depth (Premium Feel)

- Add catalog sibling recession on hover:
  when one card is active, subtly de-emphasize non-hovered cards to improve
  focus and visual hierarchy.
- Add category-driven ambient lighting accents:
  vary spotlight/glow treatment by course category while preserving contrast and
  readability.
- Tune backdrop dim and blur timing:
  ensure catalog recedes without fighting sheet motion or causing jank.

### P3 Optional Delight (Post-Hardening)

- Add first-load ripple entrance for course grid:
  stagger cards by index/row for a controlled cascade on desktop.
- Add per-card micro-personality tokens:
  allow small, bounded differences (timing offset, hover intensity) without
  altering FLIP geometry or motion semantics.
- Add instrumentation for motion quality checks:
  track frame stability and interaction latency during card-to-sheet flows.

### Suggested Systematic Rollout

1. Complete P0 and run accessibility + reduced-motion QA.
2. Implement P1 and verify no regressions in FLIP entry/dismiss paths.
3. Layer P2 enhancements and profile animation smoothness.
4. Ship P3 only after hardening and cross-browser validation.

## Definition Of Done

- All Sprint 2 acceptance criteria are met
- UX polish is consistent across major breakpoints
- No critical accessibility regression
- No critical type or build issues
- Product and engineering sign-off completed for course detail and enrollment
  motion quality
