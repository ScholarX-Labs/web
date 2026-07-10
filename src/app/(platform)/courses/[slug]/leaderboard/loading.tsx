import { LeaderboardSkeleton } from "@/components/leaderboard/LeaderboardSkeleton";

export default function LeaderboardLoading() {
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
      <LeaderboardSkeleton />
    </div>
  );
}
