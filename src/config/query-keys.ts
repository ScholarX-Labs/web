import { OpportunitiesQuery } from "@/lib/opportunities/types";

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
  opportunities: {
    all: ["opportunities"] as const,
    lists: () => [...queryKeys.opportunities.all, "list"] as const,
    list: (filters: OpportunitiesQuery) =>
      [...queryKeys.opportunities.lists(), { filters }] as const,
    details: () => [...queryKeys.opportunities.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.opportunities.details(), id] as const,
  },
  sales: {
    all: ["sales"] as const,
    inquiries: () => [...queryKeys.sales.all, "inquiries"] as const,
    inquiry: (id: string) => [...queryKeys.sales.inquiries(), id] as const,
    stats: () => [...queryKeys.sales.all, "stats"] as const,
    status: (courseId: string) =>
      [...queryKeys.sales.all, "status", courseId] as const,
  },
  admin: {
    all: ["admin"] as const,
    courses: {
      all: () => [...queryKeys.admin.all, "courses"] as const,
      lists: () => [...queryKeys.admin.courses.all(), "list"] as const,
      list: (query: Record<string, unknown>) =>
        [...queryKeys.admin.courses.lists(), query] as const,
      details: () => [...queryKeys.admin.courses.all(), "detail"] as const,
      detail: (id: string) =>
        [...queryKeys.admin.courses.details(), id] as const,
    },
    lessons: {
      all: (courseId: string) =>
        [...queryKeys.admin.courses.detail(courseId), "lessons"] as const,
      detail: (courseId: string, lessonId: string) =>
        [...queryKeys.admin.lessons.all(courseId), lessonId] as const,
    },
    users: {
      all: () => [...queryKeys.admin.all, "users"] as const,
      lists: () => [...queryKeys.admin.users.all(), "list"] as const,
      list: (query: Record<string, unknown>) =>
        [...queryKeys.admin.users.lists(), query] as const,
      detail: (id: string) =>
        [...queryKeys.admin.users.all(), "detail", id] as const,
    },
    subscriptions: {
      all: () => [...queryKeys.admin.all, "subscriptions"] as const,
      list: (query: Record<string, unknown>) =>
        [...queryKeys.admin.subscriptions.all(), "list", query] as const,
      detail: (id: string) =>
        [...queryKeys.admin.subscriptions.all(), "detail", id] as const,
    },
    inquiries: {
      all: () => [...queryKeys.admin.all, "inquiries"] as const,
      list: (query: Record<string, unknown>) =>
        [...queryKeys.admin.inquiries.all(), "list", query] as const,
      detail: (id: string) =>
        [...queryKeys.admin.inquiries.all(), "detail", id] as const,
    },
    stats: {
      all: () => [...queryKeys.admin.all, "stats"] as const,
      overview: () => [...queryKeys.admin.stats.all(), "overview"] as const,
    },
    reports: {
      all: () => [...queryKeys.admin.all, "reports"] as const,
      revenue: (range: Record<string, unknown>) =>
        [...queryKeys.admin.reports.all(), "revenue", range] as const,
      users: (range: Record<string, unknown>) =>
        [...queryKeys.admin.reports.all(), "users", range] as const,
      courses: (range: Record<string, unknown>) =>
        [...queryKeys.admin.reports.all(), "courses", range] as const,
    },
  },
} as const;
