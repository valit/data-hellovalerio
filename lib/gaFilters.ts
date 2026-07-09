// Shared types and utilities for dimension filtering.
// Imported by both client components (for serialization) and API routes
// (for building GA4 FilterExpression objects). Types are erased at runtime,
// so importing from here in server-side routes is safe.

export type DimFilterType = "page" | "source" | "geo";

export type DimensionFilter = {
  id: string;       // e.g. "page::/work/campaigns", "geo::Berkeley::United States"
  type: DimFilterType;
  label: string;    // chip display text
  dimensions: { name: string; value: string }[];
};

// Client-side: serialize filters to a URL query param value
export function serializeFilters(filters: DimensionFilter[]): string {
  if (filters.length === 0) return "";
  return encodeURIComponent(JSON.stringify(filters));
}

// Server-side: parse the ?filters= query param back to DimensionFilter[]
export function parseFiltersParam(raw: string | null): DimensionFilter[] {
  if (!raw) return [];
  try {
    return JSON.parse(decodeURIComponent(raw)) as DimensionFilter[];
  } catch {
    return [];
  }
}

type GAExpr = Record<string, unknown>;

function buildGeoExpression(f: DimensionFilter): GAExpr {
  const city = f.dimensions.find((d) => d.name === "city")!;
  const country = f.dimensions.find((d) => d.name === "country")!;
  return {
    andGroup: {
      expressions: [
        { filter: { fieldName: "city",    stringFilter: { value: city.value,    matchType: "EXACT" } } },
        { filter: { fieldName: "country", stringFilter: { value: country.value, matchType: "EXACT" } } },
      ],
    },
  };
}

// Server-side: build a GA4 FilterExpression from the parsed filters array.
// Returns undefined when filters is empty (omit the field from runReport).
export function buildGAFilterExpression(filters: DimensionFilter[]): GAExpr | undefined {
  if (filters.length === 0) return undefined;

  const byType = new Map<string, DimensionFilter[]>();
  for (const f of filters) {
    const g = byType.get(f.type) ?? [];
    g.push(f);
    byType.set(f.type, g);
  }

  const typeExprs: GAExpr[] = [];

  for (const [type, group] of byType.entries()) {
    if (type === "geo") {
      const exprs = group.map(buildGeoExpression);
      typeExprs.push(exprs.length === 1 ? exprs[0] : { orGroup: { expressions: exprs } });
    } else {
      const fieldName = type === "page" ? "pagePath" : "sessionDefaultChannelGroup";
      const values = group.map((f) => f.dimensions[0].value);
      typeExprs.push({ filter: { fieldName, inListFilter: { values } } });
    }
  }

  if (typeExprs.length === 1) return typeExprs[0];
  return { andGroup: { expressions: typeExprs } };
}
