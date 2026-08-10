"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatedCounter } from "./animated-counter";
import { ActivityBadge } from "./activity-badge";
import { Star, Users } from "lucide-react";
import type { CourseMetrics } from "@/domain/courses/contracts/course-metrics.contract";

interface CourseCountersDisplayProps {
  initialMetrics: CourseMetrics;
  variant?: "default" | "hero";
}

export function CourseCountersDisplay({
  initialMetrics,
  variant = "default",
}: CourseCountersDisplayProps) {
  const { data: metrics } = useQuery({
    queryKey: ["course-counters", initialMetrics.courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${initialMetrics.courseId}/counters`);
      if (!res.ok) throw new Error("Failed to fetch counters");
      return res.json() as Promise<CourseMetrics>;
    },
    initialData: initialMetrics,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000,
  });

  const enrollmentDiff = metrics.enrollmentCount - initialMetrics.enrollmentCount;

  if (variant === "hero") {
    return (
      <>
        <div className="flex items-center gap-1.5 text-amber-400">
          <Star className="w-4 h-4 fill-amber-400" />
          <AnimatedCounter
            value={metrics.averageRating}
            label=""
            className="text-white"
            layout="inline"
            abbreviated={false}
          />
          <span className="text-slate-400">
            (
            <AnimatedCounter
              value={metrics.ratingCount}
              label=""
              className="inline"
              layout="inline"
              abbreviated={false}
            />
            {" reviews)"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-slate-400" />
          <div className="flex items-center">
            <AnimatedCounter
              value={metrics.enrollmentCount}
              label="enrolled"
              className="inline"
              layout="inline"
              abbreviated={true}
            />
            <ActivityBadge increment={enrollmentDiff} />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex gap-8 py-4">
      <div className="flex flex-col">
        <div className="flex items-center">
          <AnimatedCounter
            value={metrics.enrollmentCount}
            label="students enrolled"
            className="text-3xl font-bold"
            abbreviated={true}
          />
          <ActivityBadge increment={enrollmentDiff} />
        </div>
      </div>
      <div className="flex flex-col">
        <AnimatedCounter
          value={metrics.ratingCount}
          label="reviews"
          className="text-3xl font-bold"
          abbreviated={false}
        />
      </div>
      <div className="flex flex-col">
        <AnimatedCounter
          value={metrics.averageRating}
          label="average rating"
          suffix="/5"
          className="text-3xl font-bold"
          abbreviated={false}
        />
      </div>
    </div>
  );
}
