"use client";

import { motion } from "framer-motion";
import { ScoreBreakdown, CATEGORY_WEIGHTS } from "@/domain/leaderboard/contracts/leaderboard.types";
import { useTranslations } from "next-intl";

interface ScoreBreakdownPanelProps {
  breakdown: ScoreBreakdown;
  totalScore: number;
}

export function ScoreBreakdownPanel({ breakdown, totalScore }: ScoreBreakdownPanelProps) {
  const t = useTranslations("leaderboard.breakdown");
  // Safe percentage calculation to avoid division by zero
  const getPercentage = (value: number, weight: number) => {
    // If totalScore is 0, just show 0
    if (totalScore === 0) return 0;
    
    // The value here is raw points. 
    // The weighted contribution to the total score is: value * weight
    // Percentage of total score: (value * weight / totalScore) * 100
    return Math.round((value * weight / totalScore) * 100);
  };

  const categories = [
    {
      name: t("quizzes"),
      value: breakdown.quizzesAndExams,
      weight: CATEGORY_WEIGHTS.quizzesAndExams,
      color: "bg-blue-500",
    },
    {
      name: t("participation"),
      value: breakdown.participation,
      weight: CATEGORY_WEIGHTS.participation,
      color: "bg-green-500",
    },
    {
      name: t("completion"),
      value: breakdown.courseCompletion,
      weight: CATEGORY_WEIGHTS.courseCompletion,
      color: "bg-purple-500",
    }
  ];

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="pt-2 pb-4 px-4 bg-muted/30 border-x border-b rounded-b-xl space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t("title")}
        </h4>
        
        {categories.map((cat) => {
          const pct = getPercentage(cat.value, cat.weight);
          return (
            <div key={cat.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{cat.name}</span>
                <span className="tabular-nums font-semibold">
                  {cat.value.toLocaleString()} <span className="text-muted-foreground font-normal text-xs">pts</span>
                  {" "}
                  <span className="text-muted-foreground font-normal text-xs ml-1">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${cat.color}`} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
