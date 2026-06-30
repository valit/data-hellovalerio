"use client";

import { useEffect, useState } from "react";
import Widget from "./Widget";
import { useDateRange } from "@/context/DateRange";

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

export default function TopPages() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { apiStart, apiEnd } = useDateRange();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ga/top-pages?startDate=${apiStart}&endDate=${apiEnd}`)
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiStart, apiEnd]);

  return (
    <Widget title="Top pages">
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
              {data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300 font-mono text-xs truncate max-w-xs">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Widget>
  );
}
