import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonLayoutShell } from "./_components/lesson-layout-shell";
import { LessonHeader } from "./_components/lesson-header";
import { LessonClientBridge } from "./_components/lesson-client-bridge";
import { createCourseProgressDomain, createNextCourseDomain } from "@/domain/courses";
import { createCertificateDomain } from "@/domain/certificates/factory/certificate-services.factory";
import type { LearnerCertificateLinkDto } from "@/domain/certificates/application/certificate-verification-query.service";
import { isNextCourseError } from "@/domain/courses/application/next-course.errors";
import { getSession, requireSession } from "@/lib/dal";

interface LessonPageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { slug, lessonId } = await params;
  try {
    const session = await getSession();
    const courseDomain = createNextCourseDomain();
    const lessonData = await courseDomain.catalog.getLesson(
      slug,
      lessonId,
      session?.user.id,
    );
    return {
      title: `${lessonData.currentLesson.title} | ScholarX`,
      description: `Lesson: ${lessonData.currentLesson.title} — ${lessonData.course.title}`,
    };
  } catch {
    return {
      title: "Lesson | ScholarX",
      description: "Premium course lesson viewer.",
    };
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonId } = await params;

  const session = await requireSession();
  const courseDomain = createNextCourseDomain();

  let lessonData;
  try {
    lessonData = await courseDomain.catalog.getLesson(
      slug,
      lessonId,
      session.user.id,
    );
  } catch (error) {
    if (isNextCourseError(error) && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }

  // If the lesson is locked (user not subscribed), return a 404.
  if (lessonData.currentLesson.isLocked) {
    notFound();
  }

  const currentLesson = lessonData.currentLesson;
  const allLessons = lessonData.allLessons;
  const lessonIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const canonicalCourseSlug = lessonData.course.slug;
  let certificateLink: LearnerCertificateLinkDto | null = null;

  try {
    const progressDomain = createCourseProgressDomain();
    const progress = await progressDomain.progressQuery.getCourseProgress(
      session.user.id,
      lessonData.course.id,
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
    console.error("[LessonPage] Certificate lookup failed:", error);
  }

  return (
    <LessonLayoutShell lessonKey={currentLesson.id}>
      {/* ─────────────────────────────────────────────────────────────
          CINEMATIC AMBIENT MESH — creates the color field that
          glass surfaces refract. Fixed and animated for "life".
         ───────────────────────────────────────────────────────────── */}
      <div
        key="ambient-mesh"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[#050812]" />

        {/* Global Drift Animations */}
        <style>{`
          @keyframes drift-halo {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(50px, 80px) scale(1.15); }
            66% { transform: translate(-30px, 40px) scale(0.9); }
            100% { transform: translate(0, 0) scale(1); }
          }
          .animate-halo {
            animation: drift-halo 30s ease-in-out infinite alternate;
          }
          .animate-halo-slow {
            animation: drift-halo 45s ease-in-out infinite alternate-reverse;
          }
        `}</style>

        {/* Top-left hero glow (Blue) */}
        <div className="animate-halo absolute -top-[20%] -left-[10%] h-[90vh] w-[90vh] rounded-full bg-blue-600/20 blur-[130px]" />

        {/* Mid-right accent (Violet) */}
        <div className="animate-halo-slow absolute top-[30%] -right-[5%] h-[70vh] w-[70vh] rounded-full bg-violet-600/15 blur-[110px]" />

        {/* Bottom wash (Cyan/Emerald) */}
        <div className="animate-halo absolute -bottom-[10%] left-[25%] h-[60vh] w-[60vh] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYERED LAYOUT
         ───────────────────────────────────────────────────────────── */}
      <div
        key="lesson-content"
        className="relative flex min-h-[100dvh] flex-col text-white font-sans"
      >
        {/* STICKY GLASS HEADER */}
        <LessonHeader slug={canonicalCourseSlug} lessonTitle={currentLesson.title} />

        {/* CONTENT BRIDGE — Wires up interactive states (Client) */}
        <Suspense fallback={<LessonLoadingSkeleton />}>
          <LessonClientBridge
            lessonId={currentLesson.id}
            courseSlug={canonicalCourseSlug}
            courseId={lessonData.course.id}
            courseTitle={lessonData.course.title}
            lessonTitle={currentLesson.title}
            lessonIndex={lessonIndex + 1}
            totalLessons={allLessons.length}
            prevLesson={allLessons[lessonIndex - 1]}
            nextLesson={allLessons[lessonIndex + 1]}
            lessons={allLessons}
            initialIsCompleted={Boolean(currentLesson.isCompleted)}
            certificateLink={certificateLink}
          />
        </Suspense>
      </div>
    </LessonLayoutShell>
  );
}

function LessonLoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col lg:flex-row gap-6 p-6 lg:p-8 w-full max-w-[1800px] mx-auto animate-pulse">
      <div className="flex flex-1 flex-col gap-6">
        <div className="aspect-video w-full rounded-3xl bg-white/5" />
        <div className="h-40 w-full rounded-2xl bg-white/5" />
      </div>
      <div className="hidden lg:block w-80 xl:w-96 rounded-3xl bg-white/5" />
    </div>
  );
}
