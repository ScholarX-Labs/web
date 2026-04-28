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

  const [searchQuery, setSearchQuery] = useState<string>(
    () => searchParams.get("q") || "",
  );
  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    const initialFilters: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key !== "q" && key !== "page") {
        initialFilters[key] = value ? value.split(",") : [];
      }
    });
    return initialFilters;
  });

  useEffect(() => {
    // Sync local state if searchParams change (e.g. from Back button or external nav)
    const newQuery = searchParams.get("q") || "";
    const nextFilters: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key !== "q" && key !== "page") {
        nextFilters[key] = value ? value.split(",") : [];
      }
    });

    // Only update if actually different to avoid cycles
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchQuery((prev) => (prev !== newQuery ? newQuery : prev));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters((prev) => {
      const isDifferent = JSON.stringify(prev) !== JSON.stringify(nextFilters);
      return isDifferent ? nextFilters : prev;
    });
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
