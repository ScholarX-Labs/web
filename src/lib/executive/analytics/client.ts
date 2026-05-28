"use client";

import posthog from "posthog-js";
import { sanitizeAnalyticsProperties } from "./privacy";
import type { AnalyticsEventInput } from "./types";
import { shouldMirrorEvent } from "./mirror-routing";
import { dispatchFailOpen } from "./dispatcher";

export async function trackClientEvent(input: AnalyticsEventInput): Promise<void> {
  const properties = sanitizeAnalyticsProperties(input.properties);

  await dispatchFailOpen(async () => {
    // PostHog is initialized centrally in provider/instrumentation files.
    if ((posthog as { __loaded?: boolean }).__loaded) {
      posthog.capture(input.event, properties);
    }
  }, "posthog_capture");

  if (shouldMirrorEvent(input.event)) {
    await dispatchFailOpen(async () => {
      await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: input.event, properties }),
        keepalive: true,
      });
    }, "internal_mirror_fetch");
  }
}
