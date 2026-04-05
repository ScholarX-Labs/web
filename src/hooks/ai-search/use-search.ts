"use client";

import { useQuery } from "@tanstack/react-query";
import { searchScholarships } from "@/lib/ai-search/api";

export function useSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["search", trimmed],
    queryFn: () => searchScholarships(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 5 * 60 * 1000, // cached for 5 minutes
    refetchOnWindowFocus: false,
  });
}
