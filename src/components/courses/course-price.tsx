import { cn } from "@/lib/utils";
import { ShinyText } from "@/components/animations/shiny-text";

interface CoursePriceProps {
  price?: number | null;
  className?: string;
}

export function CoursePrice({ price, className }: CoursePriceProps) {
  // Free Course
  if (price === 0) {
    return (
      <div
        className={cn(
          "inline-flex font-semibold items-center justify-center rounded-md bg-emerald-100 px-2.5 py-0.5 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 group-hover/course-card:ring-emerald-500/30 transition-shadow",
          className,
        )}
      >
        <ShinyText
          text="Free"
          speed={3}
          className="text-emerald-700 dark:text-emerald-400"
        />
      </div>
    );
  }

  // Exact Paid Price
  if (typeof price === "number" && price > 0) {
    return (
      <div
        className={cn(
          "font-bold text-lg text-foreground tracking-tight",
          className,
        )}
      >
        ${price.toFixed(2)}
      </div>
    );
  }

  // On Request (Undefined or Null)
  return (
    <div className={cn("text-sm font-medium text-muted-foreground", className)}>
      On Request
    </div>
  );
}
