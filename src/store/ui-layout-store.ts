import { create } from "zustand";

export interface UILayoutState {
  // ── Existing fields (preserved) ──────────────────────────────────────────
  /** ID of the currently expanded interactive widget (e.g. video player) */
  activeLayoutId: string | null;
  /** Controls the Vaul bottom drawer (mobile curriculum) */
  isDrawerOpen: boolean;

  // ── New fields (phase 1 addition) ────────────────────────────────────────
  /** Focus Mode: hides all secondary UI, reveals only video + minimal controls */
  isFocusMode: boolean;
  /** Notes panel slide-in overlay (desktop) / bottom sheet (mobile) */
  isNotesOverlayOpen: boolean;
  /** Resources Vaul bottom sheet */
  isResourcesSheetOpen: boolean;

  // ── Existing actions (preserved) ─────────────────────────────────────────
  setActiveLayoutId: (id: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;

  // ── New actions ───────────────────────────────────────────────────────────
  toggleFocusMode: () => void;
  setFocusMode: (active: boolean) => void;
  setNotesOverlayOpen: (open: boolean) => void;
  setResourcesSheetOpen: (open: boolean) => void;
}

export const useUILayoutStore = create<UILayoutState>((set) => ({
  // ── Initial state ─────────────────────────────────────────────────────────
  activeLayoutId:       null,
  isDrawerOpen:         false,
  isFocusMode:          false,
  isNotesOverlayOpen:   false,
  isResourcesSheetOpen: false,

  // ── Actions ───────────────────────────────────────────────────────────────
  setActiveLayoutId:    (id)     => set({ activeLayoutId: id }),
  setDrawerOpen:        (isOpen) => set({ isDrawerOpen: isOpen }),
  toggleFocusMode:      ()       => set((s) => ({ isFocusMode: !s.isFocusMode })),
  setFocusMode:         (active) => set({ isFocusMode: active }),
  setNotesOverlayOpen:  (open)   => set({ isNotesOverlayOpen: open }),
  setResourcesSheetOpen:(open)   => set({ isResourcesSheetOpen: open }),
}));
