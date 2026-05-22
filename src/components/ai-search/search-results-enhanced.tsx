"use client";

import { useState, useLayoutEffect, useEffect } from "react";
import { ArrowUp, Filter } from "lucide-react";
import { SearchResult } from "@/lib/ai-search/types";
import { ScholarshipCard } from "./scholarship-card";
import { ScholarshipModal } from "./scholarship-modal-enhanced";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingStateOverlay } from "@/components/ai-search/loading";
import type { StageConfig } from "@/components/ai-search/loading";
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
  currentStage: StageConfig;
  progress: number;
}

type SortOption = "match" | "deadline";

const PAGE_SIZE = 6;

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
  currentStage,
  progress,
}: SearchResultsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const opportunityIdFromUrl = searchParams.get("o");

  // Reset visible count when results change (new search)
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(PAGE_SIZE);
  }, [results]);

  useEffect(() => {
    if (!opportunityIdFromUrl) return;
    const match = results.find((r) => r.id === opportunityIdFromUrl);
    if (match && (!selectedResult || selectedResult.id !== opportunityIdFromUrl)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedResult(match);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsModalOpen(true);
    }
  }, [opportunityIdFromUrl, results, selectedResult]);

  useEffect(() => {
    if (opportunityIdFromUrl) return;
    if (isModalOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsModalOpen(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedResult(null);
    }
  }, [opportunityIdFromUrl, isModalOpen]);

  function handleViewDetails(result: SearchResult) {
    setSelectedResult(result);
    setIsModalOpen(true);

    if (result.id) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("o", result.id);
      const queryString = params.toString();
      router.replace(queryString ? `?${queryString}` : "/ai-search", {
        scroll: false,
      });
    }
  }

  function handleClose() {
    setIsModalOpen(false);
    setSelectedResult(null);

    if (opportunityIdFromUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("o");
      const queryString = params.toString();
      router.replace(queryString ? `?${queryString}` : "/ai-search", {
        scroll: false,
      });
    }
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
    <LayoutGroup>
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

          {/* Loading state — driven by single source of truth stage props */}
          <AnimatePresence>
            {isLoading && (
              <LoadingStateOverlay
                isLoading={isLoading}
                currentStage={currentStage}
                progress={progress}
              />
            )}
          </AnimatePresence>

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
                    isSelected={selectedResult?.id === result.id && isModalOpen}
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

        <AnimatePresence>
          {isModalOpen && (
            <ScholarshipModal
              result={selectedResult}
              isOpen={isModalOpen}
              onClose={handleClose}
            />
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
