"use client";

import { SearchResult } from "@/lib/ai-search/types";
import { Badge } from "@/components/ai-search/ui/badge";
import { Calendar, DollarSign, ArrowRight } from "lucide-react";

interface ScholarshipCardProps {
  result: SearchResult;
  onViewDetails: (result: SearchResult) => void;
}

function getMatchPct(result: SearchResult): number | null {
  const raw = result.match_percentage;
  if (raw == null) return null;
  return raw > 1 ? Math.round(raw) : Math.round(raw * 100);
}

function getCategory(result: SearchResult): string | null {
  if (result.category) return result.category;
  if (result.tags && result.tags.length > 0) return result.tags[0];
  return null;
}

function getMatchColor(pct: number): string {
  if (pct >= 80) return "#16a34a";
  if (pct >= 60) return "var(--scholar-blue)";
  return "#f59e0b";
}

export function ScholarshipCard({
  result,
  onViewDetails,
}: ScholarshipCardProps) {
  const matchPct = getMatchPct(result);
  const category = getCategory(result);

  return (
    <div
      onClick={() => onViewDetails(result)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetails(result);
        }
      }}
      role="button"
      tabIndex={0}
      className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden hover:shadow-md hover:cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Top: category badge + match % */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
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
      <div className="px-5 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-base text-foreground leading-snug mb-1.5">
            {result.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {result.description}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          {(result.fundingLevel || result.funding) && (
            <div className="flex items-center gap-2 text-foreground/80">
              <DollarSign
                className="size-4 shrink-0"
                style={{ color: "var(--scholar-blue)" }}
              />
              <span className="font-medium">
                {result.fundingLevel || result.funding}
              </span>
            </div>
          )}
          {result.deadline && (
            <div className="flex items-center gap-2 text-foreground/80">
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
      <div className="px-5 pb-5 pt-4">
        <button
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5"
          style={{ color: "var(--scholar-blue)" }}
        >
          View Details
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
