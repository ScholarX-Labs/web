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
