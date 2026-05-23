import Link from "next/link";
import { Award, ExternalLink, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCertificateLinkCardProps {
  certificateNumber: string;
  certificateUrl: string;
  courseTitle: string;
  issuedAt?: string;
  variant?: "light" | "dark";
  className?: string;
}

const formatIssuedDate = (value?: string) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export function CourseCertificateLinkCard({
  certificateNumber,
  certificateUrl,
  courseTitle,
  issuedAt,
  variant = "light",
  className,
}: CourseCertificateLinkCardProps) {
  const isDark = variant === "dark";
  const issuedDate = formatIssuedDate(issuedAt);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-6",
        isDark
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-white shadow-emerald-950/20"
          : "border-emerald-200 bg-emerald-50 text-slate-950 shadow-emerald-100/70",
        className,
      )}
      aria-labelledby="course-certificate-link-title"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl",
              isDark
                ? "bg-emerald-400/15 text-emerald-300"
                : "bg-white text-emerald-700",
            )}
          >
            <Award className="size-6" />
          </div>

          <div className="min-w-0">
            <div
              className={cn(
                "mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                isDark
                  ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                  : "border-emerald-200 bg-white text-emerald-700",
              )}
            >
              <ShieldCheck className="size-3" />
              Certificate issued
            </div>

            <h2
              id="course-certificate-link-title"
              className={cn(
                "text-lg font-black tracking-tight sm:text-xl",
                isDark ? "text-white" : "text-slate-950",
              )}
            >
              Your course certificate is ready
            </h2>

            <p
              className={cn(
                "mt-1 text-sm leading-6",
                isDark ? "text-emerald-50/75" : "text-slate-600",
              )}
            >
              View and share your verified certificate for {courseTitle}.
            </p>

            <div
              className={cn(
                "mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold",
                isDark ? "text-emerald-100/70" : "text-slate-500",
              )}
            >
              <span className="break-all font-mono">{certificateNumber}</span>
              {issuedDate ? <span>Issued {issuedDate}</span> : null}
            </div>
          </div>
        </div>

        <Link
          href={certificateUrl}
          className={cn(
            "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:w-auto",
            isDark
              ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500",
          )}
        >
          View certificate
          <ExternalLink className="size-4" />
        </Link>
      </div>
    </section>
  );
}
