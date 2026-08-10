import { Suspense } from "react";
import { CourseCountersDisplay } from "./course-counters-display";
import { CountersSkeleton } from "./counters-skeleton";
import { createNextCourseDomain } from "@/domain/courses/factory/next-course-domain.factory";

interface CourseCountersSectionProps {
  courseId: string;
  fallbackStudentsCount: number;
  fallbackRating?: number | null;
  fallbackTotalRatings?: number | null;
  variant?: "default" | "hero";
  fallback?: React.ReactNode;
}

async function CountersDataFetch({ 
  courseId, 
  fallbackStudentsCount, 
  fallbackRating,
  fallbackTotalRatings,
  variant, 
  fallback 
}: CourseCountersSectionProps) {
  const domain = createNextCourseDomain();
  const metrics = await domain.metrics.getCourseMetrics(courseId, {
    enrollmentCount: fallbackStudentsCount,
    ratingCount: fallbackTotalRatings ?? undefined,
    averageRating: fallbackRating ?? undefined,
  });

  if (!metrics) {
    return <>{fallback}</>; // Fallback entirely if we can't load data
  }

  return <CourseCountersDisplay initialMetrics={metrics} variant={variant} />;
}

export function CourseCountersSection({
  courseId,
  fallbackStudentsCount,
  fallbackRating,
  fallbackTotalRatings,
  variant = "default",
  fallback,
}: CourseCountersSectionProps) {
  return (
    <Suspense fallback={<CountersSkeleton variant={variant} />}>
      <CountersDataFetch 
        courseId={courseId} 
        fallbackStudentsCount={fallbackStudentsCount} 
        fallbackRating={fallbackRating}
        fallbackTotalRatings={fallbackTotalRatings}
        variant={variant} 
        fallback={fallback} 
      />
    </Suspense>
  );
}
