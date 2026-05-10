"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/admin-api-client";
import { queryKeys } from "@/config/query-keys";

export function useRevenueReport(range: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys.admin.reports.revenue(range),
    queryFn: () => adminApi.reports.revenue(range),
    enabled: !!range.from && !!range.to,
  });
}

export function useUsersReport(range: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys.admin.reports.users(range),
    queryFn: () => adminApi.reports.users(range),
    enabled: !!range.from && !!range.to,
  });
}

export function useCoursesReport(range: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys.admin.reports.courses(range),
    queryFn: () => adminApi.reports.courses(range),
    enabled: !!range.from && !!range.to,
  });
}
