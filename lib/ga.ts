import { BetaAnalyticsDataClient } from "@google-analytics/data";

let client: BetaAnalyticsDataClient | null = null;

export function getGAClient(): BetaAnalyticsDataClient {
  if (!client) {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
    const credentials = JSON.parse(raw);
    client = new BetaAnalyticsDataClient({ credentials });
  }
  return client;
}

export function getPropertyId(): string {
  const id = process.env.GA4_PROPERTY_ID;
  if (!id) throw new Error("GA4_PROPERTY_ID is not set");
  return `properties/${id}`;
}

export function last30Days(): { startDate: string; endDate: string } {
  return { startDate: "30daysAgo", endDate: "today" };
}

/** GA4 can return the string "NaN" for uncomputable metrics. This converts safely to 0. */
export function safeNum(value: string | null | undefined, round = false): number {
  const n = Number(value ?? 0);
  const safe = isFinite(n) ? n : 0;
  return round ? Math.round(safe) : safe;
}
