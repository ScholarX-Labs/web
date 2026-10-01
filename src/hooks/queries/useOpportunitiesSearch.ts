import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/config/query-keys";
import { opportunitiesService } from "@/lib/api/opportunities.service";
import { OpportunitiesQuery, OpportunitiesResponse } from "@/lib/opportunities/types";

/**
 * Fetch opportunities with filtering and pagination.
 * Pass server-rendered `initialData` so the first paint has content
 * and the client skips the duplicate mount refetch.
 */
export const useOpportunitiesSearch = (
  filters: OpportunitiesQuery,
  options?: { initialData?: OpportunitiesResponse },
) => {
  return useQuery({
    queryKey: queryKeys.opportunities.list(filters as Record<string, unknown>),
    queryFn: () => opportunitiesService.getOpportunities(filters),
    placeholderData: (previousData) => previousData, // keep previous data while fetching next page
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnMount: options?.initialData ? false : true,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
