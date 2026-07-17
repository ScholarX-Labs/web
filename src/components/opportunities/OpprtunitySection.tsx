"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import OpportiuntyCard from "./OpportunityCard";
import { Outfit } from "next/font/google";
import { useOpportunitiesSearch as useOpportunitiesQuery } from "@/hooks/queries/useOpportunitiesSearch";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function OpportunitySection() {
  const t = useTranslations("opportunities");

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
      <div className="flex flex-col space-y-6 py-6 sm:py-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-[24px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-500">
        <h3 className="text-xl font-semibold">{t("results.errorTitle")}</h3>
        <p>{t("results.errorDescription")}</p>
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

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    await router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pagesInfo = generatePagination(page, totalPages);

  return (
    <div className="flex flex-col py-6 sm:py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={`text-4xl font-extrabold tracking-tight ${outfit.className}`}>
          {t("results.found", { count: formattedTotal })}
        </h2>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {opportunities.map((item) => (
            <OpportiuntyCard key={item.id} Opportunity={item} />
          ))}
        </AnimatePresence>
      </motion.div>

      {opportunities.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 text-slate-400 space-y-4"
        >
          <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full">
             <Search size={48} />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t("results.emptyTitle")}</h3>
            <p>{t("results.emptyDescription")}</p>
          </div>
        </motion.div>
      )}

      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mt-12 pb-12"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-xl h-10 w-10 sm:h-12 sm:w-12 hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {pagesInfo.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-slate-300">
                  <MoreHorizontal className="h-5 w-5" />
                </span>
              ) : (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    className={cn(
                      "h-10 w-10 sm:h-12 sm:w-12 rounded-xl font-bold transition-all cursor-pointer shrink-0",
                      page === p 
                        ? "shadow-lg shadow-primary/20 scale-110" 
                        : "hover:bg-primary/5 hover:text-primary"
                    )}
                    onClick={() => handlePageChange(Number(p))}
                  >
                    {p}
                  </Button>
              ),
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-xl h-10 w-10 sm:h-12 sm:w-12 hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer shrink-0"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default OpportunitySection;
