import { create } from "zustand";
import { EnrollmentContext, EnrollmentLifecycle } from "@/lib/enrollment/types";

interface EnrollmentState {
  isModalOpen: boolean;
  isEnrolling: boolean;
  isSuccess: boolean;
  lifecycle: EnrollmentLifecycle;
  context: EnrollmentContext | null;

  openModal: (context?: EnrollmentContext) => void;
  closeModal: () => void;
  setEnrolling: (value: boolean) => void;
  setSuccess: (value: boolean) => void;
  setLifecycle: (lifecycle: EnrollmentLifecycle) => void;
  markPrecheck: (context?: EnrollmentContext) => void;
  markAuthRedirect: () => void;
  setError: () => void;
  reset: () => void;
}

const toFlags = (lifecycle: EnrollmentLifecycle) => ({
  isModalOpen:
    lifecycle === "modal_open" ||
    lifecycle === "processing" ||
    lifecycle === "success" ||
    lifecycle === "error",
  isEnrolling: lifecycle === "processing",
  isSuccess: lifecycle === "success",
});

export const useEnrollmentStore = create<EnrollmentState>((set) => ({
  ...toFlags("idle"),
  lifecycle: "idle",
  context: null,

  openModal: (context) =>
    set((state) => {
      const lifecycle: EnrollmentLifecycle =
        state.lifecycle === "success" ? "success" : "modal_open";

      return {
        ...toFlags(lifecycle),
        lifecycle,
        context: context ?? state.context,
      };
    }),

  closeModal: () =>
    set((state) => ({
      ...toFlags("closed"),
      lifecycle: "closed",
      context: state.context,
    })),

  setEnrolling: (value) =>
    set((state) => {
      const lifecycle: EnrollmentLifecycle = value
        ? "processing"
        : state.isSuccess
          ? "success"
          : "modal_open";

      return {
        ...toFlags(lifecycle),
        lifecycle,
      };
    }),

  setSuccess: (value) =>
    set((state) => {
      const lifecycle: EnrollmentLifecycle = value ? "success" : "modal_open";

      return {
        ...toFlags(lifecycle),
        lifecycle,
        context: state.context,
      };
    }),

  setLifecycle: (lifecycle) =>
    set((state) => ({
      ...toFlags(lifecycle),
      lifecycle,
      context: state.context,
    })),

  markPrecheck: (context) =>
    set((state) => ({
      ...toFlags("precheck"),
      lifecycle: "precheck",
      context: context ?? state.context,
    })),

  markAuthRedirect: () =>
    set((state) => ({
      ...toFlags("auth_redirect"),
      lifecycle: "auth_redirect",
      context: state.context,
    })),

  setError: () =>
    set((state) => ({
      ...toFlags("error"),
      lifecycle: "error",
      context: state.context,
    })),

  reset: () =>
    set({
      ...toFlags("idle"),
      lifecycle: "idle",
      context: null,
    }),
}));
