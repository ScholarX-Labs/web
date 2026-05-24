"use client";

import { useQuery } from "@tanstack/react-query";
import { aiSearchService } from "@/lib/api/ai-search.service";

export function useSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["search", trimmed],
    queryFn: () => aiSearchService.search(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 5 * 60 * 1000, // cached for 5 minutes
    refetchOnWindowFocus: false,
  });
}
