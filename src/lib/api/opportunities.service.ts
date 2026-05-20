import { apiClient } from "@/lib/api/client";
import {
  OpportunitiesQuery,
  OpportunitiesResponse,
  Opportunity,
  SearchRawOpportunity,
  SearchRawOpportunitiesResponse,
  Funding,
  Categories,
  OpportunityType,
  TargetSegment,
} from "../opportunities/types";

const OPPORTUNITIES_API_URL =
  "https://scholarx-search-api.vercel.app/api/opportunities";

const DEFAULT_QUERY: OpportunitiesQuery = {
  page: 1,
  per_page: 12,
};

export const mapOpportunity = (raw: {
  id: string;
  data: Partial<SearchRawOpportunity>;
}): Opportunity => {
  const { data } = raw;
  const type: NonNullable<SearchRawOpportunity["type"]> = data.type ?? {};

  return {
    id: raw.id,
    title: data.title ?? "Untitled opportunity",
    description: data.description ?? "",
    applicationLink: data.application_link ?? "",
    eligibility: data.eligibility ?? "",
    country: Array.isArray(data.country) ? data.country : [],
    location: data.location ?? "",
    startDate: data.start_date ?? "",
    endDate: data.end_date ?? "",
    duration: data.duration ?? "",
    // Safely extract and cast to Enum array
    fundType: (Array.isArray(data.fund_type) ? data.fund_type : []) as Funding[],
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
    applicationFee: data.application_fee ?? "",
    officialWebsite: data.official_website ?? "",
    deadline: data.deadline ?? "",
    // Conversions
    gpa:
      data.gpa !== null && data.gpa !== undefined
        ? Number(data.gpa)
        : undefined,
    minAge:
      data.min_age !== null && data.min_age !== undefined
        ? Number(data.min_age)
        : null,
    maxAge:
      data.max_age !== null && data.max_age !== undefined
        ? Number(data.max_age)
        : null,
    category: type.category as Categories,
    subtype: (Array.isArray(type.subtype) ? type.subtype : []) as OpportunityType[],
    targetSegment: (Array.isArray(data.target_segment)
      ? data.target_segment
      : []) as TargetSegment[],
    eligibleNationalities: Array.isArray(data.eligible_nationalities)
      ? data.eligible_nationalities
      : [],
    documentsRequired: Array.isArray(data.documents_required)
      ? data.documents_required
      : [],
    languageRequirements:
      typeof data.language_requirements === "object" &&
      data.language_requirements !== null &&
      !Array.isArray(data.language_requirements)
        ? data.language_requirements
        : {},
    isRemote: Boolean(data.is_remote),
  };
};

export const opportunitiesService = {
  getOpportunities: async (
    query: OpportunitiesQuery = DEFAULT_QUERY,
  ): Promise<OpportunitiesResponse> => {
    const mergedQuery = { ...DEFAULT_QUERY, ...query };
    const { query: q, ...rest } = mergedQuery;
    const response = await apiClient.get<SearchRawOpportunitiesResponse>(
      OPPORTUNITIES_API_URL,
      {
        params: { q, ...rest },
      },
    );
    const opportunities = Array.isArray(response.data?.opportunities)
      ? response.data.opportunities
      : [];
    const pagination = response.data?.pagination;

    if (!Array.isArray(response.data?.opportunities)) {
      console.error("[opportunitiesService] Expected opportunities array", {
        payload: response.data,
      });
    }

    return {
      opportunities: opportunities.map((item) =>
        mapOpportunity({ id: item.id, data: item.data ?? {} }),
      ),
      pagination: {
        page: pagination?.page ?? mergedQuery.page ?? 1,
        perPage: pagination?.per_page ?? mergedQuery.per_page ?? 12,
        total: pagination?.total ?? opportunities.length,
        totalPages: pagination?.total_pages ?? 1,
      },
    };
  },
};
