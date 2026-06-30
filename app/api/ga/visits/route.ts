import { NextRequest, NextResponse } from "next/server";
import { getGAClient, getPropertyId } from "@/lib/ga";

export const dynamic = "force-dynamic";

// Resolve GA4 relative date strings ("today", "yesterday", "NdaysAgo") or
// absolute "YYYY-MM-DD" strings into a local-time Date. Mirrors what GA4
// itself does so our zero-fill enumeration matches the queried range exactly.
function resolveDate(str: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (str === "today") return today;
  if (str === "yesterday") {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d;
  }
  const daysAgo = str.match(/^(\d+)daysAgo$/);
  if (daysAgo) {
    const d = new Date(today);
    d.setDate(d.getDate() - parseInt(daysAgo[1]));
    return d;
  }
  // "YYYY-MM-DD" absolute date — parse as local time to avoid UTC shift
  const [y, mo, day] = str.split("-").map(Number);
  return new Date(y, mo - 1, day);
}

function toYYYYMMDD(dt: Date): string {
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, "0"),
    String(dt.getDate()).padStart(2, "0"),
  ].join("");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("startDate") ?? "30daysAgo";
  const endParam = searchParams.get("endDate") ?? "today";

  try {
    const client = getGAClient();
    const property = getPropertyId();

    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate: startParam, endDate: endParam }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });

    // Index GA4 rows by date string
    const rowMap = new Map<string, { sessions: number; activeUsers: number }>();
    for (const row of response.rows ?? []) {
      const date = row.dimensionValues?.[0]?.value ?? "";
      if (date) {
        rowMap.set(date, {
          sessions: Number(row.metricValues?.[0]?.value ?? 0),
          activeUsers: Number(row.metricValues?.[1]?.value ?? 0),
        });
      }
    }

    // Zero-fill: emit every calendar date in the range, using 0 where GA4
    // returned nothing (days with no sessions are simply omitted by GA4)
    const start = resolveDate(startParam);
    const end = resolveDate(endParam);
    const rows: { date: string; sessions: number; activeUsers: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const key = toYYYYMMDD(cur);
      const found = rowMap.get(key);
      rows.push({
        date: key,
        sessions: found?.sessions ?? 0,
        activeUsers: found?.activeUsers ?? 0,
      });
      cur.setDate(cur.getDate() + 1);
    }

    // Last date that actually has session data — used by the client to anchor
    // the 7-day week view so it doesn't show empty trailing days
    let lastAvailableDate: string | null = null;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].sessions > 0) {
        lastAvailableDate = rows[i].date;
        break;
      }
    }

    return NextResponse.json({ rows, lastAvailableDate });
  } catch (err) {
    console.error("[ga/visits]", err);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}
