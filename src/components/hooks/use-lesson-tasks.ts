import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LessonTask {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  type: string;
  isOptional: boolean;
  pointsAwarded: number;
  status: string;
  sortIndex: number;
  config: any;
  submission: any | null;
}

export function useLessonTasks(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["lesson-tasks", courseId, lessonId];

  const tasksQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/tasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch lesson tasks");
      }
      const data = await response.json();
      return data.data as LessonTask[];
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ taskId, answer }: { taskId: string; answer: any }) => {
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/tasks/${taskId}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Failed to submit answer");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const skipTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/tasks/${taskId}/skip`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Failed to skip task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    submitAnswer: submitAnswerMutation.mutateAsync,
    isSubmitting: submitAnswerMutation.isPending,
    skipTask: skipTaskMutation.mutateAsync,
    isSkipping: skipTaskMutation.isPending,
  };
}
