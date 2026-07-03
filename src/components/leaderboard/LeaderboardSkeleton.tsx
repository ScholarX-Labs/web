"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function LeaderboardSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* Time window selector skeleton */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
