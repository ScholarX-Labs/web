import { NextRequest, NextResponse } from "next/server";
import { getOpportunityById } from "@/lib/ai-search/api";
import { checkPublicOpportunityDetailLimit } from "@/lib/rate-limiter";
import { getClientIpFromHeaders } from "@/lib/request-ip";

const normalizeLang = (lang?: string): "en" | "ar" =>
  lang === "ar" ? "ar" : "en";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const clientIp = getClientIpFromHeaders(request.headers);
  if (!clientIp) {
    return NextResponse.json(
      { error: "Unable to identify request origin" },
      { status: 400 },
    );
  }

  const rateLimit = await checkPublicOpportunityDetailLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
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

  const { id } = await params;
  const lang = normalizeLang(
    request.nextUrl.searchParams.get("lang") ?? undefined,
  );

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid opportunity_id" },
      { status: 400 },
    );
  }

  const opportunity = await getOpportunityById(id, lang);

  if (!opportunity) {
    return NextResponse.json(
      { error: "Opportunity not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(opportunity, {
    status: 200,
    headers: {
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400",
      "X-RateLimit-Remaining": String(rateLimit.remaining),
    },
  });
}
