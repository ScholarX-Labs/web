"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ExecutiveExportRequest } from "@/domain/executive/contracts/executive-query.schemas";
import { executiveQueryKeys } from "@/lib/executive/executive-query-keys";
import { ExecutiveApiClientError } from "@/lib/executive/executive-api-client";
import { EXECUTIVE_API_ROUTES } from "@/lib/executive/executive-routes";

type ExecutiveExportDownloadResult = {
  exportId: string | null;
  auditId: string | null;
  generatedAt: string | null;
  fileName: string;
  contentType: string;
};

function fileNameFromDisposition(
  disposition: string | null,
  fallback: string,
): string {
  if (!disposition) return fallback;
  const match = disposition.match(/filename="([^"]+)"/);
  return match?.[1] ?? fallback;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function exportExecutiveData(
  request: ExecutiveExportRequest,
): Promise<ExecutiveExportDownloadResult> {
  const response = await fetch(EXECUTIVE_API_ROUTES.EXPORT, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
      data?: unknown;
    } | null;
    throw new ExecutiveApiClientError(
      payload?.code ?? "REQUEST_FAILED",
      payload?.message ?? "Export request failed",
      response.status,
      payload?.data,
    );
  }

  const blob = await response.blob();
  const extension = request.format === "csv" ? "csv" : "html";
  const fallbackName = `${request.pageId}-export.${extension}`;
  const fileName = fileNameFromDisposition(
    response.headers.get("content-disposition"),
    fallbackName,
  );

  triggerDownload(blob, fileName);

  return {
    exportId: response.headers.get("x-executive-export-id"),
    auditId: response.headers.get("x-executive-audit-id"),
    generatedAt: response.headers.get("x-executive-generated-at"),
    fileName,
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}

export function useExecutiveExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ExecutiveExportRequest) => exportExecutiveData(request),
    onSuccess: (_result, request) => {
      queryClient.invalidateQueries({
        queryKey: executiveQueryKeys.exports.request(request.pageId, request.query),
      });
    },
  });
}
