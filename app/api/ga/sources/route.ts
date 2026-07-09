import { NextRequest, NextResponse } from "next/server";
import { getGAClient, getPropertyId } from "@/lib/ga";
import { parseFiltersParam, buildGAFilterExpression } from "@/lib/gaFilters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") ?? "30daysAgo";
  const endDate = searchParams.get("endDate") ?? "today";
  // Self-exclusion: sources does not filter by its own type.
  const filters = parseFiltersParam(searchParams.get("filters")).filter((f) => f.type !== "source");
  const dimensionFilter = buildGAFilterExpression(filters);

  try {
    const client = getGAClient();
    const property = getPropertyId();

    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: "sessionDefaultChannelGroup" },
        { name: "sessionSource" },
        { name: "sessionMedium" },
      ],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 50,
      ...(dimensionFilter ? { dimensionFilter } : {}),
    });

    const rows = (response.rows ?? []).map((row) => ({
      channel: row.dimensionValues?.[0]?.value ?? "",
      source: row.dimensionValues?.[1]?.value ?? "",
      medium: row.dimensionValues?.[2]?.value ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    }));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[ga/sources]", err);
    return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
  }
}
