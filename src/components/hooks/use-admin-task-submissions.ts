import { useQuery } from "@tanstack/react-query";

export function useAdminTaskSubmissions(courseId: string, lessonId: string, taskId: string) {
  const queryKey = ["admin", "courses", courseId, "lessons", lessonId, "tasks", taskId, "submissions"];

  const { data: submissions = [], isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}/tasks/${taskId}/submissions`);
      if (!res.ok) {
        throw new Error("Failed to fetch submissions");
      }
      return res.json();
    },
  });

  const exportSubmissions = (format: 'csv' | 'json') => {
    window.location.href = `/api/admin/courses/${courseId}/lessons/${lessonId}/tasks/${taskId}/submissions/export?format=${format}`;
  };

  return {
    submissions,
    isLoading,
    isError,
    error,
    exportSubmissions,
  };
}
