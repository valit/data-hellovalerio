import { NextRequest, NextResponse } from "next/server";
import { getGAClient, getPropertyId } from "@/lib/ga";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") ?? "30daysAgo";
  const endDate = searchParams.get("endDate") ?? "today";

  try {
    const client = getGAClient();
    const property = getPropertyId();

    // sessionId and exitPage are not valid dimensions in the GA4 Data API
    // (only available in BigQuery export). sessionDuration is also not a valid
    // metric name — use averageSessionDuration instead.
    // We group by date + landingPage; on a small site this is close to per-session.
    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: "date" },
        { name: "landingPage" },
      ],
      metrics: [
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "engagedSessions" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" }, desc: true }],
      limit: 500,
    });

    const rows = (response.rows ?? []).map((row) => {
      const sessions = Math.max(1, Number(row.metricValues?.[0]?.value ?? 1));
      const pageViews = Number(row.metricValues?.[1]?.value ?? 0);
      const engagedSessions = Number(row.metricValues?.[2]?.value ?? 0);
      const avgDuration = Number(row.metricValues?.[3]?.value ?? 0);
      return {
        date: row.dimensionValues?.[0]?.value ?? "",
        landingPage: row.dimensionValues?.[1]?.value ?? "",
        sessions,
        pageCount: Math.round(pageViews / sessions),
        durationSec: Math.round(avgDuration),
        engaged: engagedSessions > 0,
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[ga/sessions]", err);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
