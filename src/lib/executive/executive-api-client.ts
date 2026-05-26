import type { ExecutiveExportRequest } from "@/domain/executive/contracts/executive-query.schemas";
import type { ExecutivePageId } from "@/domain/executive/contracts/executive-types";
import { getExecutiveApiPath, EXECUTIVE_API_ROUTES } from "./executive-routes";

export type ApiSuccess<TData> = {
  status: "success";
  data: TData;
};

export type ApiFailure = {
  status: "error";
  code: string;
  message: string;
  data?: unknown;
};

export class ExecutiveApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly data?: unknown,
  ) {
    super(message);
    this.name = "ExecutiveApiClientError";
  }
}

async function readJson<TData>(response: Response): Promise<TData> {
  const payload = (await response.json()) as ApiSuccess<TData> | ApiFailure;
  if (!response.ok || payload.status === "error") {
    const error = payload as ApiFailure;
    throw new ExecutiveApiClientError(
      error.code ?? "REQUEST_FAILED",
      error.message ?? "Request failed",
      response.status,
      error.data,
    );
  }
  return (payload as ApiSuccess<TData>).data;
}

export async function fetchExecutivePage<TData>(
  pageId: ExecutivePageId,
  query: URLSearchParams,
): Promise<TData> {
  const response = await fetch(`${getExecutiveApiPath(pageId)}?${query}`, {
    method: "GET",
    credentials: "same-origin",
  });
  return readJson<TData>(response);
}

export async function requestExecutiveExport<TData>(
  request: ExecutiveExportRequest,
): Promise<TData> {
  const response = await fetch(EXECUTIVE_API_ROUTES.EXPORT, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  return readJson<TData>(response);
}
