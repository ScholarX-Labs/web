import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/query-keys";
import { coursesService } from "@/lib/api/courses.service";
import { toast } from "sonner";

/**
 * Enroll in a free course.
 * Invalidates enrollment-related caches on success.
 */
export const useEnrollFreeCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => coursesService.enrollFree(courseId),
    onSuccess: (_data, courseId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.enrollmentStatus(courseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.enrollments(),
      });
      toast.success("Successfully enrolled in the course!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to enroll.");
    },
  });
};
