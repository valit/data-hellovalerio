"use client";

import { createContext, useContext, useState, useMemo, useRef } from "react";
import type { DimensionFilter } from "@/lib/gaFilters";
import { serializeFilters } from "@/lib/gaFilters";

export type { DimensionFilter } from "@/lib/gaFilters";
export { serializeFilters } from "@/lib/gaFilters";

const MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtLabel(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTH[m - 1]} ${d}`;
}

export interface DateRangeContextValue {
  // date range
  startDate: string | null;
  endDate: string | null;
  apiStart: string;
  apiEnd: string;
  setDateRange: (start: string, end: string) => void;
  reset: () => void;
  isFiltered: boolean;
  rangeLabel: string;
  // dimension filters
  dimensionFilters: DimensionFilter[];
  addFilter: (f: DimensionFilter) => void;
  removeFilter: (id: string) => void;
  clearDimensionFilters: () => void;
  hasDimensionFilters: boolean;
}

const DateRangeContext = createContext<DateRangeContextValue>({
  startDate: null,
  endDate: null,
  apiStart: "30daysAgo",
  apiEnd: "today",
  setDateRange: () => {},
  reset: () => {},
  isFiltered: false,
  rangeLabel: "Last 30 days",
  dimensionFilters: [],
  addFilter: () => {},
  removeFilter: () => {},
  clearDimensionFilters: () => {},
  hasDimensionFilters: false,
});

export function useDateRange() {
  return useContext(DateRangeContext);
}

export function useDateRangeCallbacks() {
  const ctx = useContext(DateRangeContext);
  const setRef = useRef(ctx.setDateRange);
  setRef.current = ctx.setDateRange;
  const resetRef = useRef(ctx.reset);
  resetRef.current = ctx.reset;
  return { setRef, resetRef };
}

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [startDate, setStart] = useState<string | null>(null);
  const [endDate, setEnd] = useState<string | null>(null);
  const [dimensionFilters, setDimensionFilters] = useState<DimensionFilter[]>([]);

  function setDateRange(start: string, end: string) {
    setStart(start);
    setEnd(end);
  }

  function reset() {
    setStart(null);
    setEnd(null);
  }

  function addFilter(f: DimensionFilter) {
    setDimensionFilters((prev) =>
      prev.some((x) => x.id === f.id) ? prev : [...prev, f]
    );
  }

  function removeFilter(id: string) {
    setDimensionFilters((prev) => prev.filter((x) => x.id !== id));
  }

  function clearDimensionFilters() {
    setDimensionFilters([]);
  }

  const isFiltered = startDate !== null;
  const hasDimensionFilters = dimensionFilters.length > 0;

  const rangeLabel = useMemo(() => {
    if (!startDate) return "Last 30 days";
    const s = fmtLabel(startDate);
    const e = endDate && endDate !== startDate ? fmtLabel(endDate) : null;
    return e ? `${s} – ${e}` : s;
  }, [startDate, endDate]);

  const value: DateRangeContextValue = {
    startDate,
    endDate,
    apiStart: startDate ?? "30daysAgo",
    apiEnd: endDate ?? "today",
    setDateRange,
    reset,
    isFiltered,
    rangeLabel,
    dimensionFilters,
    addFilter,
    removeFilter,
    clearDimensionFilters,
    hasDimensionFilters,
  };

  // Expose serializeFilters so widgets don't need to import lib/gaFilters directly
  void serializeFilters; // keep import live

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}
