const BASE_URL = "/api/admin";

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | undefined>;
}

class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await response.json();

  if (!response.ok) {
    if (json.details) {
      console.error("[AdminApiError Details]:", JSON.stringify(json.details, null, 2));
    }
    throw new AdminApiError(
      response.status,
      json.code ?? "UNKNOWN",
      (json.message ?? "Request failed") + (json.details ? ` - Details: ${JSON.stringify(json.details)}` : ""),
    );
  }

  return json.data ?? json;
}

export const adminApi = {
  stats: {
    getOverview: () => request<Record<string, unknown>>("/stats"),
  },

  courses: {
    list: (params?: { page?: number; limit?: number; search?: string; status?: string; category?: string }) =>
      request<{ items: unknown[]; pagination: unknown }>("/courses", {
        params: params as Record<string, string | undefined>,
      }),

    getById: (id: string) => request<unknown>(`/courses/${id}`),

    create: (data: unknown) =>
      request<unknown>("/courses", { method: "POST", body: data }),

    update: (id: string, data: unknown) =>
      request<unknown>(`/courses/${id}`, { method: "PUT", body: data }),

    updateStatus: (id: string, data: unknown) =>
      request<unknown>(`/courses/${id}/status`, { method: "PATCH", body: data }),

    archive: (id: string) =>
      request<void>(`/courses/${id}`, { method: "DELETE" }),

    enrollUser: (id: string, data: unknown) =>
      request<void>(`/courses/${id}/enroll`, { method: "POST", body: data }),

    revokeUser: (id: string, data: unknown) =>
      request<void>(`/courses/${id}/enroll`, { method: "DELETE", body: data }),

    enrollWithPayment: (courseId: string, data: {
      userId?: string;
      email?: string;
      amount: number;
      paymentMethod: string;
      paymentId?: string;
    }) =>
      request<unknown>(`/courses/${courseId}/enroll-with-payment`, {
        method: "POST",
        body: data,
      }),

    listEnrollments: (courseId: string, params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    }) =>
      request<{ items: unknown[]; pagination: unknown }>(`/courses/${courseId}/enrollments`, {
        params: params as Record<string, string | undefined>,
      }),

    listLessons: (courseId: string) =>
      request<unknown[]>(`/courses/${courseId}/lessons`),
  },

  lessons: {
    getById: (id: string) => request<unknown>(`/lessons/${id}`),

    create: (courseId: string, data: unknown) =>
      request<unknown>(`/courses/${courseId}/lessons`, { method: "POST", body: data }),

    update: (id: string, data: unknown) =>
      request<unknown>(`/lessons/${id}`, { method: "PUT", body: data }),

    toggleVisibility: (id: string) =>
      request<unknown>(`/lessons/${id}/visibility`, { method: "PATCH" }),

    archive: (id: string) =>
      request<void>(`/lessons/${id}`, { method: "DELETE" }),

    reorder: (courseId: string, data: unknown) =>
      request<unknown[]>(`/courses/${courseId}/lessons/reorder`, {
        method: "PUT",
        body: data,
      }),
  },

  users: {
    list: (params?: { page?: number; limit?: number; search?: string; role?: string; isBlocked?: boolean }) => {
      const clean: Record<string, string | undefined> = {};
      if (params) {
        if (params.page !== undefined) clean.page = String(params.page);
        if (params.limit !== undefined) clean.limit = String(params.limit);
        if (params.search !== undefined) clean.search = params.search;
        if (params.role !== undefined) clean.role = params.role;
        if (params.isBlocked !== undefined) clean.isBlocked = String(params.isBlocked);
      }
      return request<{ items: unknown[]; pagination: unknown }>("/users", { params: clean });
    },

    getById: (id: string) => request<unknown>(`/users/${id}`),

    create: (data: { email: string; firstName: string; lastName: string; phoneNumber?: string }) =>
      request<{ user: { id: string; email: string; firstName: string; lastName: string }; password: string }>(
        "/users",
        { method: "POST", body: data },
      ),

    update: (id: string, data: unknown) =>
      request<unknown>(`/users/${id}`, { method: "PUT", body: data }),

    setRole: (id: string, data: unknown) =>
      request<unknown>(`/users/${id}/role`, { method: "PUT", body: data }),

    block: (id: string, data: unknown) =>
      request<unknown>(`/users/${id}/block`, { method: "POST", body: data }),

    unblock: (id: string) =>
      request<unknown>(`/users/${id}/unblock`, { method: "POST" }),

    suspend: (id: string) =>
      request<void>(`/users/${id}`, { method: "DELETE" }),
  },

  subscriptions: {
    list: (params?: { page?: number; limit?: number; status?: string; courseId?: string }) =>
      request<{ items: unknown[]; pagination: unknown }>("/subscriptions", {
        params: params as Record<string, string | undefined>,
      }),

    getById: (id: string) => request<unknown>(`/subscriptions/${id}`),

    update: (id: string, data: unknown) =>
      request<unknown>(`/subscriptions/${id}`, { method: "PUT", body: data }),
  },

  inquiries: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      request<{ items: unknown[]; pagination: unknown }>("/inquiries", {
        params: params as Record<string, string | undefined>,
      }),

    getById: (id: string) => request<unknown>(`/inquiries/${id}`),

    updateStatus: (id: string, data: unknown) =>
      request<unknown>(`/inquiries/${id}/status`, { method: "PUT", body: data }),
  },

  reports: {
    revenue: (params: { from: string; to: string }) =>
      request<unknown>("/reports/revenue", { params }),

    users: (params: { from: string; to: string }) =>
      request<unknown>("/reports/users", { params }),

    courses: (params: { from: string; to: string }) =>
      request<unknown>("/reports/courses", { params }),
  },

  operations: {
    cashEnrollment: (data: {
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
    }) =>
      request<{
        user: { id: string; email: string; firstName: string; lastName: string };
        password?: string;
        course: { id: string; title: string };
        enrollment: { id: string; courseId: string; amount: number; paymentMethod: string; status: string; enrolledAt: string };
      }>("/operations/cash-enrollment", { method: "POST", body: data }),
  },
};
