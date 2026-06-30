"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import Widget from "./Widget";
import { useChartTheme } from "./ThemeProvider";
import { useDateRange } from "@/context/DateRange";

type Row = { date: string; sessions: number; activeUsers: number };
type Mode = "7d" | "30d";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseGADate(d: string): Date {
  return new Date(
    parseInt(d.slice(0, 4)),
    parseInt(d.slice(4, 6)) - 1,
    parseInt(d.slice(6, 8))
  );
}

function toAPIDate(dt: Date): string {
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, "0"),
    String(dt.getDate()).padStart(2, "0"),
  ].join("-");
}

// "20260625" → "2026-06-25"
function gaDateToISO(d: string): string {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

// "2026-06-25" → "20260625"
function isoToGADate(iso: string): string {
  return iso.replace(/-/g, "");
}

function isoToFull(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return fmtFull(new Date(y, m - 1, d));
}

function fmtShort(dt: Date): string {
  return `${MONTH_SHORT[dt.getMonth()]} ${dt.getDate()}`;
}

function fmtFull(dt: Date): string {
  return `${DAY_SHORT[dt.getDay()]}, ${MONTH_SHORT[dt.getMonth()]} ${dt.getDate()}`;
}

function getDateRange(
  mode: Mode,
  weekOffset: number,
  anchor: string | null
): { startDate: string; endDate: string } {
  if (mode === "30d") return { startDate: "30daysAgo", endDate: "today" };

  let anchorDate: Date;
  if (anchor) {
    anchorDate = parseGADate(anchor);
  } else {
    anchorDate = new Date();
    anchorDate.setHours(0, 0, 0, 0);
    anchorDate.setDate(anchorDate.getDate() - 1);
  }

  const end = new Date(anchorDate);
  end.setDate(anchorDate.getDate() + weekOffset * 7);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { startDate: toAPIDate(start), endDate: toAPIDate(end) };
}

function SevenDayTick(props: Record<string, unknown>) {
  const { x, y, payload } = props as { x: number; y: number; payload: { value: string } };
  if (!payload?.value) return null;
  const dt = parseGADate(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={13} textAnchor="middle" fill="#a1a1aa" fontSize={11}>
        {DAY_SHORT[dt.getDay()]}
      </text>
      <text x={0} y={0} dy={25} textAnchor="middle" fill="#71717a" fontSize={10}>
        {fmtShort(dt)}
      </text>
    </g>
  );
}

export default function VisitsChart() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("30d");
  const [weekOffset, setWeekOffset] = useState(0);
  const [lastAvailableDate, setLastAvailableDate] = useState<string | null>(null);
  const [anchorApplied, setAnchorApplied] = useState(false);

  // Drag-to-select state (local to this chart — sets the global filter on commit)
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragCurrent, setDragCurrent] = useState<string | null>(null);

  // Refs so the global mouseup handler sees current values without stale closure
  const dragStartRef = useRef<string | null>(null);
  const dragCurrentRef = useRef<string | null>(null);
  dragStartRef.current = dragStart;
  dragCurrentRef.current = dragCurrent;

  const ct = useChartTheme();
  const { startDate: globalStart, endDate: globalEnd, isFiltered, setDateRange, reset } = useDateRange();

  const load = useCallback((m: Mode, offset: number, anchor: string | null) => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(m, offset, anchor);
    fetch(`/api/ga/visits?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.rows)) {
          setData(d.rows);
          if (d.lastAvailableDate) {
            setLastAvailableDate((prev) =>
              prev == null || d.lastAvailableDate > prev ? d.lastAvailableDate : prev
            );
          }
        } else {
          setData([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(mode, weekOffset, lastAvailableDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, mode, weekOffset]);

  useEffect(() => {
    if (mode === "7d" && lastAvailableDate && !anchorApplied) {
      setAnchorApplied(true);
      load("7d", weekOffset, lastAvailableDate);
    }
  }, [mode, lastAvailableDate, anchorApplied, load, weekOffset]);

  // Global mouseup — commits selection even if released outside the chart
  useEffect(() => {
    if (!dragStart) return;

    function onGlobalMouseUp() {
      const s = dragStartRef.current;
      const e = dragCurrentRef.current ?? s;
      if (s && e) {
        const [lo, hi] = [s, e].sort();
        setDateRange(gaDateToISO(lo), gaDateToISO(hi));
      }
      setDragStart(null);
      setDragCurrent(null);
    }

    window.addEventListener("mouseup", onGlobalMouseUp);
    return () => window.removeEventListener("mouseup", onGlobalMouseUp);
  }, [dragStart, setDateRange]);

  const weekendAreas = useMemo(() => {
    if (mode !== "30d") return [];
    const dateSet = new Set(data.map((r) => r.date));
    const areas: { x1: string; x2: string }[] = [];
    data.forEach(({ date }) => {
      const dt = parseGADate(date);
      if (dt.getDay() === 6) {
        const sun = new Date(dt);
        sun.setDate(dt.getDate() + 1);
        const sunStr = [
          sun.getFullYear(),
          String(sun.getMonth() + 1).padStart(2, "0"),
          String(sun.getDate()).padStart(2, "0"),
        ].join("");
        areas.push({ x1: date, x2: dateSet.has(sunStr) ? sunStr : date });
      }
    });
    return areas;
  }, [data, mode]);

  const total = useMemo(() => {
    if (isFiltered && globalStart) {
      const lo = isoToGADate(globalStart);
      const hi = isoToGADate(globalEnd ?? globalStart);
      return data
        .filter((r) => r.date >= lo && r.date <= hi)
        .reduce((sum, r) => sum + r.sessions, 0);
    }
    return data.reduce((sum, r) => sum + r.sessions, 0);
  }, [data, isFiltered, globalStart, globalEnd]);

  const rangeLabel = useMemo(() => {
    if (mode === "30d") return "last 30 days";
    if (data.length === 0) return "…";
    const first = parseGADate(data[0].date);
    const last = parseGADate(data[data.length - 1].date);
    return `${fmtShort(first)} – ${fmtShort(last)}`;
  }, [mode, data]);

  // Active selection overlay — either the in-progress drag or the committed global filter
  const selectionArea = useMemo(() => {
    if (dragStart && dragCurrent) {
      const [lo, hi] = [dragStart, dragCurrent].sort();
      return { x1: lo, x2: hi, live: true };
    }
    if (isFiltered && globalStart) {
      return {
        x1: isoToGADate(globalStart),
        x2: isoToGADate(globalEnd ?? globalStart),
        live: false,
      };
    }
    return null;
  }, [dragStart, dragCurrent, isFiltered, globalStart, globalEnd]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleMouseDown(e: any) {
    if (e?.activeLabel) {
      setDragStart(e.activeLabel as string);
      setDragCurrent(e.activeLabel as string);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleMouseMove(e: any) {
    if (dragStart && e?.activeLabel) {
      setDragCurrent(e.activeLabel as string);
    }
  }

  return (
    <Widget title="Visits by day">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {loading ? "–" : total.toLocaleString()}
          </span>
          <span className="text-zinc-500 text-sm">
            sessions ·{" "}
            {isFiltered && globalStart
              ? globalEnd && globalEnd !== globalStart
                ? `${isoToFull(globalStart)} – ${isoToFull(globalEnd)}`
                : isoToFull(globalStart)
              : rangeLabel}
          </span>
          {isFiltered && (
            <button
              onClick={reset}
              className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors font-medium"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 text-xs">
            {(["7d", "30d"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setWeekOffset(0); if (m === "7d") setAnchorApplied(false); }}
                className={`px-3 py-1.5 transition-colors ${
                  mode === m
                    ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100"
                    : "bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {m === "7d" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>

          {mode === "7d" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-base"
                title="Previous week"
              >‹</button>
              <button
                onClick={() => setWeekOffset((o) => o + 1)}
                disabled={weekOffset >= 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-base disabled:opacity-25 disabled:cursor-not-allowed"
                title="Next week"
              >›</button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between w-full -mt-1">
          <span className="text-zinc-400 dark:text-zinc-600 text-xs">
            GA4 data is typically 24–48h delayed
          </span>
          <span className="text-zinc-400 dark:text-zinc-600 text-xs">
            Click or drag to filter all widgets ↑
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-52 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
          Loading…
        </div>
      ) : (
        <div
          className="select-none outline-none [&_svg]:outline-none"
          style={{ cursor: dragStart ? "col-resize" : "crosshair" }}
        >
          <ResponsiveContainer width="100%" height={mode === "7d" ? 210 : 180}>
            <LineChart
              data={data}
              margin={{ top: 4, right: 8, bottom: mode === "7d" ? 8 : 0, left: 0 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              // onMouseUp is handled globally via window listener
            >
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />

              {/* Weekend shading */}
              {weekendAreas.map((area, i) => (
                <ReferenceArea
                  key={i}
                  x1={area.x1}
                  x2={area.x2}
                  fill={ct.refAreaFill}
                  fillOpacity={0.03}
                  stroke="none"
                />
              ))}

              {/* Single-day: vertical amber line (ReferenceArea x1===x2 is zero-width on categorical charts) */}
              {selectionArea?.x1 === selectionArea?.x2 && selectionArea && (
                <ReferenceLine
                  x={selectionArea.x1}
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeOpacity={0.9}
                />
              )}

              {/* Range: filled amber area */}
              {selectionArea && selectionArea.x1 !== selectionArea.x2 && (
                <ReferenceArea
                  x1={selectionArea.x1}
                  x2={selectionArea.x2}
                  fill="#f59e0b"
                  fillOpacity={selectionArea.live ? 0.28 : 0.2}
                  stroke="#f59e0b"
                  strokeOpacity={selectionArea.live ? 0.9 : 0.7}
                  strokeWidth={1.5}
                />
              )}

              <XAxis
                dataKey="date"
                tick={mode === "7d" ? <SevenDayTick /> : { fill: ct.tick, fontSize: 11 }}
                tickFormatter={
                  mode === "30d"
                    ? (d) => { const dt = parseGADate(d); return dt.getDay() === 1 ? fmtShort(dt) : ""; }
                    : undefined
                }
                tickLine={false}
                axisLine={false}
                interval={0}
                height={mode === "7d" ? 42 : 20}
              />

              <YAxis
                tick={{ fill: ct.tick, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={30}
                allowDecimals={false}
              />

              <Tooltip
                contentStyle={ct.tooltipStyle}
                labelStyle={ct.tooltipLabelStyle}
                itemStyle={ct.tooltipItemStyle}
                labelFormatter={(d) => fmtFull(parseGADate(String(d)))}
              />

              <Line
                type="linear"
                dataKey="sessions"
                stroke="#6366f1"
                strokeWidth={2}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isSelected =
                    selectionArea?.x1 === selectionArea?.x2 &&
                    payload?.date === selectionArea?.x1;
                  if (isSelected) {
                    return (
                      <circle
                        key={payload.date}
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill="#f59e0b"
                        stroke="rgba(255,255,255,0.7)"
                        strokeWidth={2.5}
                      />
                    );
                  }
                  const r = mode === "7d" ? 4 : 2;
                  return (
                    <circle
                      key={payload.date}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="#6366f1"
                      stroke={mode === "7d" ? "#09090b" : "none"}
                      strokeWidth={mode === "7d" ? 2 : 0}
                    />
                  );
                }}
                activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#09090b" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Widget>
  );
}
