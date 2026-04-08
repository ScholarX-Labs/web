import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Instructor } from "@/types/course.types";
import { cn } from "@/lib/utils";
import { User2Icon } from "lucide-react";

interface InstructorInfoProps {
  instructor?: Instructor;
  className?: string;
}

export function InstructorInfo({ instructor, className }: InstructorInfoProps) {
  if (!instructor) {
    return null;
  }

  // Generate fallback initials (e.g. "John Doe" -> "JD")
  const initials = instructor.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Avatar className="h-8 w-8 ring-1 ring-border shadow-xs">
        <AvatarImage src={instructor.avatar} alt={instructor.name} />
        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
          {initials || <User2Icon className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium leading-none text-foreground">
          {instructor.name}
        </span>
        {instructor.title && (
          <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {instructor.title}
          </span>
        )}
      </div>
    </div>
  );
}
