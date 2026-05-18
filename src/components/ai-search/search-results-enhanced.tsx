"use client";

import { useState, useLayoutEffect } from "react";
import { ArrowUp, ChevronDown, Filter, Loader2 } from "lucide-react";
import { SearchResult } from "@/lib/ai-search/types";
import { ScholarshipCard } from "./scholarship-card";
import { ScholarshipModal } from "./scholarship-modal-enhanced";
import { Skeleton } from "@/components/ai-search/ui/skeleton";
import { Button } from "@/components/ai-search/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  resultsContainerVariants,
  cardVariants,
  emptyStateVariants,
  buttonVariants,
} from "@/lib/ai-search-animations";

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
    <motion.div
      className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-6 flex flex-col gap-4"
      animate={{
        backgroundPosition: ["200% center", "-200% center"],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-7 w-12" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-1/2" />
    </motion.div>
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
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Reset visible count when results change (new search)
  useLayoutEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [results]);

  function handleViewDetails(result: SearchResult) {
    setSelectedResult(result);
    setIsModalOpen(true);
  }

  // Split query for color highlight: last word in blue
  const words = query.trim().split(" ");
  const firstPart = words.slice(0, -1).join(" ");
  const lastWord = words[words.length - 1];

  const sortedResults = sortResults(results ?? [], sortBy);
  const visibleResults = sortedResults.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;
  const hasResults = !isLoading && results.length > 0;
  const hasNoResults = !isLoading && results.length === 0;

  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen">
      {/* Header with query heading + new search arrow */}
      <AnimatePresence>
        {hasResults && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-40 border-b border-white/20 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl"
          >
            <div className="mx-auto max-w-6xl px-6 py-6 flex items-start justify-between gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
                  {firstPart && <span>{firstPart} </span>}
                  <span className="bg-gradient-to-r from-scholar-blue to-purple-600 bg-clip-text text-transparent">
                    {lastWord}
                  </span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-muted-foreground mt-2 text-base max-w-xl"
                >
                  We&apos;ve found{" "}
                  {results.length < 10
                    ? results.length
                    : Math.floor(results.length / 10) * 10}
                  {results.length >= 10 && results.length % 10 !== 0 && "+"}{" "}
                  opportunities. Here are the best matches for your profile.
                </motion.p>
              </motion.div>

              {/* Scroll-to-top button */}
              <motion.button
                onClick={onScrollToTop}
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all mt-1 shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, var(--scholar-blue) 0%, var(--scholar-blue-dark) 100%)",
                }}
                aria-label="New search"
                title="New search"
              >
                <ArrowUp className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        layout
        className="mx-auto max-w-6xl px-6 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Sort controls */}
        {hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-white/20"
          >
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Results
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Found {results.length} matching opportunities
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort dropdown */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-sm font-medium text-foreground hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all"
                >
                  <Filter className="w-4 h-4" />
                  Sort:{" "}
                  <span className="text-scholar-blue font-semibold">
                    {sortBy === "match" ? "Best Match" : "Deadline"}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl border border-white/20 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                    >
                      {["match", "deadline"].map((option) => (
                        <motion.button
                          key={option}
                          onClick={() => {
                            setSortBy(option as SortOption);
                            setShowSortMenu(false);
                          }}
                          whileHover={{
                            backgroundColor: "rgba(51, 153, 204, 0.1)",
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-all ${
                            sortBy === option
                              ? "text-scholar-blue bg-scholar-blue/10"
                              : "text-foreground hover:text-scholar-blue"
                          }`}
                        >
                          {option === "match" ? "✓ Best Match" : "✓ Deadline"}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </motion.div>
        )}

        {/* Results Grid */}
        {hasResults && (
          <motion.div
            variants={resultsContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {visibleResults.map((result) => (
              <motion.div key={result.id} variants={cardVariants}>
                <ScholarshipCard
                  result={result}
                  onViewDetails={handleViewDetails}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Load More button */}
        {hasResults && hasMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-12"
          >
            <motion.button
              onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-full border border-scholar-blue/30 text-scholar-blue font-semibold hover:bg-scholar-blue/10 transition-all"
            >
              Load More Results
            </motion.button>
          </motion.div>
        )}

        {/* Empty state */}
        {hasNoResults && (
          <motion.div
            variants={emptyStateVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center mb-6">
              <Filter className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No results found
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Try adjusting your search criteria or explore our suggestions to
              find the perfect opportunity.
            </p>
            <motion.button
              onClick={onScrollToTop}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 rounded-lg bg-scholar-blue text-white font-semibold hover:bg-scholar-blue-dark transition-all"
            >
              Try a New Search
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Modal */}
      <ScholarshipModal
        result={selectedResult}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
