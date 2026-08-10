import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEnrollmentBadgeProps {
  count: number | null;
  label?: string;
  className?: string;
}

export function InlineEnrollmentBadge({ count, label = "students", className }: InlineEnrollmentBadgeProps) {
  if (count === null || count === 0) {
    return null; // Or return a "Be the first to enroll" badge based on design
  }

  const displayCount = count >= 10000 
    ? count >= 100000 
      ? `${Math.floor(count / 1000)}K+`
      : `${(count / 1000).toFixed(0)}K+`
    : `${count.toLocaleString()}+`;

  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Users className="w-3.5 h-3.5" />
      <span>{displayCount} {label}</span>
    </div>
  );
}
