export enum Categories {
  Academic = "academic",
  NonAcademic = "non_academic",
}

export enum OpportunityType {
  Bachelor = "bachelor",
  Masters = "masters",
  PhD = "phd",
  Internship = "internship",
  Conference = "conference",
  Workshop = "workshop",
  Volunteering = "volunteering",
  Camp = "camp",
}

export enum Funding {
  FullyFunded = "fully_funded",
  PartiallyFunded = "partially_funded",
}

export const OpportunityTypeColors: Record<OpportunityType, string> = {
  [OpportunityType.Bachelor]: "blue-500",
  [OpportunityType.Masters]: "purple-500",
  [OpportunityType.PhD]: "fuchsia-500",
  [OpportunityType.Internship]: "emerald-500",
  [OpportunityType.Conference]: "amber-500",
  [OpportunityType.Workshop]: "rose-500",
  [OpportunityType.Volunteering]: "cyan-500",
  [OpportunityType.Camp]: "lime-500",
};

export const FundingColors: Record<Funding, string> = {
  [Funding.FullyFunded]: "emerald-500",
  [Funding.PartiallyFunded]: "amber-500",
};

export enum TargetSegment {
  HighSchool = "high_school",
  Undergraduate = "undergraduate",
  Graduate = "graduate",
}

type OpportunitiesQuery = {
  query?: string;
  category?: Categories;
  subtype?: OpportunityType;
  funding?: Funding;
  targetSegment?: TargetSegment;
  page?: number;
  per_page?: number;
  limit?: number;
};

interface SearchRawOpportunity {
  id?: string; // UUID assigned by the extractor (optional, may be absent in raw data)
  title: string;
  description: string;
  application_link: string;

  // Basic info
  eligibility?: string;
  country?: string[]; // Always normalized as array in the JSON provided
  location?: string;
  start_date?: string; // ISO date "YYYY-MM-DD"
  end_date?: string; // ISO date "YYYY-MM-DD"
  duration?: string;

  // Funding / benefits
  fund_type?: string[]; // Array in the JSON provided
  benefits?: string[];
  application_fee?: string | number;
  official_website?: string;

  // Deadlines / numeric criteria
  deadline?: string; // ISO date "YYYY-MM-DD" (pipeline enforces this format)
  gpa?: string | number; // String in some JSON examples
  min_age?: number | string | null;
  max_age?: number | string | null;

  // Type / category
  type?: {
    category?: string;
    subtype?: string[];
  };

  // Target & eligibility
  target_segment?: string[];
  eligible_nationalities?: "all" | string[] | string;

  // Documents & language
  documents_required?: string[]; // e.g., ["cv", "transcript", "motivation letter"]
  language_requirements?: Record<string, string>; // exam -> score or empty string, e.g. { "IELTS": "6.5", "TOEFL": "" }

  // Misc
  is_remote?: boolean;
}

interface Opportunity {
  id?: string;
  title: string;
  description: string;
  applicationLink: string;

  eligibility?: string;
  country?: string[];
  location?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;

  fundType?: Funding[];
  benefits?: string[];
  applicationFee?: string | number;
  officialWebsite?: string;

  deadline?: string;
  gpa?: number;
  minAge?: number | null;
  maxAge?: number | null;

  category?: Categories;
  subtype?: OpportunityType[];

  targetSegment?: TargetSegment[];
  eligibleNationalities?: "all" | string[] | string;

  documentsRequired?: string[];
  languageRequirements?: Record<string, string>;

  isRemote?: boolean;
}

type Pagination = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

type OpportunitiesResponse = {
  opportunities: Opportunity[];
  pagination: Pagination;
};

type SearchRawOpportunitiesResponse = {
  opportunities: { id: string; data: SearchRawOpportunity }[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

export type {
  SearchRawOpportunity,
  Opportunity,
  Pagination,
  OpportunitiesResponse,
  SearchRawOpportunitiesResponse,
  OpportunitiesQuery,
};
