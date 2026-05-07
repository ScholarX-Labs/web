import type { Metadata } from "next";
import { verifyCertificate } from "@/actions/certificates.actions";
import Link from "next/link";

interface Props {
  params: Promise<{ certificateId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certificateId } = await params;
  const result = await verifyCertificate(certificateId);

  if (result.valid) {
    return {
      title: `Verified: ${result.studentName} — ${result.courseName} | ScholarX`,
      description: `Authenticity verification for ${result.studentName}'s completion of ${result.courseName} on ScholarX.`,
    };
  }

  return {
    title: "Verify Certificate | ScholarX",
    description: "Verify the authenticity of a ScholarX course certificate.",
  };
}

export default async function CertificateVerifyPage({ params }: Props) {
  const { certificateId } = await params;
  const result = await verifyCertificate(certificateId);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border bg-card shadow-2xl">
        <div className="bg-primary p-8 text-center text-primary-foreground">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl">
            {result.valid ? "✅" : "❌"}
          </div>
          <h1 className="text-2xl font-bold">
            {result.valid ? "Certificate Verified" : "Verification Failed"}
          </h1>
          <p className="mt-1 opacity-90">
            {result.valid
              ? "This document is an authentic ScholarX certificate."
              : "We could not verify this certificate ID."}
          </p>
        </div>

        <div className="p-8">
          {result.valid ? (
            <div className="space-y-6">
              <div className="grid gap-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Student Name
                </p>
                <p className="text-xl font-bold">{result.studentName}</p>
              </div>

              <div className="grid gap-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Course
                </p>
                <p className="text-xl font-bold">{result.courseName}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t">
                <div className="grid gap-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Issued On
                  </p>
                  <p className="font-semibold">
                    {new Date(result.completedAt!).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Certificate ID
                  </p>
                  <p className="font-mono text-sm break-all font-semibold">
                    {result.certificateId}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                The certificate ID <strong>{certificateId}</strong> was not found in our records.
                If you believe this is an error, please contact our support team.
              </p>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center border-t pt-8">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Visit ScholarX
            </Link>
            <Link
              href="/courses"
              className="inline-flex h-10 items-center justify-center rounded-xl border px-6 text-sm font-medium transition-colors hover:bg-muted"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
