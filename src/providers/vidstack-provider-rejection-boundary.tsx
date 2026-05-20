"use client";

import { useEffect } from "react";

const getErrorMessage = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (typeof value !== "object" || value === null) return null;

  const message = (value as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
};

const isVidstackProviderDestroyedRejection = (reason: unknown): boolean => {
  return getErrorMessage(reason) === "provider destroyed";
};

export function VidstackProviderRejectionBoundary() {
  useEffect(() => {
    const suppressEvent = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isVidstackProviderDestroyedRejection(event.reason)) return;

      suppressEvent(event);
    };

    const handleError = (event: ErrorEvent) => {
      if (
        getErrorMessage(event.error) !== "provider destroyed" &&
        event.message !== "provider destroyed"
      ) {
        return;
      }

      suppressEvent(event);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
