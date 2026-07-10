"use client";

import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

export function ScoringInfoModal() {
  const t = useTranslations("leaderboard.scoringInfo");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center justify-center rounded-full w-8 h-8 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Info className="w-5 h-5" />
          <span className="sr-only">{t("button")}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{t("weights.quizzes")}</p>
                <p className="text-xs text-muted-foreground">{t("weights.quizzesDesc")}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{t("weights.participation")}</p>
                <p className="text-xs text-muted-foreground">{t("weights.participationDesc")}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{t("weights.completion")}</p>
                <p className="text-xs text-muted-foreground">{t("weights.completionDesc")}</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground italic mt-4">
            {t("note")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
