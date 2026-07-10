"use client";

import { AnimatePresence } from "framer-motion";
import { LeaderboardEntryDto, MyRankDto } from "@/domain/leaderboard/contracts/leaderboard.types";
import { LeaderboardRow } from "./LeaderboardRow";
import { LeaderboardMyRank } from "./LeaderboardMyRank";
import { LeaderboardEmptyState } from "./LeaderboardEmptyState";

interface LeaderboardTableProps {
  entries: LeaderboardEntryDto[];
  myRank?: MyRankDto | null;
}

export function LeaderboardTable({ entries, myRank }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return <LeaderboardEmptyState />;
  }

  // Check if my rank is already in the top entries list
  const isMyRankInTop10 = entries.some(e => e.isCurrentUser);
  const showMyRankSticky = myRank && myRank.rank && !isMyRankInTop10;

  return (
    <div 
      className="w-full max-w-4xl mx-auto rounded-xl border bg-card/50 shadow-xl backdrop-blur-md overflow-hidden p-6"
      role="table"
      aria-label="Course Leaderboard"
      aria-live="polite"
    >
      <div className="flex flex-col space-y-3" role="rowgroup">
        <AnimatePresence mode="popLayout">
          {entries.map((entry) => (
            <div key={entry.rank} role="row">
              <LeaderboardRow entry={entry} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {showMyRankSticky && (
        <div role="rowgroup">
          <LeaderboardMyRank myRank={myRank} />
        </div>
      )}
    </div>
  );
}
