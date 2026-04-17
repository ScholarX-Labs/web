"use client";

import { useUiStore } from "@/stores/ui.store";
import { LatestCoursesSection } from "./latest-courses-section";
import { CoursesFilterSection } from "./courses-filter-section";
import { Course } from "@/types/course.types";

interface CoursesViewProps {
  courses: Course[];
}

export function CoursesView({ courses }: CoursesViewProps) {
  const { courseSearch, activeCourseFilters } = useUiStore();
  
  const isFiltering = courseSearch.trim().length > 0 || activeCourseFilters.length > 0;

  if (isFiltering) {
    return <CoursesFilterSection courses={courses} />;
  }

  return <LatestCoursesSection courses={courses} />;
}
