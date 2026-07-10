"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Download, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArtifactPollResult {
  certificateNumber: string;
  pdf: {
    status: "pending" | "generating" | "ready" | "failed" | string;
    downloadUrl: string | null;
    nextPollAfterMs: number | null;
  };
}

interface CertificateArtifactStatusPollerProps {
  /** Certificate public number used for polling and download */
  certificateNumber: string;
  /** Initial status (from SSR) — avoids an extra round-trip on page load */
  initialStatus: string;
  /** If certificate is revoked, skip polling and hide download */
  isRevoked: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_POLL_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const DEFAULT_POLL_INTERVAL_MS = 5_000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * CertificateArtifactStatusPoller
 *
 * Server renders with the initial artifact status from the SSR pass.
 * If the PDF is not yet ready, this client component starts polling
 * `/api/certificates/{certificateNumber}/artifact-status` every 5 seconds.
 *
 * Polling stops when:
 * - PDF becomes ready (shows download CTA)
 * - PDF fails (shows retry guidance)
 * - Certificate is revoked (no download)
 * - 2 minutes elapse without resolution (shows manual refresh guidance)
 */
export function CertificateArtifactStatusPoller({
  certificateNumber,
  initialStatus,
  isRevoked,
}: CertificateArtifactStatusPollerProps) {
  const t = useTranslations("certificates.poller");
  const [status, setStatus] = useState<string>(initialStatus);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(
    initialStatus === "ready"
      ? `/certificates/${certificateNumber}/download`
      : null,
  );
  const [pollingExpired, setPollingExpired] = useState(false);

  const pollingStartRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pollRef = useRef<() => Promise<void>>(null!);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/certificates/${certificateNumber}/artifact-status`,
        { cache: "no-store" },
      );
      if (!res.ok) return;

      const data: ArtifactPollResult = await res.json();
      const pdfStatus = data?.pdf?.status;

      setStatus(pdfStatus ?? "pending");

      if (pdfStatus === "ready" && data.pdf.downloadUrl) {
        setDownloadUrl(data.pdf.downloadUrl);
        stopPolling();
        return;
      }

      if (pdfStatus === "failed") {
        stopPolling();
        return;
      }

      const elapsed = Date.now() - (pollingStartRef.current ?? Date.now());
      if (elapsed >= MAX_POLL_DURATION_MS) {
        setPollingExpired(true);
        stopPolling();
        return;
      }

      const interval = data?.pdf?.nextPollAfterMs ?? DEFAULT_POLL_INTERVAL_MS;
      timerRef.current = setTimeout(pollRef.current!, interval);
    } catch {
      timerRef.current = setTimeout(pollRef.current!, DEFAULT_POLL_INTERVAL_MS);
    }
  }, [certificateNumber, stopPolling]);

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  useEffect(() => {
    if (isRevoked || status === "ready" || status === "failed") return;

    pollingStartRef.current = Date.now();
    timerRef.current = setTimeout(pollRef.current!, DEFAULT_POLL_INTERVAL_MS);

    return () => stopPolling();
  }, [isRevoked, status, stopPolling]);

  // Revoked — no download action
  if (isRevoked) return null;

  // PDF ready — show download CTA
  if (status === "ready" && downloadUrl) {
    return (
      <a
        href={downloadUrl}
        download
        id="certificate-download-link"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-md shadow-teal-600/30 transition-all hover:bg-teal-500 hover:shadow-teal-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
      >
        <Download className="size-4 shrink-0" />
        {t("download")}
      </a>
    );
  }

  // Failed — show retry guidance
  if (status === "failed") {
    return (
      <div
        id="certificate-pdf-failed"
        className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-200">
              {t("failed")}
            </p>
            <p className="mt-1 text-xs text-amber-300/80">
              {t("failedDesc")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Polling expired without resolution
  if (pollingExpired) {
    return (
      <div
        id="certificate-pdf-still-generating"
        className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
      >
        <div className="flex items-start gap-3">
          <RefreshCw className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {t("stillGenerating")}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {t("stillGeneratingDesc")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full border-white/15 bg-white/5 text-xs text-white hover:bg-white/10"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-2 size-3" />
          {t("refresh")}
        </Button>
      </div>
    );
  }

  // Pending / generating — show spinner
  return (
    <div
      id="certificate-pdf-generating"
      className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="size-4 shrink-0 animate-spin text-teal-400" />
        <div>
          <p className="text-sm font-semibold text-slate-200">
            {status === "generating"
              ? t("generating")
              : t("queued")}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {t("generatingDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
