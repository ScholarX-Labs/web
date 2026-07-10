"use client";

import { useState } from "react";
import { MyRankDto } from "@/domain/leaderboard/contracts/leaderboard.types";
import { LeaderboardRow } from "./LeaderboardRow";
import { useSession } from "@/lib/auth-client";
import { ScoreBreakdownPanel } from "./ScoreBreakdownPanel";
import { AnimatePresence } from "framer-motion";

import { useTranslations } from "next-intl";

interface LeaderboardMyRankProps {
  myRank: MyRankDto;
}

export function LeaderboardMyRank({ myRank }: LeaderboardMyRankProps) {
  const { data: session } = useSession();
  const [isBreakdownVisible, setIsBreakdownVisible] = useState(false);
  const t = useTranslations("leaderboard.myRank");
  const tTabs = useTranslations("leaderboard.tabs");
  
  if (!myRank.rank || !session?.user) {
    if (session?.user && myRank.window !== "all") {
      const windowText = myRank.window === "week" ? tTabs("week") : tTabs("month");
      return (
        <div className="relative mt-4 pt-4 border-t-2 border-dashed">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            {t("you")}
          </div>
          <div className="text-center py-3 text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
            {t("noActivity", { window: windowText })}
          </div>
        </div>
      );
    }
    return null; // Not ranked yet or not logged in
  }

  const mockEntry = {
    rank: myRank.rank,
    displayName: session.user.name || t("you"),
    avatarUrl: session.user.image || null,
    totalScore: myRank.totalScore,
    isCurrentUser: true,
    isPrivate: myRank.isAnonymous || myRank.isGloballyPrivate,
    isGloballyPrivate: myRank.isGloballyPrivate,
  };

  return (
    <div className="relative mt-4 pt-4 border-t-2 border-dashed">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">
        {t("you")}
      </div>
      
      <button 
        className="w-full text-left transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        onClick={() => setIsBreakdownVisible(!isBreakdownVisible)}
        aria-expanded={isBreakdownVisible}
      >
        <LeaderboardRow entry={mockEntry} isMyRank={true} />
      </button>

      <AnimatePresence>
        {isBreakdownVisible && (
          <ScoreBreakdownPanel breakdown={myRank.categoryBreakdown} totalScore={myRank.totalScore} />
        )}
      </AnimatePresence>
    </div>
  );
}
