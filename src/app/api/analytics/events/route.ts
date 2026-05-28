import { NextResponse } from "next/server";
import { analyticsEventsRouteInputSchema } from "@/lib/executive/analytics/schemas";
import { recordAnalyticsEvent } from "@/lib/executive/record-analytics-event";
import { getExecutiveFlags } from "@/lib/executive/feature-flags";
import { isInternalAdminSurface } from "@/lib/executive/analytics/segmentation";
import { getMappedMetricsForEvent } from "@/lib/executive/analytics/kpi-mapping";

type NormalizeParamOptions = {
  lowercase?: boolean;
  maxLen?: number;
  whitelist?: readonly string[];
  pattern?: RegExp;
};

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const DEFAULT_PATTERN = /^[a-zA-Z0-9._:/-]+$/;

function normalizeAttributionParam(
  value: string | null,
  options: NormalizeParamOptions = {},
): string | null {
  if (!value) return null;

  const maxLen = options.maxLen ?? 128;
  const normalized = value
    .replace(CONTROL_CHARS, "")
    .trim()
    .slice(0, maxLen);

  if (!normalized) return null;

  const candidate = options.lowercase ? normalized.toLowerCase() : normalized;

  if (options.whitelist && !options.whitelist.includes(candidate)) {
    return null;
  }

  const pattern = options.pattern ?? DEFAULT_PATTERN;
  if (!pattern.test(candidate)) {
    return null;
  }

  return candidate;
}

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
  const source = normalizeAttributionParam(url.searchParams.get("source"), {
    lowercase: true,
    maxLen: 128,
    whitelist: ["web", "app", "email", "social", "direct", "referral"],
  }) ?? "web";
  const medium = normalizeAttributionParam(url.searchParams.get("medium"), {
    lowercase: true,
    maxLen: 128,
    whitelist: ["organic", "cpc", "paid", "email", "social", "referral", "direct"],
  });
  const campaign = normalizeAttributionParam(url.searchParams.get("campaign"), {
    maxLen: 128,
  });
  const userAgent = request.headers.get("user-agent");

  const entityId = typeof parsed.data.properties?.cta_id === "string"
    ? normalizeAttributionParam(parsed.data.properties.cta_id, {
      lowercase: true,
      maxLen: 128,
      pattern: /^[a-z0-9._-]+$/,
    })
    : null;
  const path = typeof parsed.data.properties?.path === "string"
    ? normalizeAttributionParam(parsed.data.properties.path, {
      maxLen: 128,
      pattern: /^\/[a-zA-Z0-9/_-]*$/,
    })
    : null;
  if (path && isInternalAdminSurface(path)) {
    return NextResponse.json({ ok: true });
  }

  const normalizedProperties = {
    ...(parsed.data.properties ?? {}),
    ...(entityId ? { cta_id: entityId } : {}),
    ...(path ? { path } : {}),
  };

  await recordAnalyticsEvent({
    eventType: parsed.data.event,
    source,
    medium,
    campaign,
    deviceType: mapDeviceType(userAgent),
    entityType: parsed.data.event === "cta_click" ? "cta" : "page",
    entityId,
    metadata: {
      ...normalizedProperties,
      mappedMetricIds: getMappedMetricsForEvent(parsed.data.event),
      mirroredFrom: "api_analytics_events",
    },
  });

  return NextResponse.json({ ok: true });
}
