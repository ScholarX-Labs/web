"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Suspense,
  useEffect,
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
  initialSearchQuery = "",
  initialFilters = {},
}: {
  children: ReactNode;
  initialSearchQuery?: string;
  initialFilters?: Record<string, string[]>;
}) {
  // Seed from server-normalized props so SSR HTML and the first client
  // render match. URL sync happens in a Suspense-isolated effect below,
  // avoiding a `useSearchParams` CSR bailout for the whole subtree.
  const [searchQuery, setSearchQuery] =
    useState<string>(initialSearchQuery);
  const [filters, setFilters] =
    useState<Record<string, string[]>>(initialFilters);

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
      <Suspense fallback={null}>
        <SearchParamsSync
          onSync={(nextQuery, nextFilters) => {
            setSearchQuery(nextQuery);
            setFilters(nextFilters);
          }}
        />
      </Suspense>
      {children}
    </OpportunitiesSearchContext.Provider>
  );
}

function SearchParamsSync({
  onSync,
}: {
  onSync: (query: string, filters: Record<string, string[]>) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const nextQuery = searchParams.get("q") || "";
    const nextFilters: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key !== "q" && key !== "page") {
        nextFilters[key] = value ? value.split(",") : [];
      }
    });
    onSync(nextQuery, nextFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
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
