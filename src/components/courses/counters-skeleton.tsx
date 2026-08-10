import { Skeleton } from "@/components/ui/skeleton";

interface CountersSkeletonProps {
  variant?: "default" | "hero";
}

export function CountersSkeleton({ variant = "default" }: CountersSkeletonProps) {
  if (variant === "hero") {
    return (
      <>
        <div className="flex items-center gap-1.5 text-amber-400">
          <Skeleton className="h-4 w-4 rounded-full bg-amber-400/20" />
          <Skeleton className="h-4 w-8 bg-white/10 rounded-md" />
          <Skeleton className="h-4 w-20 bg-slate-400/20 rounded-md" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-4 rounded-full bg-slate-400/20" />
          <Skeleton className="h-4 w-24 bg-slate-400/20 rounded-md" />
        </div>
      </>
    );
  }

  return (
    <div className="flex gap-8 py-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
