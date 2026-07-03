import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createNextCourseDomain } from "@/domain/courses";
import { createLeaderboardDomain } from "@/domain/leaderboard/factory";
import { LeaderboardShell } from "@/components/leaderboard/LeaderboardShell";
import { getSession } from "@/lib/dal";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

interface LeaderboardPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: LeaderboardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("leaderboard");
  try {
    const courseDomain = createNextCourseDomain();
    const course = await courseDomain.catalog.getBySlug(slug);
    return {
      title: `${t("title")} - ${course.title} | ScholarX`,
      description: `View the top learners in ${course.title}`,
    };
  } catch {
    return {
      title: `${t("title")} | ScholarX`,
    };
  }
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { slug } = await params;
  const session = await getSession();

  let course;
  try {
    const courseDomain = createNextCourseDomain();
    course = await courseDomain.catalog.getBySlug(slug);
  } catch {
    notFound();
  }

  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "admin";
  const leaderboardDomain = createLeaderboardDomain();

  let topEntriesResult = null;
  let myRankResult = null;
  let hasError = false;

  try {
    // Parallel fetch: top 10 entries and my rank
    const [top, my] = await Promise.all([
      leaderboardDomain.query.getTopEntries(course.id, "all", 10, userId, isAdmin),
      userId 
        ? leaderboardDomain.query.getMyRank(course.id, "all", userId)
        : Promise.resolve(null)
    ]);
    topEntriesResult = top;
    myRankResult = my;
  } catch (error) {
    Sentry.captureException(error);
    hasError = true;
  }

  if (hasError || !topEntriesResult) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="p-8 text-center bg-red-50 text-red-900 rounded-lg border border-red-200">
          <h2 className="text-xl font-bold mb-2">Leaderboard Unavailable</h2>
          <p>We&apos;re having trouble loading the leaderboard right now. Our team has been notified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
      <LeaderboardShell 
        courseId={course.id}
        initialEntries={topEntriesResult.entries} 
        initialMyRank={myRankResult} 
        updatedAt={topEntriesResult.updatedAt}
        isAdmin={isAdmin}
      />
    </div>
  );
}
