import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PaginatedCoursesResponse, ICourse } from "../../types/course";
import { apiClient } from "@/lib/api";
// Assuming a generic api fetching utility exists in lib/api

export const useCourses = (page = 1, limit = 3, category?: string) => {
  return useQuery({
    queryKey: ["courses", { page, limit, category }],
    queryFn: async (): Promise<PaginatedCoursesResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (category) {
        params.append("category", category);
      }
      const response = await apiClient.get(`/courses?${params.toString()}`);
      return response.data;
    },
  });
};

export const useFeaturedCourses = (page = 1, limit = 3) => {
  return useQuery({
    queryKey: ["courses", "featured", { page, limit }],
    queryFn: async (): Promise<PaginatedCoursesResponse> => {
      const response = await api.get(
        `/courses/featured?page=${page}&limit=${limit}`,
      );
      return response.data;
    },
  });
};

export const useCourse = (id: string) => {
  return useQuery({
    queryKey: ["course", id],
    queryFn: async (): Promise<ICourse> => {
      const response = await api.get(`/courses/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await api.post(`/courses/${courseId}/enroll`);
      return response.data;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};
