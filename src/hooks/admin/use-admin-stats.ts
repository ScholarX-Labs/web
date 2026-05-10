"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/admin-api-client";
import { queryKeys } from "@/config/query-keys";

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats.overview(),
    queryFn: () => adminApi.stats.getOverview(),
  });
}
