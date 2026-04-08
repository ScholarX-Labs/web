import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Course } from "@/types/course.types";
import {
  coursesService,
  PaginatedCoursesApiResponse,
} from "@/lib/api/courses.service";

export const useCourses = (page = 1, limit = 3, category?: string) => {
  return useQuery({
    queryKey: ["courses", { page, limit, category }],
    queryFn: (): Promise<PaginatedCoursesApiResponse> =>
      coursesService.list({ page, limit, category }),
  });
};

export const useFeaturedCourses = (page = 1, limit = 3) => {
  return useQuery({
    queryKey: ["courses", "featured", { page, limit }],
    queryFn: (): Promise<PaginatedCoursesApiResponse> =>
      coursesService.getFeatured({ page, limit }),
  });
};

export const useCourse = (id: string) => {
  return useQuery({
    queryKey: ["course", id],
    queryFn: (): Promise<Course> => coursesService.getById(id),
    enabled: !!id,
  });
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!courseId) throw new Error("courseId is required");
      return coursesService.enrollFree(courseId);
    },
    onSuccess: (_, courseId) => {
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      }
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};
