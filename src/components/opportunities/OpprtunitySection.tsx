"use client";

import { useSearchParams } from "next/navigation";
import OpportiuntyCard from "./OpportuintyCard";
import { Outfit } from "next/font/google";
import { useOpportunitiesSearch as useOpportunitiesQuery } from "@/hooks/queries/useOpportunitiesSearch";
import { Skeleton } from "@/components/ui/skeleton";

const outfit = Outfit({ subsets: ["latin"] });

function OpprtunitySection() {
  const searchParams = useSearchParams();

  // Get current search state from URL search params
  const searchQuery = searchParams.get("q") || "";
  const page = Number(searchParams.get("page")) || 1;

  // Extract filters from URL
  const filters: Record<string, string | string[]> = {};
  searchParams.forEach((value, key) => {
    if (key !== "q" && key !== "page") {
      filters[key] = value.includes(",") ? value.split(",") : value;
    }
  });

  const { data, isLoading, isFetching, error } = useOpportunitiesQuery({
    query: searchQuery,
    page,
    ...filters,
  });

  if (isLoading || isFetching) {
    return (
      <div className="flex flex-col">
        <div className="h-10 w-64 bg-gray-200 animate-pulse m-3 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-100 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-500">
        <h3 className="text-xl font-semibold">Error loading opportunities</h3>
        <p>Please try again later or refresh the page.</p>
      </div>
    );
  }

  const opportunities = data?.opportunities || [];
  const total = data?.pagination?.total || 0;

  return (
    <div className="flex flex-col">
      <h2 className={`text-3xl font-bold p-3 w-full ${outfit.className}`}>
        {total} <span className="text-primary">Opportunities Found</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {opportunities.map((item) => (
          <OpportiuntyCard key={item.id} Opportunity={item} />
        ))}
      </div>
      {opportunities.length === 0 && (
        <div className="flex flex-col items-center justify-center p-20 text-gray-500">
          <h3 className="text-xl font-semibold">No opportunities found</h3>
          <p>Try adjusting your search query or filters.</p>
        </div>
      )}
    </div>
  );
}

export default OpprtunitySection;
