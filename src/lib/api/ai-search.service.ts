import { apiClient } from "@/lib/api/client";
import type { SearchResult } from "@/lib/ai-search/types";

export const aiSearchService = {
  async search(query: string): Promise<SearchResult[]> {
    const response = await apiClient.get<SearchResult[]>("/opportunities/search", {
      params: { q: query },
    });

    return Array.isArray(response.data) ? response.data : [];
  },
};
