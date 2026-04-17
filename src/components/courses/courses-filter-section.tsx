"use client";

import { useMemo } from "react";
import { useUiStore } from "@/stores/ui.store";
import { CourseGrid } from "./course-grid";
import { CourseCard } from "./course-card";
import { Course } from "@/types/course.types";
import { CourseDetailSurfacePortal } from "./course-detail-surface-portal";

// Maps hero filter pill labels to course category/level values
const FILTER_MAP: Record<string, (course: Course) => boolean> = {
  "Career Preparation": (c) =>
    ["Engineering", "Backend", "Systems"].includes(c.category ?? ""),
  "Skill Development": (c) =>
    ["Design", "Engineering", "Backend", "Systems"].includes(c.category ?? ""),
  "Free / Paid": (c) => (c.price ?? 0) === 0,
  "Online / In-Person": () => true, // all are online; included for future use
  "International Opportunities": () => true, // informational tag
};

interface CoursesFilterSectionProps {
  courses: Course[];
}

export function CoursesFilterSection({ courses }: CoursesFilterSectionProps) {
  const { courseSearch, activeCourseFilters } = useUiStore();

  const filtered = useMemo(() => {
    let result = courses;

    if (courseSearch.trim()) {
      const q = courseSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.category ?? "").toLowerCase().includes(q) ||
          (c.instructor?.name ?? "").toLowerCase().includes(q),
      );
    }

    if (activeCourseFilters.length > 0) {
      result = result.filter((c) =>
        activeCourseFilters.every((tag) => FILTER_MAP[tag]?.(c) ?? true),
      );
    }

    return result;
  }, [courses, courseSearch, activeCourseFilters]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 w-full">
      {filtered.length > 0 ? (
        <CourseGrid>
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </CourseGrid>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-2xl font-bold text-hero-heading mb-2">
            No courses found
          </p>
          <p className="text-muted-foreground text-sm max-w-xs">
            Try a different search term or clear the active filters.
          </p>
        </div>
      )}

      <CourseDetailSurfacePortal />
    </div>
  );
}
