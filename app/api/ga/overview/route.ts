import { NextRequest, NextResponse } from "next/server";
import { getGAClient, getPropertyId, safeNum } from "@/lib/ga";
import { parseFiltersParam, buildGAFilterExpression } from "@/lib/gaFilters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") ?? "30daysAgo";
  const endDate = searchParams.get("endDate") ?? "today";
  const dimensionFilter = buildGAFilterExpression(parseFiltersParam(searchParams.get("filters")));

  try {
    const client = getGAClient();
    const property = getPropertyId();

    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "engagementRate" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      ...(dimensionFilter ? { dimensionFilter } : {}),
    });

    const row = response.rows?.[0];
    return NextResponse.json({
      sessions: safeNum(row?.metricValues?.[0]?.value),
      engagementRate: safeNum(row?.metricValues?.[1]?.value),
      bounceRate: safeNum(row?.metricValues?.[2]?.value),
      avgSessionDurationSec: safeNum(row?.metricValues?.[3]?.value, true),
    });
  } catch (err) {
    console.error("[ga/overview]", err);
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}
