"use client";

import { useEffect, useState } from "react";
import Widget from "./Widget";
import { useDateRange } from "@/context/DateRange";

type DeviceRow = { device: string; sessions: number };
type Overview = {
  sessions: number;
  engagementRate: number;
  bounceRate: number;
  avgSessionDurationSec: number;
};

const ICONS: Record<string, string> = {
  desktop: "🖥",
  mobile: "📱",
  tablet: "⬜",
};

const COLORS: Record<string, string> = {
  desktop: "text-indigo-500 dark:text-indigo-400",
  mobile: "text-cyan-600 dark:text-cyan-400",
  tablet: "text-amber-600 dark:text-amber-400",
};

function fmtPct(rate: number) {
  if (!isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function DeviceBreakdown() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiStart, apiEnd } = useDateRange();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/ga/devices?startDate=${apiStart}&endDate=${apiEnd}`).then((r) => r.json()),
      fetch(`/api/ga/overview?startDate=${apiStart}&endDate=${apiEnd}`).then((r) => r.json()),
    ]).then(([d, o]) => {
      setDevices(Array.isArray(d) ? d : []);
      setOverview(o && !o.error ? o : null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [apiStart, apiEnd]);

  const total = devices.reduce((sum, r) => sum + r.sessions, 0);

  return (
    <Widget title="Devices &amp; engagement">
      {loading ? (
        <div className="h-24 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">Loading…</div>
      ) : (
        <div className="flex flex-col gap-5">
          {overview && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-100 dark:bg-zinc-800/60 rounded-xl p-3">
                <p className="text-zinc-500 text-xs mb-1">Engagement rate</p>
                <p className={`text-2xl font-bold tabular-nums ${overview.engagementRate >= 0.5 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {fmtPct(overview.engagementRate)}
                </p>
                <p className="text-zinc-500 dark:text-zinc-600 text-xs mt-1">of sessions engaged</p>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800/60 rounded-xl p-3">
                <p className="text-zinc-500 text-xs mb-1">Bounce rate</p>
                <p className={`text-2xl font-bold tabular-nums ${overview.bounceRate >= 0.5 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {fmtPct(overview.bounceRate)}
                </p>
                <p className="text-zinc-500 dark:text-zinc-600 text-xs mt-1">left without engaging</p>
              </div>
              <div className="col-span-2 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl p-3">
                <p className="text-zinc-500 text-xs mb-1">Avg session duration</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {fmtDuration(overview.avgSessionDurationSec)}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {devices.map((row) => {
              const pct = total > 0 ? Math.round((row.sessions / total) * 100) : 0;
              const color = COLORS[row.device.toLowerCase()] ?? "text-zinc-500";
              return (
                <div key={row.device}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-700 dark:text-zinc-300 text-sm capitalize flex items-center gap-2">
                      <span>{ICONS[row.device.toLowerCase()] ?? "📦"}</span>
                      {row.device}
                    </span>
                    <span className={`text-sm font-bold tabular-nums ${color}`}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        row.device.toLowerCase() === "desktop"
                          ? "bg-indigo-500"
                          : row.device.toLowerCase() === "mobile"
                          ? "bg-cyan-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-zinc-500 text-xs mt-1">{row.sessions.toLocaleString()} sessions</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Widget>
  );
}
