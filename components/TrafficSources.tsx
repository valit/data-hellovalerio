"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Widget from "./Widget";
import { useChartTheme } from "./ThemeProvider";
import { useDateRange } from "@/context/DateRange";

type Row = { channel: string; source: string; medium: string; sessions: number };

const CHANNEL_COLORS: Record<string, string> = {
  "Organic Search": "#6366f1",
  "Direct":         "#22d3ee",
  "Referral":       "#f59e0b",
  "Organic Social": "#a78bfa",
  "Email":          "#34d399",
  "Paid Search":    "#f87171",
};

function channelColor(ch: string) {
  return CHANNEL_COLORS[ch] ?? "#71717a";
}

export default function TrafficSources() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(true);
  const ct = useChartTheme();
  const { apiStart, apiEnd } = useDateRange();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ga/sources?startDate=${apiStart}&endDate=${apiEnd}`)
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiStart, apiEnd]);

  const byChannel = Object.values(
    data.reduce<Record<string, { channel: string; sessions: number }>>((acc, row) => {
      if (!acc[row.channel]) acc[row.channel] = { channel: row.channel, sessions: 0 };
      acc[row.channel].sessions += row.sessions;
      return acc;
    }, {})
  ).sort((a, b) => b.sessions - a.sessions);

  const hasSuspiciousPaidSearch = data.some(
    (r) => r.channel === "Paid Search" && r.medium === "cpc"
  );

  return (
    <Widget title="Traffic sources">
      {loading ? (
        <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">Loading…</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byChannel} layout="vertical">
              <XAxis
                type="number"
                tick={{ fill: ct.tick, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="channel"
                tick={{ fill: ct.axisLabel, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip
                contentStyle={ct.tooltipStyle}
                labelStyle={ct.tooltipLabelStyle}
                itemStyle={ct.tooltipItemStyle}
                cursor={{ fill: "rgba(128,128,128,0.06)" }}
              />
              <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
                {byChannel.map((entry, i) => (
                  <Cell key={i} fill={channelColor(entry.channel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {hasSuspiciousPaidSearch && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs leading-relaxed">
              <strong>Heads up:</strong> GA4 is classifying some sessions as{" "}
              <strong>Paid Search (google / cpc)</strong>. Since this site has no paid
              campaigns, this likely means a Google Ads account is linked to your GA4
              property with auto-tagging enabled. Check GA4 Admin → Google Ads Links to review.
            </div>
          )}

          <button
            onClick={() => setShowDetail(!showDetail)}
            className="mt-4 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            {showDetail ? "Hide source/medium detail ↑" : "Show source/medium detail ↓"}
          </button>

          {showDetail && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-xs border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left pb-2 font-medium">Channel</th>
                    <th className="text-left pb-2 font-medium">Source / Medium</th>
                    <th className="text-right pb-2 font-medium">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 20).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-2 pr-4">
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded"
                          style={{
                            background: channelColor(row.channel) + "22",
                            color: channelColor(row.channel),
                          }}
                        >
                          {row.channel}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300 text-xs font-mono">
                        {row.source} / {row.medium}
                      </td>
                      <td className="py-2 text-right text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {row.sessions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Widget>
  );
}
