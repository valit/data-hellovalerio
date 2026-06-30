"use client";

import { useEffect, useState } from "react";
import Widget from "./Widget";
import { useDateRange } from "@/context/DateRange";

type Row = {
  date: string;
  landingPage: string;
  sessions: number;
  pageCount: number;
  durationSec: number;
  engaged: boolean;
};

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function fmtDate(d: string) {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function truncate(s: string, n = 35) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export default function SessionExplorer() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { apiStart, apiEnd } = useDateRange();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ga/sessions?startDate=${apiStart}&endDate=${apiEnd}`)
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiStart, apiEnd]);

  return (
    <Widget title="Session explorer" className="col-span-full">
      <div className="mb-5 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
        <strong className="text-zinc-700 dark:text-zinc-300">Note:</strong> Each row groups all sessions that shared the same landing page and date. Pages and duration are per-session averages. The GA4 Data API cannot return page-by-page sequences within a session — for that, enable the{" "}
        <strong className="text-zinc-700 dark:text-zinc-300">GA4 → BigQuery export</strong>{" "}
        (GA4 Admin → BigQuery Links) and query the raw{" "}
        <code className="text-zinc-700 dark:text-zinc-300">events</code> table.
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">Loading…</div>
      ) : data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
          No sessions in this date range
        </div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-zinc-900">
              <tr className="text-zinc-500 text-xs border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left pb-2 pr-4 font-medium">Date</th>
                <th className="text-left pb-2 pr-4 font-medium">Landing page</th>
                <th className="text-right pb-2 pr-4 font-medium">Sessions</th>
                <th className="text-right pb-2 pr-4 font-medium">Avg pages</th>
                <th className="text-right pb-2 pr-4 font-medium">Avg duration</th>
                <th className="text-right pb-2 font-medium">Engaged</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-2 pr-4 text-zinc-500 text-xs tabular-nums whitespace-nowrap">
                    {fmtDate(row.date)}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-zinc-700 dark:text-zinc-300" title={row.landingPage}>
                    {truncate(row.landingPage)}
                  </td>
                  <td className="py-2 pr-4 text-right text-zinc-900 dark:text-zinc-100 tabular-nums">{row.sessions}</td>
                  <td className="py-2 pr-4 text-right text-zinc-500 tabular-nums">{row.pageCount}</td>
                  <td className="py-2 pr-4 text-right text-zinc-500 tabular-nums whitespace-nowrap">
                    {fmtDuration(row.durationSec)}
                  </td>
                  <td className="py-2 text-right">
                    <span className={`text-xs font-medium ${row.engaged ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-600"}`}>
                      {row.engaged ? "Yes" : "No"}
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
