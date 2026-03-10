import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CourseCardSkeletonProps {
  className?: string;
}

export function CourseCardSkeleton({ className }: CourseCardSkeletonProps) {
  return (
    <Card
      className={cn(
        "flex flex-col h-full overflow-hidden border-border/50",
        className,
      )}
    >
      {/* Image Skeleton */}
      <Skeleton className="aspect-[16/9] w-full rounded-none" />

      {/* Content Skeleton */}
      <CardContent className="flex flex-col flex-1 gap-4 p-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center gap-4 mt-auto pt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>

      {/* Footer Skeleton */}
      <CardFooter className="flex items-center justify-between p-5 pt-0 border-t border-border/40 bg-muted/5 h-[68px] mt-auto">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-20" />
      </CardFooter>
    </Card>
  );
}
