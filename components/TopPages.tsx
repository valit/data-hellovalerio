"use client";

import { useEffect, useState } from "react";
import Widget from "./Widget";
import { useDateRange } from "@/context/DateRange";
import { serializeFilters } from "@/lib/gaFilters";
import type { DimensionFilter } from "@/lib/gaFilters";

type Row = {
  path: string;
  pageviews: number;
  avgEngagementSec: number;
  engagementRate: number;
  bounceRate: number;
};

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function fmtPct(rate: number) {
  if (!isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function makePageFilter(path: string): DimensionFilter {
  return {
    id: `page::${path}`,
    type: "page",
    label: path,
    dimensions: [{ name: "pagePath", value: path }],
  };
}

export default function TopPages() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { apiStart, apiEnd, dimensionFilters, addFilter, removeFilter } = useDateRange();

  // Filters excluding own type (self-exclusion — server does the same, but we
  // also need it here for the fetch URL)
  const queryFilters = dimensionFilters.filter((f) => f.type !== "page");

  useEffect(() => {
    setLoading(true);
    const fp = serializeFilters(queryFilters);
    fetch(`/api/ga/top-pages?startDate=${apiStart}&endDate=${apiEnd}${fp ? `&filters=${fp}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiStart, apiEnd, JSON.stringify(queryFilters)]);

  const activePageFilters = dimensionFilters.filter((f) => f.type === "page");
  const activePageIds = new Set(activePageFilters.map((f) => f.id));

  function handleRowClick(path: string) {
    const id = `page::${path}`;
    if (activePageIds.has(id)) {
      removeFilter(id);
    } else {
      addFilter(makePageFilter(path));
    }
  }

  const headerExtra = activePageFilters.length > 0 ? (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-zinc-400 dark:text-zinc-500">
        {activePageFilters.length} selected
      </span>
      <button
        onClick={() => activePageFilters.forEach((f) => removeFilter(f.id))}
        className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors font-medium"
      >
        Reset
      </button>
    </div>
  ) : undefined;

  return (
    <Widget title="Top pages" headerExtra={headerExtra}>
      {loading ? (
        <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left pb-2 font-medium">Path</th>
                <th className="text-right pb-2 font-medium">Views</th>
                <th className="text-right pb-2 font-medium">Avg time</th>
                <th className="text-right pb-2 font-medium">Engaged</th>
                <th className="text-right pb-2 font-medium">Bounce</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const isActive = activePageIds.has(`page::${row.path}`);
                return (
                  <tr
                    key={i}
                    onClick={() => handleRowClick(row.path)}
                    className={`border-b border-zinc-100 dark:border-zinc-800/50 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/40"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                    }`}
                  >
                    <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300 font-mono text-xs truncate max-w-xs">
                      {isActive && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 mb-px" />
                      )}
                      {row.path}
                    </td>
                    <td className="py-2 text-right text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {row.pageviews.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-zinc-500 tabular-nums">
                      {fmtDuration(row.avgEngagementSec)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      <span className={row.engagementRate >= 0.5 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}>
                        {fmtPct(row.engagementRate)}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      <span className={row.bounceRate >= 0.5 ? "text-red-600 dark:text-red-400" : "text-zinc-500"}>
                        {fmtPct(row.bounceRate)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Widget>
  );
}
