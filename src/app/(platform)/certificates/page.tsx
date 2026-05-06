import { getUserCertificates } from "@/actions/certificates.actions";
import { CertificateCard } from "@/components/certificates/certificate-card";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Certificates | ScholarX",
  description: "View and download your ScholarX course completion certificates.",
};

export default async function CertificatesPage() {
  const certificates = await getUserCertificates();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          My Certificates
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Congratulations on your hard work! Here are your earned certificates.
        </p>
      </header>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-muted/30 py-24 text-center">
          <div className="text-6xl mb-6">🏆</div>
          <h2 className="text-2xl font-bold">No Certificates Yet</h2>
          <p className="mt-2 max-w-xs text-muted-foreground">
            Once you complete a course with 100% progress, your certificate will appear here.
          </p>
          <Link
            href="/courses"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <CertificateCard key={cert.completionId} certificate={cert} />
          ))}
        </div>
      )}
    </div>
  );
}
