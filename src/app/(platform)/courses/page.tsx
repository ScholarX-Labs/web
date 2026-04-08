import { CoursesHero } from "@/components/courses/courses-hero";
import { LatestCoursesSection } from "@/components/courses/latest-courses-section";
import { coursesService } from "@/lib/api/courses.service";

export const revalidate = 60;

async function getLatestCourses() {
  try {
    const data = await coursesService.list({ page: 1, limit: 9 });
    return data.items;
  } catch {
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await getLatestCourses();

  return (
    <div className="w-full flex flex-col pb-10">
      <CoursesHero />
      <LatestCoursesSection courses={courses} />
    </div>
  );
}
