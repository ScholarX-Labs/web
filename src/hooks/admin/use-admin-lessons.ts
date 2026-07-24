"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/admin-api-client";
import { queryKeys } from "@/config/query-keys";

export function useAdminLessons(courseId: string) {
  return useQuery({
    queryKey: queryKeys.admin.lessons.all(courseId),
    queryFn: () => adminApi.courses.listLessons(courseId),
    enabled: !!courseId,
  });
}

export function useAdminLesson(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.lessons.all(id),
    queryFn: () => adminApi.lessons.getById(id),
    enabled: !!id,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: unknown }) =>
      adminApi.lessons.create(courseId, data),
    onSuccess: (_result, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lessons.all(courseId) });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.lessons.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lessons.all(id) });
    },
  });
}

export function useToggleLessonVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.lessons.toggleVisibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.lists() });
    },
  });
}

export function useArchiveLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.lessons.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses.lists() });
    },
  });
}

export function useReorderLessons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: unknown }) =>
      adminApi.lessons.reorder(courseId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.lessons.all(courseId),
      });
    },
  });
}
