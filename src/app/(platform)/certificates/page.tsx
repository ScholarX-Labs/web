import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { createCertificateDomain } from "@/domain/certificates/factory/certificate-services.factory";
import { CourseCertificateLinkCard } from "@/components/certificates/course-certificate-link-card";
import { Award, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Certificates | ScholarX",
  description: "View and manage your verified ScholarX certificates.",
};

export default async function CertificatesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  const certDomain = createCertificateDomain();
  const certificates = await certDomain.verificationQuery.getCertificatesForUser(
    session.user.id,
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
          My Certificates
        </h1>
        <p className="text-lg text-muted-foreground">
          View, download, and share your verified certificates from completed courses.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-8 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <GraduationCap className="size-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground">
            No certificates yet
          </h2>
          <p className="mb-6 max-w-sm text-muted-foreground">
            Complete a course to earn your first verified certificate. Your certificates will appear here once issued.
          </p>
          <Link
            href={ROUTES.COURSES}
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {certificates.map((cert) => (
            <CourseCertificateLinkCard
              key={cert.certificateNumber}
              certificateNumber={cert.certificateNumber}
              certificateUrl={cert.certificateUrl}
              courseTitle={cert.courseTitle}
              issuedAt={cert.issuedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
