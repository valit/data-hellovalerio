"use client";

import { useEffect, useState } from "react";
import Widget from "./Widget";
import { useDateRange } from "@/context/DateRange";

type Row = { country: string; city: string; sessions: number; activeUsers: number };

export default function Geography() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { apiStart, apiEnd } = useDateRange();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ga/geo?startDate=${apiStart}&endDate=${apiEnd}`)
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiStart, apiEnd]);

  return (
    <Widget title="Geography">
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
              {data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-2 pr-3 text-zinc-700 dark:text-zinc-300 text-xs">{row.country}</td>
                  <td className="py-2 pr-3 text-zinc-500 text-xs">{row.city || "—"}</td>
                  <td className="py-2 text-right text-zinc-900 dark:text-zinc-100 tabular-nums">{row.sessions.toLocaleString()}</td>
                  <td className="py-2 text-right text-zinc-500 tabular-nums">{row.activeUsers.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Widget>
  );
}
