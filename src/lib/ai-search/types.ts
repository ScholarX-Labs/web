// Raw API types
export interface RawOpportunity {
  id?: string;
  title: string;
  description?: string;
  country?: string[];
  benefits?: string[];
  deadline?: string;
  duration?: string;
  fund_type?: string[];
  eligibility?: string;
  target_segment?: string[];
  application_link?: string;
  official_website?: string;
  eligible_nationalities?: string;
  language_requirements?: Record<string, string>;
  type?: {
    subtype?: string[];
    category?: string;
  };
}

export interface RawSearchResult {
  id?: string;
  score?: number;
  opportunity?: RawOpportunity;
  // Flat fields as fallback
  title?: string;
  description?: string;
  match_percentage?: number;
  similarity?: number;
}

export interface RawSearchResponse {
  results?: RawSearchResult[];
  data?: RawSearchResult[];
  matches?: RawSearchResult[];
  opportunities?: RawSearchResult[];
  items?: RawSearchResult[];
  total?: number;
  parsed_query?: string | null;
}

// Normalized type used in UI
export interface SearchResult {
  id?: string;
  title: string;
  description: string;
  match_percentage?: number;
  category?: string;
  tags?: string[];
  funding?: string;
  fundingLevel?: string;
  deadline?: string;
  location?: string;
  url?: string;
  requirements?: string[];
  eligibility?: string;
  benefits?: string[];
}

export type AppView = "landing" | "results";
