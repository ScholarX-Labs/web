import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="h-[45vh] w-full animate-pulse bg-slate-200/70 dark:bg-slate-800/70" />
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col space-y-6 py-6 sm:py-8">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[400px] w-full rounded-[24px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
