import { create } from "zustand";

export interface UILayoutState {
  // The ID of the currently expanded interactive widget (e.g., video player or module card nested deep in the UI)
  activeLayoutId: string | null;
  // Controls the Vaul bottom drawer
  isDrawerOpen: boolean;

  // Actions
  setActiveLayoutId: (id: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;
}

export const useUILayoutStore = create<UILayoutState>((set) => ({
  activeLayoutId: null,
  isDrawerOpen: false,

  setActiveLayoutId: (id) => set({ activeLayoutId: id }),
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
}));
