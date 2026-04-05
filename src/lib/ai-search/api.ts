import { SearchResult, RawSearchResponse, RawSearchResult } from "./types";

const SEARCH_API_URL = "https://scholarx-search-api.vercel.app/api/search";
const LIMIT_PER_REQUEST = 20;

function normalizeResult(raw: RawSearchResult): SearchResult | null {
  const opp = raw.opportunity;

  // Use nested opportunity or flat fields
  const title = opp?.title ?? raw.title;
  if (!title) return null;

  const description = opp?.description ?? raw.description ?? "";

  // Score: either from raw.score (0-1) or raw.match_percentage (0-100) or raw.similarity
  const rawScore = raw.score ?? raw.match_percentage ?? raw.similarity;
  const match_percentage =
    rawScore != null
      ? rawScore <= 1
        ? Math.round(rawScore * 100)
        : Math.round(rawScore)
      : undefined;

  // Category from type.category or type.subtype, formatted for UI
  const rawCategory =
    opp?.type?.category ??
    (opp?.type?.subtype && opp.type.subtype.length > 0
      ? opp.type.subtype[0]
      : undefined);

  const category = rawCategory
    ? rawCategory.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : undefined;

  // Tags from fund_type or subtype
  const tags = opp?.fund_type?.map((f) =>
    f.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  );

  // Funding level: derive from fund_type, fall back to benefit keywords
  let fundingLevel: string | undefined;
  if (opp?.fund_type && opp.fund_type.length > 0) {
    const ft = opp.fund_type[0].toLowerCase();
    if (ft.includes("full")) fundingLevel = "Fully Funded";
    else if (ft.includes("partial")) fundingLevel = "Partially Funded";
    else
      fundingLevel = opp.fund_type[0]
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
  } else if (opp?.benefits && opp.benefits.length > 0) {
    const joined = opp.benefits.join(" ").toLowerCase();
    if (
      joined.includes("fully funded") ||
      joined.includes("full scholarship")
    ) {
      fundingLevel = "Fully Funded";
    } else if (joined.includes("partial")) {
      fundingLevel = "Partially Funded";
    }
  }

  // Funding: first benefit text for detail view
  const funding =
    opp?.benefits && opp.benefits.length > 0 ? opp.benefits[0] : undefined;

  // Location
  const location = opp?.country?.join(", ");

  // URL
  const url = opp?.application_link ?? opp?.official_website;

  return {
    id: raw.id ?? opp?.id,
    title,
    description,
    match_percentage,
    category,
    tags,
    funding,
    fundingLevel,
    deadline: opp?.deadline ?? undefined,
    location,
    url,
    eligibility: opp?.eligibility,
    benefits: opp?.benefits,
  };
}

export async function searchScholarships(
  query: string,
): Promise<SearchResult[]> {
  const response = await fetch(SEARCH_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit: LIMIT_PER_REQUEST }),
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  const data: RawSearchResponse | RawSearchResult[] = await response.json();

  let rawResults: RawSearchResult[] = [];

  if (Array.isArray(data)) {
    rawResults = data;
  } else {
    rawResults =
      data.results ??
      data.data ??
      data.matches ??
      data.opportunities ??
      data.items ??
      [];
  }

  return rawResults
    .map(normalizeResult)
    .filter((r): r is SearchResult => r !== null);
}
