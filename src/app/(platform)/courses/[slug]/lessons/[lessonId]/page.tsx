import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { VideoPlayer } from "./_components/video-player";
import { LessonSidebar } from "./_components/lesson-sidebar";

interface LessonPageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { lessonId } = await params;
  return {
    title: `Lesson ${lessonId} | ScholarX`,
    description: "Premium course lesson viewer.",
  };
}

// MOCK DATA for layout testing
const MOCK_LESSONS = [
  {
    id: "lesson-1",
    title: "Introduction to the Core Concepts",
    duration: "5:23",
    isCompleted: true,
  },
  {
    id: "lesson-2",
    title: "Setting up your Environment",
    duration: "12:45",
    isCompleted: true,
  },
  {
    id: "lesson-3",
    title: "Understanding State and Lifecycle",
    duration: "18:10",
  },
  {
    id: "lesson-4",
    title: "Advanced Component Patterns",
    duration: "25:30",
    isLocked: true,
  },
  {
    id: "lesson-5",
    title: "Performance Optimization Tricks",
    duration: "14:15",
    isLocked: true,
  },
];

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonId } = await params;

  // Assuming current lesson is the matched one or fallback to lesson-1 for preview
  const currentLesson = MOCK_LESSONS.find((l) => l.id === lessonId) || MOCK_LESSONS[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black/95 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-hero-blue/20">
      {/* 
        PREMIUM NAVIGATION BAR (APPLE-LIKE)
        Slim, blur-backed, and focused on context.
      */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 lg:px-8 py-3 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-slate-200 dark:hover:bg-white/10">
            <Link href={`/courses/${slug}`}>
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <span className="sr-only">Back to Course</span>
            </Link>
          </Button>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-hero-blue">
              Course Player
            </span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
              {currentLesson.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex rounded-full gap-2 text-slate-600 dark:text-slate-300">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          {/* Progress / Context */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="w-2 h-2 rounded-full bg-hero-blue animate-pulse" />
            <span className="text-xs font-medium">In Progress</span>
          </div>
        </div>
      </header>

      {/* 
        MAIN CONTENT / THEATER STAGE
      */}
      <main className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto p-4 lg:p-6 xl:p-8 gap-6 lg:gap-8">
        
        {/* VIDEO PLAYER SECTION */}
        <div className="flex-1 flex flex-col gap-6">
          <VideoPlayer
            title={currentLesson.title}
            src="youtube/_cMxraX_5RE"
            thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
          />

          {/* BELOW VIDEO METADATA */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {currentLesson.title}
            </h1>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                In this lesson, we will dive deep into the core mechanics of 
                building robust, scalable front-end architectures. By combining 
                industry-standard patterns with fluid UI aesthetics, you'll learn 
                how to craft experiences that resonate deeply with users.
              </p>
              <p>
                Ensure you have completed the prerequisites before continuing. 
                All project assets are available in the course repository.
              </p>
            </div>
          </div>
        </div>

        {/* SIDEBAR FOR CURRICULUM NAVIGATION */}
        <LessonSidebar
          courseSlug={slug}
          currentLessonId={currentLesson.id}
          lessons={MOCK_LESSONS}
          className="shrink-0"
        />
        
      </main>
    </div>
  );
}
