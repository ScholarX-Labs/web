import { Suspense } from "react";
import { CourseCountersDisplay } from "./course-counters-display";
import { CountersSkeleton } from "./counters-skeleton";
import { createNextCourseDomain } from "@/domain/courses/factory/next-course-domain.factory";

interface CourseCountersSectionProps {
  courseId: string;
  fallbackStudentsCount: number;
  variant?: "default" | "hero";
  fallback?: React.ReactNode;
}

async function CountersDataFetch({ courseId, fallbackStudentsCount, variant, fallback }: CourseCountersSectionProps) {
  const domain = createNextCourseDomain();
  const metrics = await domain.metrics.getCourseMetrics(courseId, fallbackStudentsCount);

  if (!metrics) {
    return <>{fallback}</>; // Fallback entirely if we can't load data
  }

  return <CourseCountersDisplay initialMetrics={metrics} variant={variant} />;
}

export function CourseCountersSection({
  courseId,
  fallbackStudentsCount,
  variant = "default",
  fallback,
}: CourseCountersSectionProps) {
  return (
    <Suspense fallback={<CountersSkeleton variant={variant} />}>
      <CountersDataFetch courseId={courseId} fallbackStudentsCount={fallbackStudentsCount} variant={variant} fallback={fallback} />
    </Suspense>
  );
}
