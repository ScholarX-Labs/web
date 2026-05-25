"use client";

import { SearchResult } from "@/lib/ai-search/types";
import { Badge } from "@/components/ai-search/ui/badge";
import { Calendar, DollarSign, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ScholarshipCardProps {
  result: SearchResult;
  onViewDetails: (result: SearchResult) => void;
  isSelected?: boolean;
}

function getCategory(result: SearchResult): string | null {
  if (result.category) return result.category;
  if (result.tags && result.tags.length > 0) return result.tags[0];
  return null;
}

export function ScholarshipCard({
  result,
  onViewDetails,
  isSelected,
}: ScholarshipCardProps) {
  const category = getCategory(result);
  const cardId = `scholarship-card-${result.id}`;

  return (
    <motion.div
      layout
      layoutId={cardId}
      animate={{
        opacity: isSelected ? 0 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 26,
        mass: 0.5,
      }}
      onClick={() => onViewDetails(result)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetails(result);
        }
      }}
      role="button"
      tabIndex={0}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] sm:rounded-2xl border border-slate-200/60 dark:border-white/10 flex flex-col h-full min-h-[280px] overflow-hidden shadow-sm hover:shadow-xl hover:cursor-pointer hover:-translate-y-1 transition-all duration-300 group"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-scholar-blue/40 via-scholar-blue to-purple-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* Top: category badge + match % */}
      <div className="relative flex items-start justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {category && (
            <Badge
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full h-auto"
              style={{
                backgroundColor: "var(--scholar-blue-light)",
                color: "var(--scholar-blue-dark)",
                border: "none",
              }}
            >
              {category}
            </Badge>
          )}
          {result.tags &&
            result.tags.slice(1, 3).map((tag) => (
              <Badge
                key={tag}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full h-auto"
                style={{
                  backgroundColor: "var(--x-purple-light)",
                  color: "var(--x-purple)",
                  border: "none",
                }}
              >
                {tag}
              </Badge>
            ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-5 flex-1 flex flex-col gap-3">
        <div>
          <motion.h3
            layoutId={`${cardId}-title`}
            className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-scholar-blue transition-colors line-clamp-2 min-h-[3.5rem]"
          >
            {result.title}
          </motion.h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
            {result.description}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 text-sm pt-2">
          {(result.fundingLevel || result.funding) && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
              <DollarSign
                className="size-4 shrink-0"
                style={{ color: "var(--scholar-blue)" }}
              />
              <span>
                {result.fundingLevel || result.funding}
              </span>
            </div>
          )}
          {result.deadline && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
              <Calendar
                className="size-4 shrink-0"
                style={{ color: "var(--scholar-blue)" }}
              />
              <span>Deadline: {result.deadline}</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA — text link style */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Explore
          </span>
          <button
            className="inline-flex items-center gap-1.5 text-sm font-bold transition-all hover:gap-2.5"
            style={{ color: "var(--scholar-blue)" }}
          >
            View Details
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
