/**
 * Query Key Factory for React Query.
 * Centralizing query keys prevents typos and makes cache invalidation predictable.
 * Follows the pattern: [entity, scope, ...variables]
 */
export const queryKeys = {
  courses: {
    all: ["courses"] as const,
    lists: () => [...queryKeys.courses.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.courses.lists(), { filters }] as const,
    details: () => [...queryKeys.courses.all, "detail"] as const,
    detail: (idOrSlug: string) =>
      [...queryKeys.courses.details(), idOrSlug] as const,
    lessons: (courseId: string) =>
      [...queryKeys.courses.all, courseId, "lessons"] as const,
    lesson: (courseId: string, lessonId: string) =>
      [...queryKeys.courses.lessons(courseId), lessonId] as const,
    enrollments: () => [...queryKeys.courses.all, "enrollments"] as const,
    enrollmentStatus: (courseId: string) =>
      [...queryKeys.courses.enrollments(), courseId, "status"] as const,
  },
  sales: {
    all: ["sales"] as const,
    inquiries: () => [...queryKeys.sales.all, "inquiries"] as const,
    inquiry: (id: string) => [...queryKeys.sales.inquiries(), id] as const,
    stats: () => [...queryKeys.sales.all, "stats"] as const,
    status: (courseId: string) =>
      [...queryKeys.sales.all, "status", courseId] as const,
  },
} as const;
