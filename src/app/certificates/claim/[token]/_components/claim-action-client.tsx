"use client";

import { useState } from "react";
import Link from "next/link";

interface ClaimActionClientProps {
  token: string;
  certificateId: string;
  verificationUrl: string;
  linkedInUrl: string;
}

type ClaimState = "idle" | "claiming" | "success" | "error";

/**
 * ClaimActionClient
 *
 * Interactive client island inside the server-rendered claim page.
 * Handles the two-step UX:
 * 1. "Claim Certificate" button → POST /api/certificates/claim
 * 2. On success → show share + view options
 *
 * Design: Keeps server component pure (data + SEO), only the interactive
 * state lives here (Open/Closed Principle applied to component boundaries).
 */
export default function ClaimActionClient({
  token,
  certificateId,
  verificationUrl,
  linkedInUrl,
}: ClaimActionClientProps) {
  const [state, setState] = useState<ClaimState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClaim = async () => {
    setState("claiming");
    setError(null);

    try {
      const res = await fetch("/api/certificates/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimToken: token }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setState("success");
      } else {
        setError(data.message ?? "Failed to claim certificate. Please try again.");
        setState("error");
      }
    } catch {
      setError("A network error occurred. Please try again.");
      setState("error");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — do nothing silently
    }
  };

  // ── Success state ────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
          <span className="text-lg">✓</span>
          <span>Certificate claimed! It&apos;s now in your wallet.</span>
        </div>

        <Link
          href={verificationUrl}
          className="block w-full py-3 text-center bg-[#C9A84C] text-[#1E3A5F] font-bold rounded-xl hover:bg-[#C9A84C]/90 transition-colors text-sm"
        >
          View My Certificate →
        </Link>

        <a
          href={linkedInUrl}
          target="_blank"
          rel="noreferrer"
          className="block w-full py-3 text-center bg-[#0A66C2]/20 text-[#5AA9E6] font-semibold rounded-xl hover:bg-[#0A66C2]/30 transition-colors border border-[#0A66C2]/30 text-sm"
        >
          Share on LinkedIn
        </a>

        <button
          onClick={copyLink}
          className="w-full py-3 text-center bg-white/[0.06] text-slate-300 font-medium rounded-xl hover:bg-white/[0.10] transition-colors border border-white/10 text-sm"
        >
          {copied ? "✓ Link Copied!" : "Copy Verification Link"}
        </button>

        <Link
          href="/my/certificates"
          className="block w-full py-2.5 text-center text-slate-400 text-sm hover:text-white transition-colors"
        >
          Go to My Wallet
        </Link>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="space-y-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
        <button
          onClick={() => setState("idle")}
          className="w-full py-3 bg-white/[0.06] text-white font-semibold rounded-xl hover:bg-white/[0.10] transition-colors border border-white/10 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Default / claiming state ─────────────────────────────────────────────
  return (
    <button
      id="claim-certificate-btn"
      onClick={handleClaim}
      disabled={state === "claiming"}
      className="w-full py-3.5 bg-[#C9A84C] text-[#1E3A5F] font-bold rounded-xl hover:bg-[#C9A84C]/90 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      aria-busy={state === "claiming"}
    >
      {state === "claiming" ? (
        <>
          <div className="w-4 h-4 border-2 border-[#1E3A5F]/40 border-t-[#1E3A5F] rounded-full animate-spin" />
          Claiming…
        </>
      ) : (
        "🎓 Claim My Certificate"
      )}
    </button>
  );
}
