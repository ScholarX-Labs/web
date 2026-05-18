"use client";

import { useState, useRef, useEffect } from "react";
import { SearchHero } from "@/components/ai-search/search-hero-enhanced";
import { SearchResults } from "@/components/ai-search/search-results-enhanced";
import { useSearch } from "@/hooks/ai-search/use-search";
import { Rubik } from "next/font/google";
import { motion } from "framer-motion";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export default function EnhancedAISearchPage() {
  const [activeQuery, setActiveQuery] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isLoading, isFetching } = useSearch(activeQuery);

  const hasSearched = activeQuery.trim().length > 0;
  const loading = isLoading || isFetching;

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
  }, [activeQuery, hasSearched]);

  function handleSearch(query: string) {
    setActiveQuery(query);
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
          <SearchHero onSearch={handleSearch} isLoading={loading} />
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
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
