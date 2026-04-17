import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createNextCourseDomain } from "@/domain/courses";
import { CourseHero } from "./_components/course-hero";
import { CourseStickyCta } from "./_components/course-sticky-cta";
import { CourseCurriculum } from "./_components/course-curriculum";
import { CourseInstructor } from "./_components/course-instructor";
import { EnrollModal } from "@/components/courses/enroll-modal";

import { getSession } from "@/lib/dal";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ intent?: string }>;
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const session = await getSession();
    const courseDomain = createNextCourseDomain();
    const course = await courseDomain.catalog.getBySlug(slug, session?.user.id);
    return {
      title: `${course.title} | ScholarX`,
      description: course.description,
    };
  } catch {
    return {
      title: "Course Not Found | ScholarX",
    };
  }
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: CourseDetailPageProps) {
  const { slug } = await params;
  const { intent } = await searchParams;

  let course;
  const session = await getSession();

  try {
    const courseDomain = createNextCourseDomain();
    course = await courseDomain.catalog.getBySlug(slug, session?.user.id);
  } catch {
    notFound();
  }

  // Determine if enrollment modal should open automatically
  const shouldOpenEnrollIntent = intent === "enroll";

  return (
    <div className="relative w-full flex flex-col min-h-screen pb-24 bg-white dark:bg-card">
      <CourseHero course={course} />

      <div className="container mx-auto max-w-5xl px-4 py-12 flex flex-col gap-12 lg:gap-16">
        <CourseCurriculum course={course} />
        <CourseInstructor instructor={course.instructor} />
      </div>

      <CourseStickyCta course={course} />

      <EnrollModal course={course} autoOpen={shouldOpenEnrollIntent} />
    </div>
  );
}
