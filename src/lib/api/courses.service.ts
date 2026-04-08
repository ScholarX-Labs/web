import { Course } from "@/types/course.types";
import { env } from "@/config/env";
import { BackendErrorPayload, BackendPagination } from "@/types/api.types";

interface InstructorSummary {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
}

interface CourseItemResponse {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  imageUrl: string | null;
  videoPreviewUrl: string | null;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
  currentPrice: number;
  originalPrice: number | null;
  status: "active" | "inactive" | string;
  rating: string | number | null;
  totalRatings: number | null;
  duration: string | null;
  lessonsCount: number | null;
  videosCount: number | null;
  studentsCount: number | null;
  isBestseller: boolean | null;
  urgencyText: string | null;
  tags: string[] | null;
  requiresForm: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  instructor?: InstructorSummary;
  thumbnail: string | null;
  price: number;
  isPublished: boolean;
  isSubscribed: boolean;
}

export interface PaginatedCoursesApiResponse {
  items: Course[];
  pagination: BackendPagination;
}

interface PaginatedCoursesResponseRaw {
  items: CourseItemResponse[];
  pagination: BackendPagination;
}

interface SubscriptionStatusResponse {
  isSubscribed: boolean;
  courseId: string;
  userId: string;
}

interface EnrollCourseResponse {
  course: {
    id: string;
    studentsCount: number;
  };
  userId: string;
}

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const getNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const mapCourse = (course: CourseItemResponse): Course => {
  const thumbnail = course.thumbnail ?? course.imageUrl ?? "";
  const currentPrice = getNumber(
    course.currentPrice,
    getNumber(course.price, 0),
  );
  const legacyPrice = getNumber(course.price, currentPrice);

  return {
    id: course.id,
    slug: course.slug ?? course.id,
    title: course.title,
    description: course.description,
    thumbnail,
    price: legacyPrice,
    currentPrice,
    originalPrice:
      course.originalPrice === null
        ? undefined
        : getNumber(course.originalPrice),
    category: course.category,
    level: course.level ?? undefined,
    duration: course.duration ?? undefined,
    videosCount: course.videosCount ?? undefined,
    lessonsCount: course.lessonsCount ?? undefined,
    studentsCount: course.studentsCount ?? undefined,
    rating:
      course.rating === null || course.rating === undefined
        ? undefined
        : getNumber(course.rating),
    totalRatings: course.totalRatings ?? undefined,
    isBestseller: course.isBestseller ?? undefined,
    urgencyText: course.urgencyText ?? undefined,
    tags: course.tags ?? undefined,
    videoPreviewUrl: course.videoPreviewUrl ?? undefined,
    instructor: course.instructor
      ? {
          id: course.instructor.id,
          name: course.instructor.name,
          avatar: course.instructor.avatar ?? undefined,
          title: course.instructor.title ?? undefined,
        }
      : undefined,
    requiresForm: course.requiresForm ?? false,
    isPublished: course.isPublished,
    isSubscribed: course.isSubscribed ?? false,
    createdAt: course.createdAt ?? new Date().toISOString(),
    updatedAt: course.updatedAt ?? new Date().toISOString(),
  };
};

const mapPaginatedCourses = (
  payload: PaginatedCoursesResponseRaw,
): PaginatedCoursesApiResponse => ({
  items: payload.items.map(mapCourse),
  pagination: payload.pagination,
});

const parseApiErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "message" in error.error &&
    typeof error.error.message === "string"
  ) {
    return error.error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const throwApiError = (
  error: unknown,
  fallback: string,
  status?: number,
): never => {
  throw new ApiRequestError(
    parseApiErrorMessage(error, fallback),
    status ?? 500,
  );
};

const createRequestUrl = (
  path: string,
  params?: Record<string, string | number | undefined>,
) => {
  const url = new URL(path, env.NEXT_PUBLIC_API_BASE_URL);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
};

const buildAuthHeaders = (token?: string) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

const createRequestHeaders = (
  token?: string,
  hasJsonBody = false,
): HeadersInit => ({
  ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
  ...(buildAuthHeaders(token) ?? {}),
  "X-Request-Id": crypto.randomUUID(),
});

const parseResponse = async <T>(
  response: Response,
  fallbackMessage: string,
) => {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson
    ? ((await response.json()) as T | BackendErrorPayload)
    : await response.text();

  if (!response.ok) {
    throwApiError(payload, fallbackMessage, response.status);
  }

  return payload as T;
};

const getJson = async <T>(
  path: string,
  options: {
    params?: Record<string, string | number | undefined>;
    token?: string;
    next?: NextFetchRequestConfig;
  } = {},
  fallbackMessage: string,
) => {
  const response = await fetch(createRequestUrl(path, options.params), {
    method: "GET",
    headers: createRequestHeaders(options.token),
    next: options.next,
  });

  return parseResponse<T>(response, fallbackMessage);
};

const postJson = async <T>(
  path: string,
  options: {
    body?: unknown;
    token?: string;
  } = {},
  fallbackMessage: string,
) => {
  const hasJsonBody = options.body !== undefined;
  const response = await fetch(createRequestUrl(path), {
    method: "POST",
    headers: createRequestHeaders(options.token, hasJsonBody),
    body: hasJsonBody ? JSON.stringify(options.body) : undefined,
  });

  return parseResponse<T>(response, fallbackMessage);
};

export const coursesService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    token?: string;
  }): Promise<PaginatedCoursesApiResponse> => {
    try {
      const { token, ...queryParams } = params ?? {};
      const data = await getJson<PaginatedCoursesResponseRaw>(
        "/courses",
        {
          params: queryParams,
          token,
        },
        "Failed to fetch courses",
      );
      return mapPaginatedCourses(data);
    } catch (error) {
      return throwApiError(error, "Failed to fetch courses");
    }
  },

  getAll: async (): Promise<Course[]> => {
    const data = await coursesService.list();
    return data.items;
  },

  getFeatured: async (params?: {
    page?: number;
    limit?: number;
    token?: string;
  }): Promise<PaginatedCoursesApiResponse> => {
    try {
      const { token, ...queryParams } = params ?? {};
      const data = await getJson<PaginatedCoursesResponseRaw>(
        "/courses/featured",
        {
          params: queryParams,
          token,
        },
        "Failed to fetch featured courses",
      );
      return mapPaginatedCourses(data);
    } catch (error) {
      return throwApiError(error, "Failed to fetch featured courses");
    }
  },

  getScholarX: async (params?: {
    page?: number;
    limit?: number;
    token?: string;
  }): Promise<PaginatedCoursesApiResponse> => {
    try {
      const { token, ...queryParams } = params ?? {};
      const data = await getJson<PaginatedCoursesResponseRaw>(
        "/courses/scholarx",
        {
          params: queryParams,
          token,
        },
        "Failed to fetch ScholarX courses",
      );
      return mapPaginatedCourses(data);
    } catch (error) {
      return throwApiError(error, "Failed to fetch ScholarX courses");
    }
  },

  search: async (
    title: string,
    params?: { page?: number; limit?: number; token?: string },
  ): Promise<PaginatedCoursesApiResponse> => {
    try {
      const { token, ...queryParams } = params ?? {};
      const data = await getJson<PaginatedCoursesResponseRaw>(
        "/courses/search",
        {
          params: {
            title,
            ...queryParams,
          },
          token,
        },
        "Failed to search courses",
      );
      return mapPaginatedCourses(data);
    } catch (error) {
      return throwApiError(error, "Failed to search courses");
    }
  },

  getById: async (id: string, token?: string): Promise<Course> => {
    try {
      const data = await getJson<CourseItemResponse>(
        `/courses/${id}`,
        { token },
        "Failed to fetch course details",
      );
      return mapCourse(data);
    } catch (error) {
      return throwApiError(error, "Failed to fetch course details");
    }
  },

  getEnrollmentStatus: async (
    courseId: string,
    token?: string,
  ): Promise<SubscriptionStatusResponse | null> => {
    try {
      return await getJson<SubscriptionStatusResponse>(
        `/courses/${courseId}/subscription-status`,
        { token },
        "Failed to fetch subscription status",
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        return null;
      }
      return null;
    }
  },

  enrollFree: async (
    courseId: string,
    token?: string,
  ): Promise<EnrollCourseResponse> => {
    try {
      return await postJson<EnrollCourseResponse>(
        `/courses/${courseId}/enroll`,
        {
          token,
        },
        "Failed to enroll",
      );
    } catch (error) {
      return throwApiError(error, "Failed to enroll");
    }
  },

  // Stub for paid enrollment - would typically integrate with payment gateway
  enrollPaid: async (
    courseId: string,
    paymentMethod: string,
  ): Promise<{ clientSecret: string }> => {
    const data = await postJson<{ clientSecret: string }>(
      `/payments/create/${courseId}`,
      { body: { paymentMethod } },
      "Failed to initialize payment",
    );
    return data;
  },

  // Kept for compatibility until slug endpoint is reintroduced.
  getBySlug: async (slug: string, token?: string): Promise<Course> => {
    return coursesService.getById(slug, token);
  },
};
