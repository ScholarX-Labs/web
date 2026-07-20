"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/admin-api-client";
import { queryKeys } from "@/config/query-keys";

export function useAdminEnrollmentsByCourse(
  courseId: string,
  query: Record<string, unknown> = {},
  initialData?: { items: unknown[]; pagination: unknown },
) {
  return useQuery({
    queryKey: queryKeys.admin.enrollments.byCourse(courseId, query),
    queryFn: () => adminApi.courses.listEnrollments(courseId, query),
    enabled: !!courseId,
    initialData: initialData as { items: unknown[]; pagination: unknown } | undefined,
    placeholderData: (previousData) => previousData,
    staleTime: initialData ? 30_000 : 0,
  });
}

export function useEnrollUserWithPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: string;
      data: {
        userId?: string;
        email?: string;
        amount: number;
        paymentMethod: string;
        paymentId?: string;
      };
    }) => adminApi.courses.enrollWithPayment(courseId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.enrollments.byCourse(courseId, {}),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.courses.detail(courseId),
      });
    },
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
    }) => adminApi.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.lists() });
    },
  });
}

export function useCashEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      user: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
      };
      course: {
        courseId: string;
        paymentMethod: string;
        amount: number;
        paymentId?: string;
      };
    }) => adminApi.operations.cashEnrollment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.enrollments.byCourse(variables.course.courseId, {}),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.courses.detail(variables.course.courseId),
      });
    },
  });
}
