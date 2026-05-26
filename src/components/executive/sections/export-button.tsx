"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import type { ExecutivePageQuery } from "@/domain/executive/contracts/executive-query.schemas";
import type { ExecutivePageId } from "@/domain/executive/contracts/executive-types";
import { EXECUTIVE_API_ROUTES } from "@/lib/executive/executive-routes";
import { Button } from "@/components/ui/button";

export type ExportButtonProps = {
  pageId: ExecutivePageId;
  query: ExecutivePageQuery;
  sectionIds?: readonly string[];
};

function fileNameFromResponse(response: Response, fallback: string): string {
  const header = response.headers.get("content-disposition");
  const match = header?.match(/filename="([^"]+)"/);
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

export function ExportButton({ pageId, query, sectionIds }: ExportButtonProps) {
  const [pendingFormat, setPendingFormat] = useState<"csv" | "snapshot" | null>(null);
  const [isPending, startTransition] = useTransition();

  const exportFile = (format: "csv" | "snapshot") => {
    setPendingFormat(format);
    startTransition(async () => {
      try {
        const response = await fetch(EXECUTIVE_API_ROUTES.EXPORT, {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pageId, format, query, sectionIds }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null) as {
            message?: string;
          } | null;
          throw new Error(errorPayload?.message ?? "Export request failed.");
        }

        const blob = await response.blob();
        const extension = format === "csv" ? "csv" : "html";
        triggerDownload(blob, fileNameFromResponse(response, `${pageId}-export.${extension}`));
      } finally {
        setPendingFormat(null);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => exportFile("csv")}
        disabled={isPending}
      >
        <Download className="size-4" aria-hidden="true" />
        {pendingFormat === "csv" ? "Exporting CSV" : "Export CSV"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => exportFile("snapshot")}
        disabled={isPending}
      >
        <Download className="size-4" aria-hidden="true" />
        {pendingFormat === "snapshot" ? "Exporting snapshot" : "Export snapshot"}
      </Button>
    </div>
  );
}
