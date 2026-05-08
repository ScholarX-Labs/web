"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/admin-api-client";
import { queryKeys } from "@/config/query-keys";

export function useAdminSubscriptions(
  query: Record<string, unknown> = {},
  initialData?: { items: unknown[]; pagination: unknown },
) {
  return useQuery({
    queryKey: queryKeys.admin.subscriptions.list(query),
    queryFn: () => adminApi.subscriptions.list(query),
    initialData: initialData as { items: unknown[]; pagination: unknown } | undefined,
    staleTime: initialData ? 30_000 : 0,
  });
}

export function useAdminSubscription(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.subscriptions.detail(id),
    queryFn: () => adminApi.subscriptions.getById(id),
    enabled: !!id,
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.subscriptions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.subscriptions.all() });
    },
  });
}
