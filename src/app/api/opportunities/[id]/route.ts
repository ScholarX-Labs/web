import { NextRequest, NextResponse } from "next/server";
import { getOpportunityById } from "@/lib/ai-search/api";

const normalizeLang = (lang?: string): "en" | "ar" =>
  lang === "ar" ? "ar" : "en";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    },
  });
}
