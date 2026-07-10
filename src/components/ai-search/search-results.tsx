"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp, ChevronDown } from "lucide-react";
import { SearchResult } from "@/lib/ai-search/types";
import { ScholarshipCard } from "./scholarship-card";
import { ScholarshipModal } from "./scholarship-modal-enhanced";
import { Skeleton } from "@/components/ai-search/ui/skeleton";
import { Button } from "@/components/ai-search/ui/button";

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  onScrollToTop: () => void;
}

type SortOption = "match" | "deadline";

const PAGE_SIZE = 6;

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-7 w-12" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

function sortResults(
  results: SearchResult[],
  sortBy: SortOption,
): SearchResult[] {
  const sorted = [...results];
  if (sortBy === "match") {
    sorted.sort(
      (a, b) => (b.match_percentage ?? 0) - (a.match_percentage ?? 0),
    );
  } else if (sortBy === "deadline") {
    sorted.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }
  return sorted;
}

export function SearchResults({
  query,
  results,
  isLoading,
  onScrollToTop,
}: SearchResultsProps) {
  const t = useTranslations("aiSearch.results");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortBy, setSortBy] = useState<SortOption>("match");

  const [prevResults, setPrevResults] = useState(results);
  if (results !== prevResults) {
    setPrevResults(results);
    setVisibleCount(PAGE_SIZE);
  }

  function handleViewDetails(result: SearchResult) {
    setSelectedResult(result);
    setIsModalOpen(true);
  }

  const words = query.trim().split(" ");
  const firstPart = words.slice(0, -1).join(" ");
  const lastWord = words[words.length - 1];

  const sortedResults = sortResults(results ?? [], sortBy);
  const visibleResults = sortedResults.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;
  const roundedCount = `${results.length < 10 ? results.length : Math.floor(results.length / 10) * 10}${results.length >= 10 && results.length % 10 !== 0 ? "+" : ""}`;

  return (
    <div style={{ backgroundColor: "var(--page-bg)" }}>
      <div className="border-t border-gray-200 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground leading-tight">
              {firstPart && <span>{firstPart} </span>}
              <span style={{ color: "var(--scholar-blue)" }}>{lastWord}</span>
            </h1>
            {!isLoading && results.length > 0 && (
              <p className="text-muted-foreground mt-2 text-base max-w-xl">
                {t("found", { count: roundedCount })}
              </p>
            )}
            {!isLoading && results.length === 0 && (
              <p className="text-muted-foreground mt-2 text-base">
                {t("noResults")}
              </p>
            )}
            {isLoading && (
              <p className="text-muted-foreground mt-2 text-base">
                {t("loading")}
              </p>
            )}
          </div>

          <button
            onClick={onScrollToTop}
            className="shrink-0 size-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 mt-1"
            style={{ backgroundColor: "var(--scholar-blue)" }}
            aria-label={t("newSearch")}
            title={t("newSearch")}
          >
            <ArrowUp className="size-5" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {!isLoading && results.length > 0 && (
          <div className="flex items-center justify-end gap-1 mb-6">
            <span className="text-gray-500 text-sm">{t("sortBy")}</span>
            <button
              onClick={() => setSortBy("match")}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:cursor-pointer ${
                sortBy === "match"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                sortBy === "match"
                  ? { backgroundColor: "var(--scholar-blue)" }
                  : {}
              }
            >
              {t("mostRelevant")}
            </button>
            <button
              onClick={() => setSortBy("deadline")}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:cursor-pointer ${
                sortBy === "deadline"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                sortBy === "deadline"
                  ? { backgroundColor: "var(--scholar-blue)" }
                  : {}
              }
            >
              {t("nearestDeadline")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : visibleResults.map((result, i) => (
                <ScholarshipCard
                  key={result.id ?? i}
                  result={result}
                  onViewDetails={handleViewDetails}
                />
              ))}
        </div>

        {!isLoading && hasMore && (
          <div className="flex justify-center mt-10">
            <Button
              variant="outline"
              className="gap-2 px-6 font-medium text-muted-foreground hover:text-foreground hover:cursor-pointer"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              {t("showMore")}
              <ChevronDown className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <ScholarshipModal
        result={selectedResult}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
