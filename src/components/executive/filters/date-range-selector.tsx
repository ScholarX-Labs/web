"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useExecutiveFilters } from "./executive-filter-provider";

const presetOptions = [
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "month_to_date", label: "Month to date" },
  { value: "year_to_date", label: "Year to date" },
  { value: "custom", label: "Custom" },
] as const;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolvePresetRange(preset: string): { from: string; to: string } {
  const today = new Date();
  const to = new Date(today);
  const from = new Date(today);

  switch (preset) {
    case "today":
      break;
    case "last_7_days":
      from.setUTCDate(to.getUTCDate() - 6);
      break;
    case "month_to_date":
      from.setUTCDate(1);
      break;
    case "year_to_date":
      from.setUTCMonth(0, 1);
      break;
    case "custom":
      return { from: isoDate(from), to: isoDate(to) };
    case "last_30_days":
    default:
      from.setUTCDate(to.getUTCDate() - 29);
      break;
  }

  return { from: isoDate(from), to: isoDate(to) };
}

export function DateRangeSelector() {
  const { query, updateQuery } = useExecutiveFilters();
  const activePreset = query.get("preset") ?? "last_30_days";
  const from = query.get("from") ?? "";
  const to = query.get("to") ?? "";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[180px]">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Range preset
        </label>
        <Select
          value={activePreset}
          onValueChange={(preset) => {
            const nextRange = resolvePresetRange(preset);
            updateQuery({
              preset,
              from: nextRange.from,
              to: nextRange.to,
            });
          }}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[148px]">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          From
        </label>
        <Input
          type="date"
          value={from}
          onChange={(event) =>
            updateQuery({
              preset: "custom",
              from: event.target.value,
            })}
          className="bg-white"
        />
      </div>
      <div className="min-w-[148px]">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          To
        </label>
        <Input
          type="date"
          value={to}
          onChange={(event) =>
            updateQuery({
              preset: "custom",
              to: event.target.value,
            })}
          className="bg-white"
        />
      </div>
    </div>
  );
}
