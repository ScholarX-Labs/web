import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { createNextCourseDomain } from "@/domain/courses";
import { getSession } from "@/lib/dal";

interface LessonsRootPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * LessonsRootPage — Redirects to the first lesson of the course.
 * This ensures that "Opening the lesson page" without a specific ID 
 * lands the user on the first lesson automatically.
 */
export default async function LessonsRootPage({ params }: LessonsRootPageProps) {
  const { slug } = await params;
  const session = await getSession();
  const courseDomain = createNextCourseDomain();
  const course = await courseDomain.catalog.getBySlug(slug, session?.user.id);
  const firstLessonId = course.lessons?.[0]?.id;

  if (!firstLessonId) {
    redirect(ROUTES.COURSE_DETAIL(course.slug));
  }

  redirect(ROUTES.LESSON(course.slug, firstLessonId));
}
