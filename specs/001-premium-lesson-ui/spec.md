# Feature Specification: World-Class Premium Lesson UI

**Feature Branch**: `001-premium-lesson-ui`  
**Created**: 2026-04-20  
**Updated**: 2026-04-20  
**Status**: Enriched  
**Input**: User description: "Deep Dive: How to Elevate to World-Class (Apple-Level) — 3-Layer Layout Architecture, Visual Hierarchy + Attention Engineering, Motion System, Design System Components, Smart Learning UX, Apple-Level Aesthetic Details, Performance = UX, Interaction Philosophy"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Fluid Lesson Transitions & Spatial Layout (Priority: P1)

When a learner navigates between lessons or expands UI elements, the page must feel like a living space — components physically flow and transform rather than snap or reload. The layout is organized into three distinct visual depth layers: the primary video player as the focal anchor, contextual panels (sidebar/notes) at mid depth, and transient overlays (modals, tooltips, quick actions) at the highest layer.

**Why this priority**: Spatial intelligence and fluid motion are the single biggest differentiator between a generic web app and a world-class experience. This is the emotional foundation of the entire interface.

**Independent Test**: Can be fully tested by switching between lessons and expanding UI elements, verifying smooth animated transitions where content flows naturally without jarring cuts or layout shifts.

**Acceptance Scenarios**:

1. **Given** a learner is watching a lesson, **When** they click the next lesson in the sidebar, **Then** the video and metadata area transitions with a directional animation, suggesting forward movement, within 250ms.
2. **Given** the lesson page is loaded, **When** any UI element is expanded (e.g., notes, resources), **Then** it animates into view as a layered panel rather than replacing the current content.
3. **Given** a collapsed sidebar, **When** the learner activates it, **Then** it floats in as a panel above the content rather than pushing the layout.

---

### User Story 2 — Dominant Video Focus with Progressive Disclosure (Priority: P1)

The video player must command 70–80% of the learner's visual attention at all times. Secondary interface elements (notes, resources, progress details) must exist on demand — never competing with the primary content. The interface reveals complexity only when the learner asks for it.

**Why this priority**: Attention engineering is critical for learning retention. A distraction-free primary zone reduces cognitive load and increases time-on-task.

**Independent Test**: Can be verified by observing the page cold — a first-time visitor's eye should land exclusively on the video player within one second, with no competing visual elements drawing attention away.

**Acceptance Scenarios**:

1. **Given** a learner is actively watching a video, **When** no interaction occurs for 3 seconds, **Then** all secondary UI elements (header controls, sidebar labels) dim to reduced opacity without hiding.
2. **Given** a learner has not interacted with the Notes panel, **When** viewing the lesson, **Then** the Notes panel is not visible; it only appears on explicit interaction.
3. **Given** a learner wants to view supplementary resources, **When** they trigger the resource section, **Then** it slides in from the bottom as a sheet rather than navigating to a new page.

---

### User Story 3 — Physics-Based Motion System (Priority: P1)

Every state change in the interface must be communicated through intentional animation. Lesson transitions slide, panels spring, buttons pulse, and toggled states morph. Motion is not decoration — it explains what is happening and where content is coming from or going to.

**Why this priority**: This is where the platform achieves "premium" feel. Without motion, even beautiful static designs feel flat. Motion builds trust and communicates responsiveness.

**Independent Test**: Can be verified by cataloging every interactive element and confirming each one provides immediate visual feedback on hover, click, open, and close states.

**Acceptance Scenarios**:

1. **Given** a learner clicks any button, **When** pressed, **Then** a subtle scale-down occurs (approximately 3%) and reverses on release, providing tactile feedback.
2. **Given** a panel is sliding in (e.g., Notes panel), **When** it enters, **Then** it uses a spring-physics curve — overshooting slightly before settling — rather than a linear fade.
3. **Given** a lesson is active in the sidebar curriculum list, **When** displayed, **Then** the active item has a distinct animated left-edge indicator and background highlight distinguishing it from inactive items.
4. **Given** the Notes panel is closed, **When** triggered to open, **Then** it slides in from the right with a blur-backed glass aesthetic and settles into place within 300ms.

---

### User Story 4 — Glassmorphic Design Language & Aesthetic System (Priority: P2)

Every persistent surface — navigation bars, sidebars, overlay panels, cards — must employ a unified glassmorphism aesthetic: blurred translucent backgrounds, soft border highlights, and layered shadow depth. The interface feels like frosted glass over rich media content.

**Why this priority**: Visual coherence and premium aesthetics directly impact perceived quality and brand trust. Consistency across all surfaces makes it feel intentionally crafted.

**Independent Test**: Can be verified by scrolling content behind persistent UI surfaces and confirming the content is correctly blurred/filtered through the glass effect on every surface.

**Acceptance Scenarios**:

1. **Given** the lesson page is loaded, **When** content scrolls beneath the header or sidebar, **Then** the surface correctly blurs the scrolling content through its background.
2. **Given** rounded corners are applied to components, **When** inspected visually, **Then** video player uses the largest radius, cards are smaller, and buttons are smallest — forming a clear rounding hierarchy.
3. **Given** shadows are present, **When** rendered, **Then** all shadows are soft and diffuse (not sharp or heavy), creating depth without visual noise.

---

### User Story 5 — Smart Progress Tracking & Intelligent Resume (Priority: P2)

The platform tracks not just how much of a video was watched, but where the learner struggled — marked by pauses, rewinds, and drop-off points. When a learner returns, the platform resumes from the most meaningful point and communicates what they did previously.

**Why this priority**: This elevates the product from a video host to a personalized learning engine. It directly increases completion rates and reduces learner frustration.

**Independent Test**: Can be tested by watching a lesson partway, pausing multiple times mid-video, leaving, then returning — and verifying the platform proposes a specific, intelligent resume point with a contextual message.

**Acceptance Scenarios**:

1. **Given** a learner watched 40% of a lesson and paused repeatedly at one segment, **When** they return, **Then** the player offers a smart resume point at the most-replayed segment with a contextual prompt (e.g., "You paused here 3 times").
2. **Given** a learner is watching, **When** the video timeline is visible, **Then** it shows a heatmap overlay indicating high-engagement segments in the current session.
3. **Given** a lesson is partially complete, **When** the learner views the curriculum sidebar, **Then** an accurate visual indicator shows the percentage watched and highlights the recommended restart point.

---

### User Story 6 — Focus Mode for Distraction-Free Learning (Priority: P2)

Learners who want maximum concentration can activate a Focus Mode that collapses all secondary UI — sidebar, header, metadata — leaving only the video player and minimal playback controls. This mode can be triggered manually or activates automatically in fullscreen.

**Why this priority**: Deep focus correlates with learning outcomes. Providing a deliberate focus environment positions ScholarX as a serious learning platform.

**Independent Test**: Can be verified by triggering Focus Mode and confirming all non-video elements are hidden, and then exiting to confirm they are cleanly restored.

**Acceptance Scenarios**:

1. **Given** a learner is on the lesson page, **When** they activate Focus Mode, **Then** all sidebar, header, and metadata areas animate out within 200ms, leaving only the video and essential controls.
2. **Given** Focus Mode is active, **When** the learner moves the cursor, **Then** minimal playback controls appear as a translucent overlay and auto-hide after 2 seconds of inactivity.
3. **Given** a learner enters fullscreen view, **When** the fullscreen event fires, **Then** Focus Mode is automatically engaged without requiring manual activation.

---

### User Story 7 — Reusable Design System Primitives (Priority: P3)

Every UI pattern used in the lesson experience — glass cards, floating panels, animated buttons, progress indicators, contextual tooltips — must be built as standalone, reusable components from a shared design system. All spacing, color, elevation, and motion values must come from explicit design tokens.

**Why this priority**: Without systemization, the UI becomes inconsistent at scale. A token-based system allows global changes (e.g., accent color, corner radius) to propagate instantly across the entire interface.

**Independent Test**: Can be verified by locating all visual primitives used in the lesson page and confirming each references a shared component rather than one-off inline styles.

**Acceptance Scenarios**:

1. **Given** the design system is in place, **When** the accent color token is changed, **Then** all interactive highlights, active indicators, and focus rings update uniformly across the entire lesson page.
2. **Given** a GlassCard primitive exists, **When** used anywhere in the lesson page, **Then** it renders consistently with the correct blur, border, shadow, and border-radius defined by the token system.
3. **Given** elevation tokens are defined, **When** UI layers are rendered, **Then** base, content, sidebar, overlay, modal, and toast layers each have a visually distinct depth level.

---

### Edge Cases

- What happens when a learner uses browser back-navigation during an active UI animation? The animation must be cancelled immediately and the final destination state must render without visual artifacts.
- How does the system behave when the OS has "Reduce Motion" accessibility enabled? All complex spatial animations must be replaced with simple opacity crossfades that respect the user's motion preferences.
- What happens when a browser does not support backdrop blur (CSS `backdrop-filter`)? The glass surfaces must gracefully fall back to a solid, theme-appropriate opaque background color without breaking layout.
- What happens when the lesson video fails to load? A graceful error state must render within the video zone, preserving all surrounding UI chrome without collapse.
- How does the Focus Mode restore state if the lesson page is refreshed in fullscreen? The page must return to standard layout on reload without persisting the collapsed UI state.
- What happens when the learner's progress tracking data is unavailable (e.g., offline or API error)? The player must still function and simply omit the heatmap/resume prompt without any error UI.

## Requirements *(mandatory)*

### Functional Requirements

**Layout & Depth**
- **FR-001**: System MUST organize the lesson page into three distinct visual layers: base content (video), contextual panels (sidebar, notes), and transient overlays (modals, tooltips), each with clear visual separation.
- **FR-002**: System MUST render the sidebar as a floating overlay panel rather than a layout-shifting column when activated on any viewport.
- **FR-003**: System MUST render the Notes panel as a slide-in overlay that does not displace the video player or surrounding content.
- **FR-004**: System MUST render supplementary resources as a bottom sheet overlay rather than a page navigation event.

**Visual Hierarchy & Attention**
- **FR-005**: System MUST allocate the video player a dominant visual weight of 70–80% of the viewport at all times.
- **FR-006**: System MUST dim secondary UI elements when the learner is in an active, uninterrupted viewing state.
- **FR-007**: System MUST implement a four-level typographic scale (title, section header, body, metadata) with consistent contrast ratios between levels.

**Motion System**
- **FR-008**: System MUST animate all lesson-to-lesson navigation transitions with a directional enter/exit animation that communicates forward or backward movement.
- **FR-009**: System MUST apply spring-physics-based entry animations to all overlay panels (notes, resources, sidebar).
- **FR-010**: System MUST provide tactile press feedback (scale reduction on press, scale restoration on release) for every interactive button and control.
- **FR-011**: System MUST animate the state indicator for the active lesson in the sidebar curriculum list (left border highlight, background glow).
- **FR-012**: System MUST respect the OS "prefers-reduced-motion" accessibility setting by replacing complex animations with simple crossfades.

**Glassmorphic Aesthetics**
- **FR-013**: System MUST apply a blurred translucent background to all persistent surface overlays (header, sidebar, panels).
- **FR-014**: System MUST apply a rounded corner hierarchy across component types: video player (largest), cards (medium), buttons (smallest).
- **FR-015**: System MUST use soft, diffuse shadows (not sharp drop shadows) on all elevated components.
- **FR-016**: System MUST use a single accent color across all interactive highlights, active states, and focus indicators.

**Smart Progress & Learning Intelligence**
- **FR-017**: System MUST record and persist the learner's last watched position per lesson.
- **FR-018**: System MUST detect repeated pause/rewind events and identify high-engagement segments within a lesson.
- **FR-019**: System MUST display a visual heatmap overlay on the video progress timeline indicating engagement density.
- **FR-020**: System MUST present an intelligent resume prompt when a learner returns to a partially-watched lesson, indicating the suggested resume point.
- **FR-021**: System MUST display per-lesson progress indicators in the curriculum sidebar showing percentage watched.

**Focus Mode**
- **FR-022**: System MUST provide a manually toggleable Focus Mode that hides all non-video UI elements with an animated transition.
- **FR-023**: System MUST auto-activate Focus Mode when the learner enters fullscreen video playback.
- **FR-024**: System MUST display auto-hiding minimal controls in Focus Mode that appear on cursor movement and hide after 2 seconds of inactivity.
- **FR-025**: System MUST restore all previously visible UI elements when Focus Mode is deactivated.

**Design System & Tokens**
- **FR-026**: System MUST define and use explicit elevation tokens (z-index levels) for each UI layer: base, content, sidebar, overlay, modal, and toast.
- **FR-027**: System MUST define and use explicit spacing, color, corner-radius, and shadow tokens consistently across all lesson UI components.
- **FR-028**: System MUST expose reusable GlassCard, FloatingPanel, AnimatedButton, ProgressRing, and ContextTooltip primitive components usable across the lesson page.

**Performance**
- **FR-029**: System MUST lazy-load curriculum sidebar content that is not visible in the current scroll viewport.
- **FR-030**: System MUST debounce all progress tracking updates to avoid excessive data persistence calls during active playback.

### Key Entities

- **Lesson**: The primary content unit containing a video, metadata, curriculum position, and associated progress records.
- **Progress Record**: A per-learner, per-lesson data structure tracking total watch time, last position, pause events, and high-engagement segment markers.
- **UI Layer**: A conceptual depth zone in the interface (base, context, transient) that governs visual stacking, shadow, and blur behavior.
- **Design Token**: A named, reusable design value (color, spacing, radius, z-index) shared across all visual components.
- **Focus Session**: An active period in which the learner has engaged Focus Mode, suppressing all secondary UI elements.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All animated transitions between lessons complete within 250ms, maintaining 60 frames per second on median consumer hardware, with no frame drops detectable by the human eye.
- **SC-002**: A first-time visitor's initial eye-fixation lands on the video player within 1 second of page load, verified by usability testing with at least 5 participants.
- **SC-003**: 100% of interactive elements (buttons, toggles, panels) provide visual feedback within 16ms of user interaction, creating perception of instant response.
- **SC-004**: The Notes and Resources panels open and close within 300ms using spring-physics curves, rated as "smooth" by 90% of testers in qualitative review.
- **SC-005**: Focus Mode activates and fully conceals secondary UI within 200ms of trigger, with zero layout shift during the transition.
- **SC-006**: Learners who return to a partially-watched lesson are presented with an intelligent resume prompt within 1 second of the player becoming ready.
- **SC-007**: Visual implementation introduces no new Cumulative Layout Shift — the CLS score on the lesson page remains zero after all UI changes.
- **SC-008**: The lesson page achieves a Lighthouse Performance score of 85 or above on desktop and 75 or above on mobile after all changes are applied.
- **SC-009**: 90% of users in qualitative testing rate the overall interface as "premium," "polished," or "feels like a native app" on first interaction.
- **SC-010**: Changing any design token (accent color, corner radius, shadow depth) propagates visually to 100% of lesson UI components without requiring individual component changes.

## Assumptions

- The redesign is exclusively a frontend / presentation-layer enhancement; no backend API data contracts are introduced or modified beyond progress record persistence endpoints that already exist.
- Learners are primarily on modern browsers (Chrome 90+, Safari 15+, Firefox 90+, Edge 90+) capable of CSS backdrop-filter and hardware-accelerated animation.
- Both desktop (mouse/keyboard) and mobile/tablet (touch) interaction models must be supported equally in all motion and interaction behaviors.
- The existing authentication and course enrollment system remains unchanged; this spec governs only the in-lesson UI experience.
- The design system tokens introduced here will serve as the foundation for future ScholarX platform pages and must be architected with reuse in mind from day one.
- Smart progress tracking features depend on a persistence mechanism (database or local storage fallback) being available; the UI degrades gracefully if this is unavailable.
- A single accent color will be chosen from the existing ScholarX brand palette; this spec does not define which specific color, only that exactly one must be used across all interactive states.
