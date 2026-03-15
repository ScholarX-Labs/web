/**
 * Standard JSend Response standard wrapper.
 * The backend API uses this payload format consistently.
 */
export interface JSendSuccess<T> {
  status: "success";
  data: T;
}

export interface JSendError {
  status: "error" | "fail";
  message: string;
  data?: unknown;
}

export type JSendResponse<T> = JSendSuccess<T> | JSendError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface BackendPagination {
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BackendErrorDetail {
  field?: string;
  constraints?: Record<string, string>;
}

export interface BackendErrorPayload {
  success: false;
  error: {
    statusCode: number;
    code: string;
    numericCode: number;
    message: string;
    details?: BackendErrorDetail[];
  };
  meta?: {
    timestamp?: string;
    path?: string;
    method?: string;
    requestId?: string;
  };
}
