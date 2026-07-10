"use client";

import { Trophy } from "lucide-react";

import { useTranslations } from "next-intl";

interface LeaderboardEmptyStateProps {
  message?: string;
}

export function LeaderboardEmptyState({ 
  message 
}: LeaderboardEmptyStateProps) {
  const t = useTranslations("leaderboard.emptyState");
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card">
      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Trophy className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{t("title")}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-2">
        {message || t("description")}
      </p>
    </div>
  );
}
