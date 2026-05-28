import { NextResponse } from "next/server";
import { analyticsEventsRouteInputSchema } from "@/lib/executive/analytics/schemas";
import { recordAnalyticsEvent } from "@/lib/executive/record-analytics-event";
import { getExecutiveFlags } from "@/lib/executive/feature-flags";
import { isInternalAdminSurface } from "@/lib/executive/analytics/segmentation";
import { getMappedMetricsForEvent } from "@/lib/executive/analytics/kpi-mapping";

function mapDeviceType(userAgent: string | null): string {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile")) return "mobile";
  if (ua.includes("tablet")) return "tablet";
  return "desktop";
}

export async function POST(request: Request) {
  const flags = getExecutiveFlags();
  if (!flags.ANALYTICS_ENABLED || !flags.ANALYTICS_INTERNAL_MIRROR_ENABLED) {
    return NextResponse.json({ ok: true });
  }

  const json = await request.json().catch(() => null);
  const parsed = analyticsEventsRouteInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const url = new URL(request.url);
  const source = url.searchParams.get("source") ?? "web";
  const medium = url.searchParams.get("medium");
  const campaign = url.searchParams.get("campaign");
  const userAgent = request.headers.get("user-agent");

  const entityId = typeof parsed.data.properties?.cta_id === "string"
    ? parsed.data.properties.cta_id
    : null;
  const path = typeof parsed.data.properties?.path === "string"
    ? parsed.data.properties.path
    : null;
  if (path && isInternalAdminSurface(path)) {
    return NextResponse.json({ ok: true });
  }

  await recordAnalyticsEvent({
    eventType: parsed.data.event,
    source,
    medium,
    campaign,
    deviceType: mapDeviceType(userAgent),
    entityType: parsed.data.event === "cta_click" ? "cta" : "page",
    entityId,
    metadata: {
      ...(parsed.data.properties ?? {}),
      mappedMetricIds: getMappedMetricsForEvent(parsed.data.event),
      mirroredFrom: "api_analytics_events",
    },
  });

  return NextResponse.json({ ok: true });
}
