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

    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "country" }, { name: "city" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 50,
    });

    const rows = (response.rows ?? []).map((row) => ({
      country: row.dimensionValues?.[0]?.value ?? "",
      city: row.dimensionValues?.[1]?.value ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      activeUsers: Number(row.metricValues?.[1]?.value ?? 0),
    }));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[ga/geo]", err);
    return NextResponse.json({ error: "Failed to fetch geo data" }, { status: 500 });
  }
}
