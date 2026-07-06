import {
  LessonPageView,
  generateLessonMetadata,
} from "../../../../../../(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-page-view";
import type { Metadata } from "next";

interface LessonPageProps {
  params: Promise<{ locale: string; slug: string; lessonId: string }>;
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { slug, lessonId } = await params;
  return generateLessonMetadata({ slug, lessonId });
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonId } = await params;
  return <LessonPageView slug={slug} lessonId={lessonId} />;
}
