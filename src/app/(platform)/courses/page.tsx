import { CoursesHero } from "@/components/courses/courses-hero";
import { CoursesView } from "@/components/courses/courses-view";
import { createNextCourseDomain } from "@/domain/courses";
import { getSession } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const session = await getSession();
  const courseDomain = createNextCourseDomain();
  const [data, categories] = await Promise.all([
    courseDomain.catalog.list({ page: 1, limit: 9 }, session?.user.id),
    courseDomain.catalog.listCategories(),
  ]);

  return (
    <div className="w-full flex flex-col pb-10">
      <CoursesHero categories={categories} />
      <CoursesView courses={data.items} categories={categories} />
    </div>
  );
}
