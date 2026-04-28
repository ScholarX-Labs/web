export const runtime = "nodejs";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CertificateClaimService } from "@/domain/certificates/application/certificate-claim.service";
import { CertificatesRepository } from "@/domain/certificates/infrastructure/db/certificates.repository";
import { db } from "@/db";

interface Props {
  params: Promise<{ token: string }>;
}

/**
 * Fetch certificate details from the claim token for metadata + page render.
 * We read without consuming the token — the POST endpoint handles actual claim.
 */
async function getCertFromToken(token: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repo = new CertificatesRepository(db as any);
  return repo.findByClaimToken(token);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const cert = await getCertFromToken(token);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarx.lk";

  if (cert) {
    return {
      title: `Claim Your Certificate — ScholarX`,
      description: `${cert.recipientName}, claim your digital certificate for completing ${cert.programName} on ScholarX.`,
      openGraph: {
        title: `${cert.recipientName}'s ScholarX Certificate`,
        description: `${cert.programName} · Season ${cert.seasonNumber} · ${cert.role === "mentor" ? "Mentor" : "Mentee"}`,
        url: `${baseUrl}/certificates/claim/${token}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${cert.recipientName}'s ScholarX Certificate`,
      },
    };
  }

  return {
    title: "Certificate Claim — ScholarX",
    robots: "noindex",
  };
}

export default async function ClaimPage({ params }: Props) {
  const { token } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repo = new CertificatesRepository(db as any);
  const cert = await repo.findByClaimToken(token);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarx.lk";

  // Determine token state
  const isExpired = cert?.claimTokenExpiresAt && cert.claimTokenExpiresAt < new Date();
  const isAlreadyClaimed = cert?.status === "CLAIMED";
  const isRevoked = cert?.status === "REVOKED";
  const isValid = cert && !isExpired && !isAlreadyClaimed && !isRevoked;

  if (!cert) notFound();

  const verificationUrl = `${baseUrl}/verify/${cert.id}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1E3A5F] to-slate-900 flex items-center justify-center p-6">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] left-[10%] w-[600px] h-[600px] rounded-full bg-[#C9A84C]/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Claim status: valid */}
        {isValid && (
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-[#C9A84C]/20 rounded-3xl p-8 shadow-[0_30px_100px_-20px_rgba(201,168,76,0.15)]">
            {/* Gold shimmer */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/50 to-transparent rounded-t-3xl" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-3xl mb-4">
                🎓
              </div>
              <p className="text-xs text-[#C9A84C] font-semibold tracking-widest uppercase mb-2">
                Your Certificate Awaits
              </p>
              <h1 className="text-2xl font-bold text-white mb-1">
                Congratulations, {cert.recipientName}!
              </h1>
              <p className="text-slate-400 text-sm">
                You've successfully completed{" "}
                <span className="text-white font-semibold">{cert.programName}</span>{" "}
                (Season {cert.seasonNumber})
              </p>
            </div>

            {/* Certificate Preview Card */}
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Program</p>
                  <p className="text-white font-semibold">{cert.programName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Role</p>
                  <p className="text-white font-semibold capitalize">{cert.role}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Season</p>
                  <p className="text-white font-semibold">{cert.seasonNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">ID</p>
                  <p className="text-slate-300 font-mono text-xs">{cert.shortId}</p>
                </div>
              </div>
            </div>

            {/* Claim Action */}
            <ClaimAction token={token} certificateId={cert.id} verificationUrl={verificationUrl} linkedInUrl={linkedInUrl} />

            {/* Footer */}
            <p className="text-center text-slate-600 text-xs mt-5">
              This link expires in 30 days and is single-use.
            </p>
          </div>
        )}

        {/* Already claimed */}
        {isAlreadyClaimed && (
          <StatusCard
            emoji="✓"
            color="emerald"
            title="Certificate Already Claimed"
            message="This certificate has already been claimed and added to your wallet."
            cta={{ href: verificationUrl, label: "View Certificate →" }}
          />
        )}

        {/* Expired */}
        {isExpired && !isAlreadyClaimed && (
          <StatusCard
            emoji="⏱"
            color="amber"
            title="Link Expired"
            message="This claim link has expired (30-day limit). Contact support to request a new link."
            cta={{ href: "mailto:support@scholarx.lk", label: "Contact Support" }}
          />
        )}

        {/* Revoked */}
        {isRevoked && (
          <StatusCard
            emoji="✕"
            color="red"
            title="Certificate Revoked"
            message="This certificate has been revoked. Please contact support if you believe this is an error."
            cta={{ href: "mailto:support@scholarx.lk", label: "Contact Support" }}
          />
        )}

        <p className="text-center text-slate-600 text-xs mt-6">
          Powered by{" "}
          <Link href="/" className="text-[#C9A84C] hover:underline">
            ScholarX
          </Link>
        </p>
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusCard({
  emoji,
  color,
  title,
  message,
  cta,
}: {
  emoji: string;
  color: "emerald" | "amber" | "red";
  title: string;
  message: string;
  cta: { href: string; label: string };
}) {
  const colorMap = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
  };
  return (
    <div className={`border rounded-2xl p-8 text-center ${colorMap[color]}`}>
      <p className="text-4xl mb-4">{emoji}</p>
      <h1 className="text-xl font-bold text-white mb-2">{title}</h1>
      <p className="text-slate-400 text-sm mb-6">{message}</p>
      <a
        href={cta.href}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors"
      >
        {cta.label}
      </a>
    </div>
  );
}

/**
 * ClaimAction — Client island for the two-step claim UX.
 * Calls the POST /api/certificates/claim endpoint on click,
 * then shows share options.
 */
function ClaimAction({
  token,
  certificateId,
  verificationUrl,
  linkedInUrl,
}: {
  token: string;
  certificateId: string;
  verificationUrl: string;
  linkedInUrl: string;
}) {
  // This is a Server Component — wrap the interactive part in a client boundary
  return <ClaimActionClient token={token} certificateId={certificateId} verificationUrl={verificationUrl} linkedInUrl={linkedInUrl} />;
}

// Inline client component for the interactive claim button
import ClaimActionClient from "./_components/claim-action-client";
