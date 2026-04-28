"use client";

export const runtime = "nodejs";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CertificateDTO } from "@/domain/certificates/contracts";

function CertificateCard({ cert }: { cert: CertificateDTO }) {
  const [copied, setCopied] = useState(false);

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarx.lk"}/verify/${cert.id}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor = {
    PENDING: "bg-amber-500/20 text-amber-400",
    CLAIMED: "bg-emerald-500/20 text-emerald-400",
    REVOKED: "bg-red-500/20 text-red-400",
    FAILED: "bg-slate-500/20 text-slate-400",
  }[cert.status];

  return (
    <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#C9A84C]/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-[#C9A84C] font-semibold tracking-wider uppercase mb-1">
            {cert.role === "mentor" ? "Mentor Recognition" : "Certificate of Completion"}
          </p>
          <h2 className="text-lg font-bold text-white">{cert.programName}</h2>
          <p className="text-slate-400 text-sm mt-1">
            Season {cert.seasonNumber} ·{" "}
            {new Date(cert.issuedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {cert.status}
        </span>
      </div>

      {/* Short ID */}
      <p className="text-xs text-slate-500 font-mono mb-5">{cert.shortId}</p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {cert.pdfStorageKey && (
          <a
            href={`/api/certificates/${cert.id}/download?format=pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-white/[0.08] text-white text-xs font-medium rounded-xl hover:bg-white/[0.14] transition-colors border border-white/10"
          >
            ↓ Download PDF
          </a>
        )}
        {cert.pngStorageKey && (
          <a
            href={`/api/certificates/${cert.id}/download?format=png`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-white/[0.08] text-white text-xs font-medium rounded-xl hover:bg-white/[0.14] transition-colors border border-white/10"
          >
            ↓ Download PNG
          </a>
        )}
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-[#0A66C2]/20 text-[#5AA9E6] text-xs font-medium rounded-xl hover:bg-[#0A66C2]/30 transition-colors border border-[#0A66C2]/30"
        >
          Share to LinkedIn
        </a>
        <button
          onClick={copyLink}
          className="px-4 py-2 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-medium rounded-xl hover:bg-[#C9A84C]/20 transition-colors border border-[#C9A84C]/20"
        >
          {copied ? "✓ Copied!" : "Copy Link"}
        </button>
        <Link
          href={`/verify/${cert.id}`}
          className="px-4 py-2 bg-white/[0.08] text-slate-300 text-xs font-medium rounded-xl hover:bg-white/[0.14] transition-colors border border-white/10"
        >
          View Certificate →
        </Link>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const [certs, setCerts] = useState<CertificateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/certificates/wallet")
      .then((r) => r.json())
      .then((data: CertificateDTO[]) => {
        setCerts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load certificates. Please refresh.");
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1E3A5F] to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10 pt-6">
          <p className="text-xs text-[#C9A84C] font-semibold tracking-widest uppercase mb-2">
            My Account
          </p>
          <h1 className="text-3xl font-bold text-white">My Certificates</h1>
          <p className="text-slate-400 mt-1">
            Your verified digital credentials from ScholarX programs
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && certs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎓</p>
            <h2 className="text-xl font-semibold text-white mb-2">
              No certificates yet
            </h2>
            <p className="text-slate-400 mb-6">
              Complete a ScholarX program to earn your first certificate.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-[#1E3A5F] font-bold rounded-xl hover:bg-[#C9A84C]/90 transition-colors"
            >
              Explore Programs →
            </Link>
          </div>
        )}

        {!loading && !error && certs.length > 0 && (
          <div className="grid gap-4">
            {certs.map((cert) => (
              <CertificateCard key={cert.id} cert={cert} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
