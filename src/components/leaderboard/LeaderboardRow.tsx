"use client";

import { motion } from "framer-motion";
import { LeaderboardEntryDto } from "@/domain/leaderboard/contracts/leaderboard.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PrivacyBadge } from "./PrivacyBadge";
import { useTranslations } from "next-intl";

interface LeaderboardRowProps {
  entry: LeaderboardEntryDto;
  isMyRank?: boolean;
}

export function LeaderboardRow({ entry, isMyRank = false }: LeaderboardRowProps) {
  const t = useTranslations("leaderboard.myRank");
  const tLeaderboard = useTranslations("leaderboard");
  const isTop3 = entry.rank <= 3;
  
  // Rank styling based on position - improved contrast for accessibility
  const rankColor = 
    entry.rank === 1 ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/30" :
    entry.rank === 2 ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30" :
    entry.rank === 3 ? "bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/30" :
    "bg-muted text-muted-foreground border-transparent";

  const displayName = entry.displayName === "Anonymous Learner" 
    ? tLeaderboard("anonymous") 
    : entry.displayName;

  return (
    <motion.div
      layoutId={`leaderboard-row-${entry.isCurrentUser ? "me" : entry.displayName}-${entry.rank}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex items-center space-x-4 p-4 rounded-xl border transition-colors",
        isMyRank || entry.isCurrentUser
          ? "bg-primary/5 border-primary/30"
          : "bg-card hover:bg-muted/50 border-transparent",
        isTop3 && !isMyRank && !entry.isCurrentUser && "bg-gradient-to-r from-card to-muted/20"
      )}
    >
      {/* Rank Badge */}
      <div 
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border text-sm font-bold shadow-sm",
          rankColor
        )}
        aria-label={`Rank ${entry.rank}`}
        title={`Rank ${entry.rank}`}
      >
        <span aria-hidden="true">{entry.rank}</span>
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10 border shadow-sm">
        <AvatarImage src={entry.avatarUrl || ""} alt={displayName} />
        <AvatarFallback className={entry.isPrivate ? "bg-muted" : "bg-primary/10 text-primary"}>
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-semibold truncate",
          (isMyRank || entry.isCurrentUser) && "text-primary"
        )}>
          {displayName}
          {entry.isCurrentUser && <span className="ml-2 text-xs font-normal text-muted-foreground">({t("you")})</span>}
          {entry.isPrivate && !entry.isCurrentUser && <PrivacyBadge />}
        </p>
      </div>

      {/* Score */}
      <div className="text-right">
        <p className="text-sm font-bold tabular-nums">
          {entry.totalScore.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          pts
        </p>
      </div>
    </motion.div>
  );
}
