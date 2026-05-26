"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ExecutivePageQuery } from "@/domain/executive/contracts/executive-query.schemas";
import type { ExecutivePageId } from "@/domain/executive/contracts/executive-types";
import { fetchExecutivePage } from "@/lib/executive/executive-api-client";
import { executiveQueryKeys } from "@/lib/executive/executive-query-keys";

function toSearchParams(query: ExecutivePageQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params;
}

export function useExecutivePage<TData>(
  pageId: ExecutivePageId,
  query: ExecutivePageQuery,
  options?: Omit<
    UseQueryOptions<TData, Error, TData>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<TData, Error, TData>({
    queryKey: executiveQueryKeys.page(pageId, query),
    queryFn: () => fetchExecutivePage<TData>(pageId, toSearchParams(query)),
    ...options,
  });
}
