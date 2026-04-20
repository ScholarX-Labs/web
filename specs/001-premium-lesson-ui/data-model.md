# Data Model: Premium Lesson UI Redesign

Because this feature is strictly frontend presentation, it does not alter Database models. However, it requires a strongly-typed Client State Model managed via Zustand.

## UI State Store (`ui-layout-store.ts`)

```typescript
export interface UILayoutState {
  // The ID of the currently expanded interactive widget (e.g., video player or module card nested deep in the UI)
  activeLayoutId: string | null;
  // Controls the Vaul bottom drawer
  isDrawerOpen: boolean;
  
  // Actions
  setActiveLayoutId: (id: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;
}
```

**State Transitions**:
- `setActiveLayoutId(id)` triggers Framer Motion's `<AnimatePresence>` to mount the fullscreen variant of the component matching that `layoutId`.
- `setDrawerOpen(true)` triggers Vaul, implicitly scaling down the Next.js `<body>` wrapper via the `shouldScaleBackground` mechanic.
