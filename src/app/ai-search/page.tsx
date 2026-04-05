"use client";

import { useState, useRef, useEffect } from "react";
import { SearchHero } from "@/components/ai-search/search-hero";
import { SearchResults } from "@/components/ai-search/search-results";
import { useSearch } from "@/hooks/ai-search/use-search";
import { Rubik } from "next/font/google";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});
export default function Page() {
  const [activeQuery, setActiveQuery] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isLoading, isFetching } = useSearch(activeQuery);

  const hasSearched = activeQuery.trim().length > 0;
  const loading = isLoading || isFetching;

  // Scroll to results when a new search happens
  useEffect(() => {
    if (hasSearched && resultsRef.current) {
      // Small delay to let the DOM render
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeQuery, hasSearched]);

  function handleSearch(query: string) {
    setActiveQuery(query);
  }

  function handleScrollToTop() {
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className={`flex flex-col ${rubik.variable}`}>
      <div className="flex-1 bg-page-bg">
        {/* Hero is always visible */}
        <div ref={heroRef}>
          <SearchHero onSearch={handleSearch} isLoading={loading} />
        </div>

        {/* Results appear below, pushed into view */}
        {hasSearched && (
          <div ref={resultsRef}>
            <SearchResults
              query={activeQuery}
              results={results}
              isLoading={loading}
              onScrollToTop={handleScrollToTop}
            />
          </div>
        )}
      </div>
    </div>
  );
}
