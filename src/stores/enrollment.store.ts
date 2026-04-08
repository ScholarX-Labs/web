import { create } from "zustand";

interface EnrollmentState {
  isModalOpen: boolean;
  isEnrolling: boolean;
  isSuccess: boolean;
  
  openModal: () => void;
  closeModal: () => void;
  setEnrolling: (value: boolean) => void;
  setSuccess: (value: boolean) => void;
  reset: () => void;
}

export const useEnrollmentStore = create<EnrollmentState>((set) => ({
  isModalOpen: false,
  isEnrolling: false,
  isSuccess: false,

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setEnrolling: (value) => set({ isEnrolling: value }),
  setSuccess: (value) => set({ isSuccess: value }),
  reset: () => set({ isModalOpen: false, isEnrolling: false, isSuccess: false }),
}));
