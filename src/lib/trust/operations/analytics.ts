import type { SupabaseClient } from "@supabase/supabase-js";

export async function getTrustAnalytics(client: SupabaseClient) {
  const [
    propertyByCity,
    propertyStatuses,
    legalStatuses,
    verifierPerf,
    partnerPerf,
    diasporaCount,
    fraudCount,
    avgCompletion,
  ] = await Promise.all([
    client
      .from("property_verification_requests")
      .select("property_location_text")
      .gte("requested_at", daysAgo(90)),
    client.from("property_verification_requests").select("status"),
    client.from("legal_verification_requests").select("status"),
    client
      .from("field_verifiers")
      .select("assigned_city, completed_inspections, performance_score, fraud_flags_count")
      .eq("status", "approved"),
    client
      .from("legal_partners")
      .select("assigned_city, completed_reviews, performance_score, fraud_flags_count")
      .eq("status", "approved"),
    client
      .from("property_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("is_diaspora_request", true)
      .in("status", ["submitted", "contacted", "awaiting_assignment", "assigned", "in_progress"]),
    client
      .from("property_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "fraud_review"),
    client
      .from("property_verification_requests")
      .select("requested_at, delivered_at")
      .not("delivered_at", "is", null)
      .gte("requested_at", daysAgo(60))
      .limit(100),
  ]);

  const cityCounts: Record<string, number> = {};
  for (const row of propertyByCity.data ?? []) {
    const loc = (row.property_location_text as string | null)?.split(",")[0]?.trim() ?? "Unknown";
    cityCounts[loc] = (cityCounts[loc] ?? 0) + 1;
  }

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }));

  const propStatusCounts = countBy(propertyStatuses.data ?? [], "status");
  const legalStatusCounts = countBy(legalStatuses.data ?? [], "status");

  let avgDays = 0;
  const completed = avgCompletion.data ?? [];
  if (completed.length) {
    const totalMs = completed.reduce((sum, r) => {
      const start = new Date(r.requested_at as string).getTime();
      const end = new Date(r.delivered_at as string).getTime();
      return sum + (end - start);
    }, 0);
    avgDays = Math.round(totalMs / completed.length / 86_400_000);
  }

  return {
    topCities,
    propertyStatusCounts: propStatusCounts,
    legalStatusCounts: legalStatusCounts,
    diasporaBacklog: diasporaCount.count ?? 0,
    fraudReviewCount: fraudCount.count ?? 0,
    avgCompletionDays: avgDays,
    verifierPerformance: (verifierPerf.data ?? []).slice(0, 15),
    legalPartnerPerformance: (partnerPerf.data ?? []).slice(0, 15),
  };
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function countBy(rows: { status?: string }[], key: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const v = String((row as Record<string, string>)[key] ?? "unknown");
    out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}
