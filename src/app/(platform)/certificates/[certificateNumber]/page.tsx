import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  CalendarCheck2,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCertificateDomain } from "@/domain/certificates/factory/certificate-services.factory";
import { CertificateArtifactStatusPoller } from "@/components/certificates/certificate-artifact-status-poller";
import { ROUTES } from "@/lib/routes";
import { repairCourseCompletionCertificateArtifactsByNumber } from "@/lib/certificates/course-certificate-repair";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CertificatePageProps {
  params: Promise<{ certificateNumber: string }>;
}

export const dynamic = "force-dynamic";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));

async function getPublicCertificate(certificateNumber: string) {
  const certDomain = createCertificateDomain();
  return certDomain.verificationQuery.getPublicCertificate(certificateNumber);
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: CertificatePageProps): Promise<Metadata> {
  const { certificateNumber } = await params;
  const certificate = await getPublicCertificate(certificateNumber);

  if (!certificate) {
    return {
      title: "Certificate not found | ScholarX",
      description: "This ScholarX certificate could not be verified.",
    };
  }

  return {
    title: `${certificate.programName} Certificate | ScholarX`,
    description: `Verified ScholarX certificate for ${certificate.recipientName}.`,
    openGraph: {
      title: `${certificate.programName} — ScholarX Certificate`,
      description: `Issued to ${certificate.recipientName} on ${formatDate(certificate.completionDate)}.`,
      type: "website",
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * GET /certificates/:certificateNumber
 *
 * Public server-rendered certificate verification page.
 * Reads exclusively from the canonical certificates domain.
 * - Public: no auth required.
 * - Revoked certificates render a revoked state (never 404).
 * - Shows PDF download CTA via client-side poller when artifact is ready.
 */
export default async function CertificatePage({
  params,
}: CertificatePageProps) {
  const { certificateNumber } = await params;

  try {
    await repairCourseCompletionCertificateArtifactsByNumber(certificateNumber);
  } catch (error) {
    console.error("[CertificatePage] Certificate artifact repair failed:", error);
  }

  const certificate = await getPublicCertificate(certificateNumber);

  // Unknown or private certificates → 404
  if (!certificate) notFound();

  const isRevoked = certificate.isRevoked;

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      {/* Ambient light blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-28 top-10 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-5xl items-center">
        <section className="w-full overflow-hidden rounded-3xl border border-white/12 bg-white/[0.04] shadow-[0_36px_140px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            {/* ----------------------------------------------------------------
                Left column — certificate credential data
            ---------------------------------------------------------------- */}
            <div className="relative overflow-hidden bg-white px-7 py-8 text-slate-950 sm:px-10 sm:py-11">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-teal-500 via-hero-blue to-orange-400" />

              <div className="mb-10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                    ScholarX Certificate
                  </p>
                  <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                    Certificate of Completion
                  </h1>
                </div>
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
                  <Award className="size-7" />
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    This certifies that
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-normal text-slate-950">
                    {certificate.recipientName}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    successfully completed
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-900">
                    {certificate.programName}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <CalendarCheck2 className="mb-3 size-5 text-teal-700" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Completed
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatDate(certificate.completionDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <GraduationCap className="mb-3 size-5 text-teal-700" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Issued
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatDate(certificate.issuedAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Certificate number
                  </p>
                  <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-950">
                    {certificate.certificateNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------------
                Right column — verification status, PDF download, navigation
            ---------------------------------------------------------------- */}
            <aside className="flex flex-col justify-between gap-8 px-7 py-8 sm:px-10 sm:py-11">
              <div>
                {/* Validity badge */}
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    isRevoked
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                      : "border-teal-400/40 bg-teal-400/10 text-teal-200"
                  }`}
                >
                  {isRevoked ? (
                    <TriangleAlert className="size-4" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {isRevoked ? "Revoked" : "Verified"}
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-normal">
                  {isRevoked
                    ? "This certificate is no longer valid."
                    : "This certificate was issued by ScholarX."}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Verification is performed by direct database lookup using the
                  certificate number. The certificate data shown here is the
                  immutable snapshot captured when it was issued.
                </p>
              </div>

              {/* Issued / revoked metadata block */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-teal-300" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Issued
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatDate(certificate.issuedAt)}
                    </p>
                  </div>
                </div>

                {isRevoked ? (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                    {certificate.revokedReason ??
                      "No revocation reason was provided."}
                  </div>
                ) : null}
              </div>

              {/* PDF download / status */}
              <div className="space-y-3">
                {/*
                  CertificateArtifactStatusPoller is a Client Component.
                  It starts SSR with the initial artifact status and begins
                  polling only when the PDF is not yet ready.
                  Once ready, it renders the download CTA without a page reload.
                */}
                <CertificateArtifactStatusPoller
                  certificateNumber={certificate.certificateNumber}
                  initialStatus={certificate.pdf.status}
                  isRevoked={isRevoked}
                />
              </div>

              {/* Navigation */}
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild className="h-11 cursor-pointer">
                  <Link href={ROUTES.COURSES}>Explore courses</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 cursor-pointer border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href={ROUTES.PROFILE}>Back to profile</Link>
                </Button>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
