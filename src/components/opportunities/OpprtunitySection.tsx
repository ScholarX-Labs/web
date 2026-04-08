"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import OpportiuntyCard from "./OpportuintyCard";
import { Outfit } from "next/font/google";
import { useOpportunitiesSearch as useOpportunitiesQuery } from "@/hooks/queries/useOpportunitiesSearch";
import { Skeleton } from "@/components/ui/skeleton";

const outfit = Outfit({ subsets: ["latin"] });

function generatePagination(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

function OpprtunitySection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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
  const totalPages = data?.pagination?.totalPages || 1;

  const formattedTotal =
    total > 0 && total < 10
      ? total
      : total > 0 && total % 10 !== 0
        ? `${Math.floor(total / 10) * 10}+`
        : total;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pagesInfo = generatePagination(page, totalPages);

  return (
    <div className="flex flex-col">
      <h2 className={`text-3xl font-bold p-3 w-full ${outfit.className}`}>
        {formattedTotal}{" "}
        <span className="text-primary">Opportunities Found</span>
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

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="hover:cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pagesInfo.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
                <MoreHorizontal className="h-5 w-5" />
              </span>
            ) : (
              <Button
                key={p}
                variant={page === p ? "default" : "outline"}
                className="w-10 hover:cursor-pointer"
                onClick={() => handlePageChange(Number(p))}
              >
                {p}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="hover:cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default OpprtunitySection;
