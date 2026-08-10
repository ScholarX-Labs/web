import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createNextCourseDomain } from "@/domain/courses";
import { CourseHero, CourseStaticCounters } from "./_components/course-hero";
import { CourseStickyCta } from "./_components/course-sticky-cta";
import { CourseCurriculum } from "./_components/course-curriculum";
import { CourseInstructor } from "./_components/course-instructor";
import { EnrollModal } from "@/components/courses/enroll-modal";
import { CourseCertificateLinkCard } from "@/components/certificates/course-certificate-link-card";
import type { LearnerCertificateLinkDto } from "@/domain/certificates/application/certificate-verification-query.service";
import { ensureCourseCompletionCertificate } from "@/lib/certificates/course-certificate-repair";
import { CourseCountersSection } from "@/components/courses/course-counters-section";

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
      certificateLink = await ensureCourseCompletionCertificate({
        userId: session.user.id,
        courseId: course.id,
        courseTitle: course.title,
        recipientName:
          session.user.name ?? session.user.email ?? "ScholarX Learner",
        recipientEmail: session.user.email,
      });
    } catch (error) {
      console.error("[CourseDetailPage] Certificate repair guard failed:", error);
    }
  }

  // Determine if enrollment modal should open automatically
  const shouldOpenEnrollIntent = intent === "enroll";
  
  return (
    <div className="relative w-full flex flex-col min-h-screen pb-24 bg-white dark:bg-card">
      <CourseHero 
        course={course} 
        countersSlot={
          <CourseCountersSection 
            courseId={course.id} 
            fallbackStudentsCount={course.studentsCount ?? 0}
            fallbackRating={course.rating ? Number(course.rating) : null}
            fallbackTotalRatings={course.totalRatings}
            fallback={
              <CourseStaticCounters
                rating={course.rating}
                totalRatings={course.totalRatings}
                studentsCount={course.studentsCount}
              />
            }
            variant="hero"
          />
        }
      />

      {/* Navigation Tabs */}
      <div className="border-b bg-card">
        <div className="container mx-auto max-w-5xl px-4">
          <nav className="flex items-center gap-8" aria-label="Course navigation">
            <div className="border-b-2 border-primary py-4 text-sm font-bold text-primary">
              Overview
            </div>
            <a
              href={ROUTES.COURSE_LEADERBOARD(course.slug)}
              className="border-b-2 border-transparent py-4 text-sm font-bold text-muted-foreground hover:border-muted hover:text-foreground transition-colors"
            >
              Leaderboard
            </a>
          </nav>
        </div>
      </div>

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
