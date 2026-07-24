"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useRef } from "react";
import { useSession } from "@/lib/auth-client";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;
    const url =
      window.origin +
      pathname +
      (searchParams.toString() ? `?${searchParams.toString()}` : "");
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

function PostHogIdentityBridge() {
  const ph = usePostHog();
  const { data: session } = useSession();
  const lastIdentifiedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ph) return;

    const userId =
      typeof session?.user?.id === "string" ? session.user.id : null;

    if (userId) {
      if (lastIdentifiedIdRef.current !== userId) {
        ph.identify(userId, {
          user_state: "authenticated",
        });
        lastIdentifiedIdRef.current = userId;
      }
      return;
    }

    if (lastIdentifiedIdRef.current) {
      ph.reset();
      lastIdentifiedIdRef.current = null;
    }
  }, [ph, session?.user?.id]);

  return null;
}

if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    ?? process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!key) {
    console.warn(
      "posthog.init skipped: missing NEXT_PUBLIC_POSTHOG_KEY/NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
    );
  } else {
    posthog.init(key, {
      api_host: '/ingest',
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST,
      capture_pageview: false,
      capture_pageleave: true,
      enable_recording_console_log: false,
    });
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
        <PostHogIdentityBridge />
      </Suspense>
      {children}
    </PHProvider>
  );
}
