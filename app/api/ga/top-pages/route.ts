import { NextRequest, NextResponse } from "next/server";
import { getGAClient, getPropertyId, safeNum } from "@/lib/ga";
import { parseFiltersParam, buildGAFilterExpression } from "@/lib/gaFilters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") ?? "30daysAgo";
  const endDate = searchParams.get("endDate") ?? "today";
  // Self-exclusion: top-pages does not filter by its own type so the table
  // shows the full page distribution within any other active filters.
  const filters = parseFiltersParam(searchParams.get("filters")).filter((f) => f.type !== "page");
  const dimensionFilter = buildGAFilterExpression(filters);

  try {
    const client = getGAClient();
    const property = getPropertyId();

    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "engagementRate" },
        // bounceRate is not reliably returned by GA4 for page-level dimensions.
        // We derive it from engagementRate, which is always valid.
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 50,
      ...(dimensionFilter ? { dimensionFilter } : {}),
    });

    const rows = (response.rows ?? []).map((row) => {
      const engagementRate = safeNum(row.metricValues?.[2]?.value);
      return {
        path: row.dimensionValues?.[0]?.value ?? "",
        pageviews: safeNum(row.metricValues?.[0]?.value),
        avgEngagementSec: safeNum(row.metricValues?.[1]?.value, true),
        engagementRate,
        bounceRate: 1 - engagementRate,
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[ga/top-pages]", err);
    return NextResponse.json({ error: "Failed to fetch top pages" }, { status: 500 });
  }
}
