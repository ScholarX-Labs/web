import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminTaskPayload } from "@/domain/courses/lesson-tasks/contracts/lesson-tasks.types";

export function useAdminLessonTasks(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "courses", courseId, "lessons", lessonId, "tasks"];

  const { data: tasks = [], isLoading, isError, error } = useQuery<AdminTaskPayload[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}/tasks`);
      if (!res.ok) {
        throw new Error("Failed to fetch lesson tasks");
      }
      return res.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: Partial<AdminTaskPayload>) => {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: Partial<AdminTaskPayload> }) => {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to update task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete task");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: async (orderedTaskIds: string[]) => {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}/tasks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedTaskIds }),
      });
      if (!res.ok) {
        throw new Error("Failed to reorder tasks");
      }
      return res.json();
    },
    onMutate: async (orderedTaskIds) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<AdminTaskPayload[]>(queryKey);

      if (previousTasks) {
        // Optimistically reorder
        const newTasks = [...previousTasks].sort((a, b) => {
          return orderedTaskIds.indexOf(a.id) - orderedTaskIds.indexOf(b.id);
        });
        queryClient.setQueryData(queryKey, newTasks);
      }
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    tasks,
    isLoading,
    isError,
    error,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    reorderTasks: reorderTasksMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isReordering: reorderTasksMutation.isPending,
  };
}
