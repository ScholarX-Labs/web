"use client";

import { Clock3, CircleCheckBig, CircleDashed, CircleX, TimerReset } from "lucide-react";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";

type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "withdrawn";

interface CourseApplicationStatusProps {
  courseTitle: string;
  status: ApplicationStatus;
  submittedAt?: string | null;
  overlayClassName?: string;
  onContinueEnrollment?: () => void;
}

const statusConfig: Record<
  ApplicationStatus,
  {
    title: string;
    description: string;
    icon: typeof Clock3;
    tone: string;
  }
> = {
  pending: {
    title: "Application pending",
    description: "Your application has been received and is waiting for initial review.",
    icon: CircleDashed,
    tone: "text-amber-500",
  },
  reviewing: {
    title: "Application under review",
    description: "Our team is reviewing your profile and course fit.",
    icon: Clock3,
    tone: "text-sky-500",
  },
  approved: {
    title: "Application approved",
    description: "You can now complete enrollment for this course.",
    icon: CircleCheckBig,
    tone: "text-emerald-500",
  },
  rejected: {
    title: "Application not approved",
    description: "This application was not approved. Contact support if you need clarification.",
    icon: CircleX,
    tone: "text-rose-500",
  },
  waitlisted: {
    title: "Application waitlisted",
    description: "You are currently waitlisted. We will contact you if a seat opens.",
    icon: TimerReset,
    tone: "text-orange-500",
  },
  withdrawn: {
    title: "Application withdrawn",
    description: "This application is no longer active.",
    icon: CircleX,
    tone: "text-slate-500",
  },
};

export function CourseApplicationStatus({
  courseTitle,
  status,
  submittedAt,
  overlayClassName,
  onContinueEnrollment,
}: CourseApplicationStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <DialogContent
      overlayClassName={overlayClassName}
      className="z-90 overflow-hidden rounded-[30px] border border-white/60 bg-white/95 p-0 shadow-[0_32px_95px_rgba(2,6,23,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 sm:max-w-3xl"
    >
      <DialogTitle className="sr-only">{config.title}</DialogTitle>
      <div className="flex min-h-[520px] flex-col justify-center px-6 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-5 rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-white/60 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
              <Icon className={`h-7 w-7 ${config.tone}`} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {courseTitle}
              </p>
              <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">
                {config.title}
              </h3>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {config.description}
              </p>
            </div>
          </div>

          {submittedAt ? (
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
              Submitted on {new Date(submittedAt).toLocaleString()}
            </div>
          ) : null}

          {status === "approved" && onContinueEnrollment ? (
            <button
              type="button"
              onClick={onContinueEnrollment}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
            >
              Continue to enrollment
            </button>
          ) : null}
        </div>
      </div>
    </DialogContent>
  );
}
