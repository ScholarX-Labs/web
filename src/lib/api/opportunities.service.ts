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
  data: SearchRawOpportunity;
}): Opportunity => {
  const { data } = raw;

  return {
    id: raw.id,
    title: data.title,
    description: data.description,
    applicationLink: data.application_link,
    eligibility: data.eligibility,
    country: data.country,
    location: data.location,
    startDate: data.start_date,
    endDate: data.end_date,
    duration: data.duration,
    // Safely extract and cast to Enum array
    fundType: (data.fund_type || []) as Funding[],
    benefits: data.benefits,
    applicationFee: data.application_fee,
    officialWebsite: data.official_website,
    deadline: data.deadline,
    // Conversions
    gpa: data.gpa ? Number(data.gpa) : undefined,
    minAge:
      data.min_age !== null && data.min_age !== undefined
        ? Number(data.min_age)
        : null,
    maxAge:
      data.max_age !== null && data.max_age !== undefined
        ? Number(data.max_age)
        : null,
    category: data.type?.category as Categories,
    subtype: data.type?.subtype as OpportunityType[],
    targetSegment: data.target_segment as TargetSegment[],
    eligibleNationalities: data.eligible_nationalities,
    documentsRequired: data.documents_required,
    languageRequirements: data.language_requirements,
    isRemote: data.is_remote,
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
    return {
      opportunities: response.data.opportunities.map((item) =>
        mapOpportunity({ id: item.id, data: item.data }),
      ),
      pagination: {
        page: response.data.pagination.page,
        perPage: response.data.pagination.per_page,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.total_pages,
      },
    };
  },
};
