import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/types/database";

type AreaBucket = {
  state: string;
  city: string;
  area: string;
  listingCount: number;
  totalViews: number;
  totalClicks: number;
  totalComplaints: number;
  misleadingComplaints: number;
  priceAnomalies: number;
  avgOutcome: number;
  outcomeSamples: number;
};

function areaKey(state: string, city: string, area: string): string {
  return `${state}|${city}|${area}`.toLowerCase();
}

export async function recalculateAreaOutcomeMemory(
  client: SupabaseClient,
  limit = 80
): Promise<number> {
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();

  const { data: listings } = await client
    .from("properties")
    .select(
      "id, state, city, area, views_count, contact_clicks, price_anomaly_level, outcome_score, status"
    )
    .gte("updated_at", since)
    .in("status", ["approved", "hidden", "rented", "pending"])
    .limit(500);

  const buckets = new Map<string, AreaBucket>();

  for (const row of listings ?? []) {
    const key = areaKey(row.state, row.city, row.area);
    const b =
      buckets.get(key) ??
      {
        state: row.state,
        city: row.city,
        area: row.area,
        listingCount: 0,
        totalViews: 0,
        totalClicks: 0,
        totalComplaints: 0,
        misleadingComplaints: 0,
        priceAnomalies: 0,
        avgOutcome: 0,
        outcomeSamples: 0,
      };
    b.listingCount++;
    b.totalViews += row.views_count ?? 0;
    b.totalClicks += row.contact_clicks ?? 0;
    if (
      row.price_anomaly_level &&
      ["unusually_low", "unusually_high", "high"].includes(row.price_anomaly_level)
    ) {
      b.priceAnomalies++;
    }
    if (row.outcome_score != null) {
      b.avgOutcome += row.outcome_score;
      b.outcomeSamples++;
    }
    buckets.set(key, b);
  }

  const listingIds = (listings ?? []).map((l) => l.id);
  if (listingIds.length > 0) {
    const { data: reports } = await client
      .from("listing_reports")
      .select("property_id, reason")
      .in("property_id", listingIds);

    const listingArea = new Map(
      (listings ?? []).map((l) => [l.id, areaKey(l.state, l.city, l.area)])
    );

    for (const r of reports ?? []) {
      const key = listingArea.get(r.property_id);
      if (!key || !buckets.has(key)) continue;
      const b = buckets.get(key)!;
      b.totalComplaints++;
      if (/mislead|fake|bait|scam/i.test(r.reason ?? "")) {
        b.misleadingComplaints++;
      }
    }
  }

  let updated = 0;
  const now = new Date().toISOString();
  const entries = [...buckets.values()]
    .filter((b) => b.listingCount >= 2)
    .slice(0, limit);

  for (const b of entries) {
    const engagementRate =
      b.totalViews > 0 ? b.totalClicks / b.totalViews : 0;
    const complaintRate =
      b.listingCount > 0 ? b.totalComplaints / b.listingCount : 0;

    let fraudRisk = 0;
    if (complaintRate >= 0.3) fraudRisk += 35;
    else if (complaintRate >= 0.15) fraudRisk += 18;
    if (b.misleadingComplaints >= 2) fraudRisk += 25;
    if (b.priceAnomalies / b.listingCount >= 0.4) fraudRisk += 15;

    let trustZone = 50;
    if (engagementRate >= 0.06 && complaintRate < 0.1) trustZone += 20;
    if (b.outcomeSamples > 0) {
      trustZone += Math.round((b.avgOutcome / b.outcomeSamples - 50) * 0.4);
    }

    let pricingRealism = 70;
    if (b.priceAnomalies / b.listingCount >= 0.35) pricingRealism -= 25;
    if (complaintRate >= 0.2) pricingRealism -= 15;

    const key = areaKey(b.state, b.city, b.area);
    await client.from("area_outcome_memory").upsert(
      {
        area_key: key,
        state: b.state,
        city: b.city,
        area: b.area,
        fraud_risk_score: Math.min(100, fraudRisk),
        trust_zone_score: Math.max(0, Math.min(100, trustZone)),
        pricing_realism_score: Math.max(0, Math.min(100, pricingRealism)),
        complaint_rate: complaintRate,
        engagement_rate: engagementRate,
        listing_sample_count: b.listingCount,
        outcome_summary: {
          misleading_complaints: b.misleadingComplaints,
          price_anomalies: b.priceAnomalies,
        },
        last_calculated_at: now,
        updated_at: now,
      },
      { onConflict: "area_key" }
    );
    updated++;
  }

  return updated;
}

export async function getAreaOutcomeBoost(
  client: SupabaseClient,
  property: Pick<Property, "state" | "city" | "area">
): Promise<{ fraudPenalty: number; trustBoost: number; pricingBoost: number }> {
  const key = areaKey(property.state, property.city, property.area);
  const { data } = await client
    .from("area_outcome_memory")
    .select("fraud_risk_score, trust_zone_score, pricing_realism_score")
    .eq("area_key", key)
    .maybeSingle();

  if (!data) return { fraudPenalty: 0, trustBoost: 0, pricingBoost: 0 };

  return {
    fraudPenalty: data.fraud_risk_score >= 40 ? Math.round(data.fraud_risk_score * 0.08) : 0,
    trustBoost: data.trust_zone_score >= 65 ? 4 : 0,
    pricingBoost: data.pricing_realism_score >= 70 ? 3 : data.pricing_realism_score < 40 ? -4 : 0,
  };
}
