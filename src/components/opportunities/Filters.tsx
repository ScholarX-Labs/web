"use client";

import SimpleDropdown from "@/components/opportunities/SimpleDropdown";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useOpportunitiesSearch } from "@/providers/opportunities-search-provider";
import {
  Categories,
  OpportunityType,
  Funding,
  TargetSegment,
} from "@/lib/opportunities/types";

type FilterItem = {
  name: string;
  queryKey: string;
  values: { displayName: string; value: string }[];
};

const DISPLAY_NAME_EXCEPTIONS: Record<string, string> = {
  PhD: "PhD",
};

const formatDisplayName = (key: string) =>
  DISPLAY_NAME_EXCEPTIONS[key] ??
  key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim();

const FILTERS: FilterItem[] = [
  {
    name: "Category",
    queryKey: "category",
    values: Object.entries(Categories).map(([key, value]) => ({
      displayName: formatDisplayName(key),
      value,
    })),
  },
  {
    name: "Type",
    queryKey: "subtype",
    values: Object.entries(OpportunityType).map(([key, value]) => ({
      displayName: formatDisplayName(key),
      value,
    })),
  },
  {
    name: "Funding",
    queryKey: "fund_type",
    values: Object.entries(Funding).map(([key, value]) => ({
      displayName: formatDisplayName(key),
      value,
    })),
  },
  {
    name: "Target segment",
    queryKey: "target_segment",
    values: Object.entries(TargetSegment).map(([key, value]) => ({
      displayName: formatDisplayName(key),
      value,
    })),
  },
];

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Filter, RefreshCcw } from "lucide-react";

export default function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { filters, updateFilter, clearFilters, searchQuery } =
    useOpportunitiesSearch();

  const handleChange = (queryKey: string, value: string, checked: boolean) => {
    const values = filters[queryKey] || [];
    let next: string[];
    if (checked) {
      next = values.includes(value) ? values : [...values, value];
    } else {
      next = values.filter((v) => v !== value);
    }
    updateFilter(queryKey, next);
  };

  const hasAppliedSelection = FILTERS.some(
    (f) => (searchParams.get(f.queryKey)?.length || 0) > 0,
  );

  const hasDraftSelection = FILTERS.some(
    (f) => (filters[f.queryKey]?.length || 0) > 0,
  );

  const isChanged = () => {
    for (const filter of FILTERS) {
      const draftValues = filters[filter.queryKey] || [];
      const appliedValues = searchParams.get(filter.queryKey)?.split(",") || [];

      if (
        draftValues.length !== appliedValues.length ||
        !draftValues.every((v) => appliedValues.includes(v))
      ) {
        return true;
      }
    }
    return false;
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    FILTERS.forEach((f) => {
      const values = filters[f.queryKey];
      if (values && values.length > 0) {
        params.set(f.queryKey, values.join(","));
      } else {
        params.delete(f.queryKey);
      }
    });

    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }

    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
    >
      <div className="w-full grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:max-w-full">
        {FILTERS.map((filter) => (
          <SimpleDropdown
            key={filter.name}
            label={filter.name}
            options={filter.values}
            selected={filters[filter.queryKey] || []}
            onChange={(value, checked) =>
              handleChange(filter.queryKey, value, checked)
            }
            disabled={false}
          />
        ))}
      </div>
      <div className="w-full lg:w-auto flex flex-row justify-end gap-3 shrink-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleApply}
          disabled={!isChanged()}
          className={cn(
            "flex-1 lg:w-40 flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-bold transition-all shadow-sm",
            "bg-primary text-white hover:bg-primary/90 active:shadow-inner cursor-pointer",
            "disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
          )}
        >
          <Filter size={18} />
          <span>Apply</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            clearFilters();
            const params = new URLSearchParams(searchParams.toString());
            FILTERS.forEach((f) => params.delete(f.queryKey));
            if (searchQuery.trim()) {
              params.set("q", searchQuery.trim());
            } else {
              params.delete("q");
            }
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
          }}
          disabled={!hasAppliedSelection && !hasDraftSelection}
          className={cn(
            "flex-1 lg:w-32 flex items-center justify-center gap-2 border-2 rounded-xl px-4 py-2 font-bold transition-all",
            "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer",
            "disabled:border-slate-100 dark:disabled:border-slate-800 disabled:text-slate-300 disabled:cursor-not-allowed"
          )}
        >
          <RefreshCcw size={18} className={cn((hasAppliedSelection || hasDraftSelection) && "animate-spin-once")} />
          <span>Clear</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

