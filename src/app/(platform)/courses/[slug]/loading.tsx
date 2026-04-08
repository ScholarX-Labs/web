"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function CourseDetailLoading() {
  return (
    <div className="w-full flex flex-col min-h-screen pb-24 animate-in fade-in duration-500">
      {/* Hero Skeleton */}
      <div className="w-full bg-slate-50 dark:bg-card border-b pb-12 pt-20 px-4 md:px-8">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row gap-8 lg:gap-12">
          
          {/* Thumb Skeleton */}
          <div className="w-full md:w-[45%] shrink-0">
            <Skeleton className="aspect-video w-full rounded-2xl" />
          </div>

          {/* Info Skeleton */}
          <div className="w-full md:w-[55%] flex flex-col justify-center space-y-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-3/4 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-12 w-32 rounded-full" />
              <Skeleton className="h-12 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto max-w-5xl px-4 py-12 flex flex-col gap-12 lg:gap-16">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 rounded-md" />
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
