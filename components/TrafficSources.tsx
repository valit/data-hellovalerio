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
import { serializeFilters } from "@/lib/gaFilters";
import type { DimensionFilter } from "@/lib/gaFilters";

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

function makeSourceFilter(channel: string): DimensionFilter {
  return {
    id: `source::${channel}`,
    type: "source",
    label: channel,
    dimensions: [{ name: "sessionDefaultChannelGroup", value: channel }],
  };
}

// Custom YAxis tick that covers the full label area with a transparent click target,
// so the entire left-hand label region is clickable — not just the bar itself.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChannelTick({ x, y, payload, onSelect }: Record<string, any> & {
  onSelect: (ch: string) => void;
}) {
  if (!payload?.value) return null;
  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: "pointer" }}
      onClick={(e) => { e.stopPropagation(); onSelect(payload.value); }}
    >
      {/* Transparent rect covers the full label column width (110px) */}
      <rect x={-110} y={-11} width={110} height={22} fill="transparent" />
      <text x={-4} y={0} dy={4} textAnchor="end" fill="#71717a" fontSize={11}>
        {payload.value}
      </text>
    </g>
  );
}

export default function TrafficSources() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(true);
  const ct = useChartTheme();
  const { apiStart, apiEnd, dimensionFilters, addFilter, removeFilter } = useDateRange();

  // Self-exclusion: don't filter by our own type so all channels remain visible
  const queryFilters = dimensionFilters.filter((f) => f.type !== "source");

  useEffect(() => {
    setLoading(true);
    const fp = serializeFilters(queryFilters);
    fetch(`/api/ga/sources?startDate=${apiStart}&endDate=${apiEnd}${fp ? `&filters=${fp}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiStart, apiEnd, JSON.stringify(queryFilters)]);

  const activeSourceFilters = dimensionFilters.filter((f) => f.type === "source");
  const activeSourceIds = new Set(activeSourceFilters.map((f) => f.id));
  const anySelected = activeSourceIds.size > 0;

  function handleChannelClick(channel: string) {
    const id = `source::${channel}`;
    if (activeSourceIds.has(id)) {
      removeFilter(id);
    } else {
      addFilter(makeSourceFilter(channel));
    }
  }

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

  const headerExtra = activeSourceFilters.length > 0 ? (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-zinc-400 dark:text-zinc-500">
        {activeSourceFilters.length} selected
      </span>
      <button
        onClick={() => activeSourceFilters.forEach((f) => removeFilter(f.id))}
        className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors font-medium"
      >
        Reset
      </button>
    </div>
  ) : undefined;

  return (
    <Widget title="Traffic sources" headerExtra={headerExtra}>
      {loading ? (
        <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">Loading…</div>
      ) : (
        <>
          {/* focus-outline suppressor: clicking Bar SVG rects in Recharts gives
              them browser focus; this prevents the resulting focus ring. */}
          <div className="[&_*:focus]:outline-none [&_*:focus-visible]:outline-none">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={byChannel}
                layout="vertical"
                style={{ cursor: "pointer" }}
                // BarChart-level click covers the full plot area (between bars etc.)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(e: any) => {
                  const label = e?.activeLabel;
                  if (label) handleChannelClick(label);
                }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: ct.tick, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="channel"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tick={(props) => (
                    <ChannelTick {...props} onSelect={handleChannelClick} />
                  )}
                />
                <Tooltip
                  contentStyle={ct.tooltipStyle}
                  labelStyle={ct.tooltipLabelStyle}
                  itemStyle={ct.tooltipItemStyle}
                  cursor={{ fill: "rgba(128,128,128,0.06)" }}
                />
                {/* Bar.onClick fires reliably on the bar rect itself; combined with
                    BarChart.onClick + ChannelTick this gives full-row coverage. */}
                <Bar
                  dataKey="sessions"
                  radius={[0, 4, 4, 0]}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(d: any) => handleChannelClick(d.channel)}
                >
                  {byChannel.map((entry, i) => {
                    const isActive = activeSourceIds.has(`source::${entry.channel}`);
                    return (
                      <Cell
                        key={i}
                        // Selected bar → indigo accent; unselected → original color dimmed
                        fill={isActive ? "#6366f1" : channelColor(entry.channel)}
                        fillOpacity={anySelected && !isActive ? 0.25 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

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
                  {data.slice(0, 20).map((row, i) => {
                    const isActive = activeSourceIds.has(`source::${row.channel}`);
                    return (
                      <tr
                        key={i}
                        onClick={() => handleChannelClick(row.channel)}
                        className={`border-b border-zinc-100 dark:border-zinc-800/50 cursor-pointer transition-colors ${
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-950/40"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                        }`}
                      >
                        <td className="py-2 pr-4 pointer-events-none">
                          {isActive && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 mb-px" />
                          )}
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
                        <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300 text-xs font-mono pointer-events-none">
                          {row.source} / {row.medium}
                        </td>
                        <td className="py-2 text-right text-zinc-900 dark:text-zinc-100 tabular-nums pointer-events-none">
                          {row.sessions.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Widget>
  );
}
