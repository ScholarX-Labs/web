"use client";

import { useState, useEffect } from "react";
import { LeaderboardWindow, LeaderboardEntryDto, MyRankDto } from "@/domain/leaderboard/contracts/leaderboard.types";
import { LeaderboardTable } from "./LeaderboardTable";
import { ScoringInfoModal } from "./ScoringInfoModal";
import { useLeaderboardEntries, useLeaderboardMyRank } from "@/hooks/queries/use-leaderboard";
import { motion } from "framer-motion";
import { AdminLeaderboardControls } from "./AdminLeaderboardControls";
import { useLocale, useTranslations } from "next-intl";
import { LeaderboardOptOutToggle } from "./LeaderboardOptOutToggle";

interface LeaderboardShellProps {
  courseId: string;
  initialEntries: LeaderboardEntryDto[];
  initialMyRank: MyRankDto | null;
  updatedAt: Date | null;
  isAdmin?: boolean;
}

export function LeaderboardShell({ 
  courseId,
  initialEntries, 
  initialMyRank, 
  updatedAt: initialUpdatedAt,
  isAdmin = false
}: LeaderboardShellProps) {
  const [window, setWindow] = useState<LeaderboardWindow>("all");
  const [timeAgo, setTimeAgo] = useState<string>("");
  const locale = useLocale();
  const t = useTranslations("leaderboard");

  const { data: entriesData } = useLeaderboardEntries(courseId, window, {
    entries: initialEntries,
    updatedAt: initialUpdatedAt,
  });

  const { data: myRank } = useLeaderboardMyRank(courseId, window, initialMyRank);
  
  const currentUpdatedAt = entriesData?.updatedAt;
  
  useEffect(() => {
    if (!currentUpdatedAt) return;
    const updateTimeAgo = () => {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const diff = (currentUpdatedAt.getTime() - Date.now()) / 1000;
      if (Math.abs(diff) < 60) setTimeAgo(rtf.format(Math.round(diff), 'second'));
      else if (Math.abs(diff) < 3600) setTimeAgo(rtf.format(Math.round(diff / 60), 'minute'));
      else if (Math.abs(diff) < 86400) setTimeAgo(rtf.format(Math.round(diff / 3600), 'hour'));
      else setTimeAgo(rtf.format(Math.round(diff / 86400), 'day'));
    };
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [currentUpdatedAt, locale]);
  
  const entries = entriesData?.entries || [];

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {isAdmin && <AdminLeaderboardControls courseId={courseId} window={window} />}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
            <ScoringInfoModal />
          </div>
          {currentUpdatedAt && timeAgo && (
            <p className="text-xs text-muted-foreground">
              {t("lastUpdated")} {timeAgo}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {myRank && (
            <LeaderboardOptOutToggle courseId={courseId} isAnonymous={myRank.isAnonymous} />
          )}

          {/* Stubbed time window selector (Activated fully in US3) */}
          <div className="inline-flex items-center rounded-lg border bg-muted p-1">
            {(["week", "month", "all"] as LeaderboardWindow[]).map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  window === w ? "text-foreground" : "hover:bg-background/50 text-muted-foreground"
                }`}
              >
                {window === w && (
                  <motion.div
                    layoutId="activeWindowTab"
                    className="absolute inset-0 bg-background shadow-sm rounded-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">
                  {w === "week" ? t("tabs.week") : w === "month" ? t("tabs.month") : t("tabs.all")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <LeaderboardTable entries={entries} myRank={myRank} />
    </div>
  );
}
