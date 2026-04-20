import { Metadata } from "next";
import { VideoPlayer } from "./_components/video-player";
import { LessonSidebar } from "./_components/lesson-sidebar";
import { LessonLayoutShell } from "./_components/lesson-layout-shell";
import { LessonHeader } from "./_components/lesson-header";
import { LessonMeta } from "./_components/lesson-meta";

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
  { id: "lesson-1", title: "Introduction to the Core Concepts", duration: "5:23", isCompleted: true },
  { id: "lesson-2", title: "Setting up your Environment", duration: "12:45", isCompleted: true },
  { id: "lesson-3", title: "Understanding State and Lifecycle", duration: "18:10" },
  { id: "lesson-4", title: "Advanced Component Patterns", duration: "25:30", isLocked: true },
  { id: "lesson-5", title: "Performance Optimization Tricks", duration: "14:15", isLocked: true },
];

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonId } = await params;
  const currentLesson = MOCK_LESSONS.find((l) => l.id === lessonId) || MOCK_LESSONS[0];
  const lessonIndex = MOCK_LESSONS.findIndex((l) => l.id === currentLesson.id);

  return (
    // Pass lessonId as lessonKey to trigger AnimatePresence lesson transitions
    <LessonLayoutShell lessonKey={lessonId}>
      {/* ─────────────────────────────────────────────────────────────
          CINEMATIC AMBIENT MESH — creates the color field that
          glass surfaces refract. Fixed so it stays during scroll.
         ───────────────────────────────────────────────────────────── */}
      <div key="ambient-mesh" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#050812]" />
        {/* Top-left hero glow */}
        <div className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-blue-600/25 blur-[130px]" />
        {/* Mid-right accent */}
        <div className="absolute top-[30%] -right-[5%] h-[50vh] w-[50vh] rounded-full bg-violet-600/20 blur-[110px]" />
        {/* Bottom emerald wash */}
        <div className="absolute -bottom-[10%] left-[25%] h-[55vh] w-[55vh] rounded-full bg-emerald-500/10 blur-[140px]" />
        {/* Noise texture for cinematic film grain */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          FULL-SCREEN LAYOUT SHELL
         ───────────────────────────────────────────────────────────── */}
      <div key="lesson-content" className="relative z-10 flex min-h-[100dvh] flex-col text-white font-sans">
        
        {/* STICKY GLASS HEADER */}
        <LessonHeader slug={slug} lessonTitle={currentLesson.title} />

        {/* THEATER STAGE — main content area */}
        <main className="flex flex-1 flex-col lg:flex-row gap-6 p-4 lg:p-6 xl:p-8 w-full max-w-[1800px] mx-auto">
          
          {/* ── LEFT: VIDEO + META ───────────────────────────── */}
          <div className="flex flex-1 flex-col gap-5 min-w-0">
            
            {/* Video Player — 16:9 aspect, fills available width */}
            <VideoPlayer
              key={currentLesson.id}
              title={currentLesson.title}
              src="youtube/_cMxraX_5RE"
              thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
            />

            {/* ── LESSON META BLOCK ── */}
            <LessonMeta
              lessonId={currentLesson.id}
              title={currentLesson.title}
              lessonIndex={lessonIndex}
              totalLessons={MOCK_LESSONS.length}
              courseSlug={slug}
              prevLessonId={MOCK_LESSONS[lessonIndex - 1]?.id}
              prevLessonTitle={MOCK_LESSONS[lessonIndex - 1]?.title}
              nextLessonId={MOCK_LESSONS[lessonIndex + 1]?.id}
              nextLessonTitle={MOCK_LESSONS[lessonIndex + 1]?.title}
              duration="18 min"
            />
          </div>

          {/* ── RIGHT: CURRICULUM SIDEBAR ───────────────────── */}
          <LessonSidebar
            courseSlug={slug}
            currentLessonId={currentLesson.id}
            lessons={MOCK_LESSONS}
            className="hidden lg:flex shrink-0 w-80 xl:w-96"
          />
        </main>
      </div>
    </LessonLayoutShell>
  );
}
