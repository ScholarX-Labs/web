"use client";
import React, { useState } from "react";
import SimpleDropdown from "./SimpleDropdown";

type FilterItem = {
  name: string;
  values: { displayName: string; value: string }[];
};

const FILTERS: FilterItem[] = [
  {
    name: "Category",
    values: [
      { displayName: "Academic", value: "academic" },
      { displayName: "Non Academic", value: "non_academic" },
    ],
  },
  {
    name: "Type",
    values: [
      { displayName: "Bachelor", value: "bachelor" },
      { displayName: "Masters", value: "masters" },
      { displayName: "PHD", value: "phd" },
      { displayName: "Internship", value: "internship" },
    ],
  },
  {
    name: "Funding",
    values: [
      { displayName: "Fully funded", value: "fully_funded" },
      { displayName: "Partially funded", value: "partially_funded" },
    ],
  },
  {
    name: "Target segment",
    values: [
      { displayName: "High school", value: "high_school" },
      { displayName: "Undergraduate", value: "undergraduate" },
      { displayName: "Graduate", value: "graduate" },
    ],
  },
];

export default function Filters() {
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});

  const handleChange = (
    filterName: string,
    value: string,
    checked: boolean,
  ) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterName]: checked
        ? [...(prev[filterName] ?? []), value]
        : (prev[filterName] ?? []).filter((v) => v !== value),
    }));
  };

  const hasAnySelection = Object.values(selectedFilters).some(
    (arr) => Array.isArray(arr) && arr.length > 0,
  );

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="w-full grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:max-w-3/5">
        {FILTERS.map((filter) => (
          <SimpleDropdown
            key={filter.name}
            label={filter.name}
            options={filter.values}
            selected={selectedFilters[filter.name] ?? []}
            onChange={(value, checked) =>
              handleChange(filter.name, value, checked)
            }
          />
        ))}
      </div>

      <div className="w-full lg:w-auto">
        <button
          onClick={() => setSelectedFilters({})}
          disabled={!hasAnySelection}
          className="w-full lg:w-auto border-2 border-accent rounded-xl px-3 py-2 hover:cursor-pointer bg-[#33AACC]/10 text-accent "
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
