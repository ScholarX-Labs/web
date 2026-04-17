import { CoursesHero } from "@/components/courses/courses-hero";
import { CoursesView } from "@/components/courses/courses-view";
import { createNextCourseDomain } from "@/domain/courses";
import { getSession } from "@/lib/dal";

export const dynamic = "force-dynamic";

async function getLatestCourses() {
  try {
    const session = await getSession();
    const courseDomain = createNextCourseDomain();
    const data = await courseDomain.catalog.list(
      {
        page: 1,
        limit: 9,
      },
      session?.user.id,
    );
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
      <CoursesView courses={courses} />
    </div>
  );
}
