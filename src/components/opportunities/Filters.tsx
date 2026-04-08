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
    // Check if any filter in the current draft state is different from what's in the URL
    for (const filter of FILTERS) {
      const draftValues = filters[filter.queryKey] || [];
      const appliedValues = searchParams.get(filter.queryKey)?.split(",") || [];

      // Sort both to compare easily
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
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="w-full grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:max-w-full">
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
      <div className="w-full lg:w-auto flex flex-row justify-end gap-2">
        <button
          onClick={handleApply}
          disabled={!isChanged()}
          className="flex-1 lg:w-32 rounded-xl px-4 py-2 font-medium transition-all duration-200 bg-accent text-white hover:cursor-pointer hover:bg-accent/90 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Apply filters
        </button>
        <button
          onClick={() => {
            clearFilters(); // Clear drafted filters in context

            const params = new URLSearchParams(searchParams.toString());
            FILTERS.forEach((f) => params.delete(f.queryKey));

            // Ensure the URL reflected the current draft searchQuery
            if (searchQuery.trim()) {
              params.set("q", searchQuery.trim());
            } else {
              params.delete("q");
            }

            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
          }}
          disabled={!hasAppliedSelection && !hasDraftSelection}
          className="flex-1 lg:w-32 border-2 border-accent rounded-xl px-4 py-2 font-medium transition-all duration-200 bg-transparent text-accent hover:bg-accent/5 hover:cursor-pointer active:scale-[0.98] disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
