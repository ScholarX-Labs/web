import { Course } from "@/types/course.types";
import { env } from "@/config/env";
import { BackendErrorPayload, BackendPagination } from "@/types/api.types";
import {
  EnrollmentErrorCode,
  EnrollmentSourceSurface,
} from "@/lib/enrollment/types";

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
  requestId: string;
  success: boolean;
  code: string;
  message: string;
  data: {
    course: {
      id: string;
      studentsCount: number;
    };
    userId: string;
    nextAction?: string;
  };
}

interface PaidEnrollmentInitResponse {
  requestId: string;
  success: boolean;
  code: string;
  message: string;
  data: {
    courseId: string;
    checkoutUrl: string;
    nextAction: "checkout";
  };
}

interface ApplicationEnrollmentInitResponse {
  requestId: string;
  success: boolean;
  code: string;
  message: string;
  data: {
    courseId: string;
    applicationUrl: string;
    nextAction: "application";
  };
}

interface EnrollmentRequestBody {
  idempotencyKey?: string;
  sourceSurface?: EnrollmentSourceSurface;
  returnUrl?: string;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: EnrollmentErrorCode,
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

const parseApiErrorCode = (error: unknown): EnrollmentErrorCode | undefined => {
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "code" in error.error &&
    typeof error.error.code === "string"
  ) {
    return error.error.code as EnrollmentErrorCode;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code as EnrollmentErrorCode;
  }

  return undefined;
};

const throwApiError = (
  error: unknown,
  fallback: string,
  status?: number,
): never => {
  throw new ApiRequestError(
    parseApiErrorMessage(error, fallback),
    status ?? 500,
    parseApiErrorCode(error),
  );
};

const createRequestUrl = (
  path: string,
  params?: Record<string, string | number | undefined>,
) => {
  console.log("[API] createRequestUrl called with path:", path);
  const configuredBase = env.NEXT_PUBLIC_API_BASE_URL.trim();
  console.log("[API] configuredBase from env:", configuredBase);

  const url = /^https?:\/\//i.test(configuredBase)
    ? new URL(path, configuredBase)
    : new URL(
        `${(configuredBase.startsWith("/") ? configuredBase : `/${configuredBase}`).replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost",
      );
  console.log("[API] constructed URL:", url.toString());

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
};

const buildAuthHeaders = (token?: string) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

const createRequestId = (): string => {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createRequestHeaders = (
  token?: string,
  hasJsonBody = false,
): HeadersInit => {
  const requestId = createRequestId();
  console.log(
    "[API] createRequestHeaders called with token:",
    !!token,
    "hasJsonBody:",
    hasJsonBody,
  );
  console.log("[API] generated request ID:", requestId);
  return {
    ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
    ...(buildAuthHeaders(token) ?? {}),
    "X-Request-Id": requestId,
  };
};

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
  const finalUrl = createRequestUrl(path, options.params);
  console.log("[API] getJson before fetch - url:", finalUrl.toString());
  const response = await fetch(finalUrl, {
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
  const finalUrl = createRequestUrl(path);
  console.log(
    "[API] executeRequestWithBody before fetch - url:",
    finalUrl.toString(),
  );
  const response = await fetch(finalUrl, {
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
    body?: EnrollmentRequestBody,
    token?: string,
  ): Promise<EnrollCourseResponse> => {
    try {
      console.log(
        "[COURSES_SERVICE] enrollFree called with courseId:",
        courseId,
        "body:",
        body,
      );
      const result = await postJson<EnrollCourseResponse>(
        `/courses/${courseId}/enroll/free`,
        {
          body,
          token,
        },
        "Failed to enroll",
      );
      console.log("[COURSES_SERVICE] enrollFree returned:", result);
      return result;
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        (error.status === 404 || error.code === "NOT_FOUND")
      ) {
        console.warn(
          "[COURSES_SERVICE] /enroll/free not found, falling back to legacy /enroll endpoint",
        );

        try {
          const fallbackResult = await postJson<EnrollCourseResponse>(
            `/courses/${courseId}/enroll`,
            {
              body,
              token,
            },
            "Failed to enroll",
          );
          console.log(
            "[COURSES_SERVICE] enrollFree fallback returned:",
            fallbackResult,
          );
          return fallbackResult;
        } catch (fallbackError) {
          console.error(
            "[COURSES_SERVICE] enrollFree fallback threw error:",
            fallbackError,
          );
          return throwApiError(fallbackError, "Failed to enroll");
        }
      }

      console.error("[COURSES_SERVICE] enrollFree threw error:", error);
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
    try {
      const data = await getJson<CourseItemResponse>(
        `/courses/slug/${slug}`,
        { token },
        "Failed to fetch course details",
      );
      return mapCourse(data);
    } catch (error) {
      // Backward compatibility: some links still pass course IDs in [slug] route.
      if (slug) {
        try {
          return await coursesService.getById(slug, token);
        } catch {
          return throwApiError(error, "Failed to fetch course details");
        }
      }

      return throwApiError(error, "Failed to fetch course details");
    }
  },

  initPaidEnrollment: async (
    courseId: string,
    body?: EnrollmentRequestBody,
    token?: string,
  ): Promise<PaidEnrollmentInitResponse> => {
    try {
      return await postJson<PaidEnrollmentInitResponse>(
        `/courses/${courseId}/enroll/paid/init`,
        {
          token,
          body,
        },
        "Failed to initialize paid enrollment",
      );
    } catch (error) {
      return throwApiError(error, "Failed to initialize paid enrollment");
    }
  },

  initApplicationEnrollment: async (
    courseId: string,
    body?: EnrollmentRequestBody,
    token?: string,
  ): Promise<ApplicationEnrollmentInitResponse> => {
    try {
      return await postJson<ApplicationEnrollmentInitResponse>(
        `/courses/${courseId}/enroll/application/init`,
        {
          token,
          body,
        },
        "Failed to initialize application enrollment",
      );
    } catch (error) {
      return throwApiError(
        error,
        "Failed to initialize application enrollment",
      );
    }
  },
};
