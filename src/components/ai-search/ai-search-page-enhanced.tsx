"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { SearchHero } from "@/components/ai-search/search-hero-enhanced";
import { SearchResults } from "@/components/ai-search/search-results-enhanced";
import { useSearch } from "@/hooks/ai-search/use-search";
import { useStageTimeline } from "@/components/ai-search/loading";
import { Rubik } from "next/font/google";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export default function EnhancedAISearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <EnhancedAISearchPageInner />
    </Suspense>
  );
}

function EnhancedAISearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") ?? "";
  const [activeQuery, setActiveQuery] = useState(queryParam);

  const resultsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isLoading, isFetching } = useSearch(queryParam);

  const hasSearched = queryParam.trim().length > 0;
  const loading = isLoading || isFetching;

  // ★ SINGLE SOURCE OF TRUTH — useStageTimeline called exactly once
  const { currentStage, stageIndex, progress } = useStageTimeline(loading);

  // Smooth scroll to results when a new search happens
  useEffect(() => {
    if (hasSearched && resultsRef.current) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [queryParam, hasSearched]);

  function handleSearch(query: string) {
    const trimmed = query.trim();
    setActiveQuery(trimmed);

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    params.delete("o");

    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : "/ai-search", {
      scroll: false,
    });
  }

  function handleScrollToTop() {
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={`flex flex-col min-h-screen ${rubik.variable}`}>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        className="flex-1"
      >
        {/* Hero Section */}
        <div ref={heroRef}>
          <SearchHero onSearch={handleSearch} isLoading={loading} indicatorConfig={currentStage.indicator} />
        </div>

        {/* Results Section with smooth fade in/out */}
        <motion.div
          key={hasSearched ? "results-visible" : "results-hidden"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          ref={resultsRef}
        >
          {hasSearched && (
            <SearchResults
              query={activeQuery}
              results={results}
              isLoading={loading}
              onScrollToTop={handleScrollToTop}
              currentStage={currentStage}
              progress={progress}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
