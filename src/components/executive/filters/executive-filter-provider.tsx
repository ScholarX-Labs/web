"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DateRangeSelector } from "./date-range-selector";
import { ActiveFilterBar } from "./active-filter-bar";

type NavigationItem = {
  label: string;
  href: string;
};

type ExecutiveFilterContextValue = {
  pathname: string;
  query: URLSearchParams;
  updateQuery: (updates: Record<string, string | null>) => void;
  clearFilters: () => void;
  removeFilter: (key: string) => void;
  buildHref: (href: string) => string;
  activeFilters: readonly { key: string; label: string; value: string }[];
};

const ExecutiveFilterContext = createContext<ExecutiveFilterContextValue | null>(null);

const filterLabels: Record<string, string> = {
  courseId: "Course",
  courseCategory: "Category",
  userRole: "Role",
  subscriptionStatus: "Subscription",
  applicationStatus: "Application",
  inquiryStatus: "Inquiry",
  learnerSegment: "Learner segment",
  acquisitionSource: "Acquisition",
  sort: "Sort",
  preset: "Preset",
};

const removableFilterKeys = [
  "courseId",
  "courseCategory",
  "userRole",
  "subscriptionStatus",
  "applicationStatus",
  "inquiryStatus",
  "learnerSegment",
  "acquisitionSource",
  "sort",
  "preset",
];

function firstOrNull(value: string | null): string | null {
  return value && value.trim().length > 0 ? value : null;
}

function formatPreset(value: string): string {
  return value.replaceAll("_", " ");
}

function useExecutiveFilterState(): ExecutiveFilterContextValue {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const activeFilters = useMemo(() => {
    return removableFilterKeys
      .map((key) => {
        const value = firstOrNull(query.get(key));
        if (!value) return null;
        return {
          key,
          label: filterLabels[key] ?? key,
          value: key === "preset" ? formatPreset(value) : value,
        };
      })
      .filter((entry): entry is { key: string; label: string; value: string } => Boolean(entry));
  }, [query]);

  const commit = (next: URLSearchParams) => {
    next.set("page", "1");
    const serialized = next.toString();
    router.push(serialized ? `${pathname}?${serialized}` : pathname);
  };

  return {
    pathname,
    query,
    updateQuery: (updates) => {
      const next = new URLSearchParams(query.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      commit(next);
    },
    clearFilters: () => {
      const next = new URLSearchParams(query.toString());
      for (const key of removableFilterKeys) {
        next.delete(key);
      }
      commit(next);
    },
    removeFilter: (key) => {
      const next = new URLSearchParams(query.toString());
      next.delete(key);
      commit(next);
    },
    buildHref: (href) => {
      const serialized = query.toString();
      return serialized ? `${href}?${serialized}` : href;
    },
    activeFilters,
  };
}

export function useExecutiveFilters() {
  const context = useContext(ExecutiveFilterContext);
  if (!context) {
    throw new Error("useExecutiveFilters must be used within ExecutiveFilterProvider");
  }
  return context;
}

function ExecutiveSubnav({ items }: { items: readonly NavigationItem[] }) {
  const { pathname, buildHref } = useExecutiveFilters();

  return (
    <nav className="overflow-x-auto" aria-label="Executive pages">
      <div className="flex min-w-max items-center gap-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={buildHref(item.href)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-950",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function FilterSummary() {
  const { query, clearFilters, activeFilters } = useExecutiveFilters();
  const from = query.get("from");
  const to = query.get("to");

  return (
    <section className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <CalendarRange className="size-4 text-slate-500" aria-hidden="true" />
          <span>
            {from && to ? `${from} to ${to}` : "Executive filters"}
          </span>
        </div>
        {activeFilters.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>
      <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <DateRangeSelector />
        <ActiveFilterBar />
      </div>
    </section>
  );
}

export function ExecutiveFilterProvider({
  children,
  navigationItems,
}: {
  children: ReactNode;
  navigationItems: readonly NavigationItem[];
}) {
  const value = useExecutiveFilterState();

  return (
    <ExecutiveFilterContext.Provider value={value}>
      <div className="space-y-6">
        <section className="space-y-4">
          <ExecutiveSubnav items={navigationItems} />
          <FilterSummary />
        </section>
        {children}
      </div>
    </ExecutiveFilterContext.Provider>
  );
}
