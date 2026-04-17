"use client";

import { useOpportunitiesSearch } from "@/providers/opportunities-search-provider";
import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function OpportunitiesSearchInput() {
  const { searchQuery, setSearchQuery, filters } = useOpportunitiesSearch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Clear existing filter params to rebuild them
    // We only keep 'page' if we want or just always reset to 'page' 1 when searching
    Object.keys(filters).forEach((key) => params.delete(key));
    params.delete("q");

    // Add query
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }

    // Add filters
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
    <div className="flex flex-row relative w-3/4 my-4">
      <input
        type="text"
        role="searchbox"
        className="bg-white w-full rounded-sm p-3 pr-10 text-black focus:outline-primary"
        maxLength={200}
        placeholder="Search opportunities"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        aria-label="Search"
        className="absolute right-0 top-0 h-full px-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
        onClick={handleSearch}
      >
        <Search />
      </button>
    </div>
  );
}
