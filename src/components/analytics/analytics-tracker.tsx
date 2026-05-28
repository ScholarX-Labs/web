"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ANALYTICS_EVENTS } from "@/lib/executive/analytics/constants";
import { trackClientEvent } from "@/lib/executive/analytics/client";

const MAX_QUERY_LENGTH = 512;
const MAX_REFERRER_LENGTH = 256;

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const current = `${pathname}?${query}`;
    if (current === lastTrackedRef.current) return;
    lastTrackedRef.current = current;

    // Keep payload compact to reduce tracking overhead and avoid high-cardinality query/referrer bloat.
    const compactQuery = query ? query.slice(0, MAX_QUERY_LENGTH) : null;
    const referrer = typeof document !== "undefined" ? document.referrer || null : null;
    const compactReferrer = referrer ? referrer.slice(0, MAX_REFERRER_LENGTH) : null;

    void trackClientEvent({
      event: ANALYTICS_EVENTS.WEBSITE_VISIT,
      properties: {
        path: pathname,
        query: compactQuery,
        referrer: compactReferrer,
      },
    });
  }, [pathname, searchParams]);

  return null;
}
