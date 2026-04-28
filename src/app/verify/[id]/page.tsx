export const runtime = "nodejs";
export const revalidate = 60;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CertificateVerificationService } from "@/domain/certificates/application/certificate-verification.service";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const service = new CertificateVerificationService();
  const result = await service.verify({ certificateId: id });

  if (result.status === "VALID" && result.certificate) {
    const cert = result.certificate;
    return {
      title: `${cert.recipientName}'s Certificate — ScholarX`,
      description: `${cert.recipientName} completed the ${cert.programName} program (Season ${cert.seasonNumber}) on ScholarX. Verified digital certificate.`,
      openGraph: {
        title: `${cert.recipientName}'s ScholarX Certificate`,
        description: `${cert.programName} · Season ${cert.seasonNumber} · ${cert.role === "mentor" ? "Mentor" : "Mentee"}`,
        url: `${process.env.CERT_BASE_URL ?? "https://scholarx.lk"}/verify/${id}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${cert.recipientName}'s ScholarX Certificate`,
      },
    };
  }

  return {
    title: "Certificate Verification — ScholarX",
    robots: "noindex",
  };
}

export default async function VerifyPage({ params }: Props) {
  const { id } = await params;
  const service = new CertificateVerificationService();
  const result = await service.verify({ certificateId: id });

  const isValid = result.status === "VALID";
  const isRevoked = result.status === "REVOKED";
  const cert = result.certificate;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1E3A5F] to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Status Badge */}
        <div className="flex justify-center mb-8">
          <span
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold tracking-widest uppercase
              ${isValid ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40" : ""}
              ${isRevoked ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40" : ""}
              ${!isValid && !isRevoked ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/40" : ""}
            `}
          >
            {isValid ? "✓ Certificate Valid" : isRevoked ? "✕ Certificate Revoked" : "✕ Unable to Verify"}
          </span>
        </div>

        {/* Certificate Card */}
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
            <div>
              <p className="text-xs text-[#C9A84C] font-semibold tracking-widest uppercase mb-1">
                ScholarX
              </p>
              <h1 className="text-2xl font-bold text-white">
                Certificate of Completion
              </h1>
            </div>
          </div>

          {cert ? (
            <>
              {/* Recipient */}
              <div className="mb-6">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                  Recipient
                </p>
                <p className="text-3xl font-bold text-white">{cert.recipientName}</p>
              </div>

              {/* Program Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Program
                  </p>
                  <p className="text-white font-semibold">{cert.programName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Season
                  </p>
                  <p className="text-white font-semibold">{cert.seasonNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Role
                  </p>
                  <p className="text-white font-semibold capitalize">{cert.role}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Completed
                  </p>
                  <p className="text-white font-semibold">
                    {new Date(cert.completionDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Skills */}
              {cert.skillTags.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cert.skillTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[#C9A84C]/10 text-[#C9A84C] text-xs rounded-full border border-[#C9A84C]/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructor */}
              {cert.instructorName && (
                <div className="mb-6">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Instructor
                  </p>
                  <p className="text-white font-semibold">{cert.instructorName}</p>
                </div>
              )}

              {/* Duration */}
              {cert.programDuration && (
                <div className="mb-6">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Duration
                  </p>
                  <p className="text-white">{cert.programDuration}</p>
                </div>
              )}

              {/* Signature */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Certificate ID
                  </p>
                  <p className="text-slate-300 text-sm font-mono">{cert.shortId}</p>
                  <p className="text-slate-500 text-xs font-mono mt-1">
                    Sig: {cert.signatureFingerprint}…
                  </p>
                </div>

                {/* CTA — only for VALID certs */}
                {isValid && cert.courseSlug && (
                  <Link
                    href={`/courses/${cert.courseSlug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-[#1E3A5F] font-bold text-sm rounded-xl hover:bg-[#C9A84C]/90 transition-colors"
                  >
                    Learn more on ScholarX →
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-slate-400 text-lg">{result.message}</p>
              <p className="text-slate-500 text-sm mt-3">
                If you believe this is an error, please contact{" "}
                <a
                  href="mailto:support@scholarx.lk"
                  className="text-[#C9A84C] hover:underline"
                >
                  support@scholarx.lk
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Verified by{" "}
          <Link href="/" className="text-[#C9A84C] hover:underline">
            ScholarX
          </Link>{" "}
          · Cryptographically signed certificate
        </p>
      </div>
    </main>
  );
}
