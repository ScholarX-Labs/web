import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonLayoutShell } from "./_components/lesson-layout-shell";
import { LessonHeader } from "./_components/lesson-header";
import { LessonClientBridge } from "./_components/lesson-client-bridge";
import { Skeleton } from "@/components/ui/skeleton";
import type { LessonSummary } from "@/types/course.types";
import { requireSession } from "@/lib/dal";

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

// MOCK DATA for layout testing — In production, this would be a server action or API call
const MOCK_LESSONS: LessonSummary[] = [
  {
    id: "lesson-1",
    title: "Introduction to the Core Concepts",
    duration: "5:23",
    isCompleted: true,
    media: {
      // Public sample video for local/dev preview
      src: "https://youtu.be/55NvZjUZIO8",
      thumbnails: "",
      poster: "https://placehold.co/1280x720/png?text=Lesson+1",
    },
  },
  {
    id: "lesson-2",
    title: "Setting up your Environment",
    duration: "12:45",
    isCompleted: true,
    media: {
      src: "https://www.youtube.com/watch?v=kYm8xP1mG58",
      poster: "https://placehold.co/1280x720/png?text=Lesson+2",
    },
  },
  {
    id: "lesson-3",
    title: "Understanding State and Lifecycle",
    duration: "18:10",
    media: {
      src: "https://www.youtube.com/watch?v=O6P86uwfdR0",
      poster: "https://placehold.co/1280x720/png?text=Lesson+3",
    },
  },
  {
    id: "lesson-4",
    title: "Advanced Component Patterns",
    duration: "25:30",
    isLocked: false,
    media: {
      src: "https://www.youtube.com/watch?v=w7ejDZ8SWv8",
      poster: "https://placehold.co/1280x720/png?text=Lesson+4",
    },
  },
  {
    id: "lesson-5",
    title: "Performance Optimization Tricks",
    duration: "14:15",
    isLocked: false,
    media: {
      src: "https://www.youtube.com/watch?v=sIjwL-4T-Z8",
      poster: "https://placehold.co/1280x720/png?text=Lesson+5",
    },
  },
  {
    id: "lesson-6",
    title: "App Router Fundamentals",
    duration: "21:10",
    isLocked: false,
    media: {
      src: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
      poster: "https://placehold.co/1280x720/png?text=Lesson+6",
    },
  },
  {
    id: "lesson-7",
    title: "Server vs Client Components",
    duration: "19:45",
    isLocked: false,
    media: {
      src: "https://www.youtube.com/watch?v=kYm8xP1mG58",
      poster: "https://placehold.co/1280x720/png?text=Lesson+7",
    },
  },
  {
    id: "lesson-8",
    title: "Data Fetching and Caching",
    duration: "32:15",
    isLocked: false,
    media: {
      src: "https://www.youtube.com/watch?v=O6P86uwfdR0",
      poster: "https://placehold.co/1280x720/png?text=Lesson+8",
    },
  },
  {
    id: "lesson-9",
    title: "Server Actions in Depth",
    duration: "28:30",
    isLocked: false,
    media: {
      src: "https://www.youtube.com/watch?v=w7ejDZ8SWv8",
      poster: "https://placehold.co/1280x720/png?text=Lesson+9",
    },
  },
  {
    id: "lesson-10",
    title: "Middleware and Edge Functions",
    duration: "15:20",
    isLocked: false,
    media: {
      src: "https://www.youtube.com/watch?v=sIjwL-4T-Z8",
      poster: "https://placehold.co/1280x720/png?text=Lesson+10",
    },
  },
  {
    id: "lesson-11",
    title: "Authentication Strategies",
    duration: "26:45",
    isLocked: false,
    media: {
      src: "https://www.youtube.com/watch?v=55NvZjUZIO8",
      poster: "https://placehold.co/1280x720/png?text=Lesson+11",
    },
  },
  {
    id: "lesson-12",
    title: "Deployment and Vercel",
    duration: "18:50",
    isLocked: false,
    media: {
      src: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
      poster: "https://placehold.co/1280x720/png?text=Lesson+12",
    },
  },
];

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonId } = await params;

  await requireSession();

  // Robust lookup: allow routes that use numeric lesson ids (e.g. /lessons/1)
  // as well as full ids like "lesson-1". Prefer exact match first, then
  // try numeric index mapping, then a `lesson-${id}` pattern.
  let currentLesson = MOCK_LESSONS.find((l) => l.id === lessonId);
  if (!currentLesson) {
    const numeric = parseInt(lessonId, 10);
    if (!isNaN(numeric)) {
      // map 1 -> index 0
      currentLesson = MOCK_LESSONS[numeric - 1];
    }
  }
  if (!currentLesson) {
    currentLesson = MOCK_LESSONS.find((l) => l.id === `lesson-${lessonId}`);
  }

  // If the lesson doesn't exist or is locked, return a 404.
  if (!currentLesson || currentLesson.isLocked) {
    notFound();
  }

  const lessonIndex = MOCK_LESSONS.findIndex((l) => l.id === currentLesson.id);

  return (
    <LessonLayoutShell lessonKey={lessonId}>
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
        <LessonHeader slug={slug} lessonTitle={currentLesson.title} />

        {/* CONTENT BRIDGE — Wires up interactive states (Client) */}
        <Suspense fallback={<LessonLoadingSkeleton />}>
          <LessonClientBridge
            lessonId={currentLesson.id}
            courseSlug={slug}
            lessonTitle={currentLesson.title}
            lessonIndex={lessonIndex + 1}
            totalLessons={MOCK_LESSONS.length}
            prevLesson={MOCK_LESSONS[lessonIndex - 1]}
            nextLesson={MOCK_LESSONS[lessonIndex + 1]}
            lessons={MOCK_LESSONS}
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
