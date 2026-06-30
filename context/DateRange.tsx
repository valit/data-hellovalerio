"use client";

import { createContext, useContext, useState, useMemo, useRef } from "react";

const MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtLabel(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTH[m - 1]} ${d}`;
}

export interface DateRangeContextValue {
  startDate: string | null;   // ISO "YYYY-MM-DD" or null
  endDate: string | null;     // ISO "YYYY-MM-DD" or null
  apiStart: string;           // ready for ?startDate= query param
  apiEnd: string;
  setDateRange: (start: string, end: string) => void;
  reset: () => void;
  isFiltered: boolean;
  rangeLabel: string;
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
});

export function useDateRange() {
  return useContext(DateRangeContext);
}

// Stable callback refs so widgets don't re-render when fns are recreated
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

  function setDateRange(start: string, end: string) {
    setStart(start);
    setEnd(end);
  }

  function reset() {
    setStart(null);
    setEnd(null);
  }

  const isFiltered = startDate !== null;

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
  };

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}
