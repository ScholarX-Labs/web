import "server-only";

import { unstable_cache } from "next/cache";
import { mapOpportunity } from "@/lib/api/opportunities.service";
import type {
  OpportunitiesQuery,
  OpportunitiesResponse,
  SearchRawOpportunitiesResponse,
} from "./types";

export const OPPORTUNITIES_LIST_REVALIDATE = 300;

const OPPORTUNITIES_API_URL =
  "https://scholarx-search-api.vercel.app/api/opportunities";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 12;
const MAX_PAGE = 1000;
const MAX_QUERY_LENGTH = 200;
const MAX_FILTER_VALUES = 10;

const ALLOWED_FILTER_KEYS = new Set([
  "category",
  "subtype",
  "fund_type",
  "target_segment",
]);

type RawSearchParams = Record<
  string,
  string | string[] | undefined
>;

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function normalizeFilterList(raw: string | string[] | undefined): string {
  const joined = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  const values = joined
    .split(",")
    .map((v) => v.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, MAX_FILTER_VALUES);
  return values.join(",");
}

function normalizePage(raw: string | string[] | undefined): number {
  const parsed = Number(firstValue(raw));
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_PAGE;
  return Math.min(Math.floor(parsed), MAX_PAGE);
}

/**
 * Normalize URL search params into a stable, cache-friendly query.
 * Only whitelisted keys survive, keeping the `unstable_cache` key space bounded.
 */
export function normalizeOpportunitiesSearchParams(
  searchParams: RawSearchParams = {},
): OpportunitiesQuery {
  const query: OpportunitiesQuery = {
    page: normalizePage(searchParams.page),
    per_page: DEFAULT_PER_PAGE,
  };

  const q = firstValue(searchParams.q ?? searchParams.query)
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
  if (q) query.query = q;

  for (const key of ALLOWED_FILTER_KEYS) {
    const normalized = normalizeFilterList(searchParams[key]);
    if (normalized) {
      (query as unknown as Record<string, string>)[key] = normalized;
    }
  }

  return query;
}

/** Extract provider-ready filter state from a normalized query. */
export function toProviderFilters(
  query: OpportunitiesQuery,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};
  for (const key of ALLOWED_FILTER_KEYS) {
    const value = (query as unknown as Record<string, unknown>)[key];
    if (typeof value === "string" && value.length > 0) {
      filters[key] = value.split(",").filter(Boolean);
    }
  }
  return filters;
}

const EMPTY_RESPONSE: OpportunitiesResponse = {
  opportunities: [],
  pagination: { page: 1, perPage: DEFAULT_PER_PAGE, total: 0, totalPages: 1 },
};

async function fetchOpportunitiesUncached(
  query: OpportunitiesQuery,
): Promise<OpportunitiesResponse> {
  const params = new URLSearchParams();
  if (query.query) params.set("q", query.query);
  params.set("page", String(query.page ?? DEFAULT_PAGE));
  params.set("per_page", String(query.per_page ?? DEFAULT_PER_PAGE));
  for (const key of ALLOWED_FILTER_KEYS) {
    const value = (query as unknown as Record<string, unknown>)[key];
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${OPPORTUNITIES_API_URL}?${params.toString()}`, {
      next: {
        revalidate: OPPORTUNITIES_LIST_REVALIDATE,
        tags: ["opportunities"],
      },
    });
  } catch (error) {
    console.error("[opportunitiesSSR] fetch failed", {
      page: query.page ?? DEFAULT_PAGE,
      hasQuery: Boolean(query.query),
      error: error instanceof Error ? error.message : "unknown",
    });
    return {
      ...EMPTY_RESPONSE,
      pagination: {
        ...EMPTY_RESPONSE.pagination,
        page: query.page ?? DEFAULT_PAGE,
      },
    };
  }

  if (!response.ok) {
    console.error("[opportunitiesSSR] upstream error", {
      status: response.status,
      page: query.page ?? DEFAULT_PAGE,
    });
    return {
      ...EMPTY_RESPONSE,
      pagination: {
        ...EMPTY_RESPONSE.pagination,
        page: query.page ?? DEFAULT_PAGE,
      },
    };
  }

  let payload: SearchRawOpportunitiesResponse;
  try {
    payload = (await response.json()) as SearchRawOpportunitiesResponse;
  } catch (error) {
    console.error("[opportunitiesSSR] invalid JSON", {
      page: query.page ?? DEFAULT_PAGE,
      error: error instanceof Error ? error.message : "unknown",
    });
    return {
      ...EMPTY_RESPONSE,
      pagination: {
        ...EMPTY_RESPONSE.pagination,
        page: query.page ?? DEFAULT_PAGE,
      },
    };
  }

  const rawItems = Array.isArray(payload?.opportunities)
    ? payload.opportunities
    : [];
  const pagination = payload?.pagination;

  return {
    opportunities: rawItems.map((item) =>
      mapOpportunity({ id: item.id, data: item.data ?? {} }),
    ),
    pagination: {
      page: pagination?.page ?? query.page ?? DEFAULT_PAGE,
      perPage: pagination?.per_page ?? query.per_page ?? DEFAULT_PER_PAGE,
      total: pagination?.total ?? rawItems.length,
      totalPages: pagination?.total_pages ?? 1,
    },
  };
}

const getCachedOpportunities = unstable_cache(
  fetchOpportunitiesUncached,
  ["opportunities-list"],
  {
    revalidate: OPPORTUNITIES_LIST_REVALIDATE,
    tags: ["opportunities"],
  },
);

/** Server-side list fetch. Never throws; returns empty on upstream failure. */
export function getOpportunitiesSSR(
  query: OpportunitiesQuery,
): Promise<OpportunitiesResponse> {
  return getCachedOpportunities(query);
}
