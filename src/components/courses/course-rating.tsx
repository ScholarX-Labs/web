import { StarHalf, StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseRatingProps {
  rating: number;
  totalRatings?: number;
  className?: string;
}

export function CourseRating({
  rating,
  totalRatings,
  className,
}: CourseRatingProps) {
  // Clamp rating between 0 and 5
  const clampedRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      aria-label={`Rating: ${clampedRating} out of 5 stars`}
    >
      <div className="flex text-amber-500">
        {Array.from({ length: fullStars }).map((_, i) => (
          <StarIcon key={`full-${i}`} className="h-4 w-4 fill-current" />
        ))}
        {hasHalfStar && <StarHalf className="h-4 w-4 fill-current" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <StarIcon
            key={`empty-${i}`}
            className="h-4 w-4 text-muted-foreground/30"
          />
        ))}
      </div>

      <span className="text-sm font-medium text-foreground">
        {clampedRating.toFixed(1)}
      </span>

      {totalRatings !== undefined && (
        <span className="text-xs text-muted-foreground">({totalRatings})</span>
      )}
    </div>
  );
}
