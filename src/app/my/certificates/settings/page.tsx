"use client";

export const runtime = "nodejs";

import { useState } from "react";
import Link from "next/link";

/**
 * Portfolio Settings Page
 *
 * Allows the authenticated user to:
 * 1. Set/change their public portfolio username
 * 2. Toggle portfolio visibility (private/public)
 *
 * Uses the PUT /api/certificates/portfolio endpoint.
 * All validation is done server-side + echoed to the user.
 */
export default function PortfolioSettingsPage() {
  const [username, setUsername] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarx.lk";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage(null);

    try {
      const res = await fetch("/api/certificates/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), enabled }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Portfolio settings saved successfully.");
        if (data.portfolioUsername) {
          setPortfolioUrl(`${baseUrl}/u/${data.portfolioUsername}/certificates`);
        }
      } else {
        setStatus("error");
        setMessage(data.error ?? "Failed to save settings.");
      }
    } catch {
      setStatus("error");
      setMessage("A network error occurred. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1E3A5F] to-slate-900 p-6">
      <div className="max-w-xl mx-auto pt-10">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-slate-500">
          <Link href="/my/certificates" className="hover:text-[#C9A84C] transition-colors">
            My Certificates
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">Portfolio Settings</span>
        </nav>

        <p className="text-xs text-[#C9A84C] font-semibold tracking-widest uppercase mb-2">
          Portfolio
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">Public Portfolio</h1>
        <p className="text-slate-400 text-sm mb-8">
          Create a shareable public page that showcases all your verified ScholarX certificates.
        </p>

        {/* Settings Form */}
        <form
          onSubmit={handleSave}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6"
        >
          {/* Username */}
          <div>
            <label htmlFor="portfolio-username" className="block text-sm font-medium text-white mb-2">
              Portfolio Username
            </label>
            <div className="flex items-center gap-0 bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-[#C9A84C]/40 transition-colors">
              <span className="px-3 text-slate-500 text-sm select-none border-r border-white/10 py-3 bg-white/[0.03]">
                scholarx.lk/u/
              </span>
              <input
                id="portfolio-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-username"
                pattern="[a-zA-Z0-9-]+"
                minLength={3}
                maxLength={30}
                required
                className="flex-1 bg-transparent px-3 py-3 text-white text-sm outline-none placeholder:text-slate-600"
              />
            </div>
            <p className="text-slate-500 text-xs mt-1.5">
              3–30 characters. Letters, numbers, and hyphens only.
            </p>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-white">Make Portfolio Public</p>
              <p className="text-slate-500 text-xs mt-0.5">
                When enabled, anyone with your link can view your certificates.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                enabled ? "bg-[#C9A84C]" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Status feedback */}
          {status === "success" && message && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
              {message}
              {portfolioUrl && (
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block mt-1 underline text-emerald-300 text-xs"
                >
                  {portfolioUrl}
                </a>
              )}
            </div>
          )}
          {status === "error" && message && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {message}
            </div>
          )}

          {/* Save button */}
          <button
            type="submit"
            disabled={status === "saving"}
            className="w-full py-3 bg-[#C9A84C] text-[#1E3A5F] font-bold rounded-xl hover:bg-[#C9A84C]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {status === "saving" ? "Saving…" : "Save Settings"}
          </button>
        </form>

        {/* Info box */}
        <div className="mt-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-slate-500 text-xs leading-relaxed">
          <p>
            Only certificates you've explicitly set to <strong className="text-slate-400">Public</strong>{" "}
            will appear on your portfolio page. You can control each certificate's visibility
            individually from{" "}
            <Link href="/my/certificates" className="text-[#C9A84C] hover:underline">
              My Certificates
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
