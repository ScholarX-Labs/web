"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/admin-api-client";
import { queryKeys } from "@/config/query-keys";

export function useAdminCourses(query: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.admin.courses.list(query),
    queryFn: () => adminApi.courses.list(query),
  });
}

export function useAdminCourse(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.courses.detail(id),
    queryFn: () => adminApi.courses.getById(id),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => adminApi.courses.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.lists() });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.courses.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.lists() });
    },
  });
}

export function useUpdateCourseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.courses.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.detail(id) });
    },
  });
}

export function useArchiveCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.courses.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.lists() });
    },
  });
}

export function useEnrollUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: unknown }) =>
      adminApi.courses.enrollUser(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.lists() });
    },
  });
}

export function useRevokeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: unknown }) =>
      adminApi.courses.revokeUser(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.lists() });
    },
  });
}
