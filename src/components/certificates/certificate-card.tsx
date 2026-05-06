import Image from "next/image";
import Link from "next/link";
import { UserCertificateDto } from "@/domain/certificates/contracts";

interface CertificateCardProps {
  certificate: UserCertificateDto;
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {certificate.courseImageUrl ? (
          <Image
            src={certificate.courseImageUrl}
            alt={certificate.courseTitle}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            📚
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="line-clamp-1 font-semibold text-lg" title={certificate.courseTitle}>
          {certificate.courseTitle}
        </h3>
        
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>
              {new Date(certificate.completedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>✅</span>
            <span>{certificate.completedLessons} Lessons</span>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <a
            href={`/api/certificates/${certificate.courseId}/download`}
            download={`ScholarX-Certificate-${certificate.courseId}.pdf`}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Download PDF
          </a>
          <Link
            href={`/certificates/verify/${certificate.certificateId}`}
            className="flex-1 rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors hover:bg-muted"
          >
            Verify
          </Link>
        </div>
      </div>
    </div>
  );
}
