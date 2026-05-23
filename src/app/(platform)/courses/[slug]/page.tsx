import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createCourseProgressDomain, createNextCourseDomain } from "@/domain/courses";
import { CourseHero } from "./_components/course-hero";
import { CourseStickyCta } from "./_components/course-sticky-cta";
import { CourseCurriculum } from "./_components/course-curriculum";
import { CourseInstructor } from "./_components/course-instructor";
import { EnrollModal } from "@/components/courses/enroll-modal";
import { CourseCertificateLinkCard } from "@/components/certificates/course-certificate-link-card";
import { createCertificateDomain } from "@/domain/certificates/factory/certificate-services.factory";
import type { LearnerCertificateLinkDto } from "@/domain/certificates/application/certificate-verification-query.service";

import { getSession } from "@/lib/dal";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

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

  if (course.slug !== slug) {
    const query = intent ? `?intent=${encodeURIComponent(intent)}` : "";
    redirect(`${ROUTES.COURSE_DETAIL(course.slug)}${query}`);
  }

  let certificateLink: LearnerCertificateLinkDto | null = null;

  if (session?.user.id) {
    try {
      const progressDomain = createCourseProgressDomain();
      const progress = await progressDomain.progressQuery.getCourseProgress(
        session.user.id,
        course.id,
      );

      const courseCompleted =
        progress?.status === "completed" &&
        Boolean(progress.completedAt) &&
        Boolean(progress.certificateEligibleAt);

      if (courseCompleted) {
        const certDomain = createCertificateDomain();
        certificateLink =
          await certDomain.verificationQuery.getCourseCompletionCertificateForUser({
            userId: session.user.id,
            courseProgressId: progress.id,
          });
      }
    } catch (error) {
      console.error("[CourseDetailPage] Certificate lookup failed:", error);
    }
  }

  // Determine if enrollment modal should open automatically
  const shouldOpenEnrollIntent = intent === "enroll";

  return (
    <div className="relative w-full flex flex-col min-h-screen pb-24 bg-white dark:bg-card">
      <CourseHero course={course} />

      <div className="container mx-auto max-w-5xl px-4 py-12 flex flex-col gap-12 lg:gap-16">
        {certificateLink ? (
          <CourseCertificateLinkCard
            certificateNumber={certificateLink.certificateNumber}
            certificateUrl={certificateLink.certificateUrl}
            courseTitle={course.title}
            issuedAt={certificateLink.issuedAt}
          />
        ) : null}
        <CourseCurriculum course={course} />
        <CourseInstructor instructor={course.instructor} />
      </div>

      <CourseStickyCta course={course} />

      <EnrollModal course={course} autoOpen={shouldOpenEnrollIntent} />
    </div>
  );
}
