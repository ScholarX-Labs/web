"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExecutiveFilters } from "./executive-filter-provider";

export function ActiveFilterBar() {
  const { activeFilters, removeFilter } = useExecutiveFilters();

  if (activeFilters.length === 0) {
    return (
      <div className="flex min-h-9 items-center text-sm text-slate-500">
        No additional filters applied.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilters.map((filter) => (
        <Button
          key={filter.key}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => removeFilter(filter.key)}
          className="bg-slate-50"
        >
          <span className="text-slate-500">{filter.label}:</span>
          <span className="font-semibold text-slate-900">{filter.value}</span>
          <X className="size-4 text-slate-400" aria-hidden="true" />
        </Button>
      ))}
    </div>
  );
}
