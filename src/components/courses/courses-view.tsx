"use client";

import { useUiStore } from "@/stores/ui.store";
import { LatestCoursesSection } from "./latest-courses-section";
import { CoursesFilterSection } from "./courses-filter-section";
import type { Course } from "@/types/course.types";
import type { CourseCategory } from "@/domain/courses";

interface CoursesViewProps {
  courses: Course[];
  categories: CourseCategory[];
}

export function CoursesView({ courses, categories }: CoursesViewProps) {
  const { courseSearch, activeCourseFilters } = useUiStore();
  
  const isFiltering = courseSearch.trim().length > 0 || activeCourseFilters.length > 0;

  if (isFiltering) {
    return <CoursesFilterSection courses={courses} categories={categories} />;
  }

  return <LatestCoursesSection courses={courses} />;
}
