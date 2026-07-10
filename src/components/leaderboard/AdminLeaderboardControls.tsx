"use client";

import { Download } from "lucide-react";

import { useTranslations } from "next-intl";

interface AdminLeaderboardControlsProps {
  courseId: string;
  window: string;
}

export function AdminLeaderboardControls({ courseId, window: leaderboardWindow }: AdminLeaderboardControlsProps) {
  const t = useTranslations("leaderboard.admin");
  
  const handleExportCSV = () => {
    // Trigger download via the API endpoint
    window.location.href = `/api/leaderboard/${courseId}/export?window=${leaderboardWindow}`;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 border border-warning/50 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-warning mt-0.5 text-xl font-bold">ⓘ</div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">{t("title")}</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>
      </div>
      <button
        onClick={handleExportCSV}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
      >
        <Download className="mr-2 h-4 w-4" />
        {t("exportCsv")}
      </button>
    </div>
  );
}
