"use client";

import { useOpportunitiesSearch } from "@/providers/opportunities-search-provider";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function OpportunitiesSearchInput() {
  const { searchQuery, setSearchQuery, filters } = useOpportunitiesSearch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());

    Object.keys(filters).forEach((key) => params.delete(key));
    params.delete("q");

    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }

    Object.entries(filters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        params.set(key, values.join(","));
      }
    });

    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-row relative w-full max-w-2xl my-6 group"
    >
      <motion.div
        animate={isFocused ? { scale: 1.01, boxShadow: "0 10px 40px rgba(0,0,0,0.15)" } : { scale: 1, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
        className={cn(
          "flex items-center w-full bg-white dark:bg-slate-900 rounded-full border-2 transition-colors duration-300 px-4 py-1.5 sm:px-6 sm:py-2",
          isFocused ? "border-primary" : "border-slate-200 dark:border-slate-800"
        )}
      >
        <Search className={cn("shrink-0 transition-colors hidden sm:block", isFocused ? "text-primary" : "text-slate-400")} size={22} />
        <input
          type="text"
          role="searchbox"
          className="flex-1 bg-transparent p-2 sm:p-3 text-sm sm:text-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          maxLength={200}
          placeholder="Search for scholarships, grants..."
          value={searchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => setSearchQuery("")}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} className="text-slate-400" />
            </motion.button>
          )}
        </AnimatePresence>
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block" />
        <button
          type="button"
          aria-label="Search"
          className="shrink-0 px-3 py-1.5 sm:px-5 sm:py-2 bg-primary text-white rounded-full font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all active:scale-95 cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center"
          onClick={handleSearch}
        >
          <span className="hidden sm:inline">Search</span>
          <Search className="block sm:hidden size-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}

