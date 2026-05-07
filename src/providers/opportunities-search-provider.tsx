"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

interface OpportunitiesSearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: Record<string, string[]>;
  setFilters: (filters: Record<string, string[]>) => void;
  updateFilter: (key: string, values: string[]) => void;
  clearFilters: () => void;
}

const OpportunitiesSearchContext = createContext<
  OpportunitiesSearchContextType | undefined
>(undefined);

export function OpportunitiesSearchProvider({
  children,
}: {
  children: ReactNode;
}) {
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Sync local state if searchParams change (e.g. from Back button or initial load)
    const newQuery = searchParams.get("q") || "";
    setSearchQuery(newQuery);

    const nextFilters: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key !== "q" && key !== "page") {
        nextFilters[key] = value ? value.split(",") : [];
      }
    });
    setFilters(nextFilters);
  }, [searchParams]);

  const updateFilter = (key: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <OpportunitiesSearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        updateFilter,
        clearFilters,
      }}
    >
      {children}
    </OpportunitiesSearchContext.Provider>
  );
}

export function useOpportunitiesSearch() {
  const context = useContext(OpportunitiesSearchContext);
  if (context === undefined) {
    throw new Error(
      "useOpportunitiesSearch must be used within an OpportunitiesSearchProvider",
    );
  }
  return context;
}
