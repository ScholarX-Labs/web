import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/config/query-keys";
import { opportunitiesService } from "@/lib/api/opportunities.service";
import { OpportunitiesQuery } from "@/lib/opportunities/types";

/**
 * Fetch opportunities with filtering and pagination.
 */
export const useOpportunitiesSearch = (filters: OpportunitiesQuery) => {
  return useQuery({
    queryKey: queryKeys.opportunities.list(filters as Record<string, unknown>),
    queryFn: () => opportunitiesService.getOpportunities(filters),
    placeholderData: (previousData) => previousData, // keep previous data while fetching next page
  });
};
