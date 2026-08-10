import { Clock, PlayCircle, Signal, Users } from "lucide-react";
import { InlineEnrollmentBadge } from "@/components/courses/inline-enrollment-badge";
import { cn } from "@/lib/utils";

interface CourseMetaProps {
  duration?: string;
  level?: "Beginner" | "Intermediate" | "Advanced" | string;
  videosCount?: number;
  studentsCount?: number;
  className?: string;
}

export function CourseMeta({
  duration,
  level,
  videosCount,
  studentsCount,
  className,
}: CourseMetaProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {level && (
        <div className="flex items-center gap-1.5">
          <Signal className="h-3.5 w-3.5" />
          <span>{level}</span>
        </div>
      )}

      {duration && (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{duration}</span>
        </div>
      )}

      {videosCount !== undefined && (
        <div className="flex items-center gap-1.5">
          <PlayCircle className="h-3.5 w-3.5" />
          <span>{videosCount} lessons</span>
        </div>
      )}

      {studentsCount !== undefined && (
        <InlineEnrollmentBadge 
          count={studentsCount} 
          label="enrolled" 
          className="text-primary/80 font-medium" 
        />
      )}
    </div>
  );
}
