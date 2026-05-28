import { NextRequest, NextResponse } from "next/server";
import { searchScholarships } from "@/lib/ai-search/api";
import { checkPublicOpportunitySearchLimit } from "@/lib/rate-limiter";
import { getClientIpFromHeaders } from "@/lib/request-ip";
import { trackServerEvent } from "@/lib/executive/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/executive/analytics/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json(
      { error: "Missing search query" },
      { status: 400 },
    );
  }

  if (query.length > 100) {
    return NextResponse.json(
      { error: "Search query is too long" },
      { status: 400 },
    );
  }

  const clientIp = getClientIpFromHeaders(request.headers);
  if (!clientIp) {
    return NextResponse.json(
      { error: "Unable to identify request origin" },
      { status: 400 },
    );
  }

  const rateLimit = await checkPublicOpportunitySearchLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many search requests" },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(
            1,
            Math.ceil((rateLimit.reset - Date.now()) / 1000),
          ).toString(),
        },
      },
    );
  }

  const results = await searchScholarships(query);
  const resultCount = Array.isArray(results) ? results.length : 0;
  await trackServerEvent({
    event: ANALYTICS_EVENTS.AI_SEARCH,
    properties: {
      query_intent_category: query ? "general" : "empty",
      resultCount,
      zeroResults: resultCount === 0,
      latencyMs: Date.now() - startedAt,
      status: "ok",
      source: "opportunities_search_api",
    },
  });
  return NextResponse.json(results, {
    status: 200,
    headers: {
      "Cache-Control":
        "public, max-age=60, s-maxage=300, stale-while-revalidate=1800, stale-if-error=1800",
    },
  });
}
