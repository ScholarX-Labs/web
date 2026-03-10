import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface UiState {
  theme: Theme;
  sidebarOpen: boolean;

  // Course search & filter state
  courseSearch: string;
  activeCourseFilters: string[];

  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // Course filter actions
  setCourseSearch: (query: string) => void;
  toggleCourseFilter: (tag: string) => void;
  clearCourseFilters: () => void;
}

/**
 * Global UI store.
 * Manages theme preferences, sidebar visibility, and course filtering state.
 * Auth state is managed by the auth team separately.
 */
export const useUiStore = create<UiState>((set) => ({
  theme: "system",
  sidebarOpen: false,

  courseSearch: "",
  activeCourseFilters: [],

  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),

  setCourseSearch: (query) => set({ courseSearch: query }),
  toggleCourseFilter: (tag) =>
    set((state) => ({
      activeCourseFilters: state.activeCourseFilters.includes(tag)
        ? state.activeCourseFilters.filter((t) => t !== tag)
        : [...state.activeCourseFilters, tag],
    })),
  clearCourseFilters: () => set({ courseSearch: "", activeCourseFilters: [] }),
}));
