import { NextRequest, NextResponse } from "next/server";
import { searchScholarships } from "@/lib/ai-search/api";
import { checkPublicOpportunitySearchLimit } from "@/lib/rate-limiter";
import { getClientIpFromHeaders } from "@/lib/request-ip";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  const rateLimit = await checkPublicOpportunitySearchLimit(
    getClientIpFromHeaders(request.headers),
  );
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
  return NextResponse.json(results, {
    status: 200,
    headers: {
      "Cache-Control":
        "public, max-age=60, s-maxage=300, stale-while-revalidate=1800, stale-if-error=1800",
    },
  });
}
