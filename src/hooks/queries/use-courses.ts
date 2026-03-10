import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/config/query-keys";
import { coursesService } from "@/lib/api/courses.service";

/**
 * Fetch all courses, optionally filtered.
 */
export const useCourses = (filters?: Record<string, unknown>) => {
  return useQuery({
    queryKey: filters
      ? queryKeys.courses.list(filters)
      : queryKeys.courses.lists(),
    queryFn: coursesService.getAll,
  });
};

/**
 * Fetch a single course by its slug.
 */
export const useCourseBySlug = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.courses.detail(slug),
    queryFn: () => coursesService.getBySlug(slug),
    enabled: !!slug,
  });
};
