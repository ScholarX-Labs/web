"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ActionCenterUpdateInput } from "@/domain/executive/contracts/executive-query.schemas";
import type { ActionCenterItem } from "@/domain/executive/contracts/action-center-repository.contract";
import { executiveQueryKeys } from "@/lib/executive/executive-query-keys";
import { ExecutiveApiClientError } from "@/lib/executive/executive-api-client";

type ApiSuccess<TData> = {
  status: "success";
  data: TData;
};

type ApiFailure = {
  status: "error";
  code: string;
  message: string;
  data?: unknown;
};

async function patchActionCenter(
  itemId: string,
  input: ActionCenterUpdateInput,
): Promise<ActionCenterItem> {
  const response = await fetch(`/api/admin/executive/action-center/${itemId}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as ApiSuccess<ActionCenterItem> | ApiFailure;
  if (!response.ok || payload.status === "error") {
    const error = payload as ApiFailure;
    throw new ExecutiveApiClientError(
      error.code ?? "REQUEST_FAILED",
      error.message ?? "Request failed",
      response.status,
      error.data,
    );
  }

  return (payload as ApiSuccess<ActionCenterItem>).data;
}

export function useActionCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: ActionCenterUpdateInput }) =>
      patchActionCenter(itemId, input),
    onSuccess: (item) => {
      queryClient.invalidateQueries({
        queryKey: executiveQueryKeys.actionCenter.all(),
      });
      queryClient.invalidateQueries({
        queryKey: executiveQueryKeys.pages(),
      });
      queryClient.setQueryData(
        executiveQueryKeys.actionCenter.item(item.id),
        item,
      );
    },
  });
}
