"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/admin-api-client";
import { queryKeys } from "@/config/query-keys";

export function useAdminInquiries(
  query: Record<string, unknown> = {},
  initialData?: { items: unknown[]; pagination: unknown },
) {
  return useQuery({
    queryKey: queryKeys.admin.inquiries.list(query),
    queryFn: () => adminApi.inquiries.list(query),
    initialData: initialData as { items: unknown[]; pagination: unknown } | undefined,
    staleTime: initialData ? 30_000 : 0,
  });
}

export function useAdminInquiry(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.inquiries.detail(id),
    queryFn: () => adminApi.inquiries.getById(id),
    enabled: !!id,
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.inquiries.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.inquiries.all() });
    },
  });
}
