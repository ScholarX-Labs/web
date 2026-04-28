export const runtime = "nodejs";

import type { Metadata } from "next";
import { CertificatePortfolioService } from "@/domain/certificates/application/certificate-portfolio.service";
import Link from "next/link";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const service = new CertificatePortfolioService();
  const portfolio = await service.getPublicPortfolio(username);

  if (!portfolio) {
    return {
      title: "Portfolio Not Found — ScholarX",
      robots: "noindex",
    };
  }

  return {
    title: `${portfolio.recipientName}'s Certificates — ScholarX`,
    description: `${portfolio.recipientName} has earned ${portfolio.certificates.length} certificate${portfolio.certificates.length !== 1 ? "s" : ""} on ScholarX. View their verified credentials.`,
    openGraph: {
      title: `${portfolio.recipientName}'s ScholarX Certificates`,
      description: `${portfolio.certificates.length} verified credential${portfolio.certificates.length !== 1 ? "s" : ""} earned on ScholarX`,
      url: `${process.env.CERT_BASE_URL ?? "https://scholarx.lk"}/u/${username}/certificates`,
    },
  };
}

export default async function PublicPortfolioPage({ params }: Props) {
  const { username } = await params;
  const service = new CertificatePortfolioService();
  const portfolio = await service.getPublicPortfolio(username);

  if (!portfolio) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1E3A5F] to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Profile Not Available</h1>
          <p className="text-slate-400">
            This portfolio is either private or doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-[#C9A84C] hover:underline text-sm"
          >
            ← Back to ScholarX
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1E3A5F] to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <p className="text-xs text-[#C9A84C] font-semibold tracking-widest uppercase mb-2">
            ScholarX Portfolio
          </p>
          <h1 className="text-4xl font-bold text-white mb-2">
            {portfolio.recipientName}
          </h1>
          <p className="text-slate-400">
            {portfolio.certificates.length} verified credential
            {portfolio.certificates.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Certificates Grid */}
        {portfolio.certificates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No public certificates yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {portfolio.certificates.map((cert) => (
              <Link
                key={cert.id}
                href={cert.verificationUrl}
                className="block bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#C9A84C]/40 hover:bg-white/[0.08] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#C9A84C] font-semibold tracking-wider uppercase mb-1">
                      {cert.role === "mentor" ? "Mentor Recognition" : "Certificate of Completion"}
                    </p>
                    <h2 className="text-lg font-bold text-white group-hover:text-[#C9A84C] transition-colors">
                      {cert.programName}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Season {cert.seasonNumber} ·{" "}
                      {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <div className="text-slate-400 group-hover:text-[#C9A84C] transition-colors text-xl">
                    →
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-3">{cert.shortId}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-12 pb-8">
          Powered by{" "}
          <Link href="/" className="text-[#C9A84C] hover:underline">
            ScholarX
          </Link>
        </p>
      </div>
    </main>
  );
}
