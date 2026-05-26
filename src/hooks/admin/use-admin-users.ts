"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/admin-api-client";
import { queryKeys } from "@/config/query-keys";

export function useAdminUsers(
  query: Record<string, unknown> = {},
  initialData?: { items: unknown[]; pagination: unknown },
) {
  return useQuery({
    queryKey: queryKeys.admin.users.list(query),
    queryFn: () => adminApi.users.list(query),
    initialData: initialData as { items: unknown[]; pagination: unknown } | undefined,
    placeholderData: (previousData) => previousData,
    staleTime: initialData ? 30_000 : 0,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.users.detail(id),
    queryFn: () => adminApi.users.getById(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.users.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.lists() });
    },
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.users.setRole(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.lists() });
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.users.block(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.lists() });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.users.unblock(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.lists() });
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.users.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.lists() });
    },
  });
}
