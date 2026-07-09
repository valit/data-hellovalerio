"use client";

import { useEffect, useState } from "react";
import Widget from "./Widget";
import { useDateRange } from "@/context/DateRange";
import { serializeFilters } from "@/lib/gaFilters";
import type { DimensionFilter } from "@/lib/gaFilters";

type Row = { country: string; city: string; sessions: number; activeUsers: number };

function makeGeoFilter(city: string, country: string): DimensionFilter {
  return {
    id: `geo::${city}::${country}`,
    type: "geo",
    label: city ? `${city}, ${country}` : country,
    dimensions: [
      { name: "city",    value: city },
      { name: "country", value: country },
    ],
  };
}

export default function Geography() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { apiStart, apiEnd, dimensionFilters, addFilter, removeFilter } = useDateRange();

  const queryFilters = dimensionFilters.filter((f) => f.type !== "geo");

  useEffect(() => {
    setLoading(true);
    const fp = serializeFilters(queryFilters);
    fetch(`/api/ga/geo?startDate=${apiStart}&endDate=${apiEnd}${fp ? `&filters=${fp}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiStart, apiEnd, JSON.stringify(queryFilters)]);

  const activeGeoFilters = dimensionFilters.filter((f) => f.type === "geo");
  const activeGeoIds = new Set(activeGeoFilters.map((f) => f.id));

  function handleRowClick(row: Row) {
    const id = `geo::${row.city}::${row.country}`;
    if (activeGeoIds.has(id)) {
      removeFilter(id);
    } else {
      addFilter(makeGeoFilter(row.city, row.country));
    }
  }

  const headerExtra = activeGeoFilters.length > 0 ? (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-zinc-400 dark:text-zinc-500">
        {activeGeoFilters.length} selected
      </span>
      <button
        onClick={() => activeGeoFilters.forEach((f) => removeFilter(f.id))}
        className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors font-medium"
      >
        Reset
      </button>
    </div>
  ) : undefined;

  return (
    <Widget title="Geography" headerExtra={headerExtra}>
      {loading ? (
        <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-zinc-900">
              <tr className="text-zinc-500 text-xs border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left pb-2 font-medium">Country</th>
                <th className="text-left pb-2 font-medium">City</th>
                <th className="text-right pb-2 font-medium">Sessions</th>
                <th className="text-right pb-2 font-medium">Users</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const isActive = activeGeoIds.has(`geo::${row.city}::${row.country}`);
                return (
                  <tr
                    key={i}
                    onClick={() => handleRowClick(row)}
                    className={`border-b border-zinc-100 dark:border-zinc-800/50 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/40"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                    }`}
                  >
                    <td className="py-2 pr-3 text-zinc-700 dark:text-zinc-300 text-xs">
                      {isActive && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 mb-px" />
                      )}
                      {row.country}
                    </td>
                    <td className="py-2 pr-3 text-zinc-500 text-xs">{row.city || "—"}</td>
                    <td className="py-2 text-right text-zinc-900 dark:text-zinc-100 tabular-nums">{row.sessions.toLocaleString()}</td>
                    <td className="py-2 text-right text-zinc-500 tabular-nums">{row.activeUsers.toLocaleString()}</td>
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
