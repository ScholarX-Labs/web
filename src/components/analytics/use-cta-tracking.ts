"use client";

import { useCallback } from "react";
import { ANALYTICS_EVENTS } from "@/lib/executive/analytics/constants";
import { trackClientEvent } from "@/lib/executive/analytics/client";

type CtaPayload = {
  ctaId: string;
  ctaLabel: string;
  ctaPlacement: string;
  destination?: string;
};

export function useCtaTracking() {
  return useCallback((payload: CtaPayload) => {
    void trackClientEvent({
      event: ANALYTICS_EVENTS.CTA_CLICK,
      properties: {
        cta_id: payload.ctaId,
        cta_label: payload.ctaLabel,
        cta_placement: payload.ctaPlacement,
        destination: payload.destination ?? null,
      },
    });
  }, []);
}

